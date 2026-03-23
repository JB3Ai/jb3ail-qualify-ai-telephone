# OS³ Grid Deployment Log
**Project:** JB³Ai Neural Telephone Grid
**Architecture:** React UI (cPanel) -> Node.js + WebSockets (Render) -> Twilio / Azure Speech / Gemini Core

---

### [v4.0.7-stable-mzanzi] - 2026-03-23
**Status:** Built and Pushed
**Focus:** Virtual Call Center Handover & iOS Hardware Fixes

| Change | Files Modified | Commit |
| :--- | :--- | :--- |
| **Virtual Call Center Handover:** Integrated Azure Voice Matrix mapping language outputs to distinct regional neural voices (Zandi, Sipho, Johan, Lebo, Kostas). | `server.ts`, `services/voiceService.ts` | `Pending` |
| **Handover Prompt Logic:** Upgraded `/api/converse` system prompt to mandate seamless colleague handovers on explicit language switching. | `server.ts` | `Pending` |
| **iOS Double-Tap Mic Fix:** Injected `AudioContext.resume()` hardware wake-up poke to bypass strict Safari battery-saving deep sleep. | `App.tsx` | `Pending` |
| **Mobile UI Layout:** Reordered Live Terminal for mobile flow: Header -> Master Toggles -> Duration -> Transcript -> Secondary Stats. | `App.tsx` | `Pending` |

---

### [v4.0.6-stable-mzanzi] - 2026-03-23
**Status:** Built and Pushed
**Focus:** Mobile Audio Robustness & Render Stability

| Change | Files Modified | Commit |
| :--- | :--- | :--- |
| **iOS Audio Pipeline:** Replaced one-off browser audio with persistent `os3-audio-player` element (`playsInline=true`) to bypass Apple's async media block. | `App.tsx` | `96e0da0` |
| **Mobile HUD Toggles:** Added massive mobile-friendly, dual-state `SPEAKER` and `MIC` visual toggle blocks to Live Terminal. | `App.tsx` | `96e0da0` |
| **Render Port Binding:** Hardened backend startup by explicitly binding `http.createServer` to `0.0.0.0` to clear Render's external health check timeouts. | `server.ts` | `dd23324` |
| **Brand Identity Polish:** Injected custom neon OS³ `favicon.svg` and updated browser document title. | `index.html`, `public/favicon.svg` | `40c5f52` |

---

### [v4.0.5-stable-mzanzi] - 2026-03-23
**Status:** Built and Pushed
**Focus:** Enterprise Demo Architecture (Ghost Mode)

| Change | Files Modified | Commit |
| :--- | :--- | :--- |
| **Ghost Mode Payload (Easter Egg):** Built stealth `OS3-ROOT` launch trigger mapping to a hidden `isGhostMode` state for investor pitches. | `App.tsx` | `d5061c6` |
| **VIP Greeting Override:** Bypassed generic demo introductions for a hardcoded, highly personalized "AI Co-Founder" opening tailored to VIP (George). | `App.tsx` | `d5061c6` |
| **Action Unlocking:** Mapped Ghost Mode state to bypass demo restrictions on the `[ MANUAL SIGNAL TRIGGER ]` and `Initiate Master Execution` interfaces. | `App.tsx` | `d5061c6` |
| **Polyglot Constraints:** Strengthened Gemini system prompt to forbid language-lock apologies and enforce instantaneous language switching. | `server.ts` | `d5061c6` |
| **WebSocket Hardening:** Upgraded global WS effect to be ghost-safe, preventing stale disconnect events from flagging false UI errors. | `App.tsx` | `d5061c6` |

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

