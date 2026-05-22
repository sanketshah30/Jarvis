function sleep(ms) {
  const delay = Number(ms);
  if (!Number.isFinite(delay) || delay < 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, Math.min(delay, 30_000)));
}

async function runHttpRequest(action) {
  const method = (action.method || "GET").toUpperCase();
  const url = action.url?.trim();
  if (!url) {
    return { ok: false, error: "http_request missing url" };
  }

  const headers = { ...(action.headers || {}) };
  const init = { method, headers };

  if (action.body != null && method !== "GET" && method !== "HEAD") {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    init.body =
      typeof action.body === "string" ? action.body : JSON.stringify(action.body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    // keep raw text
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

async function runEmitEvent(action, context) {
  const event = action.event || "agent_event";
  const payload = action.payload ?? {};
  console.log(`[jarvis:action] emit_event ${event}`, {
    agentId: context?.agentId,
    stage: context?.stage
  });
  return { ok: true, event, payload };
}

async function runAction(action, context) {
  if (!action || typeof action !== "object" || !action.type) {
    return { ok: false, error: "invalid action" };
  }

  try {
    switch (action.type) {
      case "http_request":
        return { type: action.type, ...(await runHttpRequest(action)) };
      case "emit_event":
        return { type: action.type, ...(await runEmitEvent(action, context)) };
      case "sleep":
        await sleep(action.ms);
        return { type: action.type, ok: true, ms: action.ms };
      default:
        return { type: action.type, ok: false, error: `unknown action type: ${action.type}` };
    }
  } catch (error) {
    return {
      type: action.type,
      ok: false,
      error: error.message || "action failed"
    };
  }
}

export async function executeActions(actions = [], context = {}) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [];
  }

  const results = [];
  for (const action of actions) {
    results.push(await runAction(action, context));
  }
  return results;
}
