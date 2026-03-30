# Build Cleanup Prompts & Standard Procedures

This guide gives you reusable prompts and a practical post-build cleanup routine for this repository (`jb3ai-neural-hub`), which uses:
- TypeScript (`tsc -p tsconfig.server.json`)
- Vite (`vite build`)
- Output folders such as `dist-server/` and (when built) `dist/`

> Current build script from `package.json`:
> `npm run build` → `tsc -p tsconfig.server.json && vite build`

---

## 1) Quick “after build” prompt templates

Use these with an AI assistant (or as your own checklist instructions) right after running a build.

### Prompt A — Standard post-build cleanup

"I just ran `npm run build` in this repo. Do a post-build cleanup and report:
1. Unused temporary files/log files,
2. Unexpected generated artifacts,
3. Secrets accidentally created in tracked files,
4. Whether build output directories should be ignored,
5. Any stale docs that still reference old scripts/paths.
Then propose exact commands and safe file edits."

### Prompt B — Strict git hygiene cleanup

"Audit this repo after build with strict git hygiene:
- Show what changed,
- Separate source changes from generated artifacts,
- Keep only intentional source edits,
- Remove accidental files,
- Update `.gitignore` if needed,
- Provide final `git status` expected output."

### Prompt C — Release-ready verification cleanup

"Perform a release-ready post-build check:
- Build passes,
- Type checks pass,
- No secret material committed,
- Docs are accurate,
- Deploy scripts still align with output folders.
Return a short pass/fail table and exact fix commands for each failure."

---

## 2) Standard procedures for this project

## Step 1 — Run baseline checks

```bash
npm run build
npm run lint
```

If either fails, fix before cleanup; otherwise cleanup is noise.

## Step 2 — Inspect what the build changed

```bash
git status --short
```

Typical expected build artifacts in this repo:
- `dist-server/` (server transpile output)
- `dist/` (Vite frontend output, if generated)

If these changed unexpectedly, decide whether they should be committed or ignored.

## Step 3 — Remove temporary/debug leftovers

Common candidates:
- ad-hoc debug logs (`*.log`, one-off notes)
- temporary exports or scratch files
- local test payloads accidentally created during debugging

Helpful checks:

```bash
find . -maxdepth 2 -type f \( -name "*.log" -o -name "*.tmp" -o -name "*.bak" \)
```

## Step 4 — Confirm secrets are not in tracked files

Check for obvious key/token patterns in source and docs:

```bash
rg -n "(API_KEY|SECRET|TOKEN|PRIVATE KEY|BEGIN RSA|TWILIO|AZURE_OPENAI|GOOGLE_KEY_JSON)" .
```

Then manually review results for real credentials vs variable names/placeholders.

## Step 5 — Validate ignore rules

Ensure generated output and local-only files are correctly ignored (when intended).

Typical lines to consider in `.gitignore` (project policy dependent):
- `dist/`
- `dist-server/` (if build output should not be versioned)
- `.env*` (except template files)
- `*.log`

## Step 6 — Clean install/build determinism check (optional but recommended)

```bash
rm -rf dist dist-server
npm ci
npm run build
```

This confirms repeatable builds and catches hidden local-state dependencies.

## Step 7 — Deployment alignment check

For this repo, verify scripts/docs still match actual output and start command:
- `package.json` scripts (`build`, `start`, `dev`)
- `deploy.sh`
- `rebuild_hub.sh`
- `RENDER_DEPLOY.md` and `README.md`

If paths or commands drift, update docs/scripts together.

## Step 8 — Final pre-commit hygiene

Before commit:

```bash
git status --short
git diff --stat
```

Then commit only intentional source/config/doc changes.

---

## 3) Suggested lightweight routine (copy/paste)

```bash
npm run build && npm run lint && git status --short
```

If output looks clean:
1. Remove accidental temp files,
2. Re-check `git status --short`,
3. Commit intentional changes only.

---

## 4) Team convention recommendation

Adopt this rule for every PR:
- **No accidental generated artifacts, logs, or secrets**.
- **Any build-output commit must be explicit in PR description**.
- **Docs/scripts must match real build and run commands**.

This keeps operational drift low and prevents deployment surprises.
