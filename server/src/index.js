import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { executeMission, getOrganization } from "./orchestrator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jarvisRootEnvPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: jarvisRootEnvPath });

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[http] ${req.method} ${req.url} started`);
  res.on("finish", () => {
    console.log(
      `[http] ${req.method} ${req.url} ${res.statusCode} in ${Date.now() - startedAt}ms`
    );
  });
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "jarvis-server",
    anthropic_key_loaded: Boolean(process.env.ANTHROPIC_API_KEY),
  });
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
    if (!mission) {
      return res.status(400).json({ error: "mission is required" });
    }
    const result = await executeMission(mission);
    return res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Mission execution failed" });
  }
});

app.listen(port, () => {
  console.log(`Jarvis server running on http://localhost:${port}`);
  console.log(
    `[jarvis] ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? "loaded" : "missing"}`
  );
});
