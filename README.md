# 🏏 CricScore Pro — Live Cricket Score Website

A **free, mobile-optimized** live cricket score website that automatically shows the T20 World Cup, India matches, and all international fixtures. Built to earn ad revenue through banner ads.

## ✨ Features

- 🔴 **Live Scores** — Auto-refreshes every 30 seconds
- 🏆 **Smart Priority** — T20 World Cup & India matches always featured first
- 📋 **Upcoming Matches** — Shows today's scheduled fixtures below
- 👤 **Player of the Match** — Displays featured athlete details when available
- 📱 **Mobile-First Design** — Looks great on all screen sizes
- ⚡ **Zero Dependencies for Frontend** — Pure HTML, CSS, JavaScript
- 🚀 **Vercel-Ready** — Deploy in 2 minutes, free forever

## 🗂️ Project Structure

```
cricscore-pro/
├── api/
│   └── score.js          # Vercel Serverless Function — fetches ESPN scores
├── public/
│   └── index.html        # Main website (mobile-optimized)
├── vercel.json           # Vercel deployment config
├── package.json
└── .gitignore
```

## 🚀 Deploy on Vercel (Free Forever)

### Option 1: One-Click via GitHub
1. Fork this repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import this GitHub repo
4. Click **Deploy** — done! ✅

### Option 2: Vercel CLI
```bash
npm install -g vercel
vercel
```

## 💰 Add Ads (Earn Revenue)

Open `public/index.html` and find these comment blocks:

```html
<!-- PASTE YOUR MONETAG / ADSTERRA 728x90 or 320x50 SCRIPT HERE -->
<!-- PASTE YOUR 300x250 AD SCRIPT HERE -->
<!-- PASTE YOUR BOTTOM 320x50 AD SCRIPT HERE -->
```

Replace the placeholder text with your ad network script tag.

### Recommended Ad Networks

| Network | Approval | Accepts Free Domains? |
|---|---|---|
| [A-Ads](https://a-ads.com) | Instant | ✅ Yes |
| [AdMaven](https://ad-maven.com) | 1–2 days | ✅ Yes |
| [Monetag](https://monetag.com) | Instant | ✅ Yes |
| [Adsterra](https://adsterra.com) | 1–3 days | ✅ Yes |
| [Google AdSense](https://adsense.google.com) | 2–4 weeks | ❌ Needs custom domain |

## 📡 Data Source

Scores are fetched from the **ESPN Cricinfo public API** (no API key needed):
```
https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel
```

The API is free and publicly accessible. For high-traffic commercial use, consider switching to a paid provider like [Sportmonks](https://sportmonks.com) or [CricketData.org](https://cricketdata.org).

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run locally
node server.js

# Visit
http://localhost:3000
```

> Note: `server.js` is for local development only. Vercel uses `api/score.js` in production.

## ⚖️ Legal & Ethics

- ✅ Using public ESPN Cricinfo feed for **personal/small project** use
- ✅ Banner ads are legal and ethical on sports content sites
- ✅ No user data collected — no cookies, no tracking
- ⚠️ For large-scale commercial use, switch to an official licensed cricket data API

## 📝 License

MIT — Free to use, modify, and deploy.

---

Built with ❤️ for cricket fans 🏏
