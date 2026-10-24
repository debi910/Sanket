// Clinic lead window: safety measures from the decision log, rule activity,
// seasonal readiness and the public Indian data behind the design.
import { esc, icon, toast, modal, laneChip, LANE, fmtNum, fmtTime, fmtDate, countUp } from "../ui.js";
import * as store from "../store.js";
import { getKey, setKey } from "../ai.js";
import * as charts from "../charts.js";
import { STATS, SOURCES, SEASONS, seasonWatch, CLINIC } from "../india.js";

const COL = { E: "var(--em)", S: "var(--sd-dot)", R: "var(--rt-dot)" };
const src = (k) => `<a class="src" href="${SOURCES[k].url}" target="_blank" rel="noopener">${esc(SOURCES[k].label)}</a>`;

export function render(root) {
  const s = store.load();
  const now = Date.now();
  const req = s.requests;
  const lane = (l) => req.filter((r) => r.suggestedLane === l).length;
  const overrides = s.log.filter((h) => h.action === "override");
  const raised = overrides.filter((h) => store.laneRank(h.to) > store.laneRank(h.from));
  const lowered = overrides.filter((h) => store.laneRank(h.to) < store.laneRank(h.from));
  const guard = req.filter((r) => r.result.framingGuard && r.result.framingGuard.changed).length;
  const fallback = req.filter((r) => r.result.isFallback).length;
  const emActs = req.filter((r) => r.lane === "EMERGENCY").map((r) => { const h = r.history.find((x) => x.action === "signposted"); return h ? (h.at - r.createdAt) / 1000 : null; }).filter((x) => x != null);
  const median = (a) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const sdReviewed = req.filter((r) => r.history.some((h) => h.action === "reviewed"));
  const within2h = sdReviewed.filter((r) => r.history.find((h) => h.action === "reviewed").at - r.createdAt <= 2 * 3600e3).length;
  const ruleCount = {};
  req.forEach((r) => r.result.reasons.concat(r.result.otherSignals || []).forEach((x) => { const k = x.ruleId; ruleCount[k] = ruleCount[k] || { id: k, title: x.title, cat: x.category, n: 0 }; ruleCount[k].n++; }));
  const topRules = Object.values(ruleCount).sort((a, b) => b.n - a.n).slice(0, 8);
  const sw = seasonWatch();
  const m = new Date().getMonth();

  root.innerHTML = `
  <div class="wrap view ins">
    <header class="page-head">
      <div>
        <div class="eyebrow"><span class="dot"></span>Clinic lead · safety and insights</div>
        <h1>Is the front door safe today?</h1>
        <p>Every lane change by a person is a signal. Raised lanes are rule misses to fix; lowered lanes need a clear reason. All data here is synthetic.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" data-csv>${icon("download")} Export log (CSV)</button>
        <button class="btn" data-settings>${icon("key")} Settings</button>
      </div>
    </header>

    <div class="grid g4 kpis stagger">
      ${kpi("Requests today", req.length, "", "queue", `${lane("EMERGENCY")} emergency · ${lane("SAME_DAY")} same-day · ${lane("ROUTINE")} routine`)}
      ${kpi("Emergency guidance logged", median(emActs) != null ? Math.round(median(emActs)) : 0, "s", "ambulance", "Median time from request to staff confirming 108 advice", median(emActs) != null && median(emActs) <= 60 ? "good" : "warn")}
      ${kpi("Rule misses (staff raised)", raised.length, "", "arrowUp", "Each one is a wording the rules did not catch", raised.length ? "warn" : "good")}
      ${kpi("Framing guard saves", guard, "", "shield", `${fallback} unclear requests sent to a person`)}
    </div>

    <div class="grid ins-a">
      <div class="card">
        <div class="card-head"><div><h3>Requests by lane</h3><div class="sub">Last 14 days and today · suggested lane</div></div>
          <div class="legend"><span><i style="background:${COL.E}"></i>Emergency</span><span><i style="background:${COL.S}"></i>Same-day</span><span><i style="background:${COL.R}"></i>Routine</span></div></div>
        <div data-c="trend"></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Today's lane mix</h3><div class="sub">${req.length} requests</div></div></div>
        <div data-c="mix"></div>
        <hr class="divider">
        <div class="mini-stats">
          <div><span class="muted">Same-day reviewed in 2 h</span><b class="num">${sdReviewed.length ? Math.round((within2h / sdReviewed.length) * 100) + "%" : "—"}</b></div>
          <div><span class="muted">Lowered by staff</span><b class="num">${lowered.length}</b></div>
          <div><span class="muted">Rule flags from doctor</span><b class="num">${s.ruleFlags.length}</b></div>
          <div><span class="muted">Policy</span><b>${esc(window.TriageEngine.POLICY_VERSION.split(" ").slice(0, 2).join(" "))}</b></div>
        </div>
      </div>
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <div class="card-head"><div><h3>Rules that fired today</h3><div class="sub">Includes secondary signals</div></div></div>
        <div data-c="rules"></div>
      </div>
      <div class="card flush">
        <div class="card-head" style="padding:20px 20px 0"><div><h3>Lane changes and rule flags</h3><div class="sub">What the clinic lead reviews each week</div></div></div>
        <div class="table-wrap" style="max-height:330px">
          <table class="table"><thead><tr><th>Token</th><th>Change</th><th>Reason</th><th>By</th></tr></thead><tbody>
          ${overrides.concat(s.log.filter((h) => h.action === "rule-flag")).sort((a, b) => b.at - a.at).map((h) => `<tr>
            <td class="num"><b>${esc(h.token)}</b><div class="muted">${fmtTime(h.at)}</div></td>
            <td>${h.action === "rule-flag" ? `<span class="tag">${icon("flag")}Flag</span>` : `${laneChip(h.from)} ${icon("arrowR", "inl")} ${laneChip(h.to)}<div class="muted" style="margin-top:4px">${store.laneRank(h.to) > store.laneRank(h.from) ? "Raised (rule miss)" : "Lowered"}</div>`}</td>
            <td>${esc(h.reason || h.note || "")}</td><td class="muted">${esc(h.by)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">No changes yet today.</td></tr>`}
          </tbody></table>
        </div>
      </div>
    </div>

    <section class="ctx">
      <div class="ctx-head">
        <div class="eyebrow"><span class="dot"></span>Indian context</div>
        <h2>Why the front door matters here</h2>
        <p class="ink2">Public data that shaped Sanket's rules and booking. Hover any bar for the figure.</p>
      </div>

      <div class="card ladder-card">
        <div class="card-head"><div><h3>The referral ladder, and where it thins out</h3><div class="sub">Public health facilities in India · ${src("hdi")}</div></div></div>
        <div class="ladder stagger">
          ${STATS.infra.map((f, i) => `<div class="rung r${i}">
            <span class="r-count num">${f.approx ? "~" : ""}${fmtNum(f.count)}${f.plus ? "+" : ""}</span>
            <b>${esc(f.level)}</b><span class="muted">${esc(f.note)}</span></div>`).join(`<span class="r-arrow">${icon("arrowR")}</span>`)}
        </div>
        <div class="gap-band">
          <div class="gap-num"><strong class="num" data-count="${STATS.specialistGap.value}" data-dec="1" data-suffix="%">0%</strong><span>of specialist posts at rural CHCs were short in March 2023</span></div>
          <p class="ink2">${esc(STATS.specialistGap.of)}. When the first referral unit has no specialist, a PHC that sends the wrong patient up the ladder, or keeps the wrong one back, costs hours. Sanket's job is to get the lane right at the first desk and to say plainly when to skip the queue and call 108.</p>
        </div>
      </div>

      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><div><h3>Dengue cases in India</h3><div class="sub">${src("dengue")}</div></div></div>
          <div data-c="dengue"></div>
          <p class="muted" style="font-size:12.5px;margin-top:10px">2024 top states: ${STATS.dengueTop2024.map((d) => `${esc(d.state)} ${fmtNum(d.cases)}`).join(", ")}. Rule <span class="kbd">E12</span> sends fever with bleeding gums, nosebleed, black stools or severe belly pain straight to emergency guidance.</p>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Seasonal readiness</h3><div class="sub">Relative pattern from IDSP, NCVBDC and NCDC reporting · not counts</div></div></div>
          <div data-c="season"></div>
          <p class="muted" style="font-size:12.5px;margin-top:10px">${sw.peak.length ? `In ${sw.month}, ${sw.peak.map((r) => esc(r.label.toLowerCase())).join(", ")} ${sw.peak.length > 1 ? "are" : "is"} at peak. The front desk shows a season watch banner with the matching red-flag rules.` : "No peak season this month."}</p>
        </div>
      </div>

      <div class="grid g3 facts stagger" style="margin-top:16px">
        <div class="card fact">${icon("thermo")}<strong class="num" data-count="${STATS.heat2024.suspected}">0</strong><span>suspected heatstroke cases, 1 Mar to 18 Jun 2024, with ${STATS.heat2024.deaths} deaths. Rule <span class="kbd">E11</span> catches “loo lag gayi” and “लू लग गई”.</span><small>${src("heat")}</small></div>
        <div class="card fact">${icon("snake")}<strong class="num">~<span data-count="${STATS.snakebiteDeaths}">0</span></strong><span>snakebite deaths a year in India (2000 to 2019), mostly farmers in the monsoon. Rule <span class="kbd">E10</span> never books a bite as routine.</span><small>${src("snake")}</small></div>
        <div class="card fact">${icon("heart")}<strong class="num">14416</strong><span>Tele-MANAS, free 24x7 mental health line. Shown with 108 whenever rule <span class="kbd">E8</span> fires.</span><small>${src("telemanas")}</small></div>
      </div>

      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><div><h3>Chronic conditions a PHC sees every week</h3><div class="sub">${src("nfhs")}</div></div></div>
          <div data-c="nfhs"></div>
          <p class="muted" style="font-size:12.5px;margin-top:12px">One in four adult men has raised blood pressure. That is why refill requests are booked straight into the NCD clinic day, while a missed insulin dose goes to same-day review.</p>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Programme coverage gaps</h3><div class="sub">${src("nfhs")}</div></div></div>
          <div data-c="cov"></div>
          <p class="muted" style="font-size:12.5px;margin-top:12px">A quarter of children miss full immunisation. Sanket books vaccine requests into the next immunisation session and reminds parents to bring the MCP card. Pregnancy requests point to the PMSMA clinic on the 9th. ${src("pmsma")}</p>
        </div>
      </div>
    </section>
  </div>`;

  const c = (k) => root.querySelector(`[data-c="${k}"]`);
  const today = { label: "Today", full: "Today (live)", values: { E: lane("EMERGENCY"), S: lane("SAME_DAY"), R: lane("ROUTINE") } };
  charts.stacked(c("trend"), s.days.map((d) => ({ label: fmtDate(d.date, { day: "numeric" }), full: fmtDate(d.date), values: { E: d.E, S: d.S, R: d.R } })).concat([today]),
    [{ key: "E", label: "Emergency", color: COL.E }, { key: "S", label: "Same-day", color: COL.S }, { key: "R", label: "Routine", color: COL.R }]);
  charts.shareBar(c("mix"), [{ label: "Emergency", value: lane("EMERGENCY"), color: COL.E }, { label: "Same-day", value: lane("SAME_DAY"), color: COL.S }, { label: "Routine", value: lane("ROUTINE"), color: COL.R }]);
  charts.bars(c("rules"), topRules.map((r) => ({ label: r.id, value: r.n, color: r.cat === "EMERGENCY" ? COL.E : r.cat === "ROUTINE" ? COL.R : COL.S, tip: `<b>${esc(r.id)} · ${esc(r.title)}</b><br>${r.n} request${r.n > 1 ? "s" : ""}` })), { height: 210 });
  charts.bars(c("dengue"), STATS.dengue.map((d) => ({ label: String(d.year), value: d.cases, tip: `<b>${d.year}</b><br>${fmtNum(d.cases)} cases<br>${d.deaths} deaths`, color: "var(--brand)" })), { height: 220, fmt: (v) => (v >= 1000 ? Math.round(v / 1000) + "k" : v) });
  charts.heatmap(c("season"), SEASONS, m);
  charts.hbars(c("nfhs"), STATS.nfhs.map((n) => ({ label: n.label, value: n.value, note: n.rule })), { max: 80 });
  charts.hbars(c("cov"), STATS.nfhsCoverage.map((n) => ({ label: n.label, value: n.value, color: "var(--saffron)" })));
  countUp(root);

  root.querySelector("[data-csv]").addEventListener("click", () => {
    const rows = [["time", "token", "by", "action", "from", "to", "reason_or_note"]].concat(s.log.map((h) => [new Date(h.at).toISOString(), h.token, h.by, h.action, h.from || "", h.to || "", (h.reason || h.note || "").replace(/"/g, "'")]));
    const csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "sanket-decision-log.csv"; a.click();
    toast("Decision log downloaded");
  });
  root.querySelector("[data-settings]").addEventListener("click", openSettings);
}

function kpi(label, value, suffix, ic, sub, tone) {
  return `<div class="card kpi ${tone || ""}"><div class="k-top"><span class="k-ico">${icon(ic)}</span><span class="k-lbl">${esc(label)}</span></div>
    <strong class="num" data-count="${value}" data-suffix="${suffix}">0${suffix}</strong><span class="muted">${esc(sub)}</span></div>`;
}

export function openSettings() {
  const st = store.settings();
  const m = modal(`
    <h2 style="font-size:20px">Settings</h2>
    <p class="muted" style="margin:4px 0 18px">These apply to this browser only.</p>
    <div class="grid" style="gap:16px">
      <label class="check"><input type="checkbox" data-ai ${st.ai ? "checked" : ""}><span><strong>AI second reader (Claude)</strong><span>Runs after the rules and may only raise a lane. Quotes it gives are kept only if they appear in the request. If it fails, a routine result goes to a person.</span></span></label>
      <div class="field"><label>Anthropic API key</label><input class="input" type="password" autocomplete="off" data-key value="${esc(getKey())}" placeholder="sk-ant-…"><span class="hint">Kept only in this tab (sessionStorage) and sent only to the Anthropic API. For a real clinic, this call belongs on a server.</span></div>
      <div class="field"><label>Model</label><select class="input select" data-model>
        ${["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"].map((x) => `<option ${x === st.model ? "selected" : ""}>${x}</option>`).join("")}</select></div>
      <hr class="divider" style="margin:4px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="muted" style="font-size:13px">Reset the synthetic queue and decision log for a fresh demo.</span>
        <button class="btn" data-reset>${icon("refresh")} Reset demo data</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>Save</button></div>`, { label: "Settings" });
  m.el.querySelector("[data-save]").addEventListener("click", () => {
    setKey(m.el.querySelector("[data-key]").value.trim());
    store.settings({ ai: m.el.querySelector("[data-ai]").checked, model: m.el.querySelector("[data-model]").value });
    m.close(); toast("Settings saved");
  });
  m.el.querySelector("[data-reset]").addEventListener("click", () => { store.reset(); m.close(); toast("Demo data reset"); location.reload(); });
}
