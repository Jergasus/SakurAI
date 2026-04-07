<p align="center">
  <img src="https://img.shields.io/badge/Self--Hosted-AI%20Chat%20Agent-ff69b4?style=for-the-badge" alt="Self-Hosted AI Chat Agent" />
  <img src="https://img.shields.io/badge/RAG-Knowledge%20Base-blueviolet?style=for-the-badge" alt="RAG Knowledge Base" />
  <img src="https://img.shields.io/badge/Embeddable-Widget-blue?style=for-the-badge" alt="Embeddable Widget" />
</p>

<h1 align="center">🌸 SakurAI 🌸</h1>

<p align="center">
  A self-hosted AI chat agent that blooms on your website.<br/>
  Upload your documents, embed a lightweight chat widget, and let SakurAI answer your visitors' questions — grounded in your own content, powered by RAG.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#how-it-works">How It Works</a> &bull;
  <a href="#embedding-the-widget">Embed Widget</a> &bull;
  <a href="DEPLOY.md">Deployment Guide</a> &bull;
  <a href="TOOLS.md">Custom Tools</a>
</p>

---

## Why SakurAI?

Drop a single `<script>` tag into any site and you get a polished AI assistant that actually knows your stuff. No third-party SaaS, no per-seat pricing — just your server, your data, your agent.

## Demo

### Admin Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/82f87512-035b-41e4-89eb-f1686504dbae" alt="Admin Dashboard" width="800" />
</p>

### RAG in Action

Upload your documents and SakurAI uses them to answer questions:

<p align="center">
  <img src="https://github.com/user-attachments/assets/7decf561-18ce-4419-8e08-41c8e021976b" alt="RAG Demo 1" width="400" />
  <img src="https://github.com/user-attachments/assets/cbd0e385-7a15-4bfd-a2b7-469c905c3b63" alt="RAG Demo 2" width="400" />
</p>

### Conversation Memory

The agent remembers your conversation history and uses RAG context:

<p align="center">
  <img src="https://github.com/user-attachments/assets/daa9f692-5cf8-4709-be6b-a7706b95d214" alt="Chat History 1" width="350" />
  <img src="https://github.com/user-attachments/assets/534c8986-103e-4180-9394-df0841a84b47" alt="Chat History 2" width="350" />
  <img src="https://github.com/user-attachments/assets/370607bf-9a5b-4310-8a13-28e31ee82b1a" alt="Chat History 3" width="350" />
</p>

## Features

- **Knowledge Base (RAG)** — Upload PDFs, Word docs, text, JSON, CSV, or Markdown files. SakurAI uses vector embeddings to find relevant context before answering.
- **Embeddable Widget** — One `<script>` tag on any website — WordPress, Shopify, plain HTML, anything.
- **Admin Dashboard** — Configure your agent's personality, appearance, knowledge base, and tools from a clean web UI.
- **Conversation Memory** — Chat sessions persist across page reloads with automatic conversation summaries.
- **Custom Tools** — Give your agent the ability to call APIs, query databases, or perform actions. See [TOOLS.md](TOOLS.md) for details.
- **Zero Configuration** — `docker-compose up -d` and you're live. Default admin credentials are created on first boot.
- **Rate Limiting & Security** — Built-in throttling, Helmet.js security headers, JWT auth, and bcrypt password hashing.

> [!NOTE]
> SakurAI currently uses **Google Gemini** as its AI provider (chat, embeddings, and tool calling). Multi-provider support (OpenAI, Claude, etc.) is not available yet — contributions are welcome!

## Quick Start

You only need **Docker** and a free **Google Gemini API Key**.

```bash
git clone https://github.com/Jergasus/SakurAI.git && cd SakurAI
cp .env.example .env
# Set your GEMINI_API_KEY in .env
docker-compose up -d --build
```

Open **http://localhost** and log in with `admin@sakurai.com` / `admin123`.

> [!WARNING]
> Change the default credentials immediately via the **Account** tab in the dashboard. Also set a strong `JWT_SECRET` in your `.env` before exposing the app to the internet.

## Embedding the Widget

From the admin dashboard, go to **Install**, copy the snippet, and drop it into your HTML:

```html
<script src="http://localhost/widget/widget.js"
        data-api-key="YOUR_API_KEY"
        data-api-url="http://localhost/api"></script>
```

That's it — a floating chat button appears in the bottom-right corner of your site.

> [!TIP]
> Replace `localhost` with your server's domain or IP when deploying to production. The widget works on any website — WordPress, Shopify, static HTML, etc.

## How It Works

```
Your visitor's browser               Your server (one VPS)
┌─────────────┐                  ┌─────────────────────────┐
│  <script>   │ ──── loads ────▶ │ Nginx (:80)             │
│  widget.js  │                  │  ├── Admin dashboard     │
│             │                  │  ├── widget.js           │
│  User types │                  │  └── /api/* proxy ──┐    │
│  a message  │ ── /api/* ────▶  │                     ▼    │
│             │                  │ NestJS API (internal)    │
│             │ ◀── response ──  │  ├── RAG vector search   │
│  AI replies │                  │  ├── Gemini AI call      │
└─────────────┘                  │  └── Session persistence │
                                 │                          │
                                 │ MongoDB (internal)       │
                                 └─────────────────────────┘
```

1. Your visitor loads `widget.js` — a floating chat button appears
2. They send a message — the widget calls your API
3. SakurAI searches your knowledge base using vector similarity
4. Top matches + the question go to Google Gemini
5. Gemini responds and the answer blooms in the widget

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
├── DEPLOY.md                # Full deployment & production guide
└── TOOLS.md                 # How to create custom tools
```

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Google Gemini 2.5 Flash + Embedding API |
| Backend | NestJS, Mongoose, JWT, Helmet |
| Frontend | Angular, Tailwind CSS |
| Widget | Angular Elements (Web Component, Shadow DOM) |
| Database | MongoDB 7 |
| Deployment | Docker Compose, Nginx |

## Configuration

All configuration is done via environment variables in `.env`. See [`.env.example`](.env.example) for the full list.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Google AI API key |
| `JWT_SECRET` | `change-me-in-production` | Auth token signing key |
| `VECTOR_SEARCH_MODE` | `local` | `local` (in-memory cosine) or `atlas` (MongoDB Atlas) |
| `CORS_ALLOW_ALL` | `true` | Allow widget embedding from any domain |
| `THROTTLE_LIMIT` | `60` | Max requests per minute per IP |
| `WEB_PORT` | `80` | Host port (dashboard + API via Nginx proxy) |
| `DEFAULT_ADMIN_*` | `admin@sakurai.com` / `admin123` | First-run seed credentials |

> [!NOTE]
> The default `VECTOR_SEARCH_MODE=local` uses in-memory cosine similarity, which works well for small-to-medium knowledge bases. For 5,000+ documents, switch to `atlas` mode with a MongoDB Atlas vector search index.

For production setup (HTTPS, MongoDB Atlas, CORS), see the [Deployment Guide](DEPLOY.md).

## Running Multiple Agents

Each SakurAI deployment runs **one agent** with its own knowledge base, configuration, and API key. If you need separate agents for different projects, run a separate instance for each:

```bash
# Agent 1 (default port 80)
cp -r SakurAI agent-1 && cd agent-1
# Edit .env: set GEMINI_API_KEY and credentials
docker-compose up -d

# Agent 2 (different port)
cp -r SakurAI agent-2 && cd agent-2
# Edit .env: set WEB_PORT=8080 and your GEMINI_API_KEY
docker-compose up -d
```

Each instance is fully isolated — separate database, separate knowledge base, separate admin account.

> [!TIP]
> You only need to change `WEB_PORT` in `.env` to avoid port conflicts. Docker Compose uses the folder name to isolate containers, networks, and volumes automatically. If using **MongoDB Atlas**, set a different database name in `MONGO_URI` for each instance (e.g., `mongodb+srv://.../agent_1` and `mongodb+srv://.../agent_2`).

## License

[MIT](LICENSE)
