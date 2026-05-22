# Jarvis Portal (React + Node + Anthropic)

Jarvis is now a full-stack portal with:
- React frontend for mission submission and result viewing
- Node/Express backend for hierarchical AI orchestration
- Anthropic-powered CEO -> C-suite -> specialist flow
- Finance branch with CFO and subordinates (FP&A, Accounting, Treasury)

## Architecture

User Mission -> React UI -> Node API (`/api/mission`) -> Anthropic Agents

Hierarchy:
- CEO: Alex Prime
- C-Suite: CTO, COO, CMO, CFO
- Specialists:
  - CTO -> Engineering, Data
  - COO -> Sales
  - CMO -> Content, Growth
  - CFO -> FP&A, Accounting, Treasury

## Project Structure

```text
jarvis/
  client/                    # React portal (Vite)
  server/                    # Node/Express API
  config/
    agents.json              # Org chart and prompt mapping
    routing-rules.json       # Mission keyword routing
  prompts/
    ceo.md
    executives/
    specialists/
  .env.example
  package.json               # Workspaces + run scripts
```

## Prerequisites

- Node.js 18+
- Anthropic API key

## Setup

1. Copy `.env.example` to `.env`
2. Fill `ANTHROPIC_API_KEY`
3. Install dependencies:

```bash
npm install
```

4. Run frontend + backend:

```bash
npm run dev
```

5. Open `http://localhost:5173`

Backend runs on `http://localhost:4000`.

## API Endpoints

- `GET /api/health` -> server health
- `GET /api/org` -> organization config
- `POST /api/mission` -> run mission orchestration

Request body:

```json
{
  "mission": "Launch a new device protection plan with engineering, growth, and finance support."
}
```

## Notes

- Routing to executives is keyword-based via `config/routing-rules.json`.
- If no keyword matches, all executives are engaged.
- Anthropic model used by server: `claude-sonnet-4-5`.
