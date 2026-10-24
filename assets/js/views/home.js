// Landing page: what Sanket is, the four windows, the framing guard demo and
// the numbers that motivate it.
import { esc, icon, highlight, evidenceGroups, laneChip, LANE, countUp } from "../ui.js";
import { STATS, SOURCES } from "../india.js";

const ROLES = [
  { href: "#/patient", icon: "user", title: "Patient", who: "Patients and families", text: "Describe the problem in English, Hinglish or Hindi, by typing or speaking. Get 108 guidance at once, or a token for the right clinic day.", tone: "brand" },
  { href: "#/desk", icon: "desk", title: "Front desk", who: "Receptionist, ANM", text: "A live queue sorted by lane. Accept or change each lane with a reason. Add phone calls and walk-ins with an instant lane preview.", tone: "saffron" },
  { href: "#/clinician", icon: "steth", title: "Clinician", who: "Medical officer", text: "Same-day worklist with the evidence highlighted. Call back, record the outcome, refer up the ladder or flag a rule.", tone: "info" },
  { href: "#/insights", icon: "chart", title: "Clinic lead", who: "In-charge, block officer", text: "Rule misses, overrides, framing guard saves and season watch, next to national data on dengue, heat and staffing.", tone: "em" }
];

const DEMO = "Seene mein halka sa dard hai, ghar wale bolte hain gas hai, kuch nahi hai";

export function render(root) {
  root.innerHTML = `
  <div class="home view">
    <section class="hero">
      <div class="wrap hero-in">
        <div class="hero-copy stagger">
          <div class="eyebrow"><span class="dot"></span>AI Innovate-A-Thon · Question 4</div>
          <h1>Every OPD request,<br>in the <span class="u">right lane</span>.</h1>
          <p class="lede">Sanket (संकेत, "signal") reads appointment requests the way Indian families write them, catches red flags in English, Hinglish and Hindi, and sorts each one into <b>emergency guidance</b>, <b>same-day review</b> or a <b>routine booking</b>. A person checks every suggestion. It never diagnoses.</p>
          <div class="hero-cta">
            <a class="btn primary lg" href="#/patient">${icon("user")} Try the patient window</a>
            <a class="btn lg" href="#/desk">${icon("desk")} Open the front desk</a>
          </div>
          <div class="hero-trust">
            <span>${icon("shield")}Rules first, AI can only escalate</span>
            <span>${icon("users")}Human decides every lane</span>
            <span>${icon("eye")}Synthetic data only</span>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">${heroArt()}</div>
      </div>
    </section>

    <section class="wrap">
      <div class="sec-head"><div class="eyebrow"><span class="dot"></span>Four windows</div><h2>One request, four people, one shared queue</h2>
      <p class="ink2">Open two windows side by side. A request sent from the patient window appears on the front desk at once.</p></div>
      <div class="grid g4 roles stagger">
        ${ROLES.map((r) => `
        <article class="card role tone-${r.tone}">
          <span class="r-ico">${icon(r.icon)}</span>
          <h3>${esc(r.title)}</h3><span class="muted r-who">${esc(r.who)}</span>
          <p>${esc(r.text)}</p>
          <div class="r-act"><a class="btn sm primary" href="${r.href}">Open ${icon("arrowR")}</a><a class="btn sm ghost" href="${r.href}" target="_blank" rel="noopener" title="Open in a new window">${icon("ext")} New window</a></div>
        </article>`).join("")}
      </div>
    </section>

    <section class="wrap">
      <div class="guard-demo card">
        <div class="gd-copy">
          <div class="eyebrow"><span class="dot"></span>The new idea</div>
          <h2>A guard against “kuch nahi hai”</h2>
          <p class="ink2">In India a family member often writes the request, and softens it: “bas thoda sa dard hai”, “ghar wale bolte hain gas hai”. A February 2026 Nature Medicine study found that this kind of reassurance made an AI triage tool <b>11.7 times</b> more likely to give a less urgent answer. Sanket finds these phrases, scores the request again without them, and keeps the more cautious lane.</p>
          <p class="muted" style="font-size:12.5px;margin-top:12px"><a class="src" href="${SOURCES.nature.url}" target="_blank" rel="noopener">${esc(SOURCES.nature.label)}</a></p>
        </div>
        <div class="gd-try">
          <label class="label" for="try">Try it. Edit the text.</label>
          <textarea id="try" class="textarea" style="min-height:96px">${esc(DEMO)}</textarea>
          <div class="gd-out" data-out></div>
        </div>
      </div>
    </section>

    <section class="wrap">
      <div class="sec-head"><div class="eyebrow"><span class="dot"></span>Why it matters here</div><h2>Built for the Indian front door</h2></div>
      <div class="grid g4 stats stagger">
        <div class="card stat"><strong class="num" data-count="79.9" data-dec="1" data-suffix="%">0</strong><span>of specialist posts at rural CHCs were short in March 2023</span><small>${esc(SOURCES.hdi.label.split(",")[0])}</small></div>
        <div class="card stat"><strong class="num" data-count="${STATS.dengue[3].cases}">0</strong><span>dengue cases reported in India in 2024</span><small>NCVBDC</small></div>
        <div class="card stat"><strong class="num" data-count="${STATS.heat2024.suspected}">0</strong><span>suspected heatstroke cases, March to June 2024</span><small>NCDC</small></div>
        <div class="card stat"><strong class="num">~<span data-count="${STATS.snakebiteDeaths}">0</span></strong><span>snakebite deaths a year, mostly in the monsoon</span><small>eLife 2020</small></div>
      </div>
    </section>

    <section class="wrap">
      <div class="sec-head"><div class="eyebrow"><span class="dot"></span>How it works</div><h2>Safety first, then speed</h2></div>
      <ol class="how stagger">
        <li><span class="h-n">1</span><b>Red-flag rules run first</b><p>Chest pain, stroke signs, snakebite, pesticide, dengue warning signs, heatstroke, pregnancy danger signs. In English, Hinglish and Devanagari Hindi. Instant, offline, no AI.</p></li>
        <li><span class="h-n">2</span><b>History and framing guard</b><p>Past history (heart disease, blood thinners, chemo, pregnancy, a repeat visit) can raise the lane. Reassurance is removed and the request is scored again. The more urgent lane wins.</p></li>
        <li><span class="h-n">3</span><b>Optional AI second reader</b><p>Claude may raise a lane or mark text unclear. It can never lower one, and invented quotes are dropped.</p></li>
        <li><span class="h-n">4</span><b>A person decides</b><p>Staff accept or change every lane with a reason. Routine requests are booked into the right programme day.</p></li>
      </ol>
    </section>
  </div>`;

  const ta = root.querySelector("#try"), out = root.querySelector("[data-out]");
  const paint = () => {
    const txt = ta.value.trim();
    if (!txt) { out.innerHTML = `<span class="muted">Type a request to see the lane.</span>`; return; }
    const r = window.TriageEngine.route({ description: txt, age: 55 });
    const g = r.framingGuard;
    out.innerHTML = `
      <div class="gd-text">${highlight(txt, evidenceGroups(r))}</div>
      <div class="gd-lanes">
        <div><span class="label">As written</span>${laneChip(g.asWritten, true)}</div>
        <span class="gd-arrow">${icon("arrowR")}</span>
        <div><span class="label">Reassurance removed</span>${laneChip(g.withoutReassurance, true)}</div>
        <div class="gd-final"><span class="label">Sanket keeps</span>${laneChip(r.category, true)}</div>
      </div>
      <p class="muted" style="font-size:13px">${g.phrases.length ? `Removed: ${g.phrases.map((p) => `<s>${esc(p)}</s>`).join(", ")}` : "No reassurance found."} · ${esc(r.reasons.map((x) => x.ruleId + " " + x.title).join(" · "))}</p>`;
  };
  ta.addEventListener("input", paint);
  paint();
  countUp(root);
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
