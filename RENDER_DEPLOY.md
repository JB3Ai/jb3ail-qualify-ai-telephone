# Render Deployment Guide (OS3 Grid Telephone Backend)

This project uses a static frontend plus a Node API backend.

- Frontend stays on cPanel: `https://jb3ai.com/os3grid-telephone/`
- Backend should run online (Render recommended): `https://<your-render-service>.onrender.com`

---

## 1) Create Render Web Service

1. Push this project to GitHub.
2. In Render, create a **New Web Service** from the repo.
3. Use these settings:

- **Environment**: Node
- **Build Command**:

```bash
npm install && npm run build
```

- **Start Command**:

```bash
npm run start:api
```

- **Region**: closest to your users
- **Instance type**: start with Free/Starter, scale as needed

---

## 2) Required Environment Variables

Set these in Render service settings:

- `GEMINI_API_KEY`
- `SPEECH_KEY`
- `SPEECH_REGION`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Recommended:

- `APP_URL=https://<your-render-service>.onrender.com`
- `DOMAIN=<your-render-service>.onrender.com`
- `NODE_ENV=production`

---

## 3) Verify Backend Is Live

After deploy, open:

- `https://<your-render-service>.onrender.com/api/health`

Expected JSON:

```json
{ "status": "ok", "message": "🚀 JB³Ai Neural Hub Backend is Online!" }
```

If you see HTML instead of JSON, the backend is not correctly running.

---

## 4) Connect Frontend to Backend

In live Telephone UI (`/os3grid-telephone/`):

1. Open **System Recalibration**.
2. Set **Core Endpoint** to:

```text
https://<your-render-service>.onrender.com
```

3. Click **Reboot Server**.
4. Run Neural Lab test again.

---

## 5) Troubleshooting

### Error: `Unexpected token '<'`
Cause: frontend received HTML page, not JSON API response.

Fix:
- Ensure backend URL is the Render API host, not cPanel frontend URL.
- Confirm `/api/health` returns JSON.

### Twilio call fails
Check:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- phone permissions/verified numbers in Twilio

### Voice test fails
Check:
- `SPEECH_KEY`, `SPEECH_REGION`
- Azure speech quota/region validity

### Logic test fails
Check:
- `GEMINI_API_KEY`
- model access and key scope

---

## 6) Optional Production Hardening

- Add a custom API subdomain (e.g., `api.jb3ai.com`) to Render.
- Add CORS allow-list to restrict domains.
- Add uptime monitoring for `/api/health`.
- Keep a deployment changelog with build hash and release date.
