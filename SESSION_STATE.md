# SESSION_STATE — jb3ail-qualify-ai-telephone

> Last updated: 2026-03-05

## Project Summary
- **Name:** JB3Ai Neural Hub — Multi-lingual Outbound Signal Processing & Intelligence Platform
- **Stack:** React 18, Vite 7, TypeScript, Express, Twilio, Azure OpenAI, Gemini, Azure Speech SDK, App Insights
- **Repo:** https://github.com/JB3Ai/jb3ail-qualify-ai-telephone.git
- **Branch:** `main`
- **Deploy:** 
  - **Azure Web App:** `os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net` (via GitHub Actions `main_os3grid.yml`)
  - **cPanel (legacy):** `deploy-cpanel.yml` — frontend only (deprecated path)

## Current Status: DEPLOYING / TROUBLESHOOTING AZURE
- Working tree has **staged** `.vscode/extensions.json` (not committed).
- Last commit: `d5a6108` — *fix: add .deployment file to disable Oryx build (vite build fails on compiled-only package)*
- **Active issue:** Azure deployment pipeline has been iteratively debugged:
  - Exit code 127 (tsx not found in production) → fixed by pre-compiling server.ts to `dist-server/`
  - Oryx build conflicts → disabled with `.deployment` file
  - Health endpoint confirmed responding (`/api/health`)

## Recent Work (last 10 commits) — all deployment fixes
1. fix: add .deployment file to disable Oryx build
2. fix: pre-compile server.ts to CJS dist-server/ — eliminate tsx runtime dep
3. fix: include production node_modules in deploy artifact
4. fix: deploy source only — trim 498MB artifact to ~5MB
5. fix: use dynamic import for vite to prevent production startup hang
6. chore: add startup diagnostics for Azure debugging
7. fix: lazy-init Twilio client to prevent startup crash
8. Fix: Azure API version 2025-01-01-preview, fix deployment baseURL
9. fix: guard appInsights setup with connection string check
10. Fix: Remove startup-command (invalid with publish-profile), rely on npm start

## Key Features / Modules
- Twilio voice call integration (outbound)
- Azure OpenAI + Gemini AI cascade
- Azure Speech SDK (speech-to-text)
- Google Cloud Speech fallback
- WebSocket real-time updates
- Express API server (`server.ts` → compiled to `dist-server/server.js`)

## Next Steps / Open Items
- **Verify Azure deployment is fully healthy** after Oryx-disable fix
- Commit staged `.vscode/extensions.json` or discard
- Consider: consolidate the 3 GitHub Actions workflows (main_os3grid, main_jb3ail, deploy-cpanel) — some may be obsolete
- Test full call flow end-to-end on Azure

## Known Issues
- Azure deploy has been fragile — 10+ iterative fix commits in a row
- `tsx` runtime dependency was causing exit 127 in Azure (now pre-compiled)
- Oryx build was conflicting with pre-built artifacts (now disabled)
