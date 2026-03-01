# Deployment Guide — OJ Gnan Tax App

## 🚀 How to Push Changes to GitHub Pages

GitHub Pages is **automatically deployed** via GitHub Actions whenever you push to the `main` branch.

---

## ✅ Standard Workflow (Recommended)

Just push your changes to `main` — GitHub Actions handles the rest automatically.

```bash
# 1. Make your code changes

# 2. Stage all changes
git add .

# 3. Commit with a message
git commit -m "Your change description"

# 4. Push to main branch
git push origin main
```

**That's it!** GitHub Actions will:
1. Install dependencies
2. Build the React app
3. Deploy the build to the `gh-pages` branch
4. GitHub Pages serves from `gh-pages` → live at https://sandeeplati.github.io/oj-finance-tax/

**Deployment takes ~2-3 minutes** after pushing.

---

## 📋 First-Time Setup on a New Machine

```bash
# 1. Clone the repository
git clone https://github.com/sandeeplati/oj-finance-tax.git
cd oj-finance-tax

# 2. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Install all dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Run locally
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm start
```

---

## 🔍 Check Deployment Status

```bash
# Check if GitHub Actions workflow succeeded
# Visit: https://github.com/sandeeplati/oj-finance-tax/actions

# Or check via curl
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  https://sandeeplati.github.io/oj-finance-tax/
```

---

## 🛠️ Manual Deploy (if GitHub Actions fails)

If you need to manually build and push to `gh-pages`:

```bash
# 1. Build the frontend
cd frontend
npm run build

# 2. Install gh-pages tool (one-time)
npm install -g gh-pages

# 3. Deploy the build folder
gh-pages -d build --repo https://github.com/sandeeplati/oj-finance-tax.git

# 4. Go back to root
cd ..
```

---

## 🔑 Git Push with PAT Token (if credential issues)

If `git push` asks for a password or fails authentication:

```bash
# Push using your Personal Access Token
PAT="your_github_pat_token_here"
git remote set-url origin "https://sandeeplati:${PAT}@github.com/sandeeplati/oj-finance-tax.git"
git push origin main

# Reset remote URL (remove token from URL for security)
git remote set-url origin https://github.com/sandeeplati/oj-finance-tax.git
```

> **Generate a PAT at:** https://github.com/settings/tokens/new  
> Required scopes: `repo` + `workflow`

---

## 📁 Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Source code — push your changes here |
| `gh-pages` | Built React app — auto-managed by GitHub Actions, do NOT edit manually |

---

## 🌐 URLs

| Environment | URL |
|-------------|-----|
| **Live (GitHub Pages)** | https://sandeeplati.github.io/oj-finance-tax/ |
| **Repository** | https://github.com/sandeeplati/oj-finance-tax |
| **Actions** | https://github.com/sandeeplati/oj-finance-tax/actions |
| **Local Frontend** | http://localhost:3000 |
| **Local Backend** | http://localhost:5001 |