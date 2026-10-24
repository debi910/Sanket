// The request detail panel shared by the front desk and clinician windows:
// highlighted evidence, rule reasons, the framing guard comparison, AI status,
// booking or referral, and the decision history.
import { esc, icon, highlight, evidenceGroups, laneChip, LANE, ago, fmtTime, fmtDate } from "../ui.js";
import { CLINIC } from "../india.js";
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
  accepted: { label: "Awaiting review", cls: "saffron" },
  booked: { label: "Booked", cls: "brand" },
  reviewed: { label: "Reviewed", cls: "brand" },
  closed: { label: "Closed", cls: "" }
};

export const statusTag = (s) => `<span class="tag ${STATUS[s].cls}">${STATUS[s].label}</span>`;
export const ageText = (a) => (a == null ? "Age not given" : a < 1 ? Math.round(a * 12) + " months" : a + " yrs");
export const isHindi = (t) => /[ऀ-ॿ]/.test(t || "");

export function headerHtml(r) {
  return `
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="token-lg num">${esc(r.token)}</span>
        ${laneChip(r.lane, true)}
        ${statusTag(r.status)}
      </div>
      <div class="meta-row">
        <span>${icon(SOURCE[r.source].icon)}${SOURCE[r.source].label}</span>
        <span>${icon("user")}${ageText(r.age)}${r.forWhom === "family" ? " · written by family" : ""}</span>
        <span>${icon("clock")}${fmtTime(r.createdAt)} · ${ago(r.createdAt)}</span>
        ${r.area ? `<span>${icon("pin")}${esc(r.area)}</span>` : ""}
      </div>
    </div>
    <button class="icon-btn" data-close aria-label="Close">${icon("x")}</button>`;
}

export function bodyHtml(r) {
  const res = r.result;
  const g = res.framingGuard || { phrases: [] };
  const LBL = (c) => LANE[c].long;
  const reasons = res.reasons.map((x) => `
      <li><span class="rid ${x.category}">${esc(x.ruleId)}</span><div><b>${esc(x.title)}</b><p>${esc(x.reason)}</p>
      ${x.evidence && x.evidence.length ? `<div class="evs">${x.evidence.map((e) => `<span class="ev-pill">“${esc(e)}”</span>`).join("")}</div>` : ""}</div></li>`).join("");
  const others = (res.otherSignals || []).filter((x) => !res.reasons.some((y) => y.ruleId === x.ruleId));
  const overridden = r.lane !== r.suggestedLane;
  let ai;
  if (!res.ai) ai = `<span class="tag">${icon("spark")}AI check off</span><span class="muted">Rules only. Switch on in Settings.</span>`;
  else if (res.ai.failed) ai = `<span class="tag em">${icon("alert")}AI check failed</span><span class="muted">Routine results are raised to human review.</span>`;
  else if (res.ai.escalated) ai = `<span class="tag saffron">${icon("arrowUp")}AI raised to ${LANE[res.ai.level].short}</span><span class="muted">Quotes kept only if found in the text.</span>`;
  else ai = `<span class="tag brand">${icon("check")}AI agreed</span><span class="muted">AI read: ${LANE[res.ai.level].short}${res.ai.unclear ? ", unclear" : ""}.</span>`;

  const svc = r.service;
  const plan = r.lane === "EMERGENCY" ? `
    <section class="sect">
      <h4>${icon("route")}Referral chain</h4>
      <div class="chain">
        ${CLINIC.referral.map((f, i) => `<div class="hop ${i === 1 ? "on" : ""}"><span class="lvl">${esc(f.level)}</span><b>${esc(f.name)}</b><span class="muted">${esc(f.dist || "Here")}</span></div>${i < CLINIC.referral.length - 1 ? `<span class="arrow">${icon("arrowR")}</span>` : ""}`).join("")}
      </div>
      <p class="muted" style="margin-top:10px;font-size:13px">Ask the caller to dial 108 now. Alert the duty doctor. Anti-snake venom and ICU are at the district hospital; the 108 crew decides where to go.</p>
    </section>` : svc ? `
    <section class="sect">
      <h4>${icon("calendar")}${r.lane === "ROUTINE" ? "Booking" : "Suggested next clinic day"}</h4>
      <div class="svc">${icon(svc.icon)}<div><b>${esc(svc.name)}</b><span class="muted">${esc(fmtDate(svc.date, { weekday: "long", day: "numeric", month: "short" }))} · ${esc(svc.time)}</span></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:8px">Bring: ${esc(svc.bring.join(", "))}</p>
    </section>` : "";

  return `
    <section class="sect">
      <h4>${icon("msg")}Request ${isHindi(r.description) ? '<span class="tag">Hindi</span>' : ""}</h4>
      <blockquote class="req-text">${highlight(r.description, evidenceGroups(res))}</blockquote>
      <div class="legend" style="margin-top:8px"><span><i style="background:color-mix(in srgb,var(--em) 40%,transparent)"></i>Red flag</span><span><i style="background:color-mix(in srgb,var(--saffron) 45%,transparent)"></i>Other signal</span>${g.phrases.length ? '<span><i style="background:var(--bg-sunk);box-shadow:inset 0 0 0 1px var(--line-2)"></i>Reassurance (struck)</span>' : ""}</div>
    </section>
    ${historyHtml(r)}
    ${overridden ? `<div class="note">${icon("undo")}<span>Rules suggested <b>${LBL(r.suggestedLane)}</b>. Staff changed it to <b>${LBL(r.lane)}</b>.</span></div>` : ""}
    <section class="sect">
      <h4>${icon("layers")}Why ${esc(LBL(r.suggestedLane).toLowerCase())}</h4>
      <ul class="reasons">${reasons}</ul>
      ${others.length ? `<details class="others"><summary>${others.length} other signal${others.length > 1 ? "s" : ""}</summary><ul class="reasons">${others.map((x) => `<li><span class="rid ${x.category}">${esc(x.ruleId)}</span><div><b>${esc(x.title)}</b><p>${esc(x.reason)}</p></div></li>`).join("")}</ul></details>` : ""}
    </section>
    ${g.phrases.length ? `
    <section class="sect guard ${g.changed ? "changed" : ""}">
      <h4>${icon("shield")}Framing guard ${g.changed ? '<span class="tag saffron">Raised the lane</span>' : '<span class="tag">No change</span>'}</h4>
      <div class="guard-cmp">
        <div><span class="label">As written</span>${laneChip(g.asWritten)}</div>
        <span class="arrow">${icon("arrowR")}</span>
        <div><span class="label">Reassurance removed</span>${laneChip(g.withoutReassurance)}</div>
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">Removed: ${g.phrases.map((p) => `<s>${esc(p)}</s>`).join(", ")}. The more cautious lane is kept.</p>
    </section>` : ""}
    <section class="sect"><h4>${icon("spark")}AI second reader</h4><div class="ai-row">${ai}</div></section>
    ${plan}
    <section class="sect">
      <h4>${icon("clock")}History</h4>
      <ol class="hist">${r.history.map((h) => `<li><span class="dotl ${h.to || ""}"></span><div><b>${esc(h.by)}</b> ${esc(histText(h))}${h.reason ? `<p>“${esc(h.reason)}”</p>` : ""}${h.note && h.action !== "suggested" ? `<p class="muted">${esc(h.note)}</p>` : ""}<span class="muted">${fmtTime(h.at)}</span></div></li>`).join("")}</ol>
    </section>`;
}

export const historyItems = (r) => window.TriageEngine.historySummary({ history: r.pmh || {} });

function historyHtml(r) {
  const items = historyItems(r);
  const used = r.result.reasons.concat(r.result.otherSignals || []).filter((x) => /^H\d/.test(x.ruleId));
  return `<section class="sect">
    <h4>${icon("doc")}Past history ${items.length ? `<span class="tag">${r.forWhom === "family" ? "told by family" : "self-reported"}</span>` : ""}</h4>
    ${items.length ? `<div class="chips">${items.map((x) => `<span class="tag hist-tag">${esc(x)}</span>`).join("")}</div>
      <p class="muted" style="font-size:12.5px;margin-top:8px">${used.length ? `Used by ${used.map((x) => `<span class="kbd">${x.ruleId}</span>`).join(" ")} to raise the lane. History can only raise a lane, never lower it.` : "No history rule matched today's text, so the lane is from the text alone."}</p>`
      : `<p class="muted" style="font-size:13px">None given. Ask about long-term illness, regular medicines and recent hospital stays when you call back.</p>`}
  </section>`;
}

function histText(h) {
  const L = (c) => (c ? LANE[c].short.toLowerCase() : "");
  switch (h.action) {
    case "suggested": return `suggested ${L(h.to)} (${h.note})`;
    case "accepted": return `accepted ${L(h.to)}`;
    case "signposted": return "gave emergency guidance";
    case "override": return `changed ${L(h.from)} to ${L(h.to)}`;
    case "escalated": return `raised ${L(h.from)} to ${L(h.to)}`;
    case "reviewed": return `reviewed: ${OUTCOMES[h.outcome] ? OUTCOMES[h.outcome].label : h.outcome}`;
    case "closed": return "closed the request";
    case "rule-flag": return "flagged the rules for review";
    default: return h.action;
  }
}
