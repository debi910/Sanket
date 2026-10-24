// Clinician window: the medical officer's same-day worklist. One request at a
// time with the evidence, then a recorded outcome. The doctor may lower a
// lane (a human decision); the tool never does.
import { esc, icon, toast, laneChip, waitText, ago, fmtTime, LANE } from "../ui.js";
import * as store from "../store.js";
import { OUTCOMES } from "../store.js";
import { CLINIC } from "../india.js";
import { headerHtml, bodyHtml, ageText } from "./detail.js";

export function render(root) {
  let sel = null;
  root.innerHTML = `
  <div class="wrap view clin">
    <header class="page-head">
      <div>
        <div class="eyebrow"><span class="dot"></span>Clinician · ${esc(CLINIC.mo)}</div>
        <h1>Same-day review</h1>
        <p>Requests the front desk sent to you, oldest first. Call back, decide, and the outcome is logged for the safety review.</p>
      </div>
      <div class="clin-stats" data-stats></div>
    </header>
    <div class="em-strip" data-em></div>
    <div class="clin-grid">
      <aside class="card flush clin-list" data-list></aside>
      <section class="card clin-detail" data-detail></section>
    </div>
  </div>`;
  const $ = (s) => root.querySelector(s);

  function worklist() {
    return store.load().requests.filter((r) => r.lane === "SAME_DAY" && (r.status === "accepted" || r.status === "new")).sort((a, b) => (a.status === "accepted" ? 0 : 1) - (b.status === "accepted" ? 0 : 1) || a.createdAt - b.createdAt);
  }

  function paint() {
    const s = store.load(), now = Date.now();
    const list = worklist();
    const reviewed = s.requests.filter((r) => r.history.some((h) => h.action === "reviewed"));
    const oldest = list.filter((r) => r.status === "accepted").reduce((m, r) => Math.min(m, r.createdAt), Infinity);
    $("[data-stats]").innerHTML = `
      <div><strong class="num">${list.filter((r) => r.status === "accepted").length}</strong><span>to review</span></div>
      <div><strong class="num">${isFinite(oldest) ? waitText(now - oldest) : "—"}</strong><span>oldest wait</span></div>
      <div><strong class="num">${reviewed.length}</strong><span>reviewed today</span></div>`;
    const ems = s.requests.filter((r) => r.lane === "EMERGENCY");
    $("[data-em]").innerHTML = ems.length ? `${icon("ambulance")}<b>${ems.length} emergenc${ems.length > 1 ? "ies" : "y"} today</b>${ems.map((r) => `<span class="em-pill"><span class="num">${esc(r.token)}</span> ${esc(r.result.reasons[0] ? r.result.reasons[0].title : "")} · ${fmtTime(r.createdAt)}</span>`).join("")}` : "";
    if (!sel || !list.some((r) => r.id === sel)) sel = list[0] ? list[0].id : null;
    $("[data-list]").innerHTML = `<div class="cl-head"><b>Worklist</b><span class="muted">${list.length}</span></div>` + (list.length ? list.map((r) => `
      <button class="cl-row ${r.id === sel ? "on" : ""} ${r.status === "new" ? "pending" : ""}" data-id="${r.id}">
        <span class="num tok">${esc(r.token)}</span>
        <span class="cl-main"><span class="cl-title">${esc(r.description)}</span><span class="muted">${ageText(r.age)} · ${esc(r.result.reasons[0] ? r.result.reasons[0].title : "Review")}${r.status === "new" ? " · not yet sent by desk" : ""}</span></span>
        <span class="num cl-wait">${waitText(now - r.createdAt)}</span>
      </button>`).join("") : `<div class="empty">${icon("check")}<b>All reviewed</b><span class="muted">Nothing is waiting for you.</span></div>`);
    $("[data-list]").querySelectorAll(".cl-row").forEach((b) => b.addEventListener("click", () => { sel = b.dataset.id; paint(); }));
    paintDetail();
  }

  function paintDetail() {
    const el = $("[data-detail]");
    const r = sel && store.get(sel);
    if (!r) { el.innerHTML = `<div class="empty big">${icon("steth")}<b>Nothing to review</b><span class="muted">Same-day requests appear here once the front desk sends them.</span></div>`; return; }
    el.innerHTML = `
      <div class="cd-head">${headerHtml(r).replace(/<button class="icon-btn" data-close[\s\S]*?<\/button>/, "")}</div>
      <div class="cd-body">${bodyHtml(r)}</div>
      <div class="cd-act">
        <span class="label">Outcome after call-back</span>
        <div class="outcomes">${Object.entries(OUTCOMES).map(([k, o]) => `<button class="oc ${k}" data-oc="${k}">${icon(o.icon)}<span>${esc(o.label)}</span></button>`).join("")}</div>
        <textarea class="textarea" data-note placeholder="Short note (what you heard, what you advised)" style="min-height:64px"></textarea>
        <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap">
          <button class="btn ghost" data-flag>${icon("flag")} Flag rules for review</button>
          <a class="btn" href="https://esanjeevani.mohfw.gov.in/" target="_blank" rel="noopener">${icon("ext")} Open eSanjeevani</a>
        </div>
      </div>`;
    el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
    el.querySelectorAll("[data-oc]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.oc, note = el.querySelector("[data-note]").value.trim();
      if (k === "routine" && !note) { el.querySelector("[data-note]").focus(); toast("Add a note when lowering to routine", "info"); return; }
      store.review(r.id, k, note || OUTCOMES[k].label);
      toast(`${r.token}: ${OUTCOMES[k].label}`);
    }));
    el.querySelector("[data-flag]").addEventListener("click", () => {
      const note = el.querySelector("[data-note]").value.trim() || "Rule wording looks wrong for this request";
      store.flagRule(r.id, note); toast("Sent to the clinic lead's rule review");
    });
  }

  const unsub = store.subscribe(paint);
  const tick = setInterval(paint, 30000);
  paint();
  return () => { unsub(); clearInterval(tick); };
}
