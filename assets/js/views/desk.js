// Front desk window: one queue, emergencies on top. Open a request to accept
// the suggested lane or change it with a reason. Add phone calls and walk-ins.
import { esc, icon, toast, drawer, modal, segmented, laneChip, LANE, waitText } from "../ui.js";
import * as store from "../store.js";
import { aiCheck } from "../ai.js";
import { CLINIC } from "../india.js";
import { ILLUS } from "../illus.js";
import { headerHtml, bodyHtml, SOURCE, statusTag, ageText } from "./detail.js";

const REASONS = {
  up: ["Sounded worse on the phone", "More detail from the caller", "Vulnerable patient", "Rule missed the wording"],
  down: ["Called back: feeling better", "Only a routine need", "Rule matched the wrong words"]
};
const LIMIT = { EMERGENCY: 60e3, SAME_DAY: 2 * 3600e3, ROUTINE: 8 * 3600e3 };
const DONE = ["closed", "booked", "reviewed", "signposted"];

export function render(root) {
  let tab = "todo", openId = null, focusIdx = -1;
  root.innerHTML = `
  <div class="wrap view desk">
    <header class="page-head art-head tone-saffron">
      <div>
        <div class="eyebrow"><span class="dot"></span>Front desk</div>
        <h1>${greet()}</h1>
        <p>Here is today's queue. Emergencies are always on top.</p>
        <button class="btn primary" data-new style="margin-top:14px">${icon("plus")} Phone or walk-in</button>
      </div>
      <div class="ph-art">${ILLUS.desk()}</div>
    </header>
    <div class="counts" data-counts></div>
    <div class="q-bar">
      <div class="seg" role="group" aria-label="Show" data-tab>
        <button data-value="todo" aria-pressed="true">To do</button>
        <button data-value="done" aria-pressed="false">Done</button>
      </div>
    </div>
    <div class="card flush q-list" role="list" data-list></div>
  </div>`;
  const $ = (s) => root.querySelector(s);
  segmented($("[data-tab]"), (v) => { tab = v; focusIdx = -1; paint(); });
  $("[data-new]").addEventListener("click", staffEntry);

  function paint() {
    const s = store.load(), now = Date.now();
    const todo = s.requests.filter((r) => !DONE.includes(r.status) && !(r.lane === "SAME_DAY" && r.status === "accepted"));
    const waiting = (l) => todo.filter((r) => r.lane === l).length;
    $("[data-counts]").innerHTML = ["EMERGENCY", "SAME_DAY", "ROUTINE"].map((l) => `
      <div class="count ${l}${waiting(l) && l === "EMERGENCY" ? " hot" : ""}"><span class="c-ico">${icon({ EMERGENCY: "ambulance", SAME_DAY: "clock", ROUTINE: "calendar" }[l])}</span><strong class="num">${waiting(l)}</strong><span>${LANE[l].short} to act on</span></div>`).join("");
    let list = tab === "todo" ? todo : s.requests.filter((r) => !todo.includes(r));
    list = list.slice().sort((a, b) => store.laneRank(b.lane) - store.laneRank(a.lane) || a.createdAt - b.createdAt);
    const el = $("[data-list]");
    if (!list.length) { el.innerHTML = `<div class="empty">${ILLUS.chai()}<b>${tab === "todo" ? "All caught up. Chai break!" : "Nothing done yet"}</b></div>`; return; }
    el.innerHTML = list.map((r, i) => {
      const late = tab === "todo" && now - r.createdAt > LIMIT[r.lane];
      return `
      <button class="q-row ${r.lane} ${tab === "done" ? "done" : ""} ${i === focusIdx ? "focus" : ""}" role="listitem" data-id="${r.id}">
        <span class="rail"></span>
        <span class="q-tok"><span class="q-token num">${esc(r.token)}</span><span class="q-av ${r.source}" title="${SOURCE[r.source].label}">${icon(SOURCE[r.source].icon)}</span></span>
        <span class="q-main">
          <span class="q-top">${laneChip(r.lane)}${tab === "done" ? statusTag(r.status) : ""}<span class="q-meta">${ageText(r.age)}</span></span>
          <span class="q-text">${esc(r.description)}</span>
        </span>
        <span class="q-wait ${late ? "late" : ""}"><b class="num">${waitText(now - r.createdAt)}</b><span class="muted">waiting</span></span>
      </button>`;
    }).join("");
    el.querySelectorAll(".q-row").forEach((b) => b.addEventListener("click", () => open(b.dataset.id)));
  }

  function open(id) {
    const r = store.get(id); if (!r) return;
    openId = id;
    const acceptLabel = { EMERGENCY: "108 advised", SAME_DAY: "Send to doctor", ROUTINE: "Confirm booking" }[r.lane];
    const canAct = r.status === "new";
    const d = drawer(`
      <div class="drawer-head">${headerHtml(r)}</div>
      <div class="drawer-body">${bodyHtml(r)}
        <section class="sect change" hidden>
          <h4>Change lane</h4>
          <div class="seg" data-to>${["EMERGENCY", "SAME_DAY", "ROUTINE"].map((l) => `<button data-value="${l}" aria-pressed="${l === r.lane}">${LANE[l].short}</button>`).join("")}</div>
          <div class="chips" data-reasons style="margin-top:12px"></div>
          <input class="input" data-note placeholder="Reason (required)" style="margin-top:10px">
          <div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" data-save>Save</button><button class="btn ghost" data-cancel>Cancel</button></div>
        </section>
      </div>
      <div class="drawer-foot">
        ${canAct ? `<button class="btn ${r.lane === "EMERGENCY" ? "danger" : "primary"}" data-accept>${icon("check")} ${acceptLabel}</button>` : ""}
        ${r.status !== "closed" ? `<button class="btn" data-change>Change lane</button>` : ""}
        ${store.settings().ai && !r.result.ai ? `<button class="btn ghost" data-ai>${icon("spark")} AI check</button>` : ""}
      </div>`, { label: "Request " + r.token, onClose: () => { openId = null; } });
    const el = d.el;
    const done = (msg) => { toast(msg); d.close(); };
    el.querySelector("[data-accept]")?.addEventListener("click", () => {
      store.accept(id);
      done({ EMERGENCY: `${r.token}: 108 advice logged`, SAME_DAY: `${r.token} sent to the doctor`, ROUTINE: `${r.token} booked` }[r.lane]);
    });
    el.querySelector("[data-ai]")?.addEventListener("click", async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spinner"></span> Checking`;
      const { ai, failed, skipped } = await aiCheck(r, r.result, store.settings().model);
      if (skipped) { toast("Add an API key in Settings first", "info"); b.disabled = false; b.innerHTML = `${icon("spark")} AI check`; return; }
      store.applyAi(id, ai, failed);
      d.close(); setTimeout(() => open(id), 260);
    });
    const ch = el.querySelector(".change");
    let to = r.lane;
    const paintReasons = () => {
      const up = store.laneRank(to) > store.laneRank(r.lane);
      el.querySelector("[data-reasons]").innerHTML = to === r.lane ? "" : REASONS[up ? "up" : "down"].map((x) => `<button type="button" class="chip">${esc(x)}</button>`).join("");
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
    const H = window.TriageEngine.HISTORY;
    const hist = { conditions: [], meds: [], repeatVisit: false, recentAdmission: false };
    const m = modal(`
      <h2 style="font-size:20px;margin-bottom:16px">New request</h2>
      <div class="grid" style="gap:14px">
        <div class="seg" data-src>${["phone", "walkin"].map((s, i) => `<button data-value="${s}" aria-pressed="${i === 0}">${SOURCE[s].label}</button>`).join("")}</div>
        <div class="field"><label>What they said</label><textarea class="textarea" data-desc placeholder="e.g. Beta behosh ho gaya school mein" style="min-height:96px" autofocus></textarea></div>
        <div class="field" style="max-width:160px"><label>Age</label><input class="input num" type="number" min="0" max="120" step="0.1" data-age></div>
        <details class="more"><summary>Health history (optional)</summary>
          <div class="chips" data-hist style="margin-top:10px">
            ${[...Object.entries(H.conditions).map(([k, v]) => ["conditions", k, v]), ...Object.entries(H.meds).map(([k, v]) => ["meds", k, v]), ...Object.entries(H.flags).map(([k, v]) => ["flags", k, v])]
              .map(([g, k, v]) => `<button type="button" class="chip" data-g="${g}" data-k="${k}" aria-pressed="false">${esc(v)}</button>`).join("")}
          </div></details>
        <div class="live-preview" data-prev><span class="muted">The lane appears as you type.</span></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
        <button class="btn ghost" data-close>Cancel</button>
        <button class="btn primary" data-add>${icon("plus")} Add to queue</button>
      </div>`, { label: "New request" });
    let src = "phone";
    segmented(m.el.querySelector("[data-src]"), (v) => { src = v; });
    const ta = m.el.querySelector("[data-desc]"), prev = m.el.querySelector("[data-prev]"), age = m.el.querySelector("[data-age]");
    const preview = () => {
      const txt = ta.value.trim();
      if (!txt) { prev.className = "live-preview"; prev.innerHTML = `<span class="muted">The lane appears as you type.</span>`; return; }
      const res = window.TriageEngine.route({ description: txt, age: age.value, history: hist });
      prev.className = "live-preview " + res.category;
      prev.innerHTML = `${laneChip(res.category)}<span>${esc(res.reasons[0] ? res.reasons[0].title : "")}</span>`;
    };
    m.el.querySelectorAll("[data-hist] .chip").forEach((c) => c.addEventListener("click", () => {
      const v = c.getAttribute("aria-pressed") !== "true", { g, k } = c.dataset;
      c.setAttribute("aria-pressed", v);
      if (g === "flags") hist[k] = v; else hist[g] = v ? hist[g].concat(k) : hist[g].filter((x) => x !== k);
      preview();
    }));
    ta.addEventListener("input", preview);
    age.addEventListener("input", preview);
    m.el.querySelector("[data-add]").addEventListener("click", () => {
      const txt = ta.value.trim(); if (!txt) { ta.focus(); return; }
      const r = store.add({ description: txt, age: age.value, source: src, history: hist });
      m.close(); toast(`${r.token} added as ${LANE[r.lane].short.toLowerCase()}`);
      setTimeout(() => open(r.id), 280);
    });
  }

  function onKey(e) {
    if (document.querySelector(".drawer, .modal") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const rows = [...root.querySelectorAll(".q-row")];
    if (!rows.length) return;
    if (e.key === "j" || e.key === "k") {
      focusIdx = Math.max(0, Math.min(rows.length - 1, focusIdx + (e.key === "j" ? 1 : -1)));
      rows.forEach((r, i) => r.classList.toggle("focus", i === focusIdx));
      rows[focusIdx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && focusIdx >= 0) open(rows[focusIdx].dataset.id);
  }
  document.addEventListener("keydown", onKey);

  const known = new Set(store.load().requests.map((r) => r.id));
  const unsub = store.subscribe((s, meta) => {
    paint();
    s.requests.forEach((r) => {
      if (known.has(r.id)) return;
      known.add(r.id);
      if (meta && meta.remote) {
        toast(`New ${LANE[r.lane].short.toLowerCase()} request ${r.token}`, r.lane === "EMERGENCY" ? "info" : "ok");
        root.querySelector(`.q-row[data-id="${r.id}"]`)?.classList.add("arrive");
      }
    });
  });
  const tick = setInterval(() => { if (!openId) paint(); }, 30000);
  paint();
  return () => { unsub(); clearInterval(tick); document.removeEventListener("keydown", onKey); };
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
