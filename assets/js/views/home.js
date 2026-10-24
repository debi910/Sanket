// Landing page: what Sanket is, the four windows and how it works.
import { esc, icon } from "../ui.js";
import { ILLUS } from "../illus.js";

const ROLES = [
  { href: "#/patient", icon: "user", art: "patient", title: "Patient", text: "Describe the problem, get a token or 108 advice.", tone: "brand" },
  { href: "#/desk", icon: "desk", art: "desk", title: "Front desk", text: "See the queue by lane and confirm each one.", tone: "saffron" },
  { href: "#/clinician", icon: "steth", art: "doctor", title: "Doctor", text: "Review today's urgent patients and record the outcome.", tone: "info" },
  { href: "#/insights", icon: "chart", art: "dashboard", title: "Dashboard", text: "Check what the rules missed and what staff changed.", tone: "em" }
];

export function render(root) {
  root.innerHTML = `
  <div class="home view">
    <section class="hero">
      <div class="wrap hero-in">
        <div class="hero-copy stagger">
          <div class="eyebrow"><span class="dot"></span>AI Innovate-A-Thon · Question 4</div>
          <h1>Every OPD request,<br>in the <span class="u">right lane</span>.</h1>
          <p class="lede">Sanket reads requests in English or Hinglish and sorts each one into <b>emergency</b>, <b>same-day</b> or <b>routine</b>. Staff confirm every lane. It never diagnoses.</p>
          <div class="hero-cta">
            <a class="btn primary lg" href="#/patient">${icon("user")} Request a visit</a>
            <a class="btn lg" href="#/desk">${icon("desk")} Front desk</a>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">${heroArt()}</div>
      </div>
      <svg class="ecg-band" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34h300l14-22 16 44 14-30 10 8h180l12-18 14 36 12-26 8 10h200l14-22 16 44 14-30 10 8h356" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
    </section>

    <section class="wrap">
      <div class="sec-head"><h2>Four windows, one shared queue</h2>
      <p class="ink2">Open two side by side. A patient request shows up on the front desk at once.</p></div>
      <div class="grid g4 roles stagger">
        ${ROLES.map((r) => `
        <a class="card role tone-${r.tone}" href="${r.href}">
          <div class="r-art">${ILLUS[r.art]()}</div>
          <div class="r-txt">
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.text)}</p>
            <span class="r-go">Open ${icon("arrowR")}</span>
          </div>
        </a>`).join("")}
      </div>
    </section>

    <section class="wrap">
      <div class="sec-head"><h2>How it works</h2></div>
      <ol class="how three stagger">
        <li>${icon("ambulance", "h-ico")}<span class="h-n">1</span><b>Red flags first</b><p>Chest pain, stroke signs, snakebite or poisoning go straight to 108. No waiting.</p></li>
        <li>${icon("shield", "h-ico")}<span class="h-n">2</span><b>Reassurance is ignored</b><p>"Kuch nahi hai, bas gas hai" cannot make a request less urgent.</p></li>
        <li>${icon("users", "h-ico")}<span class="h-n">3</span><b>A person decides</b><p>Staff confirm every lane. Routine visits are booked on the right clinic day.</p></li>
      </ol>
    </section>
  </div>`;
}

function heroArt() {
  return `
  <div class="art">
    <div class="art-card a1">
      <div class="ac-top"><span class="ac-av">${icon("users")}</span><div><b>WhatsApp · family</b><span>Age 58 · 9:42 AM</span></div></div>
      <p>Papa ke <mark class="ev em">seene mein dard</mark> hai aur paseena aa raha hai. <mark class="ev min">Ghar wale bol rahe hain gas hai</mark></p>
      <div class="ac-tags"><span class="tag saffron">${icon("shield")}Guard raised</span><span class="tag">E1</span></div>
    </div>
    <svg class="art-flow" viewBox="0 0 300 120" fill="none">
      <path class="f0" d="M150 0 C150 40 50 50 50 120"/><path class="f1" d="M150 0 V120"/><path class="f2" d="M150 0 C150 40 250 50 250 120"/>
      <circle class="pulse" r="4"><animateMotion dur="2.4s" repeatCount="indefinite" path="M150 0 C150 40 50 50 50 120"/></circle>
    </svg>
    <div class="art-lanes">
      <div class="al EMERGENCY"><span class="lane EMERGENCY">Emergency</span><b>Call 108 now</b><span class="muted">E-007 · 0:40 to guidance</span></div>
      <div class="al SAME_DAY"><span class="lane SAME_DAY">Same-day</span><b>Seen today</b><span class="muted">S-031 · Dr. Rao</span></div>
      <div class="al ROUTINE"><span class="lane ROUTINE">Routine</span><b>Wed · Immunisation</b><span class="muted">R-118 · bring MCP card</span></div>
    </div>
  </div>`;
}
