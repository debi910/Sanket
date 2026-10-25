// Shared state for every window. Requests and the decision log live in this
// browser's localStorage, so a patient window and a front-desk window on the
// same machine stay in sync (the "storage" event fires in other tabs).
// All data is synthetic.

import { suggestService } from "./india.js";

const KEY = "sanket.v2";
const E = () => window.TriageEngine;
const RANK = { ROUTINE: 1, SAME_DAY: 2, EMERGENCY: 3 };
const listeners = new Set();
let state = null;

export const STAFF = { desk: "Front desk", mo: "Medical officer" };

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function laneRank(l) { return RANK[l]; }

function tokenFor(lane, seq) {
  const L = { EMERGENCY: "E", SAME_DAY: "S", ROUTINE: "R" }[lane];
  seq[L] = (seq[L] || 0) + 1;
  return L + "-" + String(seq[L]).padStart(3, "0");
}

export function makeRequest(input, seq, now = Date.now()) {
  const history = input.history || {};
  const result = E().route({ description: input.description, age: input.age, urgent: !!input.urgent, selfEmergency: !!input.selfEmergency, history });
  const lane = result.category;
  return {
    id: "r" + now.toString(36) + Math.random().toString(36).slice(2, 6),
    token: tokenFor(lane, seq),
    createdAt: input.createdAt || now,
    source: input.source || "web",
    forWhom: input.forWhom || "self",
    age: input.age === "" || input.age == null ? null : Number(input.age),
    area: input.area || "",
    description: input.description,
    pmh: history,
    urgent: !!input.urgent,
    selfEmergency: !!input.selfEmergency,
    result,
    suggestedLane: lane,
    lane,
    service: lane === "EMERGENCY" ? null : suggestService(input.description, lane, input.createdAt || now),
    status: "new",
    outcome: null,
    history: [{ at: input.createdAt || now, by: "Sanket rules", action: "suggested", to: lane, note: result.reasons.map((r) => r.ruleId).join(", ") }]
  };
}

const SEED = [
  { m: 168, age: 58, forWhom: "family", source: "whatsapp", d: "Papa ke seene mein dard hai aur paseena aa raha hai. Ghar wale bol rahe hain gas hai", st: "signposted" },
  { m: 155, age: 0.25, forWhom: "family", source: "web", d: "Baby ka teeka lagwana hai, 10 week wala vaccination due hai", st: "booked" },
  { m: 149, age: 64, source: "phone", h: { conditions: ["bp"] }, d: "Need repeat prescription for my BP tablets, they finish next week", st: "raised", to: "SAME_DAY", reason: "Patient said home BP reading was 190/110 this morning" },
  { m: 141, age: 24, source: "phone", d: "3 din se tez bukhar aur sir dard, aaj subah se ulti bhi ho rahi hai", st: "accepted" },
  { m: 133, age: 63, forWhom: "family", source: "phone", h: { conditions: ["diabetes"], meds: ["insulin"] }, d: "Sugar ki dawai khatam ho gayi hai 2 din se, insulin bhi nahi bacha", st: "reviewed", outcome: "come_today" },
  { m: 112, age: 35, source: "web", d: "Not well", st: "lowered", to: "ROUTINE", reason: "Called back: wants a general check-up, no symptoms today" },
  { m: 96, age: 29, source: "web", d: "Do din se peshab mein jalan hai aur halka bukhar bhi hai", st: "accepted" },
  { m: 77, age: 18, source: "web", d: "Medical fitness certificate chahiye college admission ke liye", st: "booked" },
  { m: 52, age: 78, forWhom: "family", source: "whatsapp", h: { conditions: ["diabetes", "bp", "kidney"] }, d: "Dadi ji ko kal se bahut kamzori aur chakkar aa rahe hain, khana bhi kam kha rahi hain", st: "new" },
  { m: 31, age: 30, source: "web", d: "Mild headache for 3 days, tension ki koi baat nahi, bas thoda sa hai", st: "new" },
  { m: 19, age: 47, source: "web", h: { repeatVisit: true }, d: "Came last week for back pain, tablets se aaram nahi hai abhi bhi", st: "new" },
  { m: 44, age: 45, source: "walkin", d: "Mujhe sugar test ki report dikhani hai", st: "new" },
  { m: 6, age: 37, forWhom: "family", source: "phone", d: "Khet mein kaam karte waqt bichhu ne kaat liya, bahut dard hai", st: "new" },
  { m: 3, age: 6, forWhom: "family", source: "whatsapp", d: "Bachhe ne galti se keede maarne wali dawai pee li, ulti kar raha hai", st: "new" }
];

function seed() {
  const now = Date.now();
  const seq = {};
  const requests = [];
  const log = [];
  SEED.forEach((s) => {
    const at = now - s.m * 60000;
    const r = makeRequest({ description: s.d, age: s.age, forWhom: s.forWhom, source: s.source, history: s.h, createdAt: at }, seq, at);
    const dAt = at + Math.min(s.m - 1, 4 + Math.round(s.m / 30)) * 60000;
    const push = (entry) => { r.history.push(entry); log.push(Object.assign({ requestId: r.id, token: r.token }, entry)); };
    if (s.st === "signposted" || s.st === "closed") {
      push({ at: at + 40000, by: STAFF.desk, action: "signposted", to: r.lane, note: "Told to call 108 now; duty doctor alerted" });
      r.status = s.st;
      if (s.st === "closed") push({ at: at + 30 * 60000, by: STAFF.desk, action: "closed", to: r.lane, note: "108 confirmed pick-up to the nearest 24x7 hospital" });
    } else if (s.st === "raised" || s.st === "lowered") {
      push({ at: dAt, by: STAFF.desk, action: "override", from: r.lane, to: s.to, reason: s.reason });
      r.lane = s.to; r.status = s.to === "ROUTINE" ? "booked" : "accepted";
      r.service = suggestService(s.d, s.to, at);
    } else if (s.st === "accepted" || s.st === "booked") {
      push({ at: dAt, by: STAFF.desk, action: "accepted", to: r.lane });
      r.status = s.st;
    } else if (s.st === "reviewed") {
      push({ at: dAt, by: STAFF.desk, action: "accepted", to: r.lane });
      push({ at: dAt + 22 * 60000, by: STAFF.mo, action: "reviewed", to: r.lane, outcome: s.outcome, note: "Called back; asked to come to OPD today" });
      r.status = "reviewed"; r.outcome = s.outcome;
    }
    requests.push(r);
  });
  // Fourteen days of synthetic daily totals for the trend charts.
  const rand = rng(20261024);
  const days = [];
  for (let i = 14; i >= 1; i--) {
    const d = new Date(now - i * 86400000);
    const sunday = d.getDay() === 0;
    const total = sunday ? Math.round(6 + rand() * 4) : Math.round(52 + rand() * 26);
    const E = Math.max(1, Math.round(total * (0.05 + rand() * 0.04)));
    const S = Math.round(total * (0.36 + rand() * 0.1));
    const raised = Math.round(rand() * 2.4);
    days.push({ date: d.setHours(12, 0, 0, 0), total, E, S, R: total - E - S, raised, lowered: Math.round(1 + rand() * 4), guard: Math.round(total * (0.05 + rand() * 0.05)), reviewMedian: Math.round(38 + rand() * 50) });
  }
  return { version: 5, seededAt: now, seq, requests, log, days, ruleFlags: [], settings: { ai: false, provider: "gemini", model: "gemini-3.5-flash-lite" } };
}

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch (e) { state = null; }
  // A new day starts a fresh synthetic queue.
  if (!state || state.version !== 5 || new Date(state.seededAt).toDateString() !== new Date().toDateString()) { state = seed(); save(); }
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep in memory */ }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

window.addEventListener("storage", (e) => {
  if (e.key !== KEY) return;
  try { state = JSON.parse(e.newValue); } catch (err) { return; }
  listeners.forEach((fn) => fn(state, { remote: true }));
});

export function reset() { state = seed(); save(); }

export function get(id) { return load().requests.find((r) => r.id === id); }

export function add(input) {
  const s = load();
  const r = makeRequest(input, s.seq);
  s.requests.push(r);
  save();
  return r;
}

export function applyAi(id, ai, failed) {
  const r = get(id); if (!r) return;
  const combined = E().combine(r.result, ai, r.description, failed);
  r.result = combined;
  const note = failed ? "AI unavailable; rules result kept" : combined.ai.lowerIgnored ? `AI suggested ${combined.ai.level.toLowerCase().replace("_", "-")}; lower lane ignored` : combined.ai.escalated ? "AI raised the lane" : "AI agreed with the rules";
  if (!(combined.category !== r.suggestedLane && RANK[combined.category] > RANK[r.suggestedLane])) logIt(r, { by: "AI second opinion", action: "ai-checked", to: r.lane, note });
  if (combined.category !== r.suggestedLane && RANK[combined.category] > RANK[r.suggestedLane]) {
    logIt(r, { by: "AI second opinion", action: "escalated", from: r.suggestedLane, to: combined.category, note: failed ? "AI unavailable, so routine went to review" : "AI raised the lane" });
    r.suggestedLane = combined.category;
    if (r.status === "new") r.lane = combined.category;
    if (r.lane !== "EMERGENCY") r.service = suggestService(r.description, r.lane, r.createdAt);
    else r.service = null;
  }
  save();
  return r;
}

function logIt(r, entry) {
  entry.at = entry.at || Date.now();
  r.history.push(entry);
  load().log.push(Object.assign({ requestId: r.id, token: r.token }, entry));
}

export function accept(id, by = STAFF.desk) {
  const r = get(id); if (!r) return;
  if (r.lane === "EMERGENCY") { r.status = "signposted"; logIt(r, { by, action: "signposted", to: r.lane, note: "Told to call 108 now; duty doctor alerted" }); }
  else if (r.lane === "ROUTINE") { r.status = "booked"; logIt(r, { by, action: "accepted", to: r.lane, note: "Booked: " + (r.service ? r.service.name : "OPD") }); }
  else { r.status = "accepted"; logIt(r, { by, action: "accepted", to: r.lane, note: "Sent to clinician review" }); }
  save();
  return r;
}

export function override(id, to, reason, by = STAFF.desk) {
  const r = get(id); if (!r || r.lane === to) return r;
  const from = r.lane;
  r.lane = to;
  r.service = to === "EMERGENCY" ? null : suggestService(r.description, to, r.createdAt);
  r.status = to === "EMERGENCY" ? "signposted" : to === "ROUTINE" ? "booked" : "accepted";
  logIt(r, { by, action: "override", from, to, reason });
  save();
  return r;
}

export const OUTCOMES = {
  come_today: { label: "Come to OPD today", icon: "walk" },
  tele: { label: "eSanjeevani teleconsult", icon: "web" },
  refer: { label: "Refer to a higher centre", icon: "hospital" },
  routine: { label: "Routine slot is fine", icon: "calendar" },
  emergency: { label: "Escalate: call 108 now", icon: "ambulance" }
};

export function review(id, outcome, note, by = STAFF.mo) {
  const r = get(id); if (!r) return;
  const from = r.lane;
  if (outcome === "emergency") { r.lane = "EMERGENCY"; r.service = null; r.status = "signposted"; }
  else if (outcome === "routine") { r.lane = "ROUTINE"; r.service = suggestService(r.description, "ROUTINE", r.createdAt); r.status = "booked"; }
  else r.status = "reviewed";
  r.outcome = outcome;
  logIt(r, { by, action: "reviewed", from, to: r.lane, outcome, note });
  save();
  return r;
}

export function close(id, note, by = STAFF.desk) {
  const r = get(id); if (!r) return;
  r.status = "closed";
  logIt(r, { by, action: "closed", to: r.lane, note });
  save();
  return r;
}

export function flagRule(id, note, by = STAFF.mo) {
  const r = get(id); if (!r) return;
  load().ruleFlags.push({ at: Date.now(), requestId: id, token: r.token, by, note, rules: r.result.reasons.map((x) => x.ruleId) });
  logIt(r, { by, action: "rule-flag", to: r.lane, note });
  save();
}

export function settings(patch) {
  const s = load();
  if (!s.settings.provider) s.settings.provider = "gemini";
  if (patch) { Object.assign(s.settings, patch); save(); }
  return s.settings;
}
