# SESSION_STATE — jb3ail-qualify-ai-telephone

> Last updated: 2026-03-05

## Project Summary
- **Name:** JB3Ai Neural Hub — Multi-lingual Outbound Signal Processing & Intelligence Platform
- **Stack:** React 18, Vite 7, TypeScript, Express, Twilio, Azure OpenAI, Gemini, Azure Speech SDK, App Insights
- **Repo:** https://github.com/JB3Ai/jb3ail-qualify-ai-telephone.git
- **Branch:** `main`
- **Deploy:** `https://jb3ail-qualify-ai-telephone.onrender.com`

## Current Status: STABLE / RENDER
- Working tree status should be checked live before release.
- Production backend target: `https://jb3ail-qualify-ai-telephone.onrender.com`
- Azure GitHub Action deploy files removed as obsolete.

## Recent Work
1. Refine pipeline gating and live terminal workflow
2. Terminal UI partition hardening
3. Fast-stream voice flow improvements

## Key Features / Modules
- Twilio voice call integration (outbound)
- Azure OpenAI + Gemini AI cascade
- Azure Speech SDK (speech-to-text)
- Google Cloud Speech fallback
- WebSocket real-time updates
- Express API server (`server.ts` → compiled to `dist-server/server.js`)

## Next Steps / Open Items
- Verify full call flow end-to-end on Render
- Keep frontend backend URL pinned to `https://jb3ail-qualify-ai-telephone.onrender.com`
- Review remaining deployment docs for outdated Azure references if any surface elsewhere

## Known Issues
- No current deployment issue recorded here.
