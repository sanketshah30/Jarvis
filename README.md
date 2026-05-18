# Jarvis Portal (React + Node + Anthropic)

Full-stack multi-agent portal: React UI, Express API, Anthropic orchestration (CEO → C-suite → specialists, including CFO branch).

## Run

1. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`
2. From `jarvis/`:

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
