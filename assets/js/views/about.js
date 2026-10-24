// About: method, safety note, regulation fit, data sources, implemented vs
// future work, and the test cases run live in the browser.
import { esc, icon, laneChip } from "../ui.js";
import { SOURCES } from "../india.js";

export function render(root) {
  const rules = window.TriageEngine.RULES;
  const rows = window.TriageTests ? window.TriageTests.run(window.TriageEngine) : [];
  const pass = rows.filter((r) => r.pass).length;
  root.innerHTML = `
  <div class="wrap narrow view about">
    <header class="page-head"><div>
      <div class="eyebrow"><span class="dot"></span>Method and safety</div>
      <h1>How Sanket works, and what it will not do</h1>
      <p>Sanket is an administrative sorting aid for the front desk of a community clinic. It suggests a lane for a person to check. It is not a medical device, gives no diagnosis, and has not been tested on real patients.</p>
    </div></header>

    <nav class="toc">${["Safety", "Rules", "Regulation", "Data", "Status", "Tests"].map((x) => `<a href="#/about" data-jump="${x.toLowerCase()}">${x}</a>`).join("")}</nav>

    <section class="card prose" id="safety">
      <h2>${icon("shield")}Safety note</h2>
      <h3>Emergencies are never delayed</h3>
      <ul><li>The 108 / 112 strip is on every screen.</li><li>Red-flag rules run first, in the browser, without the AI. A slow or failed AI call cannot hold back emergency guidance.</li><li>Self-harm words also show Tele-MANAS 14416.</li><li>Ticking “This feels like an emergency” always gives emergency guidance.</li></ul>
      <h3>Past history can only raise a lane</h3>
      <ul><li>Known conditions, regular medicines, pregnancy, a recent hospital stay and a repeat visit are asked in one optional step.</li><li>Each history rule needs a history item and something in today's text (for example heart disease and chest discomfort, or a blood thinner and a fall). History alone never books someone as routine or names a disease.</li></ul>
      <h3>No diagnosis</h3>
      <ul><li>Rules describe what was written (“mentions chest pain”), never what it might be.</li><li>The AI is asked only for a lane and short quotes. Its free text is never shown, and quotes not found in the request are thrown away.</li><li>Patients only see “call 108 / 112”, “come today” or a booking.</li></ul>
      <h3>Safe fallback</h3>
      <ul><li>Routine needs positive evidence. Unclear, short, unsure or unmatched requests go to same-day human review.</li><li>A red flag written with a negation (“no chest pain”, “सांस की दिक्कत नहीं”) is not ruled out by the tool.</li><li>Scripts the rules cannot read yet (Tamil, Bengali and others) go to a person. So does Hindi that matched nothing.</li><li>If the AI check fails, a routine result is raised to human review.</li></ul>
      <h3>People stay in charge</h3>
      <ul><li>Every suggestion shows rule IDs and highlights the exact words.</li><li>Staff accept or change every lane with a reason, and every decision is logged. Raised lanes count as rule misses.</li><li>A named clinician owns the policy and reviews the log weekly.</li></ul>
      <h3>Data and privacy</h3>
      <ul><li>Only synthetic requests. No phone numbers or ID numbers are asked for, in line with data minimisation under the DPDP Act 2023.</li><li>Requests stay in this browser's storage. The optional AI check sends the request text with reassurance removed, and the age, with no name.</li></ul>
    </section>

    <section class="card flush" id="rules" style="margin-top:16px">
      <div style="padding:20px 20px 6px"><h2 class="h2i">${icon("layers")}Routing rules <span class="tag">${esc(window.TriageEngine.POLICY_VERSION)}</span></h2>
      <p class="ink2" style="margin-top:6px">Each rule has an ID, a lane and a plain-language reason. Patterns cover English, romanised Hinglish and Devanagari Hindi.</p></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Lane</th><th>Rule</th><th>Why</th></tr></thead><tbody>
        ${rules.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b></td><td>${laneChip(r.category)}</td><td><b>${esc(r.title)}</b>${r.fallback ? '<div class="muted">Safe fallback</div>' : ""}</td><td class="ink2">${esc(r.reason)}</td></tr>`).join("")}
        ${window.TriageEngine.HISTORY_RULES.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b></td><td>${laneChip(r.category)}</td><td><b>${esc(r.title)}</b><div class="muted">Past history, raises only</div></td><td class="ink2">${esc(r.reason)}</td></tr>`).join("")}
        <tr><td class="num"><b>G1</b></td><td><span class="tag saffron">Raises</span></td><td><b>Framing guard</b></td><td class="ink2">Reassurance removed, request scored again, the more urgent lane kept.</td></tr>
        <tr><td class="num"><b>AI</b></td><td><span class="tag saffron">Raises</span></td><td><b>AI second reader</b></td><td class="ink2">Optional. May raise a lane or mark text unclear; never lowers one.</td></tr>
      </tbody></table></div>
    </section>

    <section class="card prose" id="regulation" style="margin-top:16px">
      <h2>${icon("book")}Indian rules it is designed around</h2>
      <ul>
        <li><b>CDSCO medical device software guidance (2026):</b> AI software with a medical purpose is classed A to D. Staying non-diagnostic and staff-facing keeps Sanket on the low-risk side; a real deployment would still need a classification check.</li>
        <li><b>DPDP Act 2023:</b> consent and minimal collection. The demo stores no names, phone numbers or IDs.</li>
        <li><b>ICMR ethical guidelines for AI in healthcare (2023):</b> human oversight, transparency and accountability, covered by the override log, highlighted evidence and named clinician.</li>
        <li><b>Telemedicine Practice Guidelines 2020:</b> emergencies must go to in-person care at once, which is the emergency lane. Same-day reviews can use <a href="${SOURCES.esanjeevani.url}" target="_blank" rel="noopener">eSanjeevani</a>.</li>
        <li><b>IPHS 2022:</b> the PHC, CHC/FRU and district hospital ladder used for referral.</li>
      </ul>
    </section>

    <section class="card prose" id="data" style="margin-top:16px">
      <h2>${icon("chart")}Data sources</h2>
      <ul>${Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join("")}</ul>
      <p class="muted">Queue, requests, decisions and the 14-day trend are synthetic. Seasonal patterns are qualitative and vary by state.</p>
    </section>

    <section class="card flush" id="status" style="margin-top:16px">
      <div style="padding:20px 20px 6px"><h2 class="h2i">${icon("check")}Implemented and future work</h2></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Implemented</th><th>Future work</th></tr></thead><tbody>
        <tr><td>Patient, front desk, clinician and clinic lead windows, synced live across tabs</td><td>Server backend with login, audit trail and role permissions</td></tr>
        <tr><td>English, Hinglish and Devanagari Hindi rules; voice input and read-aloud</td><td>Tamil, Bengali, Marathi, Telugu and other scripts; IVR for feature phones</td></tr>
        <tr><td>Past medical history as escalate-only risk modifiers (11 rules)</td><td>Pull history from ABHA health records with consent instead of asking</td></tr>
        <tr><td>Framing guard; negation and unclear-text fallbacks</td><td>Clinician review of every rule; consented testing on real requests</td></tr>
        <tr><td>Optional Claude second reader that can only escalate</td><td>Multi-run agreement check; server-side key handling</td></tr>
        <tr><td>Programme-day booking (immunisation, PMSMA 9th, NCD clinic) and calendar file</td><td>Integration with ABHA / ABDM, eSanjeevani and the state HMIS</td></tr>
        <tr><td>Safety dashboard, season watch, CSV export of decisions</td><td>Equity audit by age, language and source; CDSCO classification check</td></tr>
      </tbody></table></div>
    </section>

    <section class="card flush" id="tests" style="margin-top:16px">
      <div style="padding:20px 20px 6px;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <h2 class="h2i">${icon("check")}Test cases</h2>
        <span class="tag ${pass === rows.length ? "brand" : "em"}">${pass} of ${rows.length} pass · run live in your browser</span>
      </div>
      <div class="table-wrap" style="max-height:520px"><table class="table"><thead><tr><th>ID</th><th>Request</th><th>Expected</th><th>Got</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b><div class="muted">${esc(r.group)}</div></td><td>${esc(r.desc)}</td><td>${laneChip(r.expect)}${r.expectRule ? `<div class="muted" style="margin-top:4px">${esc(r.expectRule)}</div>` : ""}</td><td>${r.pass ? icon("check", "ok") : icon("x", "bad")} ${esc(r.gotRules.join(", "))}</td></tr>`).join("")}
      </tbody></table></div>
    </section>
  </div>`;
  root.querySelectorAll("[data-jump]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault(); root.querySelector("#" + a.dataset.jump).scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}
