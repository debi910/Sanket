// Hand-built SVG charts: thin marks, rounded data ends on the baseline,
// recessive grid, hover tooltips with hit targets larger than the mark.
import { esc, fmtNum } from "./ui.js";

function tipper(root) {
  let tip = root.querySelector(".tip");
  if (!tip) { tip = document.createElement("div"); tip.className = "tip"; root.append(tip); }
  root.addEventListener("pointermove", (e) => {
    const t = e.target.closest("[data-tip]");
    if (!t || !root.contains(t)) { tip.classList.remove("on"); return; }
    tip.innerHTML = t.getAttribute("data-tip");
    const box = root.getBoundingClientRect();
    let x = e.clientX - box.left + 14, y = e.clientY - box.top - 12 - tip.offsetHeight;
    if (x + tip.offsetWidth > box.width) x = e.clientX - box.left - tip.offsetWidth - 14;
    if (y < -8) y = e.clientY - box.top + 18;
    tip.style.left = x + "px"; tip.style.top = y + "px";
    tip.classList.add("on");
  });
  root.addEventListener("pointerleave", () => tip.classList.remove("on"));
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// Rounded top corners only: a path for a bar anchored to the baseline.
function barPath(x, y, w, h, r = 4) {
  r = Math.min(r, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

// Vertical bars, one series. data: [{label, value, tip, color?, highlight?}]
export function bars(el, data, { height = 220, color = "var(--brand)", fmt = fmtNum, unit = "" } = {}) {
  const W = 640, H = height, pl = 46, pr = 8, pt = 12, pb = 28;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const bw = (W - pl - pr) / data.length, gap = Math.min(18, bw * 0.32);
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, yy = y(v);
    s += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text class="axis num" x="${pl - 8}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  data.forEach((d, i) => {
    const x = pl + i * bw + gap / 2, w = bw - gap, yy = y(d.value);
    const tip = d.tip || `<b>${esc(d.label)}</b><br>${fmt(d.value)}${unit}`;
    s += `<g data-tip="${esc(tip)}"><rect class="hit" x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}"/>`;
    s += `<path class="bar" style="animation-delay:${i * 45}ms" d="${barPath(x, yy, w, y(0) - yy)}" fill="${d.color || color}" opacity="${d.dim ? 0.45 : 1}"/></g>`;
    s += `<text class="axis" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line-2)"/></svg>`;
  el.classList.add("viz"); el.innerHTML = s; tipper(el);
}

// Stacked vertical bars. series: [{key, label, color}], data: [{label, values:{key:n}}]
export function stacked(el, data, series, { height = 230 } = {}) {
  const W = 640, H = height, pl = 40, pr = 8, pt = 12, pb = 28;
  const max = niceMax(Math.max(...data.map((d) => series.reduce((a, s) => a + (d.values[s.key] || 0), 0))));
  const bw = (W - pl - pr) / data.length, gap = Math.min(14, bw * 0.3);
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, yy = y(v);
    s += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text class="axis num" x="${pl - 8}" y="${yy + 4}" text-anchor="end">${fmtNum(Math.round(v))}</text>`;
  }
  data.forEach((d, i) => {
    const x = pl + i * bw + gap / 2, w = bw - gap;
    let acc = 0;
    const total = series.reduce((a, sr) => a + (d.values[sr.key] || 0), 0);
    const tip = `<b>${esc(d.full || d.label)}</b><br>` + series.map((sr) => `${esc(sr.label)}: ${fmtNum(d.values[sr.key] || 0)}`).join("<br>") + `<br>Total: ${fmtNum(total)}`;
    s += `<g data-tip="${esc(tip)}"><rect class="hit" x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}"/>`;
    series.forEach((sr, k) => {
      const v = d.values[sr.key] || 0; if (!v) return;
      const y0 = y(acc), y1 = y(acc + v); acc += v;
      const top = k === series.length - 1 || series.slice(k + 1).every((n) => !(d.values[n.key]));
      const h = Math.max(0, y0 - y1 - (acc - v > 0 ? 2 : 0));
      s += top ? `<path class="bar" style="animation-delay:${i * 30}ms" d="${barPath(x, y1, w, h)}" fill="${sr.color}"/>`
        : `<rect class="bar" style="animation-delay:${i * 30}ms" x="${x}" y="${y1}" width="${w}" height="${h}" fill="${sr.color}"/>`;
    });
    s += `</g><text class="axis" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line-2)"/></svg>`;
  el.classList.add("viz"); el.innerHTML = s; tipper(el);
}

// Horizontal percentage bars with direct labels. items: [{label, value, note}]
export function hbars(el, items, { color = "var(--brand)", max = 100, suffix = "%" } = {}) {
  el.classList.add("viz");
  el.innerHTML = `<div style="display:grid;gap:14px">` + items.map((it, i) => `
    <div data-tip="${esc(`<b>${esc(it.label)}</b><br>${it.value}${suffix}${it.note ? "<br>" + esc(it.note) : ""}`)}">
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;margin-bottom:6px">
        <span class="ink2">${esc(it.label)}</span><strong class="num">${it.value}${suffix}</strong>
      </div>
      <div class="meter"><i style="width:${(it.value / max) * 100}%;background:${it.color || color};animation-delay:${i * 50}ms"></i></div>
    </div>`).join("") + `</div>`;
  tipper(el);
}

// Month x condition heatmap with the current month outlined.
export function heatmap(el, seasons, month) {
  const cell = 34, lw = 150, top = 22, W = lw + cell * 12 + 4, H = top + seasons.rows.length * (cell + 4);
  const fills = ["var(--bg-sunk)", "color-mix(in srgb, var(--saffron) 28%, var(--bg-elev))", "color-mix(in srgb, var(--saffron) 60%, var(--bg-elev))", "var(--saffron)"];
  const words = ["Low", "Some", "High", "Peak"];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Seasonal pattern by month">`;
  seasons.months.forEach((m, j) => {
    s += `<text class="axis" x="${lw + j * cell + cell / 2}" y="12" text-anchor="middle" ${j === month ? 'style="fill:var(--ink);font-weight:650"' : ""}>${m}</text>`;
  });
  seasons.rows.forEach((r, i) => {
    const yy = top + i * (cell + 4);
    s += `<text class="lbl" x="0" y="${yy + cell / 2 + 4}">${esc(r.label)}</text>`;
    r.v.forEach((v, j) => {
      s += `<rect data-tip="${esc(`<b>${esc(r.label)}, ${seasons.months[j]}</b><br>${words[v]} season · rule ${r.rule}`)}" x="${lw + j * cell + 2}" y="${yy}" width="${cell - 4}" height="${cell}" rx="6" fill="${fills[v]}" style="animation:rise 300ms var(--ease-out) both;animation-delay:${(i * 12 + j) * 8}ms"/>`;
    });
  });
  s += `<rect x="${lw + month * cell}" y="${top - 4}" width="${cell}" height="${seasons.rows.length * (cell + 4) + 4}" rx="9" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  s += `</svg><div class="legend" style="margin-top:12px">${words.map((w, i) => `<span><i style="background:${fills[i]}"></i>${w}</span>`).join("")}</div>`;
  el.classList.add("viz"); el.innerHTML = s; tipper(el);
}

// One horizontal stacked bar for a share (lane mix).
export function shareBar(el, parts) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  el.classList.add("viz");
  el.innerHTML = `<div style="display:flex;gap:2px;height:14px;border-radius:99px;overflow:hidden">` +
    parts.map((p, i) => `<div data-tip="${esc(`<b>${esc(p.label)}</b><br>${p.value} (${Math.round((p.value / total) * 100)}%)`)}" style="flex:${p.value} 0 0;background:${p.color};transform-origin:left;animation:barRight 600ms var(--ease-out) both;animation-delay:${i * 60}ms"></div>`).join("") +
    `</div><div class="legend" style="margin-top:12px">` + parts.map((p) => `<span><i style="background:${p.color}"></i>${esc(p.label)} <strong class="num" style="color:var(--ink)">${p.value}</strong></span>`).join("") + `</div>`;
  tipper(el);
}

export function sparkline(values, { w = 120, h = 34, color = "var(--brand)" } = {}) {
  const max = Math.max(...values), min = Math.min(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / span) * (h - 6)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
  const last = pts[pts.length - 1];
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:draw 900ms var(--ease-out) forwards"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${color}"/></svg>`;
}
