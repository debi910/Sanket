// Settings: AI second opinion provider and key, and demo reset. Shared by the
// dashboard, front desk and doctor windows.
import { esc, icon, toast, modal, segmented } from "../ui.js";
import * as store from "../store.js";
import { PROVIDERS, getStoredKey, setKey, hasBuiltInKey } from "../ai.js";

export function openSettings(onSaved) {
  const st = store.settings();
  let provider = PROVIDERS[st.provider] ? st.provider : "gemini";
  const m = modal(`
    <h2 style="font-size:20px">Settings</h2>
    <p class="muted" style="margin:4px 0 18px">Saved in this browser only.</p>
    <div class="grid" style="gap:16px">
      <div class="field"><label>AI second opinion</label>
        <div class="seg" role="group" aria-label="AI provider" data-provider>${Object.entries(PROVIDERS).map(([k, p]) => `<button data-value="${k}" aria-pressed="${k === provider}">${esc(p.label)}</button>`).join("")}</div>
        <span class="hint">The rules always decide first. The AI is asked only when you press "Ask AI", and it can only raise a lane, never lower it.</span></div>
      <div class="field"><label data-keylabel>API key</label><input class="input" type="password" autocomplete="off" spellcheck="false" data-key>
        <span class="hint" data-keyhint></span></div>
      <div class="field"><label>Model</label><select class="input select" data-model></select></div>
      <label class="check"><input type="checkbox" data-ai ${st.ai ? "checked" : ""}><span><strong>Also check new patient requests automatically</strong><span>Off by default. When on, the patient window asks the AI after the rules, in the background.</span></span></label>
      <hr class="divider" style="margin:4px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="muted" style="font-size:13px">Reset the synthetic queue and decision log for a fresh demo.</span>
        <button class="btn" data-reset>${icon("refresh")} Reset demo data</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>Save</button></div>`, { label: "Settings" });
  const el = m.el;
  const keys = { gemini: getStoredKey("gemini"), claude: getStoredKey("claude") };
  const keyIn = el.querySelector("[data-key]"), modelSel = el.querySelector("[data-model]");
  const paint = () => {
    const p = PROVIDERS[provider];
    keyIn.value = keys[provider]; keyIn.placeholder = hasBuiltInKey(provider) ? "Built-in demo key in use" : p.keyHint;
    el.querySelector("[data-keylabel]").textContent = `${provider === "gemini" ? "Gemini" : "Claude"} API key`;
    el.querySelector("[data-keyhint]").innerHTML = `Get one at <a href="${p.keyUrl}" target="_blank" rel="noopener">${esc(p.keyUrl.replace("https://", ""))}</a>. Kept only in this browser and sent only to ${provider === "gemini" ? "Google" : "Anthropic"}. For a real clinic, this call belongs on a server.`;
    modelSel.innerHTML = p.models.map((x) => `<option ${x === st.model ? "selected" : ""}>${x}</option>`).join("");
  };
  segmented(el.querySelector("[data-provider]"), (v) => { keys[provider] = keyIn.value.trim(); provider = v; paint(); });
  paint();
  el.querySelector("[data-save]").addEventListener("click", () => {
    keys[provider] = keyIn.value.trim();
    setKey("gemini", keys.gemini); setKey("claude", keys.claude);
    store.settings({ provider, model: modelSel.value, ai: el.querySelector("[data-ai]").checked });
    m.close(); toast("Settings saved");
    if (onSaved) onSaved();
  });
  el.querySelector("[data-reset]").addEventListener("click", () => { store.reset(); m.close(); toast("Demo data reset"); location.reload(); });
}
