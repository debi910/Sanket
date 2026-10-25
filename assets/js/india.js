// Indian context: public statistics (with sources), the demo clinic's
// referral chain, seasonal patterns and the national programme days that
// routine requests are booked into.

export const SOURCES = {
  hdi: { label: "Health Dynamics of India (Infrastructure & Human Resources) 2022-23, MoHFW", url: "https://mohfw.gov.in/?q=en/publications-11" },
  nfhs: { label: "National Family Health Survey (NFHS-5), 2019-21, India fact sheet, IIPS & MoHFW", url: "https://rchiips.org/nfhs/factsheet_NFHS-5.shtml" },
  dengue: { label: "NCVBDC, Dengue cases and deaths 2021-2026 (till April)", url: "https://ncvbdc.mohfw.gov.in/Doc/Dengue-Cases-deaths-2021-2026-till-April.pdf" },
  heat: { label: "NCDC heat-related illness surveillance, 1 Mar to 18 Jun 2024 (reported by MoHFW)", url: "https://thesouthfirst.com/health/summers-wrath-114-heatwave-deaths-reported-nearly-41000-cases-of-suspected-heatstroke" },
  heat25: { label: "NCDC data via RTI, March to June 2025 (PTI)", url: "https://www.theweek.in/wire-updates/national/2025/07/27/del4-climate-heat-rti.html" },
  snake: { label: "Suraweera et al., Trends in snakebite deaths in India from 2000 to 2019, eLife 2020", url: "https://elifesciences.org/articles/54076" },
  pmsma: { label: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA): free antenatal check-up on the 9th of every month", url: "https://pmsma.mohfw.gov.in/" },
  telemanas: { label: "Tele-MANAS national mental health helpline 14416", url: "https://telemanas.mohfw.gov.in/" },
  esanjeevani: { label: "eSanjeevani national telemedicine service", url: "https://esanjeevani.mohfw.gov.in/" },
  iphs: { label: "Indian Public Health Standards (IPHS) 2022", url: "https://nhsrcindia.org/IPHS2022" },
  nature: { label: "Nature Medicine, Feb 2026: ChatGPT Health under-triaged 52% of emergencies; family reassurance OR 11.7 (summary)", url: "https://www.iatrox.com/blog/chatgpt-health-undertriage-52-percent-emergencies-nature-medicine-2026" }
};

export const STATS = {
  specialistGap: { value: 79.9, of: "4,413 of 21,964 specialist posts at rural CHCs filled (March 2023)", src: "hdi" },
  infra: [
    { level: "Sub-centre", count: 169000, plus: true, note: "ANM and health worker; first contact for villages", src: "hdi" },
    { level: "PHC", count: 32000, approx: true, note: "1 medical officer; OPD, immunisation, ANC, NCD screening", src: "hdi" },
    { level: "CHC / FRU", count: 6359, note: "30 beds; meant to have 4 specialists. 79.9% of specialist posts are short", src: "hdi" },
    { level: "District hospital", count: 714, note: "Full emergency, ICU, blood bank, surgery", src: "hdi" }
  ],
  dengue: [
    { year: 2021, cases: 193245, deaths: 346 },
    { year: 2022, cases: 233251, deaths: 303 },
    { year: 2023, cases: 289235, deaths: 485 },
    { year: 2024, cases: 233519, deaths: 297 },
    { year: 2025, cases: 121824, deaths: 131 }
  ],
  dengueTop2024: [
    { state: "Karnataka", cases: 32886 }, { state: "Tamil Nadu", cases: 27378 }, { state: "Kerala", cases: 20674 },
    { state: "Maharashtra", cases: 19385 }, { state: "Uttar Pradesh", cases: 15868 }
  ],
  heat2024: { suspected: 40984, deaths: 114 },
  heat2025: { suspected: 7000, deaths: 14 },
  snakebiteDeaths: 58000,
  nfhs: [
    { label: "Children 6-59 months with anaemia", value: 67.1, rule: "Routine child visits also screen for anaemia" },
    { label: "Women 15-49 with anaemia", value: 57.0, rule: "ANC and PMSMA days" },
    { label: "Men 15+ with raised blood pressure or on medicine", value: 24.0, rule: "NCD clinic refill booking" },
    { label: "Women 15+ with raised blood pressure or on medicine", value: 21.3, rule: "NCD clinic refill booking" },
    { label: "Men 15+ with high blood sugar or on medicine", value: 15.6, rule: "Medicine run-out goes same-day (S9)" },
    { label: "Women 15+ with high blood sugar or on medicine", value: 13.5, rule: "Medicine run-out goes same-day (S9)" }
  ],
  nfhsCoverage: [
    { label: "Children 12-23 months fully vaccinated", value: 76.4 },
    { label: "Births in a health facility", value: 88.6 },
    { label: "Mothers with 4 or more ANC visits", value: 58.1 },
    { label: "Households with any health insurance or scheme", value: 41.0 }
  ]
};

// Relative seasonal load, 0 (low) to 3 (peak). These are qualitative patterns
// from IDSP / NCVBDC / NCDC reporting, not counts, and vary by state.
export const SEASONS = {
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  rows: [
    { key: "heat", label: "Heat illness", icon: "thermo", rule: "E11", v: [0, 0, 1, 2, 3, 3, 1, 0, 0, 0, 0, 0] },
    { key: "diarrhoea", label: "Diarrhoea & cholera", icon: "drop", rule: "S5", v: [0, 0, 1, 2, 3, 3, 3, 3, 2, 1, 0, 0] },
    { key: "snake", label: "Snakebite", icon: "snake", rule: "E10", v: [0, 0, 0, 1, 1, 2, 3, 3, 3, 2, 1, 0] },
    { key: "malaria", label: "Malaria", icon: "bug", rule: "S2", v: [0, 0, 0, 0, 1, 2, 3, 3, 3, 2, 1, 0] },
    { key: "dengue", label: "Dengue", icon: "bug", rule: "E12", v: [0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 2, 1] },
    { key: "resp", label: "Pneumonia & flu", icon: "wind", rule: "E2", v: [3, 2, 1, 0, 0, 0, 1, 1, 1, 1, 2, 3] }
  ]
};

export function seasonWatch(date = new Date()) {
  const m = date.getMonth();
  const peak = SEASONS.rows.filter((r) => r.v[m] >= 3);
  const rising = SEASONS.rows.filter((r) => r.v[m] === 2 && r.v[(m + 1) % 12] >= r.v[m]);
  return { month: SEASONS.months[m], peak, rising };
}

// ---------- The demo clinic ----------
export const CLINIC = {
  name: "Community clinic",
  block: "Demo district",
  hours: "Mon to Sat, 9:00 AM to 4:00 PM",
  mo: "Medical officer",
  referral: [
    { level: "This clinic", name: "Community clinic", dist: "", detail: "OPD, nurse review, ANC, immunisation, NCD clinic. No night emergency cover." },
    { level: "First referral unit", name: "the nearest 24x7 hospital", dist: "", detail: "24x7 emergency and delivery, basic surgery, blood storage." },
    { level: "District", name: "District Hospital", dist: "38 km", detail: "ICU, anti-snake venom stock, dialysis, specialists." }
  ]
};

// ---------- Programme-day booking ----------
// Indian PHCs run fixed-day national programmes. Booking a routine request
// into the right one saves the patient a wasted trip. Weekdays are the demo
// clinic's; PMSMA on the 9th is national.
export const SERVICES = [
  { id: "imm", name: "Routine immunisation session", icon: "syringe", days: [3], time: "9:30 AM", bring: ["MCP card (Mother and Child Protection card)", "Previous vaccination record"],
    match: /vaccin|immuni[sz]|\bteeka\b|\btika\b|tikakaran|booster/ },
  { id: "anc", name: "PMSMA antenatal clinic (9th of every month)", icon: "baby", monthDay: 9, time: "10:00 AM", bring: ["MCP card", "Earlier scan and test reports"],
    match: /pregnan|garbh|anc\b|antenatal|pet se/ },
  { id: "ncd", name: "NCD clinic (BP, sugar)", icon: "heart", days: [2, 5], time: "11:00 AM", bring: ["Old prescription", "BP or sugar diary if you keep one", "Medicine strips"],
    match: /\bbp\b|blood pressure|sugar|diabet|insulin|hypertens|prescription|refill|dawai|dawa/ },
  { id: "rep", name: "Reports and certificates desk", icon: "doc", days: [1, 2, 3, 4, 5, 6], time: "2:00 PM", bring: ["Test reports", "ID for certificates"],
    match: /report|result|certificate|fitness/ },
  { id: "dress", name: "Dressing room", icon: "bandage", days: [1, 2, 3, 4, 5, 6], time: "9:00 AM", bring: ["Discharge or wound card"],
    match: /dressing|wound|stitch/ },
  { id: "opd", name: "General OPD", icon: "steth", days: [1, 2, 3, 4, 5, 6], time: "9:00 AM", bring: ["Old prescriptions and reports", "ABHA health ID if you have one (optional)"],
    match: /.*/ }
];

function nextDate(svc, from) {
  const d = new Date(from); d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 45; i++) {
    const c = new Date(d); c.setDate(d.getDate() + i);
    if (svc.monthDay ? c.getDate() === svc.monthDay : svc.days.includes(c.getDay())) return c;
  }
  return new Date(d.getTime() + 86400000);
}

export function suggestService(text, lane, from = Date.now()) {
  const t = String(text || "").toLowerCase();
  const svc = SERVICES.find((s) => s.match.test(t));
  const date = nextDate(svc, from);
  return { id: svc.id, name: svc.name, hi: svc.hi, icon: svc.icon, date: date.getTime(), time: svc.time, bring: svc.bring, lane };
}
