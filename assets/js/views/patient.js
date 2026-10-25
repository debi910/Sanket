// Patient window: three short steps, then a token. Red-flag rules run
// instantly in the browser, so emergency guidance never waits.
import { esc, icon, toast, fmtDate, LANE } from "../ui.js";
import * as store from "../store.js";
import { aiCheck } from "../ai.js";
import { CLINIC } from "../india.js";
import { ILLUS, confetti } from "../illus.js";

const H_ICON = { diabetes: "drop", bp: "heart", heart: "heart", lung: "wind", kidney: "drop", tb: "pill", lowimm: "shield", pregnant: "baby", thinners: "pill", insulin: "syringe", repeatVisit: "refresh", recentAdmission: "hospital" };

const CHIPS = ["Fever for 3 days now", "Baby's vaccination is due this week", "Need a prescription refill for BP", "Want to show my test reports", "Dog bite this morning"];
const STEPS = ["Patient", "Health history", "Problem"];

const emptyHistory = () => ({ conditions: [], meds: [], repeatVisit: false, recentAdmission: false });

export function render(root) {
  const draft = { forWhom: "self", age: "", description: "", urgent: false, selfEmergency: false, history: emptyHistory() };
  let step = 1, current = null;
  root.innerHTML = `
  <div class="wrap narrow view patient">
    <div class="p-head">
      <h1>Request a visit</h1>
      <p class="ink2">Three quick steps. Write in English or Hinglish.</p>
      <ol class="p-dots">${STEPS.map((s, i) => `<li data-s="${i + 1}"><span>${i + 1}</span>${s}</li>`).join("")}</ol>
      <div class="p-progress"><i style="width:0"></i></div>
    </div>
    <section class="p-card card" aria-live="polite"><div class="p-body"></div></section>
    <p class="hint p-foot">${icon("shield")} No phone number or ID needed. Sanket sorts requests; it does not diagnose.</p>
  </div>`;
  const body = root.querySelector(".p-body");

  function show(s) {
    step = s;
    root.querySelector(".p-dots").hidden = s > 3;
    root.querySelector(".p-progress i").style.width = Math.min(100, (s / 3) * 100) + "%";
    root.querySelectorAll(".p-dots li").forEach((li) => { const n = Number(li.dataset.s); li.classList.toggle("on", n === s); li.classList.toggle("done", n < s); });
    body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap");
    [null, stepOne, stepHistory, stepProblem, result][s]();
  }

  const actions = (backTo, nextLabel) => `
    <div class="p-actions">
      ${backTo ? `<button class="btn ghost" data-back>Back</button>` : "<span></span>"}
      <button class="btn primary lg" data-next>${nextLabel} ${icon("arrowR")}</button>
    </div>`;

  function stepOne() {
    body.innerHTML = `
      <div class="p-art">${ILLUS.who()}</div>
      <h2 class="p-h">Who is this for?</h2>
      <div class="choice row">
        <label class="opt"><input type="radio" name="who" value="self" ${draft.forWhom === "self" ? "checked" : ""}><span class="ico">${icon("user")}</span><strong>For me</strong></label>
        <label class="opt"><input type="radio" name="who" value="family" ${draft.forWhom === "family" ? "checked" : ""}><span class="ico">${icon("users")}</span><strong>For family</strong></label>
      </div>
      <div class="field" style="margin-top:18px;max-width:220px"><label for="p-age">Patient's age</label><input id="p-age" class="input num" inputmode="decimal" type="number" min="0" max="120" step="0.1" value="${esc(draft.age)}" placeholder="Years"></div>
      ${actions(false, "Continue")}`;
    body.querySelectorAll('input[name="who"]').forEach((r) => r.addEventListener("change", () => { draft.forWhom = r.value; }));
    body.querySelector("[data-next]").addEventListener("click", () => { draft.age = body.querySelector("#p-age").value.trim(); show(2); });
  }

  function stepHistory() {
    const H = draft.history, E = window.TriageEngine.HISTORY;
    const items = [
      ...Object.entries(E.conditions).map(([k, v]) => ["conditions", k, v]),
      ...Object.entries(E.meds).map(([k, v]) => ["meds", k, v]),
      ...Object.entries(E.flags).map(([k, v]) => ["flags", k, v])
    ];
    const on = (g, k) => (g === "flags" ? !!H[k] : H[g].includes(k));
    body.innerHTML = `
      <div class="p-art">${ILLUS.history()}</div>
      <h2 class="p-h">Any long-term illness or regular medicine?</h2>
      <p class="ink2" style="margin:-10px 0 16px">Optional. Tick what applies, it helps us see you sooner.</p>
      <div class="chips">${items.map(([g, k, v]) => `<button type="button" class="chip" data-g="${g}" data-k="${k}" aria-pressed="${on(g, k)}">${icon(H_ICON[k] || "doc", "ci")}${esc(v)}</button>`).join("")}</div>
      ${actions(true, "Continue")}`;
    body.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      const v = c.getAttribute("aria-pressed") !== "true", { g, k } = c.dataset;
      c.setAttribute("aria-pressed", v);
      if (g === "flags") H[k] = v; else H[g] = v ? H[g].concat(k) : H[g].filter((x) => x !== k);
    }));
    body.querySelector("[data-back]").addEventListener("click", () => show(1));
    body.querySelector("[data-next]").addEventListener("click", () => show(3));
  }

  function stepProblem() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    body.innerHTML = `
      <div class="p-art">${ILLUS.problem()}</div>
      <h2 class="p-h">What is the problem?</h2>
      <div class="p-ta">
        <textarea id="p-desc" class="textarea" placeholder="e.g. 3 din se bukhar hai aur sir dard" maxlength="800" autofocus>${esc(draft.description)}</textarea>
        ${SR ? `<button type="button" class="btn sm p-mic">${icon("mic")}<span>Speak</span></button>` : ""}
      </div>
      <p class="hint" style="margin-top:6px">Write it as it is, even if family says it is nothing.</p>
      <div class="chips" style="margin-top:12px">${CHIPS.map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join("")}</div>
      <label class="check em" style="margin-top:16px"><input type="checkbox" id="p-em" ${draft.selfEmergency ? "checked" : ""}><span><strong>This feels like an emergency</strong></span></label>
      ${actions(true, "Get my token")}`;
    const ta = body.querySelector("#p-desc");
    body.querySelectorAll(".chips .chip").forEach((c) => c.addEventListener("click", () => {
      ta.value = ta.value.trim() ? ta.value.trim().replace(/[.,]?$/, ", ") + c.textContent : c.textContent; ta.focus();
    }));
    const mic = body.querySelector(".p-mic");
    if (mic) {
      let rec = null;
      mic.addEventListener("click", () => {
        if (rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = "en-IN"; rec.interimResults = true;
        const base = ta.value.trim();
        mic.classList.add("live"); mic.querySelector("span").textContent = "Listening…";
        rec.onresult = (e) => { ta.value = (base ? base + " " : "") + [...e.results].map((r) => r[0].transcript).join(" "); };
        rec.onend = () => { rec = null; mic.classList.remove("live"); mic.querySelector("span").textContent = "Speak"; };
        rec.onerror = () => toast("Voice input is not available here", "info");
        rec.start();
      });
    }
    body.querySelector("[data-back]").addEventListener("click", () => { draft.description = ta.value; show(2); });
    body.querySelector("[data-next]").addEventListener("click", async () => {
      draft.description = ta.value.trim();
      draft.selfEmergency = body.querySelector("#p-em").checked;
      if (!draft.description && !draft.selfEmergency) { ta.focus(); ta.classList.add("shake"); setTimeout(() => ta.classList.remove("shake"), 400); return; }
      current = store.add(Object.assign({}, draft, { source: "web" }));
      show(4);
      // Optional AI second reader, only when staff have switched it on. It can only raise the lane.
      if (store.settings().ai && current.lane !== "EMERGENCY") {
        const { ai, failed, skipped } = await aiCheck(current, current.result, store.settings());
        if (!skipped) {
          const updated = store.applyAi(current.id, ai, failed);
          if (updated && updated.lane !== current.lane) { current = updated; show(4); }
        }
      }
    });
  }

  function result() {
    const r = store.get(current.id) || current;
    const lane = r.lane;
    const mind = r.result.reasons.some((x) => x.ruleId === "E8");
    let html;
    if (lane === "EMERGENCY") {
      html = `
      <div class="res em">
        <div class="p-art em">${ILLUS.ambulance()}</div>
        <h2>Call 108 now</h2>
        <p>Do not wait for an appointment. Call an ambulance or go to the nearest emergency department.</p>
        <div class="res-calls">
          <a class="btn danger lg" href="tel:108">${icon("phone")} 108 Ambulance</a>
          <a class="btn lg" href="tel:112">112 Emergency</a>
          ${mind ? `<a class="btn lg" href="tel:14416">14416 Tele-MANAS</a>` : ""}
        </div>
        <p class="res-near">${icon("hospital")} Or go to the nearest 24x7 hospital emergency.</p>
      </div>`;
    } else {
      const isR = lane === "ROUTINE", svc = r.service;
      html = `
      <div class="res ${isR ? "rt" : "sd"}">
        <div class="ticket">
          <div class="ticket-top"><span class="lane ${lane}">${LANE[lane].short}</span><span class="muted">${esc(CLINIC.name)}</span></div>
          <div class="ticket-token"><small>Token</small><strong class="num">${esc(r.token)}</strong></div>
          <div class="ticket-cut"></div>
          <div class="ticket-bot"><div>${icon(isR && svc ? svc.icon : "clock")}<span>${isR && svc
            ? `<b>${esc(svc.name)}</b><br>${esc(fmtDate(svc.date, { weekday: "long", day: "numeric", month: "long" }))}, ${esc(svc.time)}`
            : `<b>Today, before 4 PM</b><br>Show this token at Counter 2`}</span></div></div>
        </div>
        <h2>${isR ? "You are booked" : "Please come today"}</h2>
        <p>${isR && svc ? `Bring: ${esc(svc.bring.join(", "))}.` : "A nurse will see you before routine patients. If it gets worse, call 108."}</p>
      </div>`;
    }
    body.innerHTML = html + `
      <div class="p-actions">
        <button class="btn ghost" data-new>${icon("plus")} New request</button>
        ${lane === "ROUTINE" && r.service ? `<button class="btn" data-ics>${icon("calendar")} Add to calendar</button>` : ""}
      </div>`;
    body.querySelector("[data-new]").addEventListener("click", () => {
      Object.assign(draft, { description: "", selfEmergency: false, history: emptyHistory() }); current = null; show(1);
    });
    body.querySelector("[data-ics]")?.addEventListener("click", () => downloadIcs(r));
    if (lane === "ROUTINE") requestAnimationFrame(() => confetti(body.querySelector(".ticket-token")));
  }

  show(1);
}

function downloadIcs(r) {
  const d = new Date(r.service.date);
  const m = /(\d+):(\d+)\s*(AM|PM)/.exec(r.service.time);
  d.setHours((Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0), Number(m[2]), 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const f = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sanket//EN", "BEGIN:VEVENT", `UID:${r.id}@sanket`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, `DTEND:${f(new Date(d.getTime() + 30 * 60000))}`,
    `SUMMARY:${r.service.name} (token ${r.token})`, `LOCATION:${CLINIC.name}`, `DESCRIPTION:Bring: ${r.service.bring.join("; ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `sanket-${r.token}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
