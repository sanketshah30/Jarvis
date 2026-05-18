# Jarvis Portal (React + Node + Anthropic)

Full-stack multi-agent portal: React UI, Express API, and Anthropic orchestration (CEO → C-suite → specialists, including CFO branch).

## Run

1. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`
2. From the project root:

```bash
npm install
npm run dev
```

3. Open http://localhost:5173 (API on http://localhost:4000)

## Structure

- `client/` — React portal (Vite)
- `server/` — Express API
- `config/` — org chart + routing rules
- `prompts/` — agent system prompts

## API

- `GET /api/health` — server health
- `GET /api/org` — organization config
- `POST /api/mission` — run mission orchestration

## Legacy n8n workflow

The original n8n + Gemini workflow files are kept for reference:

- `Jarvis.json` — n8n workflow export
- `voice_trigger.html` — voice trigger page for the n8n webhook
