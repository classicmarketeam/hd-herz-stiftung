const header = document.querySelector(".site-header");
const brandLink = document.querySelector(".brand");
const navToggle = document.querySelector(".nav-toggle");
const zimbabweLink = document.querySelector('.site-nav a[href="#simbabwe"]');
const isEnglish = document.documentElement.lang.startsWith("en");
const menuLabels = isEnglish
  ? { open: "Open menu", close: "Close menu" }
  : { open: "Menü öffnen", close: "Menü schließen" };
const donationNumberFormat = new Intl.NumberFormat(isEnglish ? "en-GB" : "de-DE", { maximumFractionDigits: 0 });

function getDonationImpact(value) {
  if (isEnglish) {
    if (value >= 7500) {
      return "A donation of this size is approximately equivalent to the average cost of a new school borehole.";
    }
    if (value >= 2000) {
      return "A donation of this size can make a substantial contribution towards a new school borehole.";
    }
    if (value >= 1000) {
      return "A donation of this size can make a small income-generating project possible.";
    }
    if (value >= 500) {
      return "A donation of this size is a substantial contribution to school gardens and initial income-generating projects.";
    }
    const children = value / 10;
    const description = children === 1 ? "one child" : `${donationNumberFormat.format(children)} children`;
    return `This is approximately equivalent to the cost of school meals for ${description} for one school year.`;
  }
  if (value >= 7500) {
    return "Eine Spende dieser Größenordnung entspricht ungefähr den durchschnittlichen Kosten eines neuen Schulbrunnens.";
  }
  if (value >= 2000) {
    return "Eine Spende dieser Größenordnung kann einen wesentlichen Beitrag zu einem neuen Schulbrunnen leisten.";
  }
  if (value >= 1000) {
    return "Eine Spende dieser Größenordnung kann ein kleineres einkommenschaffendes Projekt ermöglichen.";
  }
  if (value >= 500) {
    return "Eine Spende dieser Größenordnung ist ein wesentlicher Beitrag zu Schulgärten und ersten einkommenschaffenden Projekten.";
  }
  const children = value / 10;
  const description = children === 1 ? "einem Kind" : `${donationNumberFormat.format(children)} Kindern`;
  return `Das entspricht ungefähr den Kosten der Schulspeisung von ${description} für ein Schuljahr.`;
}

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => window.lucide?.createIcons());
}

function updateHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function updateSectionNavigation() {
  if (!zimbabweLink) return;
  if (window.location.hash === "#simbabwe") {
    zimbabweLink.setAttribute("aria-current", "location");
  } else {
    zimbabweLink.removeAttribute("aria-current");
  }
}

function updateLanguageLinks() {
  document.querySelectorAll("[data-language-link]").forEach((link) => {
    const target = new URL(link.href, window.location.href);
    target.hash = window.location.hash;
    link.href = target.href;
  });
}

updateHeaderState();
updateSectionNavigation();
updateLanguageLinks();
window.addEventListener("scroll", updateHeaderState, { passive: true });

function closeNavigation() {
  header?.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", menuLabels.open);
  const icon = navToggle?.querySelector("svg, i");
  if (icon) {
    icon.outerHTML = '<i data-lucide="menu"></i>';
    window.lucide?.createIcons();
  }
}

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? menuLabels.close : menuLabels.open);
  const icon = navToggle.querySelector("svg, i");
  if (icon) {
    icon.outerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}"></i>`;
    window.lucide?.createIcons();
  }
});

brandLink?.addEventListener("click", (event) => {
  const targetUrl = new URL(brandLink.href, window.location.href);
  const isIndexPath = (path) => path.endsWith("/") || path.endsWith("/index.html");

  if (isIndexPath(window.location.pathname) && isIndexPath(targetUrl.pathname)) {
    event.preventDefault();
    closeNavigation();
    window.history.replaceState(null, "", targetUrl.pathname + targetUrl.search);
    updateSectionNavigation();
    updateLanguageLinks();
    window.scrollTo({ top: 0, behavior: "auto" });
    updateHeaderState();
  }
});

document.querySelectorAll(".site-nav a, .header-actions a").forEach((link) => {
  link.addEventListener("click", () => {
    closeNavigation();
  });
});

function alignHashTarget() {
  if (!window.location.hash) return;
  if (window.location.hash === "#top") {
    window.scrollTo({ top: 0, behavior: "auto" });
    updateHeaderState();
    return;
  }
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (!target) return;
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  target.scrollIntoView({ block: "start" });
  root.style.scrollBehavior = previousScrollBehavior;
}

window.addEventListener("load", () => {
  window.setTimeout(alignHashTarget, 120);
});

window.addEventListener("hashchange", () => {
  updateSectionNavigation();
  updateLanguageLinks();
  window.setTimeout(alignHashTarget, 0);
});

document.querySelectorAll("[data-donation-calculator]").forEach((calculator) => {
  const range = calculator.querySelector("[data-donation-range]");
  const amount = calculator.querySelector("[data-donation-amount]");
  const valueLabel = calculator.querySelector("[data-donation-value]");
  const impact = calculator.querySelector("[data-donation-impact]");
  if (!range || !amount || !valueLabel || !impact) return;

  function updateDonation(value, syncAmount = true) {
    const min = Number(range.min);
    const max = Number(range.max);
    const step = Number(range.step);
    const rounded = min + Math.round((value - min) / step) * step;
    const normalized = Math.min(max, Math.max(min, rounded));
    const formatted = donationNumberFormat.format(normalized);
    range.value = String(normalized);
    range.setAttribute("aria-valuetext", `${formatted} ${isEnglish ? "euros" : "Euro"}`);
    if (syncAmount) amount.value = String(normalized);
    valueLabel.textContent = isEnglish ? `€${formatted}` : `${formatted} €`;
    impact.textContent = getDonationImpact(normalized);
  }

  range.addEventListener("input", () => updateDonation(range.valueAsNumber));
  amount.addEventListener("input", () => {
    // Preserve partial input until a complete, valid amount has been entered.
    if (Number.isFinite(amount.valueAsNumber) && amount.validity.valid) {
      updateDonation(amount.valueAsNumber, false);
    }
  });
  amount.addEventListener("change", () => {
    const value = Number.isFinite(amount.valueAsNumber) ? amount.valueAsNumber : range.valueAsNumber;
    updateDonation(value);
  });

  updateDonation(range.valueAsNumber);
});
