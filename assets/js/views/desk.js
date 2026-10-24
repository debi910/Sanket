// Front desk window: the live queue, lane summaries, the request drawer with
// accept / change-lane, and staff entry for phone calls and walk-ins.
import { esc, icon, toast, drawer, modal, segmented, highlight, evidenceGroups, laneChip, LANE, waitText, ago } from "../ui.js";
import * as store from "../store.js";
import { aiCheck } from "../ai.js";
import { CLINIC, seasonWatch } from "../india.js";
import { headerHtml, bodyHtml, SOURCE, statusTag, ageText, isHindi, historyItems } from "./detail.js";

const REASONS = {
  up: ["Clinical concern on the phone", "More detail from the caller", "Vulnerable patient (age, pregnancy, alone)", "Rule missed the wording"],
  down: ["Called back: symptoms settled", "Called back: routine need only", "Known patient, plan in place", "Rule matched the wrong words"]
};

const SLA = {
  EMERGENCY: { target: "Guide to 108 in under 1 min", limit: 60e3 },
  SAME_DAY: { target: "Seen or called within 2 h", limit: 2 * 3600e3 },
  ROUTINE: { target: "Booked the same day", limit: 8 * 3600e3 }
};

export function render(root) {
  let filter = "action", query = "", focusIdx = -1, openId = null;
  const sw = seasonWatch();
  root.innerHTML = `
  <div class="wrap view desk">
    <header class="page-head">
      <div>
        <div class="eyebrow"><span class="dot"></span>Front desk · ${esc(CLINIC.name)}</div>
        <h1>Today's requests</h1>
        <p>Rules sort every request into a lane. You accept it or change it with a reason. Emergencies are always on top.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn" href="#/patient" target="_blank" rel="noopener">${icon("ext")} Patient window</a>
        <button class="btn primary" data-new>${icon("plus")} Phone or walk-in</button>
      </div>
    </header>
    ${sw.peak.length ? `<div class="season card">${icon("calendar")}<div><b>Season watch, ${sw.month}:</b> ${sw.peak.map((r) => r.label.toLowerCase()).join(", ")} at peak${sw.rising.length ? `; ${sw.rising.map((r) => r.label.toLowerCase()).join(", ")} rising` : ""}. Listen for ${sw.peak.map((r) => `<span class="kbd">${r.rule}</span>`).join(" ")} red flags such as fever with bleeding gums, or a bite while working in the fields.</div></div>` : ""}
    <div class="grid g3 lanes stagger" data-lanes></div>
    <div class="q-bar">
      <div class="seg" role="group" aria-label="Filter" data-filter>
        <button data-value="action" aria-pressed="true">Needs action <span class="cnt" data-c="action"></span></button>
        <button data-value="EMERGENCY" aria-pressed="false">Emergency</button>
        <button data-value="SAME_DAY" aria-pressed="false">Same-day</button>
        <button data-value="ROUTINE" aria-pressed="false">Routine</button>
        <button data-value="all" aria-pressed="false">All</button>
      </div>
      <label class="search">${icon("search")}<input class="input" placeholder="Search token or words" data-q></label>
      <span class="kb muted"><span class="kbd">J</span><span class="kbd">K</span> move <span class="kbd">Enter</span> open</span>
    </div>
    <div class="card flush q-list" role="list" data-list></div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  segmented($("[data-filter]"), (v) => { filter = v; focusIdx = -1; paintList(); });
  $("[data-q]").addEventListener("input", (e) => { query = e.target.value.toLowerCase(); paintList(); });
  $("[data-new]").addEventListener("click", () => staffEntry());

  function rows() {
    const s = store.load();
    let list = s.requests.slice();
    if (filter === "action") list = list.filter((r) => r.status === "new");
    else if (filter !== "all") list = list.filter((r) => r.lane === filter && r.status !== "closed");
    if (query) list = list.filter((r) => (r.token + " " + r.description).toLowerCase().includes(query));
    const done = (r) => ["closed", "booked", "reviewed"].includes(r.status) ? 1 : 0;
    return list.sort((a, b) => done(a) - done(b) || store.laneRank(b.lane) - store.laneRank(a.lane) || a.createdAt - b.createdAt);
  }

  function paintLanes() {
    const s = store.load(), now = Date.now();
    const el = $("[data-lanes]");
    el.innerHTML = ["EMERGENCY", "SAME_DAY", "ROUTINE"].map((lane) => {
      const all = s.requests.filter((r) => r.lane === lane);
      const open = all.filter((r) => r.status === "new" || (lane === "SAME_DAY" && r.status === "accepted"));
      const oldest = open.reduce((m, r) => Math.min(m, r.createdAt), Infinity);
      const wait = open.length ? now - oldest : 0;
      const late = open.length && wait > SLA[lane].limit;
      return `
      <div class="card lane-card ${lane}">
        <div class="lc-top">${laneChip(lane)}<span class="muted">${all.length} today</span></div>
        <div class="lc-num"><strong class="num">${open.length}</strong><span>${lane === "SAME_DAY" ? "waiting for review" : "need action"}</span></div>
        <div class="lc-foot ${late ? "late" : ""}">${icon("clock")}${open.length ? `Oldest waiting ${waitText(wait)}` : "All clear"}<span class="muted">${SLA[lane].target}</span></div>
      </div>`;
    }).join("");
    el.classList.remove("stagger");
  }

  function paintList() {
    const list = rows(), now = Date.now();
    const s = store.load();
    root.querySelector('[data-c="action"]').textContent = s.requests.filter((r) => r.status === "new").length;
    const el = $("[data-list]");
    if (!list.length) {
      el.innerHTML = `<div class="empty">${icon("check")}<b>Nothing waiting here</b><span class="muted">New requests from the patient window, WhatsApp or phone appear at once.</span></div>`;
      return;
    }
    el.innerHTML = list.map((r, i) => {
      const g = r.result.framingGuard;
      const flags = [
        r.forWhom === "family" ? `<span class="tag">${icon("users")}Family</span>` : "",
        historyItems(r).length ? `<span class="tag" title="${esc(historyItems(r).join(", "))}">${icon("doc")}History ${historyItems(r).length}</span>` : "",
        g && g.changed ? `<span class="tag saffron">${icon("shield")}Guard raised</span>` : "",
        r.result.isFallback ? `<span class="tag info">${icon("info")}Unclear</span>` : "",
        r.lane !== r.suggestedLane ? `<span class="tag">${icon("undo")}Changed</span>` : "",
        isHindi(r.description) ? `<span class="tag">हिन्दी</span>` : ""
      ].join("");
      const done = ["closed", "booked", "reviewed"].includes(r.status);
      return `
      <button class="q-row ${r.lane} ${done ? "done" : ""} ${i === focusIdx ? "focus" : ""}" role="listitem" data-id="${r.id}">
        <span class="rail"></span>
        <span class="q-token num">${esc(r.token)}</span>
        <span class="q-main">
          <span class="q-top">${laneChip(r.lane)}${statusTag(r.status)}<span class="q-meta">${icon(SOURCE[r.source].icon)}${ageText(r.age)}</span>${flags}</span>
          <span class="q-text">${highlight(r.description, evidenceGroups(r.result))}</span>
        </span>
        <span class="q-wait ${!done && now - r.createdAt > SLA[r.lane].limit ? "late" : ""}"><b class="num">${done ? "—" : waitText(now - r.createdAt)}</b><span class="muted">${ago(r.createdAt, now)}</span></span>
      </button>`;
    }).join("");
    el.querySelectorAll(".q-row").forEach((b) => b.addEventListener("click", () => open(b.dataset.id)));
  }

  function open(id) {
    const r = store.get(id); if (!r) return;
    openId = id;
    const acceptLabel = { EMERGENCY: "Confirm 108 advised", SAME_DAY: "Send to clinician", ROUTINE: "Confirm booking" }[r.lane];
    const canAct = r.status === "new";
    const d = drawer(`
      <div class="drawer-head">${headerHtml(r)}</div>
      <div class="drawer-body">${bodyHtml(r)}
        <section class="sect change" hidden>
          <h4>${icon("undo")}Change lane</h4>
          <div class="seg" data-to>${["EMERGENCY", "SAME_DAY", "ROUTINE"].map((l) => `<button data-value="${l}" aria-pressed="${l === r.lane}">${LANE[l].short}</button>`).join("")}</div>
          <div class="chips" data-reasons style="margin-top:12px"></div>
          <textarea class="textarea" data-note placeholder="Reason in your words (required)" style="min-height:70px;margin-top:10px"></textarea>
          <p class="hint" data-hint style="margin-top:6px"></p>
          <div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" data-save>Save change</button><button class="btn ghost" data-cancel>Cancel</button></div>
        </section>
      </div>
      <div class="drawer-foot">
        ${canAct ? `<button class="btn ${r.lane === "EMERGENCY" ? "danger" : "primary"}" data-accept>${icon("check")} ${acceptLabel}</button>` : ""}
        ${r.status !== "closed" ? `<button class="btn" data-change>${icon("undo")} Change lane</button>` : ""}
        ${store.settings().ai && !r.result.ai ? `<button class="btn" data-ai>${icon("spark")} Run AI check</button>` : ""}
        <span style="flex:1"></span>
        ${r.status !== "closed" && !canAct ? `<button class="btn ghost" data-close-req>Close request</button>` : ""}
      </div>`, { label: "Request " + r.token, onClose: () => { openId = null; } });
    const el = d.el;
    const done = (msg) => { toast(msg); d.close(); };
    el.querySelector("[data-accept]")?.addEventListener("click", () => {
      store.accept(id);
      done(r.lane === "EMERGENCY" ? `${r.token}: 108 guidance logged` : r.lane === "SAME_DAY" ? `${r.token} sent to Dr. Rao` : `${r.token} booked`);
    });
    el.querySelector("[data-close-req]")?.addEventListener("click", () => { store.close(id, "Closed at front desk"); done(`${r.token} closed`); });
    el.querySelector("[data-ai]")?.addEventListener("click", async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spinner"></span> Checking`;
      const { ai, failed, skipped } = await aiCheck(r, r.result, store.settings().model);
      if (skipped) { toast("Add an API key in Settings first", "info"); b.disabled = false; b.innerHTML = `${icon("spark")} Run AI check`; return; }
      store.applyAi(id, ai, failed);
      d.close(); setTimeout(() => open(id), 260);
    });
    const ch = el.querySelector(".change");
    let to = r.lane;
    const paintReasons = () => {
      const up = store.laneRank(to) > store.laneRank(r.lane);
      el.querySelector("[data-reasons]").innerHTML = to === r.lane ? "" : REASONS[up ? "up" : "down"].map((x) => `<button type="button" class="chip">${esc(x)}</button>`).join("");
      el.querySelector("[data-hint]").textContent = to === r.lane ? "Pick a different lane." : up ? "Raising a lane is counted as a rule miss and reviewed by the clinic lead." : "Lowering a lane needs a clear reason. It is shown on the safety dashboard.";
      el.querySelectorAll("[data-reasons] .chip").forEach((c) => c.addEventListener("click", () => { el.querySelector("[data-note]").value = c.textContent; }));
    };
    el.querySelector("[data-change]")?.addEventListener("click", () => {
      ch.hidden = false; segmented(el.querySelector("[data-to]"), (v) => { to = v; paintReasons(); }); paintReasons();
      ch.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    el.querySelector("[data-cancel]")?.addEventListener("click", () => { ch.hidden = true; });
    el.querySelector("[data-save]")?.addEventListener("click", () => {
      const note = el.querySelector("[data-note]").value.trim();
      if (to === r.lane) { toast("Pick a different lane", "info"); return; }
      if (!note) { el.querySelector("[data-note]").focus(); toast("Add a reason", "info"); return; }
      store.override(id, to, note);
      done(`${r.token} moved to ${LANE[to].short.toLowerCase()}`);
    });
  }

  function staffEntry() {
    const m = modal(`
      <h2 style="font-size:20px">New request</h2>
      <p class="muted" style="margin:4px 0 16px">Type what the caller or walk-in patient says, in their words.</p>
      <div class="grid" style="gap:14px">
        <div class="seg" data-src>${["phone", "walkin", "whatsapp"].map((s, i) => `<button data-value="${s}" aria-pressed="${i === 0}">${SOURCE[s].label}</button>`).join("")}</div>
        <div class="grid g2">
          <div class="field"><label>Age</label><input class="input num" type="number" min="0" max="120" step="0.1" data-age></div>
          <div class="field"><label>Who is speaking?</label><select class="input select" data-who><option value="self">Patient</option><option value="family">Family member</option></select></div>
        </div>
        <div class="field"><span class="label">Past history (ask: long-term illness, regular medicines, recent hospital stay)</span>
          <div class="chips" data-hist>
            ${Object.entries(window.TriageEngine.HISTORY.conditions).map(([k, v]) => `<button type="button" class="chip" data-g="conditions" data-k="${k}" aria-pressed="false">${esc(v)}</button>`).join("")}
            ${Object.entries(window.TriageEngine.HISTORY.meds).map(([k, v]) => `<button type="button" class="chip" data-g="meds" data-k="${k}" aria-pressed="false">${esc(v)}</button>`).join("")}
            ${Object.entries(window.TriageEngine.HISTORY.flags).map(([k, v]) => `<button type="button" class="chip" data-g="flags" data-k="${k}" aria-pressed="false">${esc(v)}</button>`).join("")}
          </div></div>
        <div class="field"><label>What they said</label><textarea class="textarea" data-desc placeholder="e.g. Beta behosh ho gaya school mein" autofocus></textarea></div>
        <div class="live-preview" data-prev><span class="muted">Lane preview appears as you type.</span></div>
        <label class="check"><input type="checkbox" data-urg><span><strong>Caller says it is urgent</strong></span></label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
        <button class="btn ghost" data-close>Cancel</button>
        <button class="btn primary" data-add>${icon("plus")} Add to queue</button>
      </div>`, { label: "New request" });
    let src = "phone";
    const hist = { conditions: [], meds: [], repeatVisit: false, recentAdmission: false };
    m.el.querySelectorAll("[data-hist] .chip").forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") !== "true"; c.setAttribute("aria-pressed", on);
      const { g, k } = c.dataset;
      if (g === "flags") hist[k] = on; else hist[g] = on ? hist[g].concat(k) : hist[g].filter((x) => x !== k);
      preview();
    }));
    segmented(m.el.querySelector("[data-src]"), (v) => { src = v; });
    const ta = m.el.querySelector("[data-desc]"), prev = m.el.querySelector("[data-prev]");
    const preview = () => {
      const txt = ta.value.trim();
      if (!txt) { prev.innerHTML = `<span class="muted">Lane preview appears as you type.</span>`; return; }
      const res = window.TriageEngine.route({ description: txt, age: m.el.querySelector("[data-age]").value, urgent: m.el.querySelector("[data-urg]").checked, history: hist });
      prev.innerHTML = `${laneChip(res.category)}<span>${esc(res.reasons.map((x) => x.title).join(" · "))}</span>`;
      prev.className = "live-preview " + res.category;
    };
    ta.addEventListener("input", preview);
    m.el.querySelector("[data-urg]").addEventListener("change", preview);
    m.el.querySelector("[data-age]").addEventListener("input", preview);
    m.el.querySelector("[data-add]").addEventListener("click", () => {
      const txt = ta.value.trim(); if (!txt) { ta.focus(); return; }
      const r = store.add({ description: txt, age: m.el.querySelector("[data-age]").value, forWhom: m.el.querySelector("[data-who]").value, urgent: m.el.querySelector("[data-urg]").checked, source: src, history: hist });
      m.close(); toast(`${r.token} added as ${LANE[r.lane].short.toLowerCase()}`);
      setTimeout(() => open(r.id), 280);
    });
  }

  function onKey(e) {
    if (document.querySelector(".drawer, .modal") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const list = [...root.querySelectorAll(".q-row")];
    if (!list.length) return;
    if (e.key === "j" || e.key === "k") {
      focusIdx = Math.max(0, Math.min(list.length - 1, focusIdx + (e.key === "j" ? 1 : -1)));
      list.forEach((r, i) => r.classList.toggle("focus", i === focusIdx));
      list[focusIdx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && focusIdx >= 0) { open(list[focusIdx].dataset.id); }
  }
  document.addEventListener("keydown", onKey);

  let known = new Set(store.load().requests.map((r) => r.id));
  const unsub = store.subscribe((s, meta) => {
    paintLanes(); paintList();
    s.requests.forEach((r) => {
      if (known.has(r.id)) return;
      known.add(r.id);
      if (meta && meta.remote) {
        toast(`New ${LANE[r.lane].short.toLowerCase()} request ${r.token}`, r.lane === "EMERGENCY" ? "info" : "ok");
        const row = root.querySelector(`.q-row[data-id="${r.id}"]`); row && row.classList.add("arrive");
      }
    });
  });
  const tick = setInterval(() => { if (!openId) { paintLanes(); paintList(); } }, 30000);
  paintLanes(); paintList();
  $("[data-lanes]").classList.add("stagger");
  return () => { unsub(); clearInterval(tick); document.removeEventListener("keydown", onKey); };
}
