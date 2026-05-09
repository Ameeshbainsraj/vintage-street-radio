# 📻 Vintage Street Radio — ビシンジストリートラジオ

AI-powered lofi radio. Always live. Runs forever even when your laptop is off.

---

## Stack
- **Backend**: Node.js + Express (SSE streaming)
- **AI**: Groq API (`llama-3.3-70b-versatile`) — free tier
- **Frontend**: Vanilla HTML/CSS/JS — no framework needed
- **Hosting**: Railway (free tier, always on)

---

## Local dev

```bash
npm install
GROQ_API_KEY=gsk_your_key_here npm run dev
```

Visit `http://localhost:3000`

---

## Deploy to Railway (free, always on, laptop off ✅)

### Step 1 — Get a free Groq API key
1. Go to **console.groq.com**
2. Sign up free
3. Click **API Keys → Create API Key**
4. Copy it (starts with `gsk_`)

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "VSR launch"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vintage-street-radio.git
git push -u origin main
```

### Step 3 — Deploy on Railway
1. Go to **railway.app** — sign up free with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo
4. Click **Variables** → Add:
   ```
   GROQ_API_KEY = gsk_your_key_here
   ```
5. Railway auto-deploys. Done. 🎉

Your site will be live at `https://your-project.up.railway.app` — running 24/7 forever.

### Optional: Custom domain
In Railway → Settings → Custom Domain → add your domain (e.g. `vintagestreetraadio.com`)

---

## Free tier limits
- Railway: 500 hours/month free (enough for 24/7)
- Groq: generous free tier, auto-rotates tracks every ~12 seconds

---

## File structure
```
vsr/
├── server/
│   └── index.js        ← Express server + Groq SSE stream
├── public/
│   ├── index.html      ← Main page
│   ├── css/style.css   ← All styling
│   └── js/
│       ├── app.js      ← SSE client + UI
│       └── rain.js     ← Rain canvas animation
├── package.json
├── railway.json        ← Railway deploy config
└── README.md
```

---

Built for **@VSR2003** — Vintage Street Radio 🌙
