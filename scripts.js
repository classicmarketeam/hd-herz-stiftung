const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const donationRange = document.querySelector("#donationRange");
const donationValue = document.querySelector("#donationValue");
const donationImpact = document.querySelector("#donationImpact");

const impacts = [
  { max: 29, text: "Damit erhält ein Kind ein Jahr lang tägliche Schulspeisung." },
  { max: 99, text: "Damit erhalten drei Kinder ein Jahr lang tägliche Schulspeisung." },
  { max: 249, text: "Damit wird die Schulgemeinschaft über Nahrung und Betreuung spürbar entlastet." },
  { max: 499, text: "Damit rückt Wassertechnik für Küche, Hygiene und Schulgarten näher." },
  { max: Infinity, text: "Damit entsteht Starthilfe für Wasser, Garten und konkrete Eigeninitiative." },
];

function updateDonationCopy(value) {
  if (!donationValue || !donationImpact) return;
  donationValue.textContent = `${value} €`;
  donationImpact.textContent = impacts.find((impact) => value <= impact.max).text;
}

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => window.lucide?.createIcons());
}

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");
  const icon = navToggle.querySelector("svg, i");
  if (icon) {
    icon.outerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}"></i>`;
    window.lucide?.createIcons();
  }
});

document.querySelectorAll(".site-nav a, .header-actions a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Menü öffnen");
    const icon = navToggle?.querySelector("svg, i");
    if (icon) {
      icon.outerHTML = '<i data-lucide="menu"></i>';
      window.lucide?.createIcons();
    }
  });
});

function alignHashTarget() {
  if (!window.location.hash) return;
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
  window.setTimeout(alignHashTarget, 0);
});

donationRange?.addEventListener("input", (event) => {
  updateDonationCopy(Number(event.target.value));
});

updateDonationCopy(Number(donationRange?.value || 60));
