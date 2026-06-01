function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function executeHttpRequest(action) {
  const method = (action.method || "POST").toUpperCase();
  const url = action.url || "";
  if (!isHttpUrl(url)) {
    throw new Error(`Invalid URL for http_request action: ${url}`);
  }

  const headers = { "Content-Type": "application/json", ...(action.headers || {}) };
  const options = { method, headers };
  if (!["GET", "HEAD"].includes(method)) {
    options.body = JSON.stringify(action.body || {});
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return {
    ok: response.ok,
    status: response.status,
    body
  };
}

async function executeSleep(action) {
  const ms = Math.max(0, Number(action.ms || 0));
  await new Promise((resolve) => setTimeout(resolve, ms));
  return { ok: true, slept_ms: ms };
}

async function executeEmitEvent(action, context) {
  // Hook for internal event bus integrations.
  // For now we just return structured metadata and log it.
  const event = action.event || "unknown_event";
  console.log(`[jarvis][action] emit_event -> ${event}`);
  return {
    ok: true,
    event,
    payload: action.payload || {},
    context: {
      agentId: context.agentId,
      role: context.role
    }
  };
}

export async function executeActions(actions, context = {}) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [];
  }

  const tasks = actions.map(async (action, index) => {
    const type = action?.type;
    try {
      if (type === "http_request") {
        const result = await executeHttpRequest(action);
        return { index, type, status: "fulfilled", result };
      }
      if (type === "sleep") {
        const result = await executeSleep(action);
        return { index, type, status: "fulfilled", result };
      }
      if (type === "emit_event") {
        const result = await executeEmitEvent(action, context);
        return { index, type, status: "fulfilled", result };
      }
      return {
        index,
        type: type || "unknown",
        status: "rejected",
        error: `Unsupported action type: ${type || "undefined"}`
      };
    } catch (error) {
      return {
        index,
        type: type || "unknown",
        status: "rejected",
        error: error?.message || "Action execution failed"
      };
    }
  });

  const results = await Promise.all(tasks);
  return results;
}
