document.querySelectorAll("[data-contact-form]").forEach((form) => {
  const status = form.querySelector("[data-form-status]");
  const label = form.querySelector("[data-submit-label]");
  const english = document.documentElement.lang.startsWith("en");
  const messages = english
    ? {
        sending: "Sending…",
        success: "Thank you! Your message has been submitted successfully.",
        error: "We could not confirm that your message was sent. Your entries have been kept. Please try again later or contact us by email.",
      }
    : {
        sending: "Wird gesendet…",
        success: "Vielen Dank! Ihre Nachricht wurde erfolgreich übermittelt.",
        error: "Der Versand konnte nicht bestätigt werden. Ihre Eingaben bleiben erhalten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per E-Mail.",
      };
  let sending = false;
  const submitButton = form.querySelector("[data-form-submit]");
  const consentNotice = form.querySelector("[data-form-consent]");
  const web3formsId = "6ace15dccf7226135505b8e2";
  const hasConsent = () => window.CCM?.consent === true &&
    Array.isArray(window.CCM.acceptedEmbeddings) &&
    window.CCM.acceptedEmbeddings.some((embedding) => embedding.id === web3formsId);
  const updateConsent = () => {
    const allowed = hasConsent();
    submitButton.disabled = sending || !allowed;
    consentNotice.hidden = allowed;
  };
  ["ccm19WidgetLoaded", "ccm19WidgetClosed", "ccm19EmbeddingAccepted", "ccm19WidgetOpened", "pageshow"].forEach((name) => {
    window.addEventListener(name, updateConsent);
  });
  updateConsent();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (form.elements.namedItem("botcheck")?.checked) return;

    if (!hasConsent()) {
      updateConsent();
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
    const controls = Array.from(form.querySelectorAll("input, select, textarea, button"));
    const previousDisabled = controls.map((control) => control.disabled);
    const originalLabel = label.textContent;
    sending = true;
    controls.forEach((control) => { control.disabled = true; });
    form.setAttribute("aria-busy", "true");
    label.textContent = messages.sending;
    status.hidden = false;
    status.dataset.state = "sending";
    status.textContent = messages.sending;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "strict-origin-when-cross-origin",
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error("Submission not confirmed");
      form.reset();
      status.dataset.state = "success";
      status.textContent = messages.success;
    } catch {
      status.dataset.state = "error";
      status.textContent = messages.error;
    } finally {
      window.clearTimeout(timeout);
      controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
      form.removeAttribute("aria-busy");
      label.textContent = originalLabel;
      sending = false;
      updateConsent();
    }
  });
});
