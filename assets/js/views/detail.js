// The request panel shared by the front desk and doctor windows. The
// essentials are shown first; everything else sits behind "More details".
import { esc, icon, highlight, evidenceGroups, laneChip, LANE, ago, fmtTime, fmtDate } from "../ui.js";
import { OUTCOMES } from "../store.js";

export const SOURCE = {
  web: { label: "Web form", icon: "web" },
  whatsapp: { label: "WhatsApp", icon: "msg" },
  phone: { label: "Phone call", icon: "phone" },
  walkin: { label: "Walk-in", icon: "walk" }
};

export const STATUS = {
  new: { label: "New", cls: "info" },
  signposted: { label: "108 advised", cls: "em" },
  accepted: { label: "With doctor", cls: "saffron" },
  booked: { label: "Booked", cls: "brand" },
  reviewed: { label: "Reviewed", cls: "brand" },
  closed: { label: "Closed", cls: "" }
};

export const statusTag = (s) => `<span class="tag ${STATUS[s].cls}">${STATUS[s].label}</span>`;
export const ageText = (a) => (a == null ? "Age not given" : a < 1 ? Math.round(a * 12) + " months" : a + " yrs");
export const historyItems = (r) => window.TriageEngine.historySummary({ history: r.pmh || {} });

export function headerHtml(r, closable = true) {
  return `
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="token-lg num">${esc(r.token)}</span>${laneChip(r.lane, true)}${statusTag(r.status)}
      </div>
      <div class="meta-row">
        <span>${icon(SOURCE[r.source].icon)}${SOURCE[r.source].label}</span>
        <span>${icon("user")}${ageText(r.age)}${r.forWhom === "family" ? ", by family" : ""}</span>
        <span>${icon("clock")}${ago(r.createdAt)}</span>
      </div>
    </div>
    ${closable ? `<button class="icon-btn" data-close aria-label="Close">${icon("x")}</button>` : ""}`;
}

export function bodyHtml(r) {
  const res = r.result;
  const g = res.framingGuard || { phrases: [] };
  const hist = historyItems(r);
  const svc = r.service;
  const next = r.lane === "EMERGENCY"
    ? `${icon("ambulance")}<span>Tell them to call <b>108</b> now. Or take them to the nearest 24x7 hospital.</span>`
    : svc ? `${icon("calendar")}<span>${r.lane === "ROUTINE" ? "Booked" : "If routine later"}: <b>${esc(svc.name)}</b>, ${esc(fmtDate(svc.date))} ${esc(svc.time)}</span>` : "";
  const others = (res.otherSignals || []).filter((x) => !res.reasons.some((y) => y.ruleId === x.ruleId));
  const ai = !res.ai ? "Off (rules only)" : res.ai.failed ? "Failed, so routine was raised to review" : res.ai.escalated ? `Raised the lane to ${LANE[res.ai.level].short}` : `Agreed (${LANE[res.ai.level].short})`;

  return `
    <blockquote class="req-text">${highlight(r.description, evidenceGroups(res))}</blockquote>
    <section class="sect">
      <h4>Why ${esc(LANE[r.suggestedLane].short.toLowerCase())}</h4>
      <ul class="reasons">${res.reasons.map((x) => `<li><span class="rid ${x.category}">${esc(x.ruleId)}</span><div><b>${esc(x.title)}</b><p>${esc(x.reason)}</p></div></li>`).join("")}</ul>
    </section>
    ${r.lane !== r.suggestedLane ? `<div class="note">${icon("undo")}<span>Staff changed ${LANE[r.suggestedLane].short.toLowerCase()} to <b>${LANE[r.lane].short.toLowerCase()}</b>.</span></div>` : ""}
    ${g.changed ? `<div class="note warm">${icon("shield")}<span>Family reassurance (<s>${esc(g.phrases[0])}</s>) was ignored. Without it the request is <b>${LANE[g.withoutReassurance].short.toLowerCase()}</b>.</span></div>` : ""}
    ${hist.length ? `<div class="hist-row">${icon("doc")}<span>${hist.map((x) => `<span class="tag">${esc(x)}</span>`).join(" ")}</span></div>` : ""}
    ${next ? `<div class="next-row">${next}</div>` : ""}
    <details class="more">
      <summary>More details</summary>
      ${others.length ? `<p class="label">Other signals</p><ul class="reasons">${others.map((x) => `<li><span class="rid ${x.category}">${esc(x.ruleId)}</span><div><b>${esc(x.title)}</b></div></li>`).join("")}</ul>` : ""}
      ${g.phrases.length && !g.changed ? `<p class="muted">Reassurance found and ignored: ${g.phrases.map((p) => `<s>${esc(p)}</s>`).join(", ")}. Lane unchanged.</p>` : ""}
      <p class="muted">AI second reader: ${ai}</p>
      <p class="label">Timeline</p>
      <ol class="hist">${r.history.map((h) => `<li><span class="dotl ${h.to || ""}"></span><div><b>${esc(h.by)}</b> ${esc(histText(h))}${h.reason ? ` · “${esc(h.reason)}”` : ""}<span class="muted">${fmtTime(h.at)}</span></div></li>`).join("")}</ol>
    </details>`;
}

function histText(h) {
  const L = (c) => (c ? LANE[c].short.toLowerCase() : "");
  switch (h.action) {
    case "suggested": return `suggested ${L(h.to)} (${h.note})`;
    case "accepted": return `accepted ${L(h.to)}`;
    case "signposted": return "gave 108 guidance";
    case "override": return `changed ${L(h.from)} to ${L(h.to)}`;
    case "escalated": return `raised ${L(h.from)} to ${L(h.to)}`;
    case "reviewed": return `reviewed: ${OUTCOMES[h.outcome] ? OUTCOMES[h.outcome].label : h.outcome}`;
    case "closed": return "closed the request";
    case "rule-flag": return "flagged the rules";
    default: return h.action;
  }
}
