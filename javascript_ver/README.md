# WebNX Intake Portal — Vercel Deployment

## Project Structure
```
webnx-vercel/
├── api/
│   └── create-ticket.js   ← Serverless function (replaces server.js)
├── public/
│   └── index.html         ← Frontend
├── vercel.json            ← Routing config
└── package.json
```

## Deploy to Vercel

### 1. Push to GitHub
Create a new repo and push this folder:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/webnx-intake.git
git push -u origin main
```

### 2. Import on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/log in (free)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Click **Deploy** (no build settings needed)

### 3. Add Environment Variables
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `JIRA_DOMAIN` | `yourcompany.atlassian.net` |
| `JIRA_EMAIL` | `you@yourcompany.com` |
| `JIRA_API_TOKEN` | your Jira API token |
| `JIRA_PROJECT_KEY` | e.g. `WEB` |

After adding variables, go to **Deployments → Redeploy** so they take effect.

### 4. Share the URL
Vercel gives you a URL like `https://webnx-intake.vercel.app` — share that with your team.

## Creating a Jira card
The intake form supports up to five items per Jira card. The card title is suggested from the item names and can be edited before submission. Build Sheet and Serial Sheet links are optional and must be HTTP or HTTPS URLs. A multi-item card is created with the item details and links in its description. Press **Enter** in the Serial Sheet field to add the next item, or **Ctrl/Command+Enter** to create the card. Use the **Dark mode** toggle to switch themes; your choice is saved in the browser.

## Getting a Jira API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Copy the token and paste it into Vercel's env vars
