// About: the idea, the safety promises, the Indian data behind the rules, and
// the reference material (rules, tests, sources) folded away until asked for.
import { esc, icon, highlight, evidenceGroups, laneChip, LANE, fmtNum, countUp } from "../ui.js";
import { STATS, SOURCES } from "../india.js";
import * as charts from "../charts.js";
import { ILLUS } from "../illus.js";
import { photo } from "../photos.js";

const DEMO = "Seene mein halka sa dard hai, ghar wale bolte hain gas hai, kuch nahi hai";
const src = (k) => `<a class="src" href="${SOURCES[k].url}" target="_blank" rel="noopener">${esc(SOURCES[k].label.split(",")[0])}</a>`;

export function render(root) {
  const E = window.TriageEngine;
  const rows = window.TriageTests ? window.TriageTests.run(E) : [];
  const pass = rows.filter((r) => r.pass).length;
  root.innerHTML = `
  <div class="wrap narrow view about">
    <header class="page-head art-head tone-brand"><div>
      <div class="eyebrow"><span class="dot"></span>About Sanket</div>
      <h1>A sorting aid, not a doctor</h1>
      <p>Sanket suggests a lane for staff to check. It gives no diagnosis and has not been tested on real patients. All data is synthetic.</p>
    </div><div class="ph-art">${ILLUS.shield()}</div></header>

    <section class="guard-demo card">
      <div class="gd-copy">
        <div class="eyebrow"><span class="dot"></span>The new idea</div>
        <h2>A guard against “kuch nahi hai”</h2>
        <p class="ink2">Families often soften a request: “bas thoda sa dard hai”, “gas hai”. A 2026 Nature Medicine study found such reassurance made AI triage <b>11.7 times</b> more likely to under-triage. Sanket removes these phrases, scores the request again, and keeps the more urgent lane.</p>
        <p class="muted" style="font-size:12.5px;margin-top:10px">${src("nature")}</p>
      </div>
      <div class="gd-try">
        <label class="label" for="try">Try it. Edit the text.</label>
        <textarea id="try" class="textarea" style="min-height:88px">${esc(DEMO)}</textarea>
        <div class="gd-out" data-out></div>
      </div>
    </section>

    <section class="card prose" style="margin-top:16px">
      <h2>${icon("shield")}Five safety promises</h2>
      <ul class="promises">
        <li><b>Emergencies never wait.</b> Red-flag rules run first, offline, without AI. 108 and 112 are on every screen.</li>
        <li><b>Unclear means a person looks.</b> Routine needs clear evidence; anything vague goes to same-day review.</li>
        <li><b>History and AI can only raise a lane.</b> Neither can make a request less urgent.</li>
        <li><b>Staff decide.</b> Every lane is confirmed or changed with a reason, and logged.</li>
        <li><b>No personal data.</b> No phone number or ID is asked for (DPDP Act 2023).</li>
      </ul>
    </section>

    <section class="card" style="margin-top:16px">
      <h2 class="h2i">${icon("chart")}Why it matters in India</h2>
      ${photo("opd", { w: 1400, cls: "why-photo", caption: "<b>A busy government OPD</b><span>Every request here needs the right lane, fast</span>" })}
      <div class="grid g3 facts stagger" style="margin-top:14px">
        <div class="fact">${icon("hospital")}<strong class="num" data-count="${STATS.specialistGap.value}" data-dec="1" data-suffix="%">0%</strong><span>of specialist posts at rural CHCs were vacant in 2023, so the first desk has to get the lane right.</span><small>${src("hdi")}</small></div>
        <div class="fact">${icon("thermo")}<strong class="num" data-count="${STATS.heat2024.suspected}">0</strong><span>suspected heatstroke cases in summer 2024. “Loo lag gayi” goes to emergency.</span><small>${src("heat")}</small></div>
        <div class="fact">${icon("snake")}<strong class="num">~<span data-count="${STATS.snakebiteDeaths}">0</span></strong><span>snakebite deaths a year. A bite is never booked as routine.</span><small>${src("snake")}</small></div>
      </div>
      <div class="card-head" style="margin-top:20px"><div><h3>Dengue cases in India</h3><div class="sub">${src("dengue")}</div></div></div>
      <div data-c="dengue"></div>
    </section>

    <details class="card more ref" style="margin-top:16px">
      <summary>${icon("layers")}Routing rules <span class="tag">${E.RULES.length + E.HISTORY_RULES.length + 2}</span></summary>
      <div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Lane</th><th>Rule</th></tr></thead><tbody>
        ${E.RULES.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b></td><td>${laneChip(r.category)}</td><td><b>${esc(r.title)}</b><div class="muted">${esc(r.reason)}</div></td></tr>`).join("")}
        ${E.HISTORY_RULES.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b></td><td>${laneChip(r.category)}</td><td><b>${esc(r.title)}</b><div class="muted">Past history, raises only. ${esc(r.reason)}</div></td></tr>`).join("")}
        <tr><td class="num"><b>G1</b></td><td><span class="tag saffron">Raises</span></td><td><b>Reassurance guard</b><div class="muted">Phrases removed, request scored again, the more urgent lane kept.</div></td></tr>
        <tr><td class="num"><b>AI</b></td><td><span class="tag saffron">Raises</span></td><td><b>AI second reader</b><div class="muted">Optional Gemini or Claude check after the rules, when staff press Ask AI. May raise a lane; never lowers one.</div></td></tr>
      </tbody></table></div>
    </details>

    <details class="card more ref" style="margin-top:12px">
      <summary>${icon("check")}Test cases <span class="tag ${pass === rows.length ? "brand" : "em"}">${pass} of ${rows.length} pass</span></summary>
      <div class="table-wrap" style="max-height:480px"><table class="table"><thead><tr><th>ID</th><th>Request</th><th>Expected</th><th>Result</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td class="num"><b>${esc(r.id)}</b></td><td>${esc(r.desc)}</td><td>${LANE[r.expect] ? laneChip(r.expect) : `<span class="tag">${esc(r.expect)}</span>`}</td><td>${r.pass ? icon("check", "ok") : icon("x", "bad")} ${esc(r.gotRules.join(", "))}</td></tr>`).join("")}
      </tbody></table></div>
    </details>

    <details class="card more ref" style="margin-top:12px">
      <summary>${icon("book")}Sources and regulations</summary>
      <div class="prose">
        <ul>${Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join("")}</ul>
        <p class="muted">Designed around CDSCO medical device software guidance, the DPDP Act 2023, ICMR's 2023 AI ethics guidelines, the Telemedicine Practice Guidelines 2020 and IPHS 2022.</p>
      </div>
    </details>

    <details class="card more ref" style="margin-top:12px">
      <summary>${icon("arrowR")}Future work</summary>
      <div class="prose"><ul>
        <li>Server backend with login and an audit trail.</li>
        <li>More Indian languages, and phone (IVR) intake for feature phones.</li>
        <li>Pull history from ABHA records with consent; link to eSanjeevani and the state HMIS.</li>
        <li>Clinician review of every rule and consented testing on real requests.</li>
      </ul></div>
    </details>
  </div>`;

  const ta = root.querySelector("#try"), out = root.querySelector("[data-out]");
  const paint = () => {
    const txt = ta.value.trim();
    if (!txt) { out.innerHTML = `<span class="muted">Type a request to see the lane.</span>`; return; }
    const r = E.route({ description: txt, age: 55 });
    const g = r.framingGuard;
    out.innerHTML = `
      <div class="gd-text">${highlight(txt, evidenceGroups(r))}</div>
      <div class="gd-lanes">
        <div><span class="label">As written</span>${laneChip(g.asWritten, true)}</div>
        <span class="gd-arrow">${icon("arrowR")}</span>
        <div class="gd-final"><span class="label">Sanket keeps</span>${laneChip(r.category, true)}</div>
      </div>`;
  };
  ta.addEventListener("input", paint);
  paint();
  charts.bars(root.querySelector('[data-c="dengue"]'), STATS.dengue.map((d) => ({ label: String(d.year), value: d.cases, tip: `<b>${d.year}</b><br>${fmtNum(d.cases)} cases`, color: "var(--brand)" })), { height: 180, fmt: (v) => (v >= 1000 ? Math.round(v / 1000) + "k" : v) });
  countUp(root);
}
