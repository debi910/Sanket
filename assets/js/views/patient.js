// Patient window: a three-step, phone-first intake in English or Hindi.
// Red-flag rules run instantly in the browser, so emergency guidance never
// waits for anything else.
import { esc, icon, toast, segmented, fmtDate, LANE } from "../ui.js";
import { T } from "../i18n.js";
import * as store from "../store.js";
import { aiCheck } from "../ai.js";
import { CLINIC } from "../india.js";

let lang = (() => { try { return localStorage.getItem("sanket.lang") || "en"; } catch (e) { return "en"; } })();

export function render(root) {
  const draft = { forWhom: "self", age: "", area: "", description: "", urgent: false, selfEmergency: false, history: { conditions: [], meds: [], repeatVisit: false, recentAdmission: false } };
  let step = 1, current = null;
  root.innerHTML = `
  <div class="wrap narrow view patient">
    <div class="p-shell">
      <aside class="p-side">
        <div class="eyebrow"><span class="dot"></span>Patient window</div>
        <h1 class="p-title" data-t="title"></h1>
        <p class="ink2" data-t="sub"></p>
        <div class="seg lang-seg" role="group" aria-label="Language">
          <button type="button" data-value="en" aria-pressed="${lang === "en"}">English</button>
          <button type="button" data-value="hi" aria-pressed="${lang === "hi"}" class="hi">हिन्दी</button>
        </div>
        <ol class="p-steps">
          <li data-s="1"><span>1</span><b data-t="step1"></b></li>
          <li data-s="2"><span>2</span><b data-t="stepH"></b></li>
          <li data-s="3"><span>3</span><b data-t="step2"></b></li>
          <li data-s="4"><span>4</span><b data-t="step3"></b></li>
        </ol>
        <div class="p-privacy">${icon("shield")}<span data-t="privacy"></span></div>
      </aside>
      <section class="p-card card" aria-live="polite"><div class="p-body"></div></section>
    </div>
  </div>`;
  const body = root.querySelector(".p-body");
  const t = (k) => T[lang][k];

  function paintStatic() {
    root.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    root.querySelector(".patient").classList.toggle("hi", lang === "hi");
    root.querySelectorAll(".p-steps li").forEach((li) => {
      const s = Number(li.dataset.s);
      li.classList.toggle("on", s === step); li.classList.toggle("done", s < step);
    });
  }

  segmented(root.querySelector(".lang-seg"), (v) => {
    lang = v; try { localStorage.setItem("sanket.lang", v); } catch (e) { /* ignore */ }
    paintStatic(); show(step, true);
  });

  function show(s, same) {
    step = s; paintStatic();
    body.classList.remove("swap"); void body.offsetWidth;
    if (!same) body.classList.add("swap");
    if (s === 1) stepOne(); else if (s === 2) stepHistory(); else if (s === 3) stepTwo(); else result(current);
  }

  function stepOne() {
    body.innerHTML = `
      <h2 class="p-h">${esc(t("step1"))}</h2>
      <div class="choice row" role="radiogroup">
        <label class="opt"><input type="radio" name="who" value="self" ${draft.forWhom === "self" ? "checked" : ""}><span class="ico">${icon("user")}</span><span><strong>${esc(t("self"))}</strong><span class="d">${esc(t("selfD"))}</span></span></label>
        <label class="opt"><input type="radio" name="who" value="family" ${draft.forWhom === "family" ? "checked" : ""}><span class="ico">${icon("users")}</span><span><strong>${esc(t("family"))}</strong><span class="d">${esc(t("familyD"))}</span></span></label>
      </div>
      <div class="grid g2" style="margin-top:18px">
        <div class="field"><label for="p-age">${esc(t("age"))}</label><input id="p-age" class="input num" inputmode="decimal" type="number" min="0" max="120" step="0.1" value="${esc(draft.age)}" placeholder="—"><span class="hint">${esc(t("ageHint"))}</span></div>
        <div class="field"><label for="p-area">${esc(t("area"))}</label><input id="p-area" class="input" value="${esc(draft.area)}" placeholder="${esc(t("areaPh"))}" maxlength="60"></div>
      </div>
      <div class="p-actions"><span></span><button class="btn primary lg" data-next>${esc(t("next"))} ${icon("arrowR")}</button></div>`;
    body.querySelectorAll('input[name="who"]').forEach((r) => r.addEventListener("change", () => { draft.forWhom = r.value; }));
    body.querySelector("[data-next]").addEventListener("click", () => {
      draft.age = body.querySelector("#p-age").value.trim();
      draft.area = body.querySelector("#p-area").value.trim();
      show(2);
    });
  }

  function stepHistory() {
    const H = draft.history;
    const chip = (group, k, label) => `<button type="button" class="chip hc" data-g="${group}" data-k="${k}" aria-pressed="${group === "flags" ? !!H[k] : H[group].includes(k)}">${esc(label)}</button>`;
    body.innerHTML = `
      <h2 class="p-h">${esc(t("hTitle"))}</h2>
      <p class="ink2" style="margin:-8px 0 18px">${esc(t("hSub"))}</p>
      <div class="field"><span class="label">${esc(t("hCond"))}</span><div class="chips">${Object.entries(t("cond")).map(([k, v]) => chip("conditions", k, v)).join("")}</div></div>
      <div class="field" style="margin-top:16px"><span class="label">${esc(t("hMeds"))}</span><div class="chips">${Object.entries(t("meds")).map(([k, v]) => chip("meds", k, v)).join("")}</div></div>
      <div class="field" style="margin-top:16px"><span class="label">${esc(t("hRecent"))}</span><div class="chips">${Object.entries(t("flags")).map(([k, v]) => chip("flags", k, v)).join("")}</div></div>
      <button type="button" class="chip" data-none style="margin-top:16px">${icon("check")} ${esc(t("hNone"))}</button>
      <div class="p-actions">
        <button class="btn ghost" data-back>${esc(t("back"))}</button>
        <button class="btn primary lg" data-next>${esc(t("next"))} ${icon("arrowR")}</button>
      </div>`;
    body.querySelectorAll(".hc").forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") !== "true";
      c.setAttribute("aria-pressed", on);
      const { g, k } = c.dataset;
      if (g === "flags") H[k] = on;
      else H[g] = on ? H[g].concat(k) : H[g].filter((x) => x !== k);
    }));
    body.querySelector("[data-none]").addEventListener("click", () => {
      H.conditions = []; H.meds = []; H.repeatVisit = false; H.recentAdmission = false; show(3);
    });
    body.querySelector("[data-back]").addEventListener("click", () => show(1));
    body.querySelector("[data-next]").addEventListener("click", () => show(3));
  }

  function stepTwo() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    body.innerHTML = `
      <h2 class="p-h">${esc(t("step2"))}</h2>
      <div class="field">
        <label for="p-desc">${esc(t("describe"))}</label>
        <div class="p-ta">
          <textarea id="p-desc" class="textarea" placeholder="${esc(t("describePh"))}" maxlength="800" autofocus>${esc(draft.description)}</textarea>
          <button type="button" class="btn sm p-mic" ${SR ? "" : "disabled title=\"" + esc(t("voiceNo")) + "\""}>${icon("mic")}<span>${esc(t("voice"))}</span></button>
        </div>
        <span class="hint">${esc(t("describeHint"))}</span>
      </div>
      <div class="field" style="margin-top:14px"><span class="label">${esc(t("quick"))}</span>
        <div class="chips">${t("chips").map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join("")}</div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <label class="check"><input type="checkbox" id="p-urg" ${draft.urgent ? "checked" : ""}><span><strong>${esc(t("urgent"))}</strong><span>${esc(t("urgentD"))}</span></span></label>
        <label class="check em"><input type="checkbox" id="p-em" ${draft.selfEmergency ? "checked" : ""}><span><strong>${esc(t("emerg"))}</strong><span>${esc(t("emergD"))}</span></span></label>
      </div>
      <div class="p-actions">
        <button class="btn ghost" data-back>${esc(t("back"))}</button>
        <button class="btn primary lg" data-go>${icon("check")} <span>${esc(t("submit"))}</span></button>
      </div>`;
    const ta = body.querySelector("#p-desc");
    body.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      ta.value = ta.value.trim() ? ta.value.trim().replace(/[.,]?$/, ", ") + c.textContent : c.textContent;
      c.setAttribute("aria-pressed", "true"); ta.focus();
    }));
    const mic = body.querySelector(".p-mic");
    if (SR) {
      let rec = null;
      mic.addEventListener("click", () => {
        if (rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = lang === "hi" ? "hi-IN" : "en-IN"; rec.interimResults = true;
        const base = ta.value.trim();
        mic.classList.add("live"); mic.querySelector("span").textContent = t("listening");
        rec.onresult = (e) => { ta.value = (base ? base + " " : "") + [...e.results].map((r) => r[0].transcript).join(" "); };
        rec.onend = () => { rec = null; mic.classList.remove("live"); mic.querySelector("span").textContent = t("voice"); };
        rec.onerror = () => { toast(t("voiceNo"), "info"); };
        rec.start();
      });
    }
    body.querySelector("[data-back]").addEventListener("click", () => { draft.description = ta.value; show(2); });
    body.querySelector("[data-go]").addEventListener("click", async (e) => {
      draft.description = ta.value.trim();
      draft.urgent = body.querySelector("#p-urg").checked;
      draft.selfEmergency = body.querySelector("#p-em").checked;
      if (!draft.description && !draft.selfEmergency) { ta.focus(); ta.classList.add("shake"); setTimeout(() => ta.classList.remove("shake"), 400); return; }
      const req = store.add(Object.assign({}, draft, { lang, source: "web" }));
      current = req;
      show(4);
      // Optional AI second reader, only when staff have switched it on.
      if (store.settings().ai && req.lane !== "EMERGENCY") {
        const { ai, failed, skipped } = await aiCheck(req, req.result, store.settings().model);
        if (!skipped) {
          const updated = store.applyAi(req.id, ai, failed);
          if (updated && updated.lane !== current.lane) { current = updated; show(4, true); }
        }
      }
    });
  }

  function result(r) {
    const lane = r.lane;
    const fresh = store.get(r.id) || r;
    const showMind = (fresh.result.reasons || []).some((x) => x.ruleId === "E8");
    const steps = { EMERGENCY: ["next1E", "next2E", "next3E"], SAME_DAY: ["next1S", "next2S", "next3S"], ROUTINE: ["next1R", "next2R", "next3R"] }[lane];
    let hero = "";
    if (lane === "EMERGENCY") {
      hero = `
      <div class="res em">
        <div class="res-ring">${icon("ambulance")}</div>
        <h2>${esc(t("emTitle"))}</h2>
        <p>${esc(t("emSub"))}</p>
        <div class="res-calls">
          <a class="btn danger lg" href="tel:108">${icon("phone")} 108 · Ambulance</a>
          <a class="btn lg" href="tel:112">${icon("phone")} 112 · Emergency</a>
          ${showMind ? `<a class="btn lg" href="tel:14416">${icon("heart")} 14416 · Tele-MANAS</a>` : ""}
        </div>
        ${showMind ? `<p class="res-mind">${esc(t("emMind"))}</p>` : ""}
        <div class="res-near">${icon("hospital")}<span><b>${esc(t("emNearest"))}:</b> ${esc(CLINIC.referral[1].name)}, ${esc(CLINIC.referral[1].dist)}</span></div>
        <p class="res-staff">${icon("check")} ${esc(t("emStaff"))}</p>
      </div>`;
    } else {
      const svc = fresh.service;
      const isR = lane === "ROUTINE";
      hero = `
      <div class="res ${isR ? "rt" : "sd"}">
        <div class="ticket">
          <div class="ticket-top">
            <span class="lane ${lane}">${LANE[lane].short}</span>
            <span class="muted">${esc(CLINIC.name)}</span>
          </div>
          <div class="ticket-token"><small>${esc(t("token"))}</small><strong class="num">${esc(fresh.token)}</strong></div>
          <div class="ticket-cut"></div>
          <div class="ticket-bot">
            ${isR && svc ? `<div>${icon(svc.icon)}<span><b class="${lang === "hi" ? "hi" : ""}">${esc(lang === "hi" ? svc.hi : svc.name)}</b><br>${esc(fmtDate(svc.date, { weekday: "long", day: "numeric", month: "long" }))} · ${esc(svc.time)}</span></div>`
              : `<div>${icon("clock")}<span><b>${esc(fmtDate(Date.now(), { weekday: "long", day: "numeric", month: "long" }))}</b><br>Counter 2 · before 4:00 PM</span></div>`}
          </div>
        </div>
        <h2>${esc(isR ? t("rtTitle") : t("sdTitle"))}</h2>
        <p>${esc(isR ? t("rtSub") : t("sdSub"))}</p>
        ${isR && svc ? `<div class="bring"><span class="label">${esc(t("bring"))}</span><ul>${svc.bring.map((b) => `<li>${icon("check")}${esc(b)}</li>`).join("")}</ul></div>` : `<p class="res-worse">${icon("alert")} ${esc(t("sdWorse"))}</p>`}
      </div>`;
    }
    body.innerHTML = `
      ${hero}
      <div class="next">
        <span class="label">${esc(t("whatNext"))}</span>
        <ol>${steps.map((k, i) => `<li><span class="n">${i + 1}</span>${esc(t(k))}</li>`).join("")}</ol>
      </div>
      <div class="p-actions">
        <button class="btn ghost" data-new>${icon("plus")} ${esc(t("newReq"))}</button>
        <span style="display:flex;gap:8px;flex-wrap:wrap">
          ${"speechSynthesis" in window ? `<button class="btn" data-read>${icon("speaker")} ${esc(t("readAloud"))}</button>` : ""}
          ${lane === "ROUTINE" && fresh.service ? `<button class="btn" data-ics>${icon("calendar")} ${esc(t("calendar"))}</button>` : ""}
        </span>
      </div>
      <p class="hint" style="margin-top:14px">${esc(t("disclaimer"))}</p>`;
    body.querySelector("[data-new]").addEventListener("click", () => {
      Object.assign(draft, { description: "", urgent: false, selfEmergency: false, history: { conditions: [], meds: [], repeatVisit: false, recentAdmission: false } }); current = null; show(1);
    });
    const rd = body.querySelector("[data-read]");
    rd && rd.addEventListener("click", () => {
      const text = [...body.querySelectorAll(".res h2, .res > p, .ticket-token strong, .next li")].map((n) => n.textContent).join(". ");
      const u = new SpeechSynthesisUtterance(text); u.lang = lang === "hi" ? "hi-IN" : "en-IN"; u.rate = 0.95;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
    const ics = body.querySelector("[data-ics]");
    ics && ics.addEventListener("click", () => downloadIcs(fresh));
  }

  show(1, true);
  return () => { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } };
}

function downloadIcs(r) {
  const d = new Date(r.service.date);
  const m = /(\d+):(\d+)\s*(AM|PM)/.exec(r.service.time);
  let h = Number(m[1]) % 12 + (m[3] === "PM" ? 12 : 0);
  d.setHours(h, Number(m[2]), 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const f = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const end = new Date(d.getTime() + 30 * 60000);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sanket//EN", "BEGIN:VEVENT", `UID:${r.id}@sanket`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, `DTEND:${f(end)}`,
    `SUMMARY:${r.service.name} (token ${r.token})`, `LOCATION:${CLINIC.name}`, `DESCRIPTION:Bring: ${r.service.bring.join("; ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `sanket-${r.token}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
