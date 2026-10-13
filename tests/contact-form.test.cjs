const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..', 'version-2');
const source = fs.readFileSync(path.join(root, 'contact-form.js'), 'utf8');
const key = 'fef67a86-2f9c-4757-b485-b29daa54572d';

// Isolated form model: no browser, network request or email delivery occurs.
function setup(lang, response, consent = true) {
  const html = fs.readFileSync(path.join(root, lang === 'en' ? 'en/contact.html' : 'kontakt.html'), 'utf8');
  const markup = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  const controls = [...markup.matchAll(/<(input|textarea|select|button)\b([^>]*)>/g)].map(([, tag, attrs]) => ({
    tag,
    name: attrs.match(/\bname="([^"]+)"/)?.[1],
    type: attrs.match(/\btype="([^"]+)"/)?.[1],
    value: attrs.match(/\bvalue="([^"]*)"/)?.[1] ?? '',
    disabled: false,
    checked: false,
  }));
  const values = { name: 'Form test', email: 'form-test@example.invalid', topic: 'General enquiry', message: 'Offline test only' };
  controls.forEach(control => { if (control.name in values) control.value = values[control.name]; });
  const status = { hidden: true, dataset: {}, textContent: '' };
  const label = { textContent: lang === 'en' ? 'Send message' : 'Nachricht senden' };
  const consentNotice = { hidden: false };
  const submitButton = controls.find(c => c.type === 'submit');
  const ccm = { consent, acceptedEmbeddings: consent ? [{ id: '6ace15dccf7226135505b8e2' }] : [] };
  const events = {};
  const requests = [];
  const timers = new Map();
  let listener;
  const form = {
    method: markup.match(/method="([^"]+)"/)[1],
    valid: true,
    resets: 0,
    attrs: {},
    elements: { namedItem: name => controls.find(control => control.name === name) },
    querySelector: selector => ({ '[data-form-status]': status, '[data-submit-label]': label, '[data-form-submit]': submitButton, '[data-form-consent]': consentNotice })[selector],
    querySelectorAll: () => controls,
    reportValidity() { return this.valid; },
    addEventListener: (_, handler) => { listener = handler; },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; },
    reset() { this.resets++; controls.forEach(c => { if (c.name in values) c.value = ''; }); },
  };
  vm.runInNewContext(source, {
    document: { documentElement: { lang }, querySelectorAll: () => [form] },
    window: {
      CCM: consent === null ? undefined : ccm,
      addEventListener(name, callback) { events[name] = callback; },
      setTimeout(fn) { timers.set(1, fn); return 1; },
      clearTimeout(id) { timers.delete(id); },
    },
    AbortController,
    FormData: class {
      *[Symbol.iterator]() {
        for (const c of controls) {
          if (c.name && !c.disabled && (c.type !== 'checkbox' || c.checked)) yield [c.name, c.value];
        }
      }
    },
    fetch: async (url, options) => { requests.push({ url, options }); return response(url, options); },
  });
  return { ccm, events, consentNotice, submitButton, form, controls, status, label, requests, timers, submit: () => listener({ preventDefault() {} }) };
}

for (const lang of ['de', 'en']) {
  test(`${lang}: confirmed success sends the configured fields once and resets the form`, async () => {
    const f = setup(lang, async () => ({ ok: true, json: async () => ({ success: true }) }));
    await f.submit();
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].url, 'https://api.web3forms.com/submit');
    const payload = JSON.parse(f.requests[0].options.body);
    assert.equal(payload.access_key, key);
    assert.equal(payload.email, 'form-test@example.invalid');
    assert.equal(payload.name, 'Form test');
    assert.equal(payload.message, 'Offline test only');
    assert.equal(payload.topic, 'General enquiry');
    assert.ok(payload.subject);
    assert.equal(payload.botcheck, undefined);
    assert.equal(f.form.resets, 1);
    assert.equal(f.status.dataset.state, 'success');
    assert.match(f.status.textContent, lang === 'en' ? /Thank you/ : /Vielen Dank/);
    assert.ok(f.controls.every(c => !c.disabled));
    assert.equal(f.timers.size, 0);
    assert.equal(f.form.attrs['aria-busy'], undefined);
  });
}

for (const [name, response] of [
  ['HTTP error', async () => ({ ok: false, json: async () => ({ success: true }) })],
  ['API rejection', async () => ({ ok: true, json: async () => ({ success: false }) })],
  ['unexpected JSON', async () => ({ ok: true, json: async () => ({}) })],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } })],
  ['network error', async () => { throw new Error('Network unavailable'); }],
]) {
  test(`${name}: keeps the message and enables retry`, async () => {
    const f = setup('en', response);
    await f.submit();
    assert.equal(f.status.dataset.state, 'error');
    assert.equal(f.form.resets, 0);
    assert.equal(f.form.elements.namedItem('message').value, 'Offline test only');
    assert.ok(f.controls.every(c => !c.disabled));
    assert.equal(f.label.textContent, 'Send message');
    assert.equal(f.timers.size, 0);
    await f.submit();
    assert.equal(f.requests.length, 2);
  });
}

test('pending request prevents duplicate sends; timeout preserves inputs', async () => {
  const f = setup('de', (_, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Timeout')));
  }));
  const first = f.submit();
  assert.ok(f.controls.every(c => c.disabled));
  await f.submit();
  assert.equal(f.requests.length, 1);
  f.timers.get(1)();
  await first;
  assert.equal(f.status.dataset.state, 'error');
  assert.equal(f.form.elements.namedItem('message').value, 'Offline test only');
  assert.equal(f.form.resets, 0);
  assert.ok(f.controls.every(c => !c.disabled));
});

test('invalid form and honeypot never reach the transport', async () => {
  const f = setup('de', () => { throw new Error('Must not be called'); });
  f.form.valid = false;
  await f.submit();
  f.form.valid = true;
  f.form.elements.namedItem('botcheck').checked = true;
  await f.submit();
  assert.equal(f.requests.length, 0);
});

for (const lang of ['de', 'en']) {
  test(`${lang}: consent denial and withdrawal prevent network transmission`, async () => {
    const f = setup(lang, async () => ({ ok: true, json: async () => ({ success: true }) }), false);
    assert.equal(f.form.method, 'dialog'); // Native submission cannot POST to any endpoint.
    assert.equal(f.submitButton.disabled, true);
    await f.submit();
    assert.equal(f.requests.length, 0);
    assert.equal(f.form.resets, 0);
    f.ccm.consent = true;
    f.ccm.acceptedEmbeddings = [{ id: 'unrelated-service' }];
    await f.submit();
    assert.equal(f.requests.length, 0);
    f.ccm.acceptedEmbeddings = [{ id: '6ace15dccf7226135505b8e2' }];
    f.events.ccm19WidgetClosed();
    assert.equal(f.submitButton.disabled, false);
    assert.equal(f.consentNotice.hidden, true);
    f.ccm.acceptedEmbeddings = [];
    f.events.ccm19WidgetClosed();
    assert.equal(f.submitButton.disabled, true);
    assert.equal(f.consentNotice.hidden, false);
    await f.submit();
    assert.equal(f.requests.length, 0);
  });
}

test('CCM19 unavailable: fails closed and preserves the message', async () => {
  const f = setup('de', async () => { throw new Error('must not be called'); }, null);
  assert.equal(f.submitButton.disabled, true);
  await f.submit();
  assert.equal(f.requests.length, 0);
  assert.equal(f.form.resets, 0);
  assert.equal(f.consentNotice.hidden, false);
});

test('every page loads CCM19 before other scripts and exposes footer settings', () => {
  const files = [root, path.join(root, 'en')].flatMap(dir => fs.readdirSync(dir).filter(n => n.endsWith('.html')).map(n => path.join(dir, n)));
  assert.equal(files.length, 16);
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html.match(/<script[^>]*>/)[0], /cloud\.ccm19\.de/);
    assert.match(html.split('<footer')[1], /href="#CCM.openWidget"/);
  }
});
