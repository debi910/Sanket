// Small UI toolkit: escaping, icons, toasts, drawer, modal, segmented
// controls, evidence highlighting and time formatting.

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.3c2.2.7 3.5 2.8 3.5 5.7"/>',
  desk: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  steth: '<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v2a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="11" r="2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  ext: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  msg: '<path d="M4 5h16v11H8l-4 4V5Z"/>',
  walk: '<circle cx="13" cy="4.5" r="2"/><path d="m9 21 2.5-7L14 16v5M7 12l3-4 4 1 3 3"/>',
  web: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  hospital: '<path d="M4 21V6l8-3 8 3v15"/><path d="M12 8v6M9 11h6M9 21v-3h6v3"/>',
  ambulance: '<path d="M3 16V7h11v9"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M8.5 9.5v4M6.5 11.5h4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.5C2 6.9 4.5 4 7.6 4c1.9 0 3.4 1 4.4 2.5C13 5 14.5 4 16.4 4 19.5 4 22 6.9 21 10.5 19.5 15.4 12 20 12 20Z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h17"/>',
  bug: '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M12 7V4M5 10l3 1M19 10l-3 1M4 15h4M16 15h4M6 20l2.5-2M18 20l-2.5-2"/>',
  snake: '<path d="M4 18c3 0 3-4 6-4s3 4 6 4 4-3 4-6-2-5-5-5H9"/><circle cx="7" cy="7" r="2"/>',
  baby: '<circle cx="12" cy="8" r="4"/><path d="M8 21v-3a4 4 0 0 1 8 0v3M10.5 8h.01M13.5 8h.01"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="m9.2 8 5.7 8"/>',
  doc: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  syringe: '<path d="m18 2 4 4M17 7l3-3M19 9 9 19l-4 1 1-4L16 6l3 3ZM8 14l2 2M11 11l2 2"/>',
  bandage: '<rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M11 11h.01M13 13h.01M11 13h.01M13 11h.01"/>',
  queue: '<path d="M4 6h16M4 12h10M4 18h6"/>',
  play: '<path d="M7 4v16l13-8L7 4Z"/>'
};

export function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
}

export const logo = (size = 30) => `
<svg class="mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="9" fill="var(--brand)"/>
  <path d="M5 17.5h5l2.4-6 3.6 11 3-8.5 1.6 3.5H27" fill="none" stroke="var(--brand-ink)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24.5" cy="9" r="2.6" fill="var(--saffron)"/>
</svg>`;

export const LANE = {
  EMERGENCY: { short: "Emergency", long: "Emergency guidance", letter: "E", color: "var(--em)" },
  SAME_DAY: { short: "Same-day", long: "Same-day review", letter: "S", color: "var(--sd-dot)" },
  ROUTINE: { short: "Routine", long: "Routine appointment", letter: "R", color: "var(--rt-dot)" }
};
export const laneChip = (lane, lg) => `<span class="lane ${lane}${lg ? " lg" : ""}">${LANE[lane].short}</span>`;

// ---------- time ----------
export function ago(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " h " + (m % 60 ? (m % 60) + " min " : "") + "ago";
  return Math.round(h / 24) + " d ago";
}
export function waitText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return m + "m";
  return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
}
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const fmtDate = (d, opts) => new Date(d).toLocaleDateString("en-IN", opts || { weekday: "short", day: "numeric", month: "short" });
export const fmtNum = (n) => Number(n).toLocaleString("en-IN");

// ---------- evidence highlighting ----------
// The engine matches on folded text (lower case, nukta removed). To mark the
// same words in the original text we fold it character by character and keep
// a map back to the original positions.
function foldWithMap(raw) {
  const src = String(raw || "").normalize("NFD");
  let text = "", map = [], lastSpace = false;
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    if (ch === "़") continue;
    if (ch === "ँ") ch = "ं";
    if (ch === "‘" || ch === "’") ch = "'";
    if (/\s/.test(ch)) { if (lastSpace) continue; ch = " "; lastSpace = true; } else lastSpace = false;
    ch = ch.toLowerCase();
    for (const c of ch) { text += c; map.push(i); }
  }
  return { text, map, src };
}

export function highlight(raw, groups) {
  // groups: [{phrases:[...], cls:"ev"|"ev em"|"ev min"}]
  const { text, map, src } = foldWithMap(raw);
  const spans = [];
  groups.forEach((g) => (g.phrases || []).forEach((p) => {
    const needle = String(p || "").toLowerCase().normalize("NFD").replace(/़/g, "").replace(/ँ/g, "ं").replace(/\s+/g, " ").trim();
    if (!needle || needle.length < 2) return;
    let from = 0, idx;
    while ((idx = text.indexOf(needle, from)) !== -1) {
      spans.push({ a: map[idx], b: map[idx + needle.length - 1] + 1, cls: g.cls });
      from = idx + needle.length;
    }
  }));
  spans.sort((x, y) => x.a - y.a || y.b - x.b);
  let out = "", pos = 0;
  for (const s of spans) {
    if (s.a < pos) continue;
    out += esc(src.slice(pos, s.a).normalize("NFC")) + `<mark class="${s.cls}">` + esc(src.slice(s.a, s.b).normalize("NFC")) + "</mark>";
    pos = s.b;
  }
  return out + esc(src.slice(pos).normalize("NFC"));
}

export function evidenceGroups(result) {
  const groups = [];
  const lane = result.category;
  const strong = [], other = [];
  (result.reasons || []).forEach((r) => { if (r.ruleId !== "G1") (r.evidence || []).forEach((e) => (lane === "EMERGENCY" ? strong : other).push(e)); });
  (result.otherSignals || []).forEach((r) => (r.evidence || []).forEach((e) => other.push(e)));
  if (result.ai && result.ai.phrases) result.ai.phrases.forEach((e) => other.push(e));
  groups.push({ phrases: strong, cls: "ev em" }, { phrases: other, cls: "ev" });
  if (result.framingGuard && result.framingGuard.phrases.length) groups.push({ phrases: result.framingGuard.phrases, cls: "ev min" });
  return groups;
}

// ---------- toasts ----------
let toaster;
export function toast(msg, kind = "ok") {
  if (!toaster) { toaster = document.createElement("div"); toaster.className = "toaster"; toaster.setAttribute("role", "status"); document.body.append(toaster); }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = (kind === "ok" ? icon("check", "t-ok") : icon("info")) + `<span>${esc(msg)}</span>`;
  toaster.append(t);
  let timer = setTimeout(close, 3200);
  // Pause while the tab is hidden, so a toast is never missed.
  const vis = () => { if (document.hidden) clearTimeout(timer); else timer = setTimeout(close, 1800); };
  document.addEventListener("visibilitychange", vis);
  function close() { document.removeEventListener("visibilitychange", vis); t.classList.add("out"); setTimeout(() => t.remove(), 220); }
}

// ---------- overlays ----------
function overlay(kind, html, { onClose, label } = {}) {
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  const panel = document.createElement("div");
  panel.className = kind;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  if (label) panel.setAttribute("aria-label", label);
  panel.innerHTML = html;
  document.body.append(scrim, panel);
  const prevFocus = document.activeElement;
  document.documentElement.style.overflow = "hidden";
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    scrim.classList.add("out"); panel.classList.add("out");
    document.removeEventListener("keydown", onKey);
    document.documentElement.style.overflow = "";
    setTimeout(() => { scrim.remove(); panel.remove(); prevFocus && prevFocus.focus && prevFocus.focus(); }, 240);
    onClose && onClose();
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey);
  scrim.addEventListener("click", close);
  panel.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  requestAnimationFrame(() => { const f = panel.querySelector("[autofocus], button, textarea, input"); f && f.focus({ preventScroll: true }); });
  return { el: panel, close };
}
export const drawer = (html, o) => overlay("drawer", html, o);
export const modal = (html, o) => overlay("modal", html, o);

// ---------- segmented control with sliding thumb ----------
export function segmented(container, onChange) {
  const btns = [...container.querySelectorAll("button")];
  let thumb = container.querySelector(".thumb");
  if (!thumb) { thumb = document.createElement("span"); thumb.className = "thumb"; container.prepend(thumb); }
  function place(animate) {
    const on = btns.find((b) => b.getAttribute("aria-pressed") === "true") || btns[0];
    if (!animate) thumb.style.transition = "none";
    thumb.style.width = on.offsetWidth + "px";
    thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    if (!animate) { thumb.offsetWidth; thumb.style.transition = ""; }
  }
  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    place(true);
    onChange && onChange(b.dataset.value, b);
  }));
  requestAnimationFrame(() => place(false));
  return { place };
}

// Animated count-up for headline numbers (rare, so a little delight is fine).
export function countUp(root = document) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count), dec = Number(el.dataset.dec || 0), suffix = el.dataset.suffix || "";
    const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-IN")) + suffix;
    if (reduce) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
