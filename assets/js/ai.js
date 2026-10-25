// Optional AI second opinion. The rule engine always runs first; this is only
// asked afterwards, and its answer can only raise a lane (engine combine()).
// Two providers: Google Gemini (free key from Google AI Studio) or Anthropic
// Claude. The key is pasted in Settings and kept only in this browser's
// localStorage; it is never in the repo and is sent only to that provider.

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.132.1/+esm";
const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

export const PROVIDERS = {
  gemini: { label: "Google Gemini (free key)", models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"], keyHint: "AIza…", keyUrl: "https://aistudio.google.com/app/apikey" },
  claude: { label: "Anthropic Claude", models: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"], keyHint: "sk-ant-…", keyUrl: "https://console.anthropic.com/settings/keys" }
};

const keyName = (p) => `sanket.key.${p}`;
export function getKey(provider) { try { return localStorage.getItem(keyName(provider)) || ""; } catch (e) { return ""; } }
export function setKey(provider, k) { try { k ? localStorage.setItem(keyName(provider), k) : localStorage.removeItem(keyName(provider)); } catch (e) { /* ignore */ } }
export const hasKey = (provider) => !!getKey(provider);

const SCHEMA = {
  type: "object",
  properties: {
    level: { type: "string", enum: ["EMERGENCY", "SAME_DAY", "ROUTINE"] },
    unclear: { type: "boolean" },
    phrases: { type: "array", items: { type: "string" } },
    reason: { type: "string" }
  },
  required: ["level", "unclear", "phrases", "reason"],
  additionalProperties: false
};

let claudePromise = null;
async function askClaude(apiKey, model, prompt) {
  if (!claudePromise) claudePromise = import(SDK_URL).then((m) => m.default || m.Anthropic);
  const Anthropic = await claudePromise;
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 20000 });
  const res = await anthropic.beta.messages.create({
    model,
    max_tokens: 1024,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: prompt }]
  });
  if (res.stop_reason === "refusal") return "";
  return (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function askGemini(apiKey, model, prompt) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(GEMINI_URL(model), {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" }
      })
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    return parts.map((p) => p.text || "").join("");
  } finally {
    clearTimeout(timer);
  }
}

// Returns {ai, failed, skipped}. Never throws. skipped = no key, nothing asked.
export async function aiCheck(request, ruleResult, settings = {}) {
  const provider = PROVIDERS[settings.provider] ? settings.provider : "gemini";
  const apiKey = getKey(provider);
  if (!apiKey) return { ai: null, failed: false, skipped: true };
  const model = PROVIDERS[provider].models.includes(settings.model) ? settings.model : PROVIDERS[provider].models[0];
  try {
    const req = { description: request.description, age: request.age, history: request.pmh || {} };
    const prompt = window.TriageEngine.aiPrompt(req, ruleResult.framingGuard ? ruleResult.framingGuard.guardedText : request.description);
    const text = provider === "claude" ? await askClaude(apiKey, model, prompt) : await askGemini(apiKey, model, prompt);
    const parsed = window.TriageEngine.parseAiReply(text);
    if (!parsed) return { ai: null, failed: true };
    parsed.provider = `${provider === "claude" ? "Claude" : "Gemini"} (${model})`;
    return { ai: parsed, failed: false };
  } catch (e) {
    console.warn("AI second opinion failed", e);
    return { ai: null, failed: true };
  }
}
