# Render Deployment Guide (OS3 Grid Telephone Backend)

This project runs against the Render production backend:

- Backend: `https://jb3ail-qualify-ai-telephone.onrender.com`

---

## 1) Canonical Production URL

Use this exact backend target:

- **APP_URL**: `https://jb3ail-qualify-ai-telephone.onrender.com`
- **DOMAIN**: `jb3ail-qualify-ai-telephone.onrender.com`

---

## 2) Verify API Health

Open:

- `https://jb3ail-qualify-ai-telephone.onrender.com/api/health`

Expected JSON:

```json
{ "status": "ok", "message": "JB3Ai Neural Hub Backend is Online!" }
```

If the response is HTML, the app process did not start correctly.

---

## 3) Connect Telephone Frontend

In the live Telephone UI:

1. Open **System Recalibration**.
2. Set **Core Endpoint** to:

```text
https://jb3ail-qualify-ai-telephone.onrender.com
```

3. Click **Reboot Server**.
4. Run Voice and Logic tests.

---

## 4) Troubleshooting

### `Unexpected token '<'`

Cause: frontend hit a non-API HTML response.

Fix:

- Confirm Core Endpoint is `https://jb3ail-qualify-ai-telephone.onrender.com`.
- Confirm `/api/health` returns JSON.

### Twilio call issues

Check:

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Twilio verified numbers and permissions

### Voice test issues

Check:

- `SPEECH_KEY`, `SPEECH_REGION`

### Logic test issues

Check:

- `GEMINI_API_KEY`
- model access and quota
