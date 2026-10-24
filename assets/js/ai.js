// Optional AI second reader (Claude). Off by default. Staff can switch it on
// in Settings with their own API key, which is kept only in this tab's
// sessionStorage. The rules have already run and shown any emergency
// guidance before this is called, and the result can only raise a lane.

const KEY_STORE = "sanket.apiKey";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.132.1/+esm";

export function getKey() { try { return sessionStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }
export function setKey(k) { try { k ? sessionStorage.setItem(KEY_STORE, k) : sessionStorage.removeItem(KEY_STORE); } catch (e) { /* ignore */ } }

const SCHEMA = {
  type: "object",
  properties: {
    level: { type: "string", enum: ["EMERGENCY", "SAME_DAY", "ROUTINE"] },
    unclear: { type: "boolean" },
    phrases: { type: "array", items: { type: "string" } }
  },
  required: ["level", "unclear", "phrases"],
  additionalProperties: false
};

let clientPromise = null;
async function client(apiKey) {
  if (!clientPromise) clientPromise = import(SDK_URL).then((m) => m.default || m.Anthropic);
  const Anthropic = await clientPromise;
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 20000 });
}

// Returns {ai, failed}. Never throws.
export async function aiCheck(request, ruleResult, model = "claude-opus-5-5") {
  const apiKey = getKey();
  if (!apiKey) return { ai: null, failed: false, skipped: true };
  try {
    const anthropic = await client(apiKey);
    const req = { description: request.description, age: request.age, history: request.pmh || {} };
    const prompt = window.TriageEngine.aiPrompt(req, ruleResult.framingGuard ? ruleResult.framingGuard.guardedText : request.description);
    const res = await anthropic.beta.messages.create({
      model,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: prompt }]
    });
    if (res.stop_reason === "refusal") return { ai: null, failed: true };
    const text = (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const parsed = JSON.parse(text);
    if (!parsed || !["EMERGENCY", "SAME_DAY", "ROUTINE"].includes(parsed.level)) return { ai: null, failed: true };
    return { ai: parsed, failed: false };
  } catch (e) {
    console.warn("AI check failed", e);
    return { ai: null, failed: true };
  }
}
