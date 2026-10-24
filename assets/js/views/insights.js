// Clinic lead dashboard: today's counts, the 14-day trend and every lane
// change staff made, which is how rule misses are found.
import { esc, icon, toast, modal, laneChip, fmtTime, fmtDate, countUp } from "../ui.js";
import * as store from "../store.js";
import { getKey, setKey } from "../ai.js";
import * as charts from "../charts.js";
import { ILLUS } from "../illus.js";

const COL = { E: "var(--em)", S: "var(--sd-dot)", R: "var(--rt-dot)" };

export function render(root) {
  const s = store.load();
  const req = s.requests;
  const lane = (l) => req.filter((r) => r.suggestedLane === l).length;
  const overrides = s.log.filter((h) => h.action === "override");
  const raised = overrides.filter((h) => store.laneRank(h.to) > store.laneRank(h.from));
  const guard = req.filter((r) => r.result.framingGuard && r.result.framingGuard.changed).length;
  const changes = overrides.concat(s.log.filter((h) => h.action === "rule-flag")).sort((a, b) => b.at - a.at);

  root.innerHTML = `
  <div class="wrap view ins">
    <header class="page-head art-head tone-em">
      <div>
        <div class="eyebrow"><span class="dot"></span>Clinic lead</div>
        <h1>Dashboard</h1>
        <p>Lanes raised by staff are rule misses to fix. All data is synthetic.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" data-csv>${icon("download")} Export CSV</button>
          <button class="btn" data-settings>${icon("key")} Settings</button>
        </div>
      </div>
      <div class="ph-art">${ILLUS.dashboard()}</div>
    </header>

    <div class="grid g3 kpis stagger">
      ${kpi("Requests today", req.length, "", "queue", "Across all three lanes", "var(--brand)", charts.sparkline(s.days.map((d) => d.E + d.S + d.R).concat(req.length), { w: 96, h: 30, color: "var(--brand)" }))}
      ${kpi("Rule misses", raised.length, "", "arrowUp", "Lanes staff had to raise", "var(--saffron)")}
      ${kpi("Reassurance caught", guard, "", "shield", "Requests made safer by the guard", "var(--em)")}
    </div>

    <div class="grid ins-b" style="margin-top:16px">
      <div class="card">
        <div class="card-head"><div><h3>Requests by lane</h3><div class="sub">Last 14 days and today</div></div>
          <div class="legend"><span><i style="background:${COL.E}"></i>Emergency</span><span><i style="background:${COL.S}"></i>Same-day</span><span><i style="background:${COL.R}"></i>Routine</span></div></div>
        <div data-c="trend"></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Today's mix</h3><div class="sub">Suggested lane</div></div></div>
        ${donut([["Emergency", lane("EMERGENCY"), COL.E], ["Same-day", lane("SAME_DAY"), COL.S], ["Routine", lane("ROUTINE"), COL.R]])}
      </div>
    </div>

    <div class="card flush" style="margin-top:16px">
      <div class="card-head" style="padding:20px 20px 0"><div><h3>Lane changes</h3><div class="sub">Reviewed each week</div></div></div>
      <div class="table-wrap" style="max-height:340px">
        <table class="table"><thead><tr><th>Token</th><th>Change</th><th>Reason</th></tr></thead><tbody>
        ${changes.map((h) => `<tr>
          <td class="num"><b>${esc(h.token)}</b><div class="muted">${fmtTime(h.at)}</div></td>
          <td>${h.action === "rule-flag" ? `<span class="tag">${icon("flag")}Flag</span>` : `${laneChip(h.from)} ${icon("arrowR", "inl")} ${laneChip(h.to)}`}</td>
          <td>${esc(h.reason || h.note || "")}<div class="muted">${esc(h.by)}</div></td></tr>`).join("") || `<tr><td colspan="3" class="muted">No changes yet today.</td></tr>`}
        </tbody></table>
      </div>
    </div>
  </div>`;

  const c = (k) => root.querySelector(`[data-c="${k}"]`);
  const today = { label: "Today", full: "Today (live)", values: { E: lane("EMERGENCY"), S: lane("SAME_DAY"), R: lane("ROUTINE") } };
  charts.stacked(c("trend"), s.days.map((d) => ({ label: fmtDate(d.date, { day: "numeric" }), full: fmtDate(d.date), values: { E: d.E, S: d.S, R: d.R } })).concat([today]),
    [{ key: "E", label: "Emergency", color: COL.E }, { key: "S", label: "Same-day", color: COL.S }, { key: "R", label: "Routine", color: COL.R }]);
  countUp(root);
  requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll(".donut [data-d]").forEach((c) => c.setAttribute("stroke-dasharray", c.dataset.d))));

  root.querySelector("[data-csv]").addEventListener("click", () => {
    const rows = [["time", "token", "by", "action", "from", "to", "reason_or_note"]].concat(s.log.map((h) => [new Date(h.at).toISOString(), h.token, h.by, h.action, h.from || "", h.to || "", (h.reason || h.note || "").replace(/"/g, "'")]));
    const csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "sanket-decision-log.csv"; a.click();
    toast("Decision log downloaded");
  });
  root.querySelector("[data-settings]").addEventListener("click", openSettings);
}

function kpi(label, value, suffix, ic, sub, tone, extra = "") {
  return `<div class="card kpi" style="--tone:${tone}"><div class="k-top"><span class="k-ico">${icon(ic)}</span><span class="k-lbl">${esc(label)}</span></div>
    <strong class="num" data-count="${value}" data-suffix="${suffix}">0${suffix}</strong><span class="muted">${esc(sub)}</span>${extra ? `<span class="k-spark">${extra}</span>` : ""}</div>`;
}

// Donut of today's lane mix; each arc draws in from zero.
function donut(parts) {
  const total = parts.reduce((a, p) => a + p[1], 0) || 1, C = 2 * Math.PI * 52;
  let off = 0;
  const arcs = parts.map(([l, v, c], i) => {
    const len = (v / total) * C, gap = v ? 3 : 0;
    const arc = `<circle cx="75" cy="75" r="52" fill="none" stroke="${c}" stroke-width="18" stroke-dasharray="0 ${C}" data-d="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)" stroke-linecap="butt" style="transition-delay:${i * 90}ms"/>`;
    off += len; return arc;
  }).join("");
  return `<div class="donut-wrap"><svg class="donut" viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="52" fill="none" stroke="var(--bg-sunk)" stroke-width="18"/>${arcs}
    <text x="75" y="78" text-anchor="middle" class="donut-mid">${total}</text><text x="75" y="96" text-anchor="middle" class="donut-sub">requests</text></svg>
    <div class="donut-leg">${parts.map(([l, v, c]) => `<div><i style="background:${c}"></i>${esc(l)}<b class="num">${v}</b></div>`).join("")}</div></div>`;
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
