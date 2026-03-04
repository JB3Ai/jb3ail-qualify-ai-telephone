# Azure App Service Deployment Guide (OS3 Grid Telephone Backend)

This project runs as a static frontend on cPanel plus a Node API on Azure App Service.

// Frontend: `https://jb3ai.com/os3grid-telephone/` (deprecated, do not use)
- Backend: `https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net`

---

## 1) Confirm Azure Resource Settings

Use this exact target:

- **Subscription**: `f1334c25-fd29-4a15-9b3c-590793520e0f`
- **Resource Group**: `tekephonemazanzi`
- **Web App Name**: `os3grid`
- **Runtime**: `Node 20 LTS`
- **OS**: `Linux`
- **Region**: `South Africa North`
- **Plan**: `appsvc_linux_southafricanorth_basic` (Basic, Small)
- **Application Insights**: Enabled
- **Defender for App Service**: Enabled
- **Basic Authentication (Deployment Credentials)**: Enabled
- **GitHub Continuous Deployment**: Enabled (`JB3Ai/jb3ail-qualify-ai-telephone`, branch `main`)

---

## 2) Configure Startup + App Settings

In **Web App > Configuration** set:

- **Startup Command**: `npm run start:api`
- **NODE_ENV**: `production`
- **APP_URL**: `https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net`
- **DOMAIN**: `os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net`
- **GEMINI_API_KEY**: `<your key>`
- **SPEECH_KEY**: `<your key>`
- **SPEECH_REGION**: `<your speech region>`
- **TWILIO_ACCOUNT_SID**: `<your sid>`
- **TWILIO_AUTH_TOKEN**: `<your token>`
- **TWILIO_PHONE_NUMBER**: `<your number>`

Then restart the app.

---

## 3) Verify API Health

Open:

- `https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net/api/health`

Expected JSON:

```json
{ "status": "ok", "message": "🚀 JB³Ai Neural Hub Backend is Online!" }
```

If the response is HTML, the app process did not start correctly.

---

## 4) Connect Telephone Frontend

// In live Telephone UI (`/os3grid-telephone/`): (deprecated, do not use)

1. Open **System Recalibration**.
2. Set **Core Endpoint** to:

```text
https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net
```

3. Click **Reboot Server**.
4. Run Voice and Logic tests.

---

## 5) Troubleshooting

### `Unexpected token '<'`
Cause: frontend hit a non-API HTML response.

Fix:
- Confirm Core Endpoint is `https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net`.
- Confirm `/api/health` returns JSON.

### Twilio call issues
Check:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Twilio verified numbers and permissions

### Voice test issues
Check:
- `SPEECH_KEY`, `SPEECH_REGION`
- Azure Speech key/region match

### Logic test issues
Check:
- `GEMINI_API_KEY`
- model access and quota
