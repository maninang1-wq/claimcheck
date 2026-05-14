# ClaimCheck 🚗💻🛒💊🏠

**Find every dollar corporations owe you.** 34 open settlements across 5 verticals — Tech, Auto, Food, Pharma, and Housing. Free AI-powered eligibility matching. Live NHTSA recall data.

---

## 🚀 Deploy in 10 Minutes (Free)

### Step 1 — Get your API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account → API Keys → **Create Key**
3. Copy it (you'll only see it once)

### Step 2 — Push to GitHub
```bash
# Clone or download this folder, then:
git init
git add .
git commit -m "ClaimCheck v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/claimcheck.git
git push -u origin main
```

### Step 3 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (free)
2. Click **Add New Project**
3. Import your `claimcheck` repo
4. Framework: **Vite** (auto-detected)
5. Click **Environment Variables** → Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here`
6. Click **Deploy** ← that's it

Your site is live at `https://claimcheck-xyz.vercel.app` in ~2 minutes.

### Step 4 — Add your domain (optional, ~5 min)
1. Buy `claimcheck.app` at [Namecheap](https://namecheap.com) (~$12/yr)
2. In Vercel: Project → Settings → Domains → Add `claimcheck.app`
3. Vercel shows you 2 DNS records to add at Namecheap
4. Wait 5–60 minutes for DNS to propagate
5. Vercel auto-provisions SSL — HTTPS is free

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

**Note on the AI finder in local dev:** The `/api/match` serverless function only runs on Vercel. Locally, install `vercel` CLI for full parity:
```bash
npm i -g vercel
vercel dev   # runs both frontend + API routes locally
```

---

## 📁 Project Structure

```
claimcheck/
├── api/
│   └── match.js          ← Serverless function (Anthropic API proxy)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          ← React entry point
│   └── App.jsx           ← Full app (all 5 verticals)
├── index.html            ← HTML entry + SEO meta tags
├── vite.config.js
├── vercel.json           ← Routing + security headers
├── .env.example          ← Copy to .env.local
├── .gitignore
└── package.json
```

---

## ➕ Adding a New Vertical

Open `src/App.jsx` and make 3 changes:

```js
// 1. Add to CATEGORIES array
{ id: "travel", label: "Travel & Hotels", icon: "✈️", color: "#0ea5e9", desc: "..." }

// 2. Create your data array
const TRAVEL_SUITS = [
  { id:"tr1", cat:"travel", company:"Marriott", icon:"🏨", payout:500, ps:"$500", ... }
]

// 3. Spread into ALL_SUITS
const ALL_SUITS = [...TECH_SUITS, ...AUTO_SUITS, ...FOOD_SUITS, ...PHARMA_SUITS, ...HOUSING_SUITS, ...TRAVEL_SUITS]
```

Also add the new IDs to `/api/match.js` in the system prompt.
That's it — the entire app (AI finder, filters, saved cases, profile) picks it up automatically.

---

## 💰 Revenue Setup

**Law Firm Lead-Gen:**
- Build your firm partner list (Keller Postman, Edelson PC, Hagens Berman)
- Cold email with pilot offer (50 leads, pay per lead)
- Wire the "Connect with Attorney" buttons to a real form → your CRM
- Add Stripe or invoicing once you have a paying firm

**Pro Subscriptions:**
- Add Stripe Checkout to the pricing page
- Gate features (unlimited saves, early alerts) behind auth
- Recommended stack: Clerk (auth) + Stripe (billing) — both have Vercel integrations

**Analytics (free):**
- Add [PostHog](https://posthog.com) — drop in one JS snippet, see every click
- Or Google Analytics 4 — add `VITE_GA_ID` to env vars

---

## 🔒 Security Notes

- `ANTHROPIC_API_KEY` lives only in Vercel env vars — never in client code
- The `/api/match` route validates input length and method
- Security headers (X-Frame-Options, XSS protection) set in `vercel.json`
- NHTSA API is a public government endpoint — no key needed

---

## 📈 SEO Quick Wins (Week 1)

Deploy these pages first — they have near-zero competition:
1. `/t-mobile-data-breach-settlement` — 8,100 searches/mo
2. `/facebook-biometric-settlement-illinois` — 4,400/mo
3. `/equifax-settlement-claim` — 2,900/mo
4. `/am-i-eligible-t-mobile-settlement` — 1,200/mo

Use the SEO Generator tool (separate artifact) to write these pages in seconds.

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Deployment:** Vercel (free tier handles ~100K visits/mo)
- **AI:** Anthropic Claude (via serverless API route)
- **Auto Data:** NHTSA Federal API (public, no key)
- **Styling:** Inline CSS + Google Fonts (no CSS framework)
- **State:** React useState (no Redux needed at this scale)

---

*ClaimCheck is not a law firm and does not provide legal advice. Settlement data is for informational purposes only.*
