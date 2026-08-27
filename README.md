# 🌸 daya

A private period, cycle, fertility, pregnancy and perimenopause companion — a full-featured
alternative to Flo with every "premium" feature free, and **all data stored only on your device**.

**Live app:** https://divyambanga.github.io/Daya/

Open that link in Safari on iPhone → Share → **Add to Home Screen** → it installs like a native
app, works offline, and keeps everything local.

## Features

- **Cycle tracking** — period logging, smart predictions (recency-weighted with outlier
  rejection), fertile window & ovulation estimates, phase-aware home screen with a signature
  cycle wheel
- **Four life modes** — Track cycle · Get pregnant (TTC) · Pregnancy (week-by-week, weeks 1–42,
  kick counter, contraction timer) · Perimenopause (monthly symptom load score, HRT tracking)
- **80+ trackers** — flow, moods, symptoms, discharge, sex & drive, digestion, ovulation &
  pregnancy tests, activity, lifestyle, water, weight, sleep, basal temperature, meds, notes
- **On-device insights engine** — daily personalized cards + cross-cycle symptom pattern
  detection ("headaches recur in your luteal phase")
- **Symptom checker** — educational self-assessments for PCOS, endometriosis, fibroids, PMDD
- **Charts** — cycle & period length, BBT with coverline, weight/sleep/water trends, top symptoms
- **Health report** — printable summary to bring to a clinician
- **65-article health library** + 42 weeks of pregnancy content, all offline
- **Reminders** — in-app + exported iPhone Calendar alerts (.ics with native notifications)
- **Import** — Apple Health export (zip/xml), Flo "request my data" JSON, manual quick-add;
  export as JSON backup / CSV
- **Optional AI assistant** — "Ask Daya", powered by Claude with your own Anthropic API key
  (stored on device, calls go directly to Anthropic)
- **Privacy** — no account, no server, no analytics; optional PIN lock; light & dark themes

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit + DOM smoke tests
npm run build      # typecheck + production build
```

Pushes to `main` auto-deploy to GitHub Pages via Actions.

## Disclaimer

Daya provides educational information and estimates — not medical advice, diagnosis, or
contraception. Always talk to a clinician about your health.
