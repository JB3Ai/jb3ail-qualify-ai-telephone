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
