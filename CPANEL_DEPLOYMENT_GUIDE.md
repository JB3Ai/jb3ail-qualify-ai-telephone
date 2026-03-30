# cPanel Deployment Guide - Complete Instructions

**Status Check:** March 1, 2026  
**Created:** Automated deployment analysis and guide generation

---

## 📊 Current Deployment Status

### ✅ Ready for cPanel Deployment (GitHub Actions configured)
1. **jb3ai-os3** - OS³ Main Website
   - Repository: `github.com/JB3Ai/jb3ai-os3`
   - Deployment path: `./` (root/public_html)
   - Status: ✅ Workflow fixed and pushed

2. **George_Board** - Clipboard App
   - Repository: `github.com/JB3Ai/George_Board`
   - Deployment path: `./clipboard/`
   - Status: Ready to deploy
   - Note: Includes `.htaccess` for Apache routing

3. **Kids-GoExplore-Gauteng-Edition-** - Kids App
   - Repository: `github.com/JB3Ai/Kids-GoExplore-Gauteng-Edition-`
   - Deployment path: `./kids-goexplore/`
   - Status: Ready to deploy

### ⚠️ Other Projects (Special Handling Required)
4. **jb3ail-qualify-ai-telephone** - Phone App
   - Repository: `github.com/JB3Ai/jb3ail-qualify-ai-telephone`
   - Deployment: **Azure App Service** (NOT cPanel)
   - Frontend path: `/os3grid-telephone/` on cPanel
   - Backend: `os3grid.azurewebsites.net`
   - Status: Azure deployment configured

5. **os3-design-testbed** - Design System
   - Status: NOT a git repository (local only)
   - Action: Can be deployed manually if needed

6. **dadchefai_south_african_edition** - AI Chef App
   - Status: NOT a git repository (local only)
   - Action: Can be deployed manually if needed

---

## 🔐 Step 1: Authenticate with GitHub CLI

### Prerequisites
- GitHub CLI installed at: `C:\Program Files\GitHub CLI\gh.exe` ✓
- GitHub account with access to `github.com/JB3Ai/*` repositories

### Action
```powershell
gh auth login
```

**What to select:**
1. Choose: `GitHub.com` (not GitHub Enterprise)
2. Choose: `HTTPS` (recommended)
3. Choose: `Y` to authenticate with your GitHub credentials
4. Open the browser link and authorize GitHub CLI
5. Return to terminal - you should see confirmation

**Verify:**
```powershell
gh auth status
```
Expected output: "Logged in to github.com as YOUR_USERNAME"

---

## 🔑 Step 2: Configure cPanel FTP Credentials

### Your cPanel Credentials ✅

| Variable | Value |
|----------|-------|
| **cPanel URL** | `https://s51.registerdomain.net.za/cpanel` |
| **cPanel Username** | `jbaicom` |
| **cPanel Password** | `R-O8bQH9zx5k*4` |
| **FTP Hostname** | `ftp.jb3ai.com` |
| **FTP Username** | `jbaicom` |
| **FTP Password** | `R-O8bQH9zx5k*4` |
| **Remote Directory** | `/public_html/` |
| **FTP Mode** | Passive Mode |
| **Shared IP** | `156.38.195.74` |
| **Name Servers** | `ns1.s51.registerdomain.net.za`, `ns2.s51.registerdomain.net.za` |

**Verify FTP User in cPanel:**
1. Login to cPanel: https://s51.registerdomain.net.za/cpanel
2. Go to **FTP Accounts**
3. Ensure user `jbaicom` has home directory: `/home/jbaicom/public_html/`

---

## 📱 Step 3: Add GitHub Secrets (FOR EACH REPOSITORY)

You must add secrets to **each** repository that will auto-deploy.

### For jb3ai-os3

1. Go to: `https://github.com/JB3Ai/jb3ai-os3/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret:

| Secret Name | Value |
|------------|-------|
| `CPANEL_FTP_SERVER` | `ftp.jb3ai.com` |
| `CPANEL_FTP_USERNAME` | `jbaicom` |
| `CPANEL_FTP_PASSWORD` | `R-O8bQH9zx5k*4` |

✅ **Verification:** Check `.github/workflows/deploy-cpanel.yml` uses these secrets

### For George_Board (Clipboard)

1. Go to: `https://github.com/JB3Ai/George_Board/settings/secrets/actions`
2. Add the **same three secrets**:
   - `CPANEL_FTP_SERVER`: `ftp.jb3ai.com`
   - `CPANEL_FTP_USERNAME`: `jbaicom`
   - `CPANEL_FTP_PASSWORD`: `R-O8bQH9zx5k*4`

✅ **Verification:** Check `.github/workflows/deploy-cpanel.yml` includes `.htaccess` copy step

### For Kids-GoExplore-Gauteng-Edition-

1. Go to: `https://github.com/JB3Ai/Kids-GoExplore-Gauteng-Edition-/settings/secrets/actions`
2. Add the **same three secrets**:
   - `CPANEL_FTP_SERVER`: `ftp.jb3ai.com`
   - `CPANEL_FTP_USERNAME`: `jbaicom`
   - `CPANEL_FTP_PASSWORD`: `R-O8bQH9zx5k*4`

✅ **Verification:** Simple workflow, no additional configuration needed

---

## 🚀 Step 4: Commit and Push Changes

### 4a: Prepare jb3ai-os3

```powershell
cd "c:\Apps in Dev Visual Code Folder\jb3ai-os3"

# Check current status
git status

# Stage modified files
git add pages/HomePage.tsx deploy.ps1 gh.ps1

# Commit
git commit -m "Update HomePage and add deployment scripts"

# Push to main (triggers auto-deploy)
git push origin main
```

**Expected:** GitHub Actions workflow starts automatically ([Check here](https://github.com/JB3Ai/jb3ai-os3/actions))

### 4b: Prepare George_Board

```powershell
cd "c:\Apps in Dev Visual Code Folder\George_Board"

# Check current status
git status

# Stage changes
git add App.tsx package.json package-lock.json vite-env.d.ts

# Commit
git commit -m "Update dependencies and components"

# Push to main (triggers auto-deploy)
git push origin main
```

**Expected:** GitHub Actions workflow starts automatically ([Check here](https://github.com/JB3Ai/George_Board/actions))

### 4c: Check Kids-GoExplore (if needed)

```powershell
cd "c:\Apps in Dev Visual Code Folder\Kids-GoExplore-Gauteng-Edition-"

# Check status
git status

# If changes exist, commit and push
git add .
git commit -m "Latest changes"
git push origin main
```

**Expected:** GitHub Actions workflow starts automatically

---

## 👀 Step 5: Monitor Deployments

### Watch in Real-Time (Terminal)

```powershell
# Check latest deployment status for jb3ai-os3
gh run list --repo JB3Ai/jb3ai-os3 --limit 5

# Check George_Board
gh run list --repo JB3Ai/George_Board --limit 5

# Check Kids-GoExplore
gh run list --repo JB3Ai/Kids-GoExplore-Gauteng-Edition- --limit 5
```

### Watch on Web

1. **jb3ai-os3:** https://github.com/JB3Ai/jb3ai-os3/actions
2. **George_Board:** https://github.com/JB3Ai/George_Board/actions
3. **Kids-GoExplore:** https://github.com/JB3Ai/Kids-GoExplore-Gauteng-Edition-/actions

**Look for:**
- 🟢 **Green check** = Deployment successful
- 🔴 **Red X** = Deployment failed (check logs for error)
- 🟡 **Yellow dot** = Deployment in progress

### Check Logs

```powershell
# View specific run details
gh run view --repo JB3Ai/jb3ai-os3 <RUN_ID> --log
```

---

## ✨ Step 6: Verify Live Deployments

After workflow completes successfully, verify files are live:

### jb3ai-os3
- **Local path:** `/public_html/` (root) on cPanel FTP
- **URL:** `https://jb3ai.com/`
- **Check:** Should load the OS³ Main Website

### George_Board (Clipboard)
- **Local path:** `/public_html/clipboard/` on cPanel FTP
- **URL:** `https://jb3ai.com/clipboard/`
- **Check:** Should load Clipboard app with `.htaccess` routing working

### Kids-GoExplore-Gauteng-Edition-
- **Local path:** `/public_html/kids-goexplore/` on cPanel FTP
- **URL:** `https://jb3ai.com/kids-goexplore/`
- **Check:** Should load Kids Explorer app

---

## 🔄 Automatic Deployment on Future Pushes

After secrets are configured, **any push to `main` branch** will auto-deploy:

```powershell
# Make changes to any project
git add .
git commit -m "Your message"
git push origin main    # 🚀 Automatic deployment starts!
```

**No manual action needed** — GitHub Actions handles everything:
1. ✅ Install dependencies
2. ✅ Build project (`npm run build`)
3. ✅ Upload `dist/` to cPanel via FTP
4. ✅ Copies `.htaccess` (if present)

---

## ⚠️ Troubleshooting

### "You are not logged into any GitHub hosts"
**Solution:** Run `gh auth login` and complete OAuth flow

### Workflow fails: "FTP connection refused"
**Possible causes:**
- FTP credentials are incorrect
- FTP server is down or unreachable
- Firewall blocking FTP port 21
**Solution:** Verify credentials in GitHub secrets

### Workflow fails: "npm ci" error
**Possible causes:**
- `package-lock.json` out of sync
- Missing Node.js dependencies
**Solution:** Run locally: `npm ci && npm run build`

### Files not updated on cPanel
**Possible causes:**
- Browser cache (press Ctrl+Shift+Delete to clear)
- .htaccess redirecting to wrong directory
- FTP upload to wrong directory
**Solution:**
1. Check GitHub Actions log for upload path
2. Check cPanel File Manager for correct directory
3. Clear browser cache

### Manual FTP Deploy (Fallback)
If GitHub Actions fails and you need to deploy manually:

```powershell
# Prepare locally
cd "c:\Apps in Dev Visual Code Folder\jb3ai-os3"
npm ci
npm run build

# Files ready in ./dist/
# Upload ./dist/* to your FTP server using:
# - WinSCP (GUI FTP client)
# - FileZilla (download free)
# - Cyberduck (download free)
```

---

## 📋 Quick Reference Checklist

- [ ] **GitHub CLI authenticated** - Run `gh auth status`
- [ ] **FTP credentials gathered** - Have server, username, password ready
- [ ] **Secrets added to jb3ai-os3** - Verify in GitHub Settings
- [ ] **Secrets added to George_Board** - Verify in GitHub Settings
- [ ] **Secrets added to Kids-GoExplore** - Verify in GitHub Settings
- [ ] **Changes committed to main** - Run git status
- [ ] **Changes pushed to GitHub** - `git push origin main`
- [ ] **Workflows running** - Check GitHub Actions
- [ ] **Deployments successful** (green checks)
- [ ] **Live URLs verified** - Site loads correctly

---

## 🎯 Next Steps

**Immediate (Today):**
1. Authenticate GitHub CLI: `gh auth login`
2. Add secrets to all 3 repositories
3. Commit and push changes to main branch

**Monitor:**
4. Watch GitHub Actions for workflow completion
5. Verify live sites are accessible and correct

**Ongoing (Future Pushes):**
6. Each push to `main` auto-deploys automatically

---

## 📞 Support Resources

- **cPanel FTP Help:** Login to cPanel → Search "FTP"
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **GitHub CLI Help:** `gh help` or `gh help auth`
- **Workflow Status:** Your project's `/actions` tab

---

Generated: 2026-03-01  
Last Updated: Deployment analysis complete
