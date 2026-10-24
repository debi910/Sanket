# Sanket (संकेत)

**Safer OPD front doors for India.** Sanket reads clinic appointment requests the way Indian families write them, in English, Hinglish or Hindi. It catches red flags and sorts each request into one of three lanes: **emergency guidance** (call 108 or 112), **same-day review**, or a **routine booking** on the right programme day. A person checks every suggestion. Sanket never diagnoses.

Built for the VIT AI Innovate-A-Thon, Question 4 (medical appointment triage and routing). **Synthetic data only. Not a medical device.**

**Live demo:** https://debi910.github.io/Sanket/

## The four windows

| Window | Who | What it does |
|---|---|---|
| **Patient** `#/patient` | Patients and families | Four steps: who it is for, past health history, the problem (typed or spoken, in English or Hindi), then a token. Emergencies get 108 / 112 straight away, plus Tele-MANAS 14416 when there are self-harm words. Routine requests are booked into the right clinic day, with a list of what to bring and a calendar file. |
| **Front desk** `#/desk` | Receptionist or ANM | A live queue sorted by lane, with wait times against targets. Each request shows highlighted evidence, rule reasons, the framing guard comparison, history and the booking or referral chain. Staff accept or change a lane with a reason. Phone calls and walk-ins can be added with an instant lane preview. Keyboard: `J` / `K` to move, `Enter` to open. |
| **Clinician** `#/clinician` | Medical officer | The same-day worklist. Call back, then record an outcome: come today, eSanjeevani teleconsult, refer to the CHC/FRU, routine slot, or escalate to 108. Rules can be flagged for review. |
| **Clinic lead** `#/insights` | PHC in-charge | Safety measures (rule misses, lowered lanes, framing guard saves, time to emergency guidance), rule activity, the decision log as CSV, and the Indian public data behind the design. |

Open two windows side by side. A request sent from the patient window shows up on the front desk at once, because both share the browser's storage.

## What is new

1. **Framing guard.** Families often soften a request, for example "kuch nahi hai" or "ghar wale bolte hain gas hai". A February 2026 Nature Medicine study found that this kind of reassurance made an LLM triage tool 11.7 times more likely to give a less urgent answer. Sanket removes these phrases, scores the request again, and keeps the more urgent lane.
2. **Past history can only escalate.** Eleven history rules (H1 to H11) combine what the patient tells us (heart disease, blood thinner, chemo or HIV, diabetes or insulin, asthma or COPD, kidney disease, pregnancy, a recent hospital stay, or a repeat visit) with today's text. Each rule needs both. For example, heart disease plus chest discomfort gives emergency guidance, and a blood thinner plus a fall does too. History alone never names a disease and never lowers a lane.
3. **Indian red flags and wording.** Snakebite, scorpion sting, pesticide, dengue warning signs, heatstroke ("loo lag gayi", "लू लग गई") and pregnancy danger signs. Patterns cover English, romanised Hinglish and Devanagari Hindi. Other scripts go to a person.
4. **Programme-day booking.** Routine requests go to the clinic day that fits: routine immunisation, the PMSMA antenatal clinic on the 9th of every month, the NCD clinic for BP and sugar, the reports desk or the dressing room.
5. **The AI can only escalate.** An optional Claude second reader (off by default) may raise a lane or mark text as unclear. It can never lower one, and any quotes it gives that are not in the request are dropped.

## Run it

It is a static site with no build step.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node tests/tests.js           # 52 routing test cases
```

You can also run the test cases in the browser under **Method → Test cases**.

To try the AI check, open **Insights → Settings**, switch it on and paste an Anthropic API key. The key stays in that browser tab only (sessionStorage). In a real deployment this call belongs on a server.

## Project layout

```
index.html                 app shell (hash routes)
assets/js/engine.js        routing rules, history rules, framing guard, AI combine (browser + Node)
assets/js/store.js         shared state, synthetic seed queue, decisions log
assets/js/india.js         public data with sources, referral chain, seasons, programme days
assets/js/views/*.js       home, patient, desk, clinician, insights, about
assets/js/ai.js            optional Claude second reader (escalate-only)
assets/css/*.css           design system and views
tests/tests.js             52 test cases (node or browser)
SAFETY_NOTE.md             safety note
```

## Design

The motion and interaction details follow [Emil Kowalski's design engineering skill](https://github.com/emilkowalski/skills): custom ease-out curves, UI motion under 300 ms, `scale(0.97)` on press, nothing entering from `scale(0)`, short staggers, interruptible transitions for toasts and drawers, hover effects only on devices with a fine pointer, and `prefers-reduced-motion` respected. Light and dark themes are both supported.

## Data sources

- Health Dynamics of India (Infrastructure & Human Resources) 2022-23, MoHFW: 79.9% of specialist posts at rural CHCs short (4,413 of 21,964 filled)
- NFHS-5 (2019-21) India fact sheet: anaemia, raised blood pressure, high blood sugar, immunisation and ANC coverage
- NCVBDC dengue cases and deaths, 2021 to 2025
- NCDC heat-related illness surveillance, March to June 2024 (40,984 suspected heatstroke cases, 114 deaths)
- Suraweera et al., eLife 2020: about 58,000 snakebite deaths a year in India
- PMSMA, Tele-MANAS 14416, eSanjeevani, IPHS 2022

The queue, requests, decisions and the 14-day trend are synthetic. Seasonal patterns are qualitative.

## Implemented and future work

| Implemented | Future work |
|---|---|
| Four role windows, synced live across tabs | Server backend with login, audit trail and role permissions |
| English, Hinglish and Devanagari Hindi rules, voice input, read-aloud | Tamil, Bengali, Marathi, Telugu and more; IVR for feature phones |
| Past history as escalate-only risk modifiers | History from ABHA records, with consent |
| Framing guard, negation and unclear-text fallbacks | Clinician review of every rule; consented testing on real requests |
| Optional Claude second reader | Multi-run agreement check; server-side key handling |
| Programme-day booking and calendar file | ABDM, eSanjeevani and HMIS integration |
| Safety dashboard, season watch, CSV export | Equity audit by age, language and source; CDSCO classification check |
