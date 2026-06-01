import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { executeMission, executeMissionStreaming, getOrganization } from "./orchestrator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jarvisRootEnvPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: jarvisRootEnvPath });

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5174";
const cancelledSessions = new Set();

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[http] ${req.method} ${req.url} started`);
  res.on("finish", () => {
    console.log(`[http] ${req.method} ${req.url} ${res.statusCode} in ${Date.now() - startedAt}ms`);
  });
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "jarvis-server" });
});

app.get("/api/org", async (_req, res) => {
  try {
    const org = await getOrganization();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load org config" });
  }
});

app.post("/api/mission", async (req, res) => {
  try {
    const mission = req.body?.mission?.trim();
    const memory = req.body?.memory?.toString() || "";
    if (!mission) {
      return res.status(400).json({ error: "mission is required" });
    }
    const result = await executeMission(mission, memory);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Mission execution failed" });
  }
});

async function streamMissionHandler(req, res, mission, memory, sessionId) {
  if (!mission) {
    return res.status(400).json({ error: "mission is required" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await executeMissionStreaming(
      mission,
      sendEvent,
      memory,
      () => cancelledSessions.has(sessionId)
    );
    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    if (error.message === "MISSION_CANCELLED") {
      sendEvent({ type: "mission_cancelled", sessionId });
    } else {
      sendEvent({
        type: "mission_failed",
        error: error.message || "Mission execution failed"
      });
    }
    res.end();
  } finally {
    cancelledSessions.delete(sessionId);
  }
}

app.post("/api/mission/stream", async (req, res) => {
  const mission = req.body?.mission?.toString().trim();
  const memory = req.body?.memory?.toString() || "";
  const sessionId = req.body?.sessionId?.toString() || `anon-${Date.now()}`;
  return streamMissionHandler(req, res, mission, memory, sessionId);
});

app.post("/api/mission/cancel", (req, res) => {
  const sessionId = req.body?.sessionId?.toString();
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  cancelledSessions.add(sessionId);
  return res.json({ ok: true, sessionId });
});

app.listen(port, () => {
  console.log(`Jarvis server running on http://localhost:${port}`);
});
