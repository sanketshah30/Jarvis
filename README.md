# Jarvis — AI Agent Organisation (n8n)

An 8-agent hierarchical AI organisation built on n8n, powered by Google Gemini. 
Accepts a natural language mission via webhook or voice, routes it through a 
CEO agent, delegates to C-suite agents, and returns a fully aggregated 
multi-department response.

## Architecture

Webhook / Voice → CEO Agent (Alex Prime)

            ↓

┌───────────┼───────────┐

CTO Agent    COO Agent   CMO Agent

(Nova Circuit) (Sage Ops) (Luna Reach)

    ↓            ↓          ↓

Eng + Data      Sales    Content + Growth
Agent        Agent      Agents

└───────────┼───────────┘

Merge

↓

CEO Aggregator

↓


Final Response

## Agents

| Agent | Role |
|---|---|
| Alex Prime (CEO) | Orchestrates mission, routes to C-suite |
| Nova Circuit (CTO) | Tech strategy, delegates engineering + data |
| Sage Ops (COO) | Operations, delegates to sales/CRM |
| Luna Reach (CMO) | Marketing strategy, delegates content + growth |
| Volt Build (Engineering) | Code, architecture, Jira tickets |
| Iris Analytics (Data) | KPIs, dashboards, data pipelines |
| Rex Pipeline (Sales) | CRM updates, outreach drafts |
| Pixel Story (Content) | Blog posts, SEO copy |
| Flux Growth (Growth) | Ad copy, targeting, ROAS tracking |

## Features

- Voice-activated trigger via browser mic → Whisper transcription
- Text webhook trigger for direct API/Postman use
- Conditional routing — agents only fire when their task is present
- Merge node aggregates all IC agent outputs before responding
- Gemini markdown fence stripping for reliable JSON parsing
- Single consolidated JSON response with all department outputs

## Stack

- **Workflow engine:** n8n (self-hosted)
- **LLM:** Google Gemini 2.5 Flash Lite
- **Voice transcription:** OpenAI Whisper
- **Trigger:** Webhook (POST) + Voice (multipart/form-data)

## Setup

1. Import `Jarvis_v3.json` into your n8n instance
2. Add your Google Gemini API credential (googlePalmApi)
3. Add your OpenAI API credential for Whisper (voice trigger only)
4. Activate the workflow
5. POST to `/webhook/ai-org-trigger` with `{ "mission": "your task here" }`

## Example Request

```json
POST /webhook/ai-org-trigger
Content-Type: application/json

{
  "mission": "Launch a new device protection plan for Samsung India. 
  Build the claims API, set up activation tracking dashboards, 
  prepare retail partner outreach, and create launch content for 
  Google and Meta ads."
}
```

## Example Response

```json
{
  "outputs": {
    "engineering": "**Code/Architecture:** REST API with...",
    "data": "**Analysis Plan:** Activation funnel...",
    "sales": "**Outreach Draft:** Dear Partner...",
    "content": "**Content:** Samsung India Protection...",
    "growth": "**Ad Copy Variants:** Headline 1..."
  },
  "agents_responded": 5,
  "timestamp": "2026-05-05T..."
}
```

## Credits

Built with n8n + Google Gemini. Inspired by multi-agent orchestration 
patterns for enterprise workflow automation.
