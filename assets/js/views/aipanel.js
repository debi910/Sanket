// "Second opinion" panel shared by the front desk drawer and the doctor view.
// The rules have already decided; pressing Ask AI asks the chosen model once.
// Its lane is shown beside the rules lane, and engine combine() lets it only
// raise the lane, never lower it.
import { esc, icon, laneChip, LANE } from "../ui.js";
import * as store from "../store.js";
import { aiCheck, hasKey } from "../ai.js";
import { openSettings } from "./settings.js";

export function aiPanelHtml(r) {
  const a = r.result.ai;
  const keyed = hasKey(store.settings().provider || "gemini");
  let body;
  if (!a) {
    body = `<p class="muted">The rules have decided. Ask an AI model to read the request again. It can only raise the lane.</p>
      <div class="ai-act">${keyed ? `<button class="btn" data-ask>${icon("spark")} Ask AI</button>` : `<button class="btn" data-keyset>${icon("key")} Add an AI key</button>`}</div>`;
  } else if (a.failed) {
    body = `<div class="ai-out warn"><b>AI unavailable.</b> <span>${r.result.reasons.some((x) => x.ruleId === "F6") ? "Not booked as routine without a person looking." : `Rules result kept: ${esc(LANE[r.result.category].short.toLowerCase())}.`}</span></div>
      <div class="ai-act"><button class="btn ghost sm" data-ask>${icon("refresh")} Try again</button></div>`;
  } else {
    const verdict = a.escalated ? `Raised the lane to ${LANE[a.level].short.toLowerCase()}`
      : a.lowerIgnored ? `Suggested a lower lane, ignored. Rules keep ${LANE[r.result.category].short.toLowerCase()}`
      : "Agrees with the rules";
    body = `<div class="ai-out ${a.escalated ? "up" : a.lowerIgnored ? "low" : "ok"} ${a.level === "EMERGENCY" ? "em" : ""}">
        <div class="ai-top">${laneChip(a.level)}<b>${esc(verdict)}</b></div>
        ${a.reason ? `<p>“${esc(a.reason)}”</p>` : ""}
        <span class="muted ai-by">${esc(a.provider || "AI")}</span>
      </div>`;
  }
  return `<section class="sect ai-panel"><h4>${icon("spark")}AI second opinion</h4>${body}</section>`;
}

// Wire the panel inside `root`. `repaint` is called once the answer is stored.
export function bindAiPanel(root, r, repaint) {
  root.querySelector("[data-keyset]")?.addEventListener("click", () => openSettings(repaint));
  root.querySelector("[data-ask]")?.addEventListener("click", async (e) => {
    const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spinner"></span> Asking`;
    const { ai, failed, skipped } = await aiCheck(r, r.result, store.settings());
    if (skipped) { openSettings(repaint); b.disabled = false; b.innerHTML = `${icon("spark")} Ask AI`; return; }
    store.applyAi(r.id, ai, failed);
    repaint();
  });
}
