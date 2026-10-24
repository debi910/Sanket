// App shell: emergency strip, top bar with a sliding active pill, hash
// router, theme toggle.
import { icon, logo } from "./ui.js";
import * as store from "./store.js";
import * as home from "./views/home.js";
import * as patient from "./views/patient.js";
import * as desk from "./views/desk.js";
import * as clinician from "./views/clinician.js";
import * as insights from "./views/insights.js";
import * as about from "./views/about.js";

const ROUTES = {
  "": { view: home, title: "Sanket" },
  patient: { view: patient, title: "Patient", nav: "Patient", icon: "user" },
  desk: { view: desk, title: "Front desk", nav: "Front desk", icon: "desk" },
  clinician: { view: clinician, title: "Clinician", nav: "Clinician", icon: "steth" },
  insights: { view: insights, title: "Insights", nav: "Insights", icon: "chart" },
  about: { view: about, title: "Method & safety", nav: "Method", icon: "book" }
};

store.load();

document.body.insertAdjacentHTML("afterbegin", `
  <a class="sr-only" href="#main">Skip to content</a>
  <div class="strip" role="note">
    <span>${icon("alert")}<b>Emergency?</b><span class="hide-sm">Do not use this form.</span></span>
    <a href="tel:108">${icon("phone")}108 Ambulance</a><a href="tel:112">112 Emergency</a>
  </div>
  <header class="topbar">
    <a class="brand" href="#/">${logo()}<span>Sanket</span><small class="hi">संकेत</small></a>
    <nav class="nav" aria-label="Windows"><span class="pill" aria-hidden="true"></span>
      ${Object.entries(ROUTES).filter(([, r]) => r.nav).map(([k, r]) => `<a href="#/${k}" data-k="${k}">${icon(r.icon)}${r.nav}</a>`).join("")}
    </nav>
    <span class="spacer"></span>
    <button class="icon-btn" data-theme aria-label="Toggle dark mode">${icon("moon")}</button>
    <button class="icon-btn menu-btn" data-menu aria-label="Menu">${icon("menu")}</button>
  </header>
  <main id="main"></main>
  <footer class="foot"><div class="in">
    <span>Sanket · AI Innovate-A-Thon, VIT · Question 4 · Synthetic data only. Not a medical device. Sorts requests; does not diagnose.</span>
    <span><a href="#/about">Method & safety</a> · <a href="https://github.com/debi910/Sanket" target="_blank" rel="noopener">Source on GitHub</a></span>
  </div></footer>`);

const main = document.getElementById("main");
const nav = document.querySelector(".nav");
const pill = nav.querySelector(".pill");
let cleanup = null, firstPaint = true;

function placePill(animate) {
  const on = nav.querySelector('a[aria-current="page"]');
  if (!on) { pill.style.opacity = "0"; return; }
  if (!animate) pill.style.transition = "none";
  pill.style.opacity = "1";
  pill.style.width = on.offsetWidth + "px";
  pill.style.transform = `translateX(${on.offsetLeft}px)`;
  if (!animate) { pill.offsetWidth; pill.style.transition = ""; }
}

function route() {
  const key = (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0]) || "";
  const r = ROUTES[key] || ROUTES[""];
  if (cleanup) { try { cleanup(); } catch (e) { console.warn(e); } cleanup = null; }
  document.querySelectorAll(".scrim, .drawer, .modal").forEach((n) => n.remove());
  document.documentElement.style.overflow = "";
  nav.querySelectorAll("a").forEach((a) => (a.dataset.k === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  placePill(!firstPaint);
  nav.classList.remove("open");
  document.title = r.title === "Sanket" ? "Sanket · Safer OPD front doors" : `${r.title} · Sanket`;
  main.innerHTML = "";
  cleanup = r.view.render(main) || null;
  if (!firstPaint) window.scrollTo({ top: 0 });
  firstPaint = false;
}

window.addEventListener("hashchange", route);
window.addEventListener("resize", () => placePill(false));
document.querySelector("[data-menu]").addEventListener("click", () => nav.classList.toggle("open"));

// Theme: follows the OS until the user picks one.
const themeBtn = document.querySelector("[data-theme]");
function applyTheme(t) {
  if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  themeBtn.innerHTML = icon(dark ? "sun" : "moon");
}
let theme = null;
try { theme = localStorage.getItem("sanket.theme"); } catch (e) { /* ignore */ }
applyTheme(theme);
themeBtn.addEventListener("click", () => {
  const dark = document.documentElement.getAttribute("data-theme") ? document.documentElement.getAttribute("data-theme") === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  theme = dark ? "light" : "dark";
  try { localStorage.setItem("sanket.theme", theme); } catch (e) { /* ignore */ }
  applyTheme(theme);
});

if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placePill(false));
route();
