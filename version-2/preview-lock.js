(() => {
  const passwordHash = "7425354c48a22a0f835b0ffc56cf52da7fa469e5e2feb160ce9ed018108aaa7b";
  const fallbackPassword = "herz";
  const storageKey = "hd-herz-preview-unlocked";

  function isRemembered() {
    try {
      return window.sessionStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }

  function rememberUnlock() {
    try {
      window.sessionStorage.setItem(storageKey, "true");
    } catch {
      // Some strict browser modes block storage; unlocking the current page still works.
    }
  }

  function unlock() {
    rememberUnlock();
    document.documentElement.classList.remove("preview-locked");
    document.getElementById("previewLock")?.remove();
  }

  async function createHash(value) {
    if (!window.crypto?.subtle) return null;
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function isValidPassword(value) {
    const normalized = value.trim().toLowerCase();
    const hash = await createHash(normalized);
    return hash ? hash === passwordHash : normalized === fallbackPassword;
  }

  function createLock() {
    if (isRemembered()) {
      unlock();
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "preview-lock-overlay";
    overlay.id = "previewLock";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "previewLockTitle");

    overlay.innerHTML = `
      <form class="preview-lock-card">
        <img src="../assets/images/logo.png" alt="Herz HD Stiftung" />
        <p class="eyebrow">Kundenvorschau</p>
        <h1 id="previewLockTitle">Geschützter Entwurf</h1>
        <p>Bitte Passwort eingeben, um die Vorschau zu öffnen.</p>
        <label for="previewPassword">Passwort</label>
        <input class="preview-lock-input" id="previewPassword" name="previewPassword" type="password" autocomplete="current-password" required />
        <p class="preview-lock-error" aria-live="polite"></p>
        <button class="button button-dark" type="submit">Vorschau öffnen</button>
      </form>
    `;

    document.body.append(overlay);

    const form = overlay.querySelector("form");
    const input = overlay.querySelector("input");
    const error = overlay.querySelector(".preview-lock-error");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (await isValidPassword(input.value)) {
        unlock();
        return;
      }

      error.textContent = "Das Passwort stimmt noch nicht.";
      input.select();
    });

    window.setTimeout(() => input.focus(), 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createLock);
  } else {
    createLock();
  }
})();
