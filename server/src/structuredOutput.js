function stripCodeFences(text) {
  if (!text) return "";
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseStructuredOutput(rawText) {
  const cleaned = stripCodeFences(rawText);
  const parsed = safeJsonParse(cleaned);

  if (!parsed || typeof parsed !== "object") {
    return {
      summary: (rawText || "").trim(),
      actions: []
    };
  }

  const summary =
    typeof parsed.summary === "string"
      ? parsed.summary.trim()
      : typeof parsed.final_response === "string"
        ? parsed.final_response.trim()
        : (rawText || "").trim();

  const actions = Array.isArray(parsed.actions) ? parsed.actions.filter(Boolean) : [];

  return { summary, actions };
}

export function extractActions(rawText) {
  return parseStructuredOutput(rawText).actions;
}

export function extractSummary(rawText) {
  return parseStructuredOutput(rawText).summary;
}

export const STRUCTURED_RESPONSE_INSTRUCTION = `
Return ONLY valid JSON with this exact shape:
{
  "summary": "concise response text",
  "actions": [
    {
      "type": "http_request" | "emit_event" | "sleep",
      "method": "GET|POST|PUT|PATCH|DELETE (http_request only)",
      "url": "https://... (http_request only)",
      "headers": { "key": "value" },
      "body": {},
      "event": "event_name (emit_event only)",
      "payload": {},
      "ms": 1000
    }
  ]
}

Rules:
- "summary" is mandatory and should contain your final useful answer for this step.
- "actions" can be empty if no action is needed.
- Do not include markdown fences, prose outside JSON, or additional keys.
`.trim();
