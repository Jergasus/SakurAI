# Deployment Guide

Self-host your own AI chat agent with RAG capabilities in under 5 minutes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier available)
- (Optional, but recommended for production) A domain name and a VPS with at least 1GB RAM.

## Setup

```bash
# 1. Clone and enter the project
git clone https://github.com/Jergasus/SakurAI.git && cd SakurAI

# 2. Configure environment (only GEMINI_API_KEY is required)
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

# 3. Start everything
docker-compose up -d --build
```

That's it. The stack includes MongoDB, the API, and the web dashboard — all running in Docker.

## First Login

1. Open **http://localhost** in your browser
2. Log in with the default credentials:
   - Email: `admin@localhost`
   - Password: `admin123`
3. You'll land on the admin dashboard where you can configure your agent

> [!CAUTION]
> Change your password immediately from the **Account** section in the dashboard header. The default credentials (`admin@localhost` / `admin123`) are publicly known.

## Using the Admin Dashboard

- **General Settings**: Set your agent's name and system prompt (personality)
- **Widget Appearance**: Customize the chat widget colors and title
- **Knowledge Base**: Upload PDFs or add text to give your agent domain knowledge (RAG)
- **Skills (Tools)**: Enable custom tools your agent can use (see [TOOLS.md](TOOLS.md) for how to create them)
- **Analytics**: View conversation stats and recent chat history
- **Install**: Get the embed code to add the chat widget to your website
- **Account**: Change your email and password

## Embedding the Chat Widget on Your Website

This is the core use case: you deploy this project **once** on a server, then paste a small snippet into your **existing** website (WordPress, Shopify, plain HTML — anything). You don't need to modify your website's backend.

> [!TIP]
> If you are just testing locally, you can use the `localhost` output from the admin panel and paste it into another web project running on your machine.

### Step 1: Deploy this project

Rent a VPS ($5/month on DigitalOcean, Hetzner, AWS Lightsail, etc.), install Docker, and run the setup commands from above. Ensure your host's firewall leaves ports 80 and 443 open.

### Step 2: Get your embed code

In the admin dashboard, click **Install Widget**. You'll see the full snippet with your API key pre-filled.

It looks like this:

```html
<script src="http://YOUR_SERVER/widget/widget.js"></script>
<ai-chat-widget api-key="sk_..." api-url="http://YOUR_SERVER:3000"></ai-chat-widget>
```

### Step 3: Paste into your website

Add the snippet before the `</body>` tag on any page where you want the chat widget to appear. That's it — a floating chat button will appear in the bottom-right corner.

An iframe embed option is also available for simpler integrations.

## Going to Production

The default setup uses a local MongoDB container, which is fine for trying things out and for small deployments. For production, consider these upgrades:

> [!IMPORTANT]
> For production deployments, you **must** set a unique `JWT_SECRET` and change the default admin password. Without this, anyone who knows the defaults can access your dashboard.

### Use HTTPS

Put a reverse proxy (Caddy, nginx, Traefik) in front of the stack with SSL certificates. Update the embed code URLs to use `https://`.

### Change Default Credentials

```env
JWT_SECRET=your-strong-random-secret
DEFAULT_ADMIN_PASSWORD=a-strong-password
```

Then change your password from the Account section in the dashboard.

### MongoDB Atlas (Optional)

For larger knowledge bases (5,000+ documents) or if you want managed backups and scaling:

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Create a vector search index named `vector_index` on the `knowledges` collection:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 768,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "tenantId"
       }
     ]
   }
   ```
4. Update your `.env`:
   ```env
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/saas_agents
   VECTOR_SEARCH_MODE=atlas
   ```

> [!TIP]
> For most users with a few hundred knowledge entries, the default local mode works perfectly fine in production. You only need Atlas if you have 5,000+ documents or want managed backups.

### CORS Configuration

> [!NOTE]
> By default, `CORS_ALLOW_ALL=true` allows the widget to be embedded on any domain. This is intentional and safe — the API key is the security boundary, not CORS (same model as Intercom, Crisp, and every embeddable widget).

To restrict to specific domains:

```env
CORS_ALLOW_ALL=false
ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com
```

## Advanced Configuration

All configuration is done via environment variables in `.env`. See `.env.example` for the full list with descriptions.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Google AI API key |
| `VECTOR_SEARCH_MODE` | `local` | `local` (in-memory cosine) or `atlas` (MongoDB vector search) |
| `CORS_ALLOW_ALL` | `true` | Allow widget from any domain |
| `JWT_SECRET` | `change-me-in-production` | Auth token signing |
| `THROTTLE_LIMIT` | `60` | Max requests per minute per IP |
| `DEFAULT_ADMIN_*` | `admin@localhost` / `admin123` | First-run seed credentials |

## Troubleshooting

- **API not starting**: Check `docker-compose logs api` for errors. Most common: invalid Gemini API key.
- **MongoDB connection failed**: Ensure the mongo container is healthy: `docker-compose ps`
- **Chat not responding**: Verify your Gemini API key is valid and has quota remaining.
- **Widget not loading on external site**: Check browser console for CORS errors. Ensure `CORS_ALLOW_ALL=true` or your domain is in `ALLOWED_ORIGINS`.

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser  │────▶│  Nginx   │────▶│  Angular │
│ (Widget)  │     │ (port 80)│     │Dashboard │
└─────┬─────┘     └──────────┘     └──────────┘
      │
      │ API calls
      ▼
┌───────────┐     ┌────────────┐
│  NestJS   │────▶│  MongoDB   │
│(port 3000)│     │(port 27017)│
└─────┬─────┘     └────────────┘
      │
      ▼
┌───────────┐
│  Gemini   │
│   API     │
└───────────┘
```
