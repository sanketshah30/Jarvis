import Anthropic from "@anthropic-ai/sdk";

const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const defaultTimeoutMs = Number(process.env.ANTHROPIC_TIMEOUT_MS || 45000);

export function createAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function runAgent({ client, system, prompt, label = "agent" }) {
  const startedAt = Date.now();
  console.log(`[jarvis] ${label} started`);

  const requestPromise = client.messages.create({
    model,
    max_tokens: 1000,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} timed out after ${defaultTimeoutMs}ms`));
    }, defaultTimeoutMs);
  });

  const response = await Promise.race([requestPromise, timeoutPromise]);

  const textBlock = response.content.find((block) => block.type === "text");
  console.log(`[jarvis] ${label} completed in ${Date.now() - startedAt}ms`);
  return textBlock?.text?.trim() || "";
}
