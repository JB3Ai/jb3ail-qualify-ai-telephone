# Deploy Log

## Current Live
- App: OS3 Grid Telephone
// Live URL: https://jb3ai.com/os3grid-telephone/ (deprecated, do not use)
// Base Path: `/os3grid-telephone/` (deprecated, do not use)
- Build Status: PASS
// Deployment Archive: `os3grid-telephone-final.zip` (deprecated)

## Last Release
- Date: 2026-02-27
- Notes:
  - Fixed Vite base path for subfolder hosting
  - Added robust API JSON parsing to prevent HTML/JSON parse failures
  - Added stricter backend health verification (`/api/health` must return JSON `{ status: "ok" }`)

## Rollback
// Keep previous archive in cPanel as `os3grid-telephone-previous.zip` (deprecated)
- Rollback steps:
  // 1. Clear files in `public_html/os3grid-telephone/` (deprecated)
  // 2. Extract rollback archive into `public_html/os3grid-telephone/` (deprecated)
  3. Hard refresh browser cache

## 2026-03-23 Session Log

### Pushed To GitHub
- Commit: `d5061c6`
- Title: `add ghost mode investor flow`
- Files:
  - `App.tsx`
  - `server.ts`
- Summary:
  - Added Ghost Mode state and `OS3-ROOT` secret launch path
  - Added George-specific demo config and VIP greeting
  - Enabled Ghost Mode access to Manual Signal Trigger
  - Allowed Ghost Mode to bypass standard Demo restriction on Master Execution
  - Bumped visible app versioning through the Ghost Mode rollout

- Commit: `40c5f52`
- Title: `add custom os3 favicon`
- Files:
  - `index.html`
  - `public/favicon.svg`
- Summary:
  - Replaced generic favicon with custom OS3 branding
  - Updated browser tab/title branding

- Commit: `dd23324`
- Title: `harden render startup binding`
- Files:
  - `server.ts`
- Summary:
  - Bound backend startup to `0.0.0.0`
  - Set default `PORT` to `10000`
  - Added clearer startup diagnostics for Render

- Commit: `96e0da0`
- Title: `improve mobile terminal audio controls`
- Files:
  - `App.tsx`
- Summary:
  - Added `isSpeakerMuted` state
  - Switched internal audio playback to persistent inline `os3-audio-player`
  - Added large mobile speaker and microphone toggles in Live Terminal

### Local Changes Built But Not Yet Pushed
- Status: `npm run build` passes
- Files:
  - `App.tsx`
  - `server.ts`
  - `services/voiceService.ts`
  - `dist-server/server.js`
  - `dist-server/services/voiceService.js`
- Summary:
  - Reordered Live Terminal in-call layout:
    header, mobile toggles, call duration, transcript, composer, then secondary stats
  - Added iOS/Safari audio wake-up on the large microphone toggle using `AudioContext.resume()`
  - Updated `/api/converse` polyglot prompt into a Virtual Call Center handover model
  - Added Azure Voice Matrix in the actual synthesis layer so voices switch by active language

### Verified During This Session
- `server.ts` is explicitly bound to `0.0.0.0`
- Ghost Mode is active in:
  - secret launch trigger
  - George greeting
  - Manual Signal Trigger access
  - Master Execution bypass
- Live Terminal mobile audio changes compile cleanly

### Excluded Local Files
- `.github/agents/test.agent.md`
- `dist-server/BACKUPserver.js`
