// Flat illustrations for page heads, steps, results and empty states. Colours
// come from the theme tokens so they work in light and dark. Moving parts use
// small CSS classes (.il-float, .il-blink, .il-draw…) defined in views.css,
// and all of them stop under prefers-reduced-motion.

const SKIN = "#c98b62", SKIN2 = "#a8714c", HAIR = "#2a2522";

const wrap = (body, cls = "", vb = "0 0 240 160") =>
  `<svg class="illus ${cls}" viewBox="${vb}" fill="none" aria-hidden="true">${body}</svg>`;

// A small person: head, hair, body. x/y is the top of the head.
function person(x, y, shirt, { s = 1, hair = HAIR, skin = SKIN, bun = false, dupatta = null } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-22 70c0-20 10-34 22-34s22 14 22 34Z" fill="${shirt}"/>
    ${dupatta ? `<path d="M-14 40c8 10 20 14 30 10l4 20H-6Z" fill="${dupatta}" opacity=".9"/>` : ""}
    <rect x="-5" y="24" width="10" height="12" rx="4" fill="${skin}"/>
    <circle cx="0" cy="14" r="14" fill="${skin}"/>
    <path d="M-14 13c0-10 6-15 14-15s14 5 14 15c-4-6-10-8-14-8s-10 2-14 8Z" fill="${hair}"/>
    ${bun ? `<circle cx="11" cy="2" r="6" fill="${hair}"/>` : ""}
  </g>`;
}

const sparkles = (pts) => pts.map(([x, y, c, d], i) =>
  `<path class="il-twinkle" style="animation-delay:${d ?? i * 0.4}s;transform-origin:${x}px ${y}px" d="M${x} ${y - 6}v12M${x - 6} ${y}h12" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`).join("");

const blob = (cx, cy, r, c, o = 0.14) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${o}"/>`;

export const ILLUS = {
  // Phone with a chat in Hinglish and a heart badge.
  patient: () => wrap(`
    ${blob(130, 84, 70, "var(--brand)")}
    ${blob(196, 40, 22, "var(--saffron)", 0.22)}
    <g class="il-float">
      <rect x="78" y="18" width="84" height="132" rx="16" fill="var(--ink)"/>
      <rect x="84" y="28" width="72" height="112" rx="10" fill="var(--bg-elev)"/>
      <rect x="90" y="40" width="50" height="16" rx="8" fill="var(--bg-sunk)"/>
      <rect x="96" y="46" width="34" height="4" rx="2" fill="var(--ink-3)"/>
      <rect class="il-pop" style="animation-delay:.2s" x="104" y="64" width="46" height="16" rx="8" fill="var(--brand)"/>
      <rect x="111" y="70" width="30" height="4" rx="2" fill="var(--brand-ink)" opacity=".8"/>
      <g class="il-pop" style="animation-delay:.5s">
        <rect x="90" y="88" width="40" height="16" rx="8" fill="var(--bg-sunk)"/>
        <circle class="il-dot" cx="101" cy="96" r="2.6" fill="var(--ink-3)"/>
        <circle class="il-dot" style="animation-delay:.15s" cx="110" cy="96" r="2.6" fill="var(--ink-3)"/>
        <circle class="il-dot" style="animation-delay:.3s" cx="119" cy="96" r="2.6" fill="var(--ink-3)"/>
      </g>
      <rect x="90" y="122" width="60" height="10" rx="5" fill="var(--bg-sunk)"/>
    </g>
    <g class="il-float" style="animation-delay:-1.4s">
      <circle cx="176" cy="104" r="20" fill="var(--em)"/>
      <path class="il-beat" style="transform-origin:176px 104px" d="M176 114s-10-6-10-12c0-3 2-6 5.5-6 2 0 3.6 1.2 4.5 2.6.9-1.4 2.5-2.6 4.5-2.6 3.5 0 5.5 3 5.5 6 0 6-10 12-10 12Z" fill="#fff"/>
    </g>
    <g class="il-float" style="animation-delay:-.7s">
      <rect x="34" y="70" width="40" height="40" rx="12" fill="var(--saffron)"/>
      <path d="M44 90h20M54 80v20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    </g>
    ${sparkles([[52, 40, "var(--sd-dot)"], [200, 140, "var(--brand)"], [62, 136, "var(--em)"]])}
  `, "il-patient"),

  // Reception counter, a monitor with three lane rows and a short queue.
  desk: () => wrap(`
    ${blob(120, 90, 72, "var(--saffron)", 0.13)}
    ${person(190, 52, "var(--info)", { s: 0.86 })}
    ${person(214, 62, "var(--rt-dot)", { s: 0.74, bun: true })}
    <g class="il-float">
      <rect x="54" y="22" width="104" height="70" rx="10" fill="var(--ink)"/>
      <rect x="60" y="28" width="92" height="58" rx="6" fill="var(--bg-elev)"/>
      <rect class="il-grow" x="66" y="35" width="70" height="11" rx="5.5" fill="var(--em)"/>
      <rect class="il-grow" style="animation-delay:.15s" x="66" y="51" width="56" height="11" rx="5.5" fill="var(--sd-dot)"/>
      <rect class="il-grow" style="animation-delay:.3s" x="66" y="67" width="78" height="11" rx="5.5" fill="var(--rt-dot)"/>
      <rect x="98" y="92" width="16" height="12" fill="var(--ink-3)"/>
    </g>
    <rect x="20" y="104" width="176" height="44" rx="10" fill="var(--brand)"/>
    <rect x="20" y="104" width="176" height="10" rx="5" fill="var(--brand-2)"/>
    <g transform="translate(168 96)">
      <path class="il-ring" style="transform-origin:0 8px" d="M-10 8a10 10 0 0 1 20 0Z" fill="var(--saffron)"/>
      <rect x="-12" y="8" width="24" height="3" rx="1.5" fill="var(--saffron)"/>
      <circle cx="0" cy="-3" r="2.5" fill="var(--saffron)"/>
    </g>
    <rect x="34" y="122" width="40" height="14" rx="4" fill="var(--bg-elev)" opacity=".9"/>
    <text x="54" y="132.5" text-anchor="middle" font-family="var(--mono)" font-size="9" font-weight="700" fill="var(--brand)">S-008</text>
    ${sparkles([[30, 40, "var(--brand)"], [176, 22, "var(--em)"]])}
  `, "il-desk"),

  // Clipboard being ticked, with a stethoscope.
  doctor: () => wrap(`
    ${blob(120, 84, 70, "var(--info)", 0.13)}
    <g class="il-float">
      <rect x="72" y="20" width="96" height="128" rx="12" fill="var(--bg-elev)" stroke="var(--line-2)" stroke-width="2"/>
      <rect x="98" y="12" width="44" height="18" rx="6" fill="var(--ink)"/>
      ${[48, 76, 104].map((y, i) => `
        <rect x="86" y="${y}" width="16" height="16" rx="5" fill="${["var(--rt-tint)", "var(--sd-tint)", "var(--brand-tint)"][i]}"/>
        <path class="il-draw" style="animation-delay:${0.3 + i * 0.35}s" d="M89.5 ${y + 8}l3.5 3.5 6-7" stroke="${["var(--rt)", "var(--sd)", "var(--brand)"][i]}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
        <rect x="110" y="${y + 3}" width="${[44, 36, 40][i]}" height="4" rx="2" fill="var(--ink-3)" opacity=".7"/>
        <rect x="110" y="${y + 10}" width="${[28, 32, 22][i]}" height="3.5" rx="1.75" fill="var(--line-2)"/>`).join("")}
    </g>
    <g class="il-float" style="animation-delay:-1.2s">
      <path d="M176 40v22a18 18 0 0 1-36 0" stroke="var(--brand)" stroke-width="5" stroke-linecap="round" fill="none" transform="translate(28 18)"/>
      <circle cx="186" cy="114" r="14" fill="var(--brand)"/>
      <circle cx="186" cy="114" r="7" fill="var(--brand-tint)"/>
      <path d="M186 80v20" stroke="var(--brand)" stroke-width="5" stroke-linecap="round"/>
    </g>
    <path class="il-ecg" d="M14 128h22l6-14 8 28 6-20 5 6h26" stroke="var(--em)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
    ${sparkles([[40, 40, "var(--saffron)"], [214, 30, "var(--brand)"]])}
  `, "il-doctor"),

  // Dashboard card with growing bars and a rising line.
  dashboard: () => wrap(`
    ${blob(122, 86, 70, "var(--em)", 0.1)}
    <g class="il-float">
      <rect x="40" y="26" width="160" height="112" rx="14" fill="var(--bg-elev)" stroke="var(--line-2)" stroke-width="2"/>
      <rect x="54" y="38" width="48" height="6" rx="3" fill="var(--ink-3)"/>
      ${[[62, 50, "var(--rt-dot)"], [84, 34, "var(--sd-dot)"], [106, 62, "var(--rt-dot)"], [128, 44, "var(--sd-dot)"], [150, 72, "var(--brand)"], [172, 56, "var(--rt-dot)"]].map(([x, h, c], i) =>
        `<rect class="il-bar" style="animation-delay:${i * 0.08}s;transform-origin:${x + 7}px 128px" x="${x}" y="${128 - h}" width="14" height="${h}" rx="4" fill="${c}"/>`).join("")}
      <path class="il-draw" style="animation-delay:.5s" d="M62 96l22-14 22 8 22-22 22 6 22-24" stroke="var(--em)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle class="il-pop" style="animation-delay:1.2s" cx="194" cy="50" r="5" fill="var(--em)"/>
    </g>
    <g class="il-float" style="animation-delay:-1s">
      <circle cx="40" cy="44" r="20" fill="var(--saffron)"/>
      <path d="M40 34v20M32 46l8 8 8-8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 40 44)"/>
    </g>
    ${sparkles([[214, 140, "var(--brand)"], [22, 120, "var(--em)"]])}
  `, "il-dash"),

  // Step 1: a person and a family.
  who: () => wrap(`
    ${blob(120, 92, 60, "var(--brand)", 0.13)}
    ${person(84, 40, "var(--brand)", { s: 1.05 })}
    ${person(146, 46, "var(--saffron)", { s: 0.95, bun: true, dupatta: "var(--em)" })}
    ${person(118, 84, "var(--info)", { s: 0.62 })}
    ${sparkles([[50, 50, "var(--sd-dot)"], [190, 40, "var(--brand)"]])}
  `, "il-step", "0 0 240 150"),

  // Step 2: pills and a health card.
  history: () => wrap(`
    ${blob(120, 84, 60, "var(--info)", 0.13)}
    <g class="il-float">
      <rect x="64" y="34" width="76" height="96" rx="10" fill="var(--bg-elev)" stroke="var(--line-2)" stroke-width="2"/>
      <rect x="64" y="34" width="76" height="22" rx="10" fill="var(--info)"/>
      <path d="M98 40v10M93 45h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      ${[66, 82, 98].map((y, i) => `<circle cx="78" cy="${y + 2}" r="4" fill="${["var(--rt-dot)", "var(--sd-dot)", "var(--em)"][i]}"/><rect x="88" y="${y}" width="${[38, 30, 34][i]}" height="4" rx="2" fill="var(--ink-3)" opacity=".7"/>`).join("")}
    </g>
    <g class="il-float" style="animation-delay:-1.1s">
      <rect x="146" y="70" width="40" height="56" rx="8" fill="var(--saffron)"/>
      <rect x="142" y="60" width="48" height="14" rx="5" fill="var(--ink)"/>
      <rect x="152" y="88" width="28" height="18" rx="3" fill="#fff" opacity=".9"/>
    </g>
    <g class="il-spin" style="transform-origin:186px 40px">
      <rect x="170" y="33" width="32" height="14" rx="7" fill="var(--brand)"/>
      <rect x="186" y="33" width="16" height="14" rx="7" fill="var(--rt-dot)"/>
    </g>
    ${sparkles([[44, 52, "var(--em)"], [52, 124, "var(--brand)"]])}
  `, "il-step", "0 0 240 150"),

  // Step 3: a speech bubble with a mic and sound waves.
  problem: () => wrap(`
    ${blob(120, 84, 60, "var(--saffron)", 0.14)}
    <g class="il-float">
      <path d="M58 34h112a14 14 0 0 1 14 14v42a14 14 0 0 1-14 14H98l-20 18v-18H58a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14Z" fill="var(--bg-elev)" stroke="var(--line-2)" stroke-width="2"/>
      <rect x="62" y="52" width="80" height="6" rx="3" fill="var(--ink-3)" opacity=".75"/>
      <rect x="62" y="66" width="104" height="6" rx="3" fill="var(--line-2)"/>
      <rect x="62" y="80" width="60" height="6" rx="3" fill="var(--line-2)"/>
    </g>
    <g transform="translate(190 108)">
      ${[22, 32].map((r, i) => `<circle class="il-wave" style="animation-delay:${i * 0.5}s" r="${r}" stroke="var(--brand)" stroke-width="2.4"/>`).join("")}
      <circle r="16" fill="var(--brand)"/>
      <rect x="-4.5" y="-9" width="9" height="13" rx="4.5" fill="#fff"/>
      <path d="M-7.5 1a7.5 7.5 0 0 0 15 0M0 8.5v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </g>
    ${sparkles([[30, 40, "var(--sd-dot)"], [206, 30, "var(--em)"]])}
  `, "il-step", "0 0 240 150"),

  // Emergency: ambulance with a flashing light on a moving road.
  ambulance: () => wrap(`
    <g class="il-road"><path d="M0 132h240" stroke="var(--line-2)" stroke-width="3" stroke-dasharray="18 14" stroke-linecap="round"/></g>
    <g class="il-drive">
      <path d="M40 60h96v62H40a6 6 0 0 1-6-6V66a6 6 0 0 1 6-6Z" fill="#fff" stroke="var(--line-2)" stroke-width="2"/>
      <path d="M136 76h34l24 24v16a6 6 0 0 1-6 6h-52Z" fill="#fff" stroke="var(--line-2)" stroke-width="2"/>
      <path d="M142 82h26l18 18h-44Z" fill="var(--info-tint)"/>
      <rect x="34" y="96" width="160" height="8" fill="var(--em)"/>
      <path d="M78 70v20M68 80h20" stroke="var(--em)" stroke-width="6" stroke-linecap="round"/>
      <rect class="il-siren" x="82" y="48" width="18" height="12" rx="4" fill="var(--em)"/>
      <rect class="il-siren b" x="100" y="48" width="18" height="12" rx="4" fill="var(--info)"/>
      <circle cx="68" cy="124" r="13" fill="var(--ink)"/><circle cx="68" cy="124" r="5" fill="var(--line-2)"/>
      <circle cx="164" cy="124" r="13" fill="var(--ink)"/><circle cx="164" cy="124" r="5" fill="var(--line-2)"/>
      <text x="96" y="114" text-anchor="middle" font-family="var(--font)" font-size="9" font-weight="800" fill="#fff">108</text>
    </g>
    <g class="il-sound"><path d="M210 52a16 16 0 0 1 0 22M220 44a28 28 0 0 1 0 38" stroke="var(--em)" stroke-width="3" stroke-linecap="round"/></g>
  `, "il-amb", "0 0 240 150"),

  // All caught up: a cup of chai with steam.
  chai: () => wrap(`
    ${blob(120, 92, 54, "var(--saffron)", 0.16)}
    ${[100, 120, 140].map((x, i) => `<path class="il-steam" style="animation-delay:${i * 0.4}s" d="M${x} 66c-6-8 6-12 0-20s6-12 0-20" stroke="var(--ink-3)" stroke-width="3" stroke-linecap="round" opacity=".6"/>`).join("")}
    <path d="M84 72h72l-8 50a10 10 0 0 1-10 8H102a10 10 0 0 1-10-8Z" fill="var(--bg-elev)" stroke="var(--line-2)" stroke-width="2"/>
    <path d="M86 80h68" stroke="var(--saffron)" stroke-width="6" stroke-linecap="round" opacity=".55"/>
    <path d="M154 86h8a10 10 0 0 1 0 20h-11" stroke="var(--line-2)" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="120" cy="136" rx="52" ry="6" fill="var(--ink)" opacity=".08"/>
    ${sparkles([[60, 50, "var(--brand)"], [184, 46, "var(--rt-dot)"]])}
  `, "il-empty", "0 0 240 150"),

  // About: a shield with a tick.
  shield: () => wrap(`
    ${blob(120, 84, 66, "var(--brand)", 0.14)}
    <g class="il-float">
      <path d="M120 22 74 38v36c0 30 20 50 46 56 26-6 46-26 46-56V38Z" fill="var(--brand)"/>
      <path d="M120 34 86 46v28c0 22 14 38 34 44Z" fill="#fff" opacity=".14"/>
      <path class="il-draw" style="animation-delay:.3s" d="M100 76l14 14 26-28" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
    </g>
    <circle class="il-pop" style="animation-delay:.6s" cx="182" cy="48" r="12" fill="var(--saffron)"/>
    <circle class="il-pop" style="animation-delay:.8s" cx="58" cy="116" r="9" fill="var(--rt-dot)"/>
    ${sparkles([[50, 44, "var(--em)"], [192, 120, "var(--brand)"]])}
  `, "il-shield")
};

// A short confetti burst from an element (token created). Small, quick, and
// skipped under reduced motion.
export function confetti(from) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !from) return;
  const r = from.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "confetti";
  const colors = ["var(--brand)", "var(--saffron)", "var(--rt-dot)", "var(--sd-dot)", "var(--info)", "var(--em)"];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("i");
    const a = (Math.PI * 2 * i) / 28 + Math.random() * 0.3, d = 70 + Math.random() * 90;
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${colors[i % colors.length]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 40}px;--r:${Math.random() * 540 - 270}deg;animation-delay:${Math.random() * 60}ms;${i % 3 === 0 ? "border-radius:50%;" : ""}`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1200);
}
