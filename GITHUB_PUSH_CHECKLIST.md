# GitHub Push - Pre-Deployment Checklist

## Status: ✅ READY FOR GITHUB

All hardcoded secrets have been removed from the source code and replaced with environment variable references.

---

## Before Pushing to GitHub

### 1. **Verify Local Repository Status**

```bash
cd /Users/eugenio/ECDEV/PokeFEC_FS_Cloud

# Check for any remaining secrets
git status
git diff --cached

# Scan for accidental secrets
grep -r "eyJhbGciOi" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null || echo "✅ No JWT found"
grep -r "Bearer rnd_" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null || echo "✅ No Render API keys found"
```

### 2. **Rotate Secrets (CRITICAL)**

Before pushing, you MUST rotate all exposed secrets:

#### Supabase Dashboard
1. Go to **Settings → API Keys**
2. Click **Generate New Key** for **Service Role Secret**
   - Copy new key to local `.env` as `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Generate New Key** for **Anon Key** (sb_publishable_...)
   - Copy new key to local `.env` as `SUPABASE_ANON_KEY`
4. **Delete or invalidate old keys**

#### Database Password Reset
1. Go to **Settings → Database → Users**
2. Click **Reset Password** for `postgres` user
3. Update `DATABASE_URL` in local `.env` with new password
4. Test connection: `psql $DATABASE_URL -c "SELECT version();"`

#### Render API Key Rotation
1. Go to **Account Settings → API Keys**
2. Create new API key
3. Save as `RENDER_API_KEY` in environment (not in .env file)

### 3. **Update Local `.env` File**

```bash
# Copy example
cp .env.example .env

# Edit with new secrets
nano .env
# OR
code .env

# Verify it contains:
# - DATABASE_URL (with new password)
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY (new)
# - SUPABASE_ANON_KEY (new)
# - JWT_SECRET
# - NODE_ENV=production
# - FRONTEND_URL=https://www.pokedec.ch
# - NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 4. **Test Backend Locally**

```bash
cd backend

# Install dependencies
npm install

# Test connection
node test-db.js  # If available
# OR
npm start        # Check for connection errors
```

### 5. **Verify .gitignore Coverage**

```bash
# Check that .env files are in .gitignore
cat .gitignore | grep -E "^\\.env|^\\*\\.env"

# Expected output:
# .env
# .env.local
# .env.render
# .env.*.local
# .env.synology
# .env.supabase
# *.env
```

### 6. **Git Configuration**

```bash
# Configure git (if needed)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Verify .env files won't be committed
git check-ignore .env .env.render .env.supabase
# Expected: all should return .gitignore match
```

---

## Commit and Push to GitHub

### Create New Repository on GitHub

1. Go to **github.com/new**
2. Create repository: `PokeFEC_FS_Cloud_Cleaned` or similar name
3. **DO NOT initialize with README** (we already have one)
4. Copy the repository URL

### Push Code to GitHub

```bash
cd /Users/eugenio/ECDEV/PokeFEC_FS_Cloud

# Initialize git (if not already done)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/PokeFEC_FS_Cloud_Cleaned.git

# Stage all files (excluding .gitignore'd files)
git add -A

# Verify what will be committed (NO .env files!)
git status

# Commit
git commit -m "Initial commit: PokéFEC application with hardcoded secrets removed

- Remove all hardcoded JWT tokens, API keys, and database credentials
- Replace with environment variable references (\${VAR_NAME})
- Update .env.example with all required variables
- Add SECURITY_CLEANUP.md documentation
- All secrets must be provided via environment on deployment
- See SECURITY_CLEANUP.md for rotation checklist"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Verify Push

1. Go to your GitHub repository
2. Verify:
   - ✅ No `.env`, `.env.render`, `.env.supabase` files visible
   - ✅ `.env.example` is visible
   - ✅ `SECURITY_CLEANUP.md` is visible
   - ✅ Source code files reference `process.env.XXX` or `${VAR_NAME}`

---

## Deploy to Render

### 1. Update Render Environment Variables

```bash
# Set RENDER_API_KEY in your environment
export RENDER_API_KEY="rnd_..." # Your new API key

# Run update script
bash update_render.sh
```

### 2. Deploy Backend

```bash
# Push to your Render-connected repository
git push origin main

# Render auto-deploys from main branch
# Check Render Dashboard for deployment logs
```

### 3. Verify Deployment

```bash
# Check backend health
curl https://your-render-backend.onrender.com/health

# Check logs
# - Go to Render Dashboard
# - Select service
# - View logs for any env var errors
```

---

## Post-Deployment Verification

- [ ] Backend starts successfully with new env vars
- [ ] Database connection works
- [ ] Supabase auth endpoints respond
- [ ] Frontend can reach backend
- [ ] User login works with new Supabase keys
- [ ] No "token not found" or auth errors in console
- [ ] GitGuardian shows no new secrets detected

---

## Rollback Plan (If Needed)

If deployment fails:

1. **Check Render logs** for specific errors
2. **Verify all env vars** are set in Render dashboard
3. **Test locally** with same env var values
4. **Rotate keys again** if there's any doubt about exposure

---

## Questions?

Refer to:
- [SECURITY_CLEANUP.md](SECURITY_CLEANUP.md) — Detailed security info
- [README.md](README.md) — Project overview
- [.env.example](.env.example) — Environment variable reference

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for GitHub push  
**Next Action:** Rotate secrets → Update .env → Commit → Push
