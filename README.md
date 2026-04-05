# 🌸 SakurAI

A self-hosted AI chat agent that blooms on your website. Upload your documents, embed a lightweight chat widget, and let SakurAI answer your visitors' questions — grounded in your own content, powered by RAG.

## Why SakurAI?

Drop a single `<script>` tag into any site and you get a polished AI assistant that actually knows your stuff. No third-party SaaS, no per-seat pricing — just your server, your data, your agent.

## Features

- **Knowledge Base (RAG)** — Upload PDFs or paste text. SakurAI uses vector embeddings to find relevant context before answering.
- **Embeddable Widget** — One `<script>` tag on any website — WordPress, Shopify, plain HTML, anything.
- **Admin Dashboard** — Configure your agent's personality, appearance, knowledge base, and tools from a clean web UI.
- **Conversation Memory** — Chat sessions persist across page reloads with automatic conversation summaries.
- **Custom Tools** — Give your agent the ability to call APIs, query databases, or perform actions. See [TOOLS.md](TOOLS.md) for details.
- **Zero Configuration** — `docker-compose up -d` and you're live. Default admin credentials are created on first boot.
- **Multi-Tenant Ready** — Run multiple distinct agents with separate knowledge bases from a single deployment.

## Quick Start

You only need Docker and a free Google Gemini API Key.

```bash
git clone https://github.com/Jergasus/saas_agents.git && cd saas_agents
cp .env.example .env
# Set your GEMINI_API_KEY in .env
docker-compose up -d --build
```

Open **http://localhost** and log in with `admin@localhost` / `admin123`.

*Change these credentials right away via the **Account** tab in the dashboard!*

## Local Testing

You don't need a VPS to try things out. Run SakurAI locally with Docker Compose alongside your own project.

From the admin dashboard at `http://localhost`, go to **Install**, copy the widget snippet, and drop it into your HTML:

```html
<script src="http://localhost/widget/widget.js"></script>
<ai-chat-widget api-key="YOUR_API_KEY" api-url="http://localhost:3000"></ai-chat-widget>
```

## Production Deployment

SakurAI is designed to run on a single VPS. See [DEPLOY.md](DEPLOY.md) for HTTPS setup, credential management, CORS configuration, and MongoDB Atlas migration.

## How It Works

```
Your visitor's browser               Your server (one VPS)
┌─────────────┐                  ┌─────────────────────────┐
│  <script>   │ ──── loads ────▶ │ Nginx (:80)             │
│  widget.js  │                  │  ├── Admin dashboard     │
│             │                  │  └── widget.js           │
│  User types │                  │                          │
│  a message  │ ── API call ──▶  │ NestJS API (:3000)       │
│             │                  │  ├── RAG vector search   │
│             │ ◀── response ──  │  ├── Gemini AI call      │
│  AI replies │                  │  └── Session persistence │
└─────────────┘                  │                          │
                                 │ MongoDB (:27017)         │
                                 │  └── Internal only       │
                                 └─────────────────────────┘
```

1. Your visitor loads `widget.js` — a floating chat button appears
2. They send a message — the widget calls your API
3. SakurAI searches your knowledge base using vector similarity
4. Top matches + the question go to Google Gemini
5. Gemini responds and the answer blooms in the widget 🌸

## Project Structure

```
.
├── api/                     # Backend (NestJS)
│   └── src/
│       ├── auth/            # JWT authentication
│       ├── bootstrap/       # Auto-creates default admin on first run
│       ├── chat/            # Chat endpoint, session history, analytics
│       ├── knowledge/       # RAG: ingestion, PDF processing, vector search
│       ├── schemas/         # MongoDB schemas
│       ├── tenants/         # Tenant CRUD, account management
│       ├── tools/           # Tool registry and custom tool interface
│       ├── app.module.ts
│       └── main.ts
│
├── web/                     # Frontend (Angular)
│   └── src/
│       ├── app/
│       │   ├── components/  # Chat widget (dashboard preview)
│       │   ├── guards/      # Auth route guard
│       │   ├── interceptors/# JWT token interceptor
│       │   ├── pages/       # Login, Admin dashboard, Public chat
│       │   ├── services/    # API clients
│       │   └── widget/      # Embeddable Web Component (Shadow DOM)
│       ├── environments/
│       ├── main.ts
│       └── widget.ts        # Widget entry point → widget.js
│
├── docker-compose.yml
├── .env.example
├── DEPLOY.md
└── TOOLS.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Google Gemini 2.5 Flash + Embedding API |
| Backend | NestJS, Mongoose, JWT |
| Frontend | Angular 21, Tailwind CSS |
| Widget | Angular Elements (Web Component, Shadow DOM) |
| Database | MongoDB 7 |
| Deployment | Docker Compose |

## License

MIT
