/* Test cases for the clinic routing engine. All requests are synthetic.
 * Each case says which lane the policy must give and, where it matters,
 * which rule must explain it. Runs in the browser and with `node tests.js`.
 */
(function (root) {
  "use strict";

  var CASES = [
    // Emergencies (English)
    { id: "T01", group: "Emergency", desc: "My father has chest pain and is sweating a lot since 20 minutes", age: 58, expect: "EMERGENCY", rule: "E1" },
    { id: "T02", group: "Emergency", desc: "She can't breathe properly and her lips look blue", age: 34, expect: "EMERGENCY", rule: "E2" },
    { id: "T03", group: "Emergency", desc: "Grandmother suddenly has slurred speech and her face is drooping", age: 72, expect: "EMERGENCY", rule: "E3" },
    { id: "T04", group: "Emergency", desc: "I don't want to live anymore and have thought about suicide", age: 22, expect: "EMERGENCY", rule: "E8" },
    { id: "T05", group: "Emergency", desc: "Child swallowed some phenyl from the bathroom 10 min ago", age: 3, expect: "EMERGENCY", rule: "E9" },
    // Emergencies (India-specific and Hinglish)
    { id: "T06", group: "India red flag", desc: "Khet mein kaam karte waqt saanp ne kaat liya pair pe", age: 41, expect: "EMERGENCY", rule: "E10" },
    { id: "T07", group: "India red flag", desc: "Papa ne galti se keetnashak pi liya hai, ulti ho rahi hai", age: 50, expect: "EMERGENCY", rule: "E9" },
    { id: "T08", group: "India red flag", desc: "4 din se bukhar hai aur ab masoodon se khoon aa raha hai", age: 19, expect: "EMERGENCY", rule: "E12" },
    { id: "T09", group: "India red flag", desc: "Worked in the sun all afternoon, loo lag gayi, very confused now", age: 45, expect: "EMERGENCY", rule: "E11" },
    { id: "T10", group: "India red flag", desc: "Wife is 8 months pregnant and has blurred vision with headache", age: 27, expect: "EMERGENCY", rule: "E13" },
    { id: "T11", group: "India red flag", desc: "Seene mein dard ho raha hai aur paseena aa raha hai", age: 61, expect: "EMERGENCY", rule: "E1" },
    { id: "T12", group: "India red flag", desc: "Beta behosh ho gaya school mein", age: 12, expect: "EMERGENCY", rule: "E4" },
    { id: "T13", group: "Emergency", desc: "Please book for tomorrow", age: 30, selfEmergency: true, expect: "EMERGENCY", rule: "E14" },

    // Framing guard (the new idea)
    { id: "T14", group: "Framing guard", desc: "Seene mein halka sa dard hai, ghar wale bolte hain gas hai, kuch nahi hai", age: 55, expect: "EMERGENCY", rule: "E1" },
    { id: "T15", group: "Framing guard", desc: "Mild headache for 3 days, tension ki koi baat nahi", age: 30, expect: "SAME_DAY", rule: "G1" },
    { id: "T16", group: "Framing guard", desc: "Just a minor thing, my mother feels dizzy every morning, probably nothing serious", age: 67, expect: "SAME_DAY", rule: "G1" },

    // Same-day review
    { id: "T17", group: "Same-day", desc: "3 din se tez bukhar hai aur badan dard", age: 25, expect: "SAME_DAY", rule: "S2" },
    { id: "T18", group: "Same-day", desc: "Baby has loose motions since yesterday and is not feeding well", age: 0.5, expect: "SAME_DAY", rule: "S5" },
    { id: "T19", group: "Same-day", desc: "Street dog bit my son on the leg this morning", age: 9, expect: "SAME_DAY", rule: "S6" },
    { id: "T20", group: "Same-day", desc: "Sugar ki dawai khatam ho gayi hai 2 din se", age: 63, expect: "SAME_DAY", rule: "S9" },
    { id: "T21", group: "Same-day", desc: "Need an appointment for a general consultation", age: 40, urgent: true, expect: "SAME_DAY", rule: "S1" },

    // Safe fallback
    { id: "T22", group: "Fallback", desc: "Not well", age: 35, expect: "SAME_DAY", rule: "F1" },
    { id: "T23", group: "Fallback", desc: "Cough for a week but no chest pain and no breathing difficulty", age: 29, expect: "SAME_DAY", rule: "F2" },
    { id: "T24", group: "Fallback", desc: "Kuch theek nahi lag raha, samajh nahi aa raha kya hai", age: 48, expect: "SAME_DAY", rule: "F3" },
    { id: "T25", group: "Fallback", desc: "मुझे कल से पेट में दर्द है और चक्कर आ रहे हैं", age: 38, expect: "SAME_DAY", rule: "F4" },
    { id: "T26", group: "Fallback", desc: "I would like to talk to someone about my knee", age: 52, expect: "SAME_DAY", rule: "F5" },

    // Routine
    { id: "T27", group: "Routine", desc: "Need my BP check and repeat prescription for next month", age: 66, expect: "ROUTINE", rule: "R1" },
    { id: "T28", group: "Routine", desc: "Baby ka teeka lagwana hai, 6 week vaccination due", age: 0.2, expect: "ROUTINE", rule: "R1" },
    { id: "T29", group: "Routine", desc: "Want to collect blood test reports and show them to the doctor", age: 33, expect: "ROUTINE", rule: "R1" },
    { id: "T30", group: "Routine", desc: "Medical fitness certificate needed for college admission", age: 18, expect: "ROUTINE", rule: "R1" },

    // Past medical history: can only raise a lane
    { id: "T31", group: "History", desc: "Seene mein thodi bechaini hai since evening", age: 62, history: { conditions: ["heart"] }, expect: "EMERGENCY", rule: "H1" },
    { id: "T32", group: "History", desc: "Fever since last night, 100 degree", age: 48, history: { conditions: ["lowimm"] }, expect: "EMERGENCY", rule: "H2" },
    { id: "T33", group: "History", desc: "Bathroom mein gir gaya, haath pe neel pad gaya", age: 70, history: { meds: ["thinners"] }, expect: "EMERGENCY", rule: "H3" },
    { id: "T34", group: "History", desc: "Need a check-up, ulti ho rahi hai aur khana nahi kha pa rahe", age: 55, history: { conditions: ["diabetes"], meds: ["insulin"] }, expect: "SAME_DAY", rule: "H5" },
    { id: "T35", group: "History", desc: "Knee pain follow-up, still painful after the tablets", age: 45, history: { repeatVisit: true }, expect: "SAME_DAY", rule: "H9" },
    { id: "T36", group: "History", desc: "Ankh mein dhundhla dikh raha hai aur sir dard", age: 24, history: { conditions: ["pregnant"] }, expect: "EMERGENCY", rule: "E13" },
    { id: "T37", group: "History", desc: "Need my BP check and repeat prescription for next month", age: 66, history: { conditions: ["bp", "diabetes"] }, expect: "ROUTINE", rule: "R1" },
    { id: "T38", group: "History", desc: "Pump se bhi aaram nahi mil raha, khansi bahut hai", age: 35, history: { conditions: ["lung"] }, expect: "EMERGENCY", rule: "H4" },
    { id: "T39", group: "Fallback", desc: "আমার মাথা খুব ব্যথা করছে দুই দিন ধরে", age: 40, expect: "SAME_DAY", rule: "F4" },
    { id: "T40", group: "India red flag", desc: "Bachhe ne galti se keede maarne wali dawai pee li, ulti kar raha hai", age: 6, expect: "EMERGENCY", rule: "E9" }
  ];

  // Checks for the AI combination rule: the AI can raise a lane, never lower it.
  var COMBINE_CASES = [
    { id: "C1", desc: "AI says ROUTINE for a rule emergency", text: "Chest pain since morning", ai: { level: "ROUTINE", unclear: false, phrases: [] }, expect: "EMERGENCY" },
    { id: "C2", desc: "AI raises a routine request it finds concerning", text: "Need a checkup, also my left arm feels heavy and numb", ai: { level: "EMERGENCY", unclear: false, phrases: ["left arm feels heavy and numb"] }, expect: "EMERGENCY" },
    { id: "C3", desc: "AI unsure about a routine request", text: "Need a checkup for something", ai: { level: "ROUTINE", unclear: true, phrases: [] }, expect: "SAME_DAY" },
    { id: "C4", desc: "AI call fails on a routine request", text: "Need my BP check next week", ai: null, aiFailed: true, expect: "SAME_DAY" },
    { id: "C5", desc: "AI invents a phrase that is not in the text", text: "Need a vaccination booster dose next month", ai: { level: "SAME_DAY", unclear: false, phrases: ["severe bleeding"] }, expect: "SAME_DAY", noPhrases: true },
    { id: "C6", desc: "AI suggests a lower lane; it is ignored and flagged", text: "3 din se bukhar hai aur sir dard", ai: { level: "ROUTINE", unclear: false, phrases: [], reason: "Sounds mild" }, expect: "SAME_DAY", lowerIgnored: true },
    { id: "C7", desc: "AI one-line reason is kept for staff, trimmed to 160 characters", text: "Need a checkup, also my left arm feels heavy and numb", ai: { level: "EMERGENCY", unclear: false, phrases: [], reason: new Array(60).join("arm numbness ") }, expect: "EMERGENCY", maxReason: 160 }
  ];

  // Checks for reading the model's reply: bad or missing answers must count as a failure.
  var PARSE_CASES = [
    { id: "P1", desc: "Plain JSON reply", text: '{"level":"SAME_DAY","unclear":false,"phrases":["bukhar"],"reason":"Fever for 3 days needs a call today."}', expect: "SAME_DAY" },
    { id: "P2", desc: "JSON inside a code fence", text: '```json\n{"level":"EMERGENCY","unclear":false,"phrases":[],"reason":"Chest symptoms."}\n```', expect: "EMERGENCY" },
    { id: "P3", desc: "Unknown lane is rejected", text: '{"level":"LOW","unclear":false,"phrases":[]}', expect: null },
    { id: "P4", desc: "Not JSON at all is rejected", text: "I think this patient is fine.", expect: null }
  ];

  function run(engine) {
    var rows = CASES.map(function (c) {
      var r = engine.route({ description: c.desc, age: c.age, urgent: !!c.urgent, selfEmergency: !!c.selfEmergency, history: c.history });
      var ruleIds = r.reasons.map(function (x) { return x.ruleId; });
      var pass = r.category === c.expect && (!c.rule || ruleIds.indexOf(c.rule) !== -1);
      return { id: c.id, group: c.group, desc: c.desc, expect: c.expect, expectRule: c.rule, got: r.category, gotRules: ruleIds, pass: pass };
    });
    COMBINE_CASES.forEach(function (c) {
      var base = engine.route({ description: c.text, age: 40 });
      var r = engine.combine(base, c.ai, c.text, !!c.aiFailed);
      var pass = r.category === c.expect && (!c.noPhrases || (r.ai && r.ai.phrases.length === 0))
        && (!c.lowerIgnored || (r.ai && r.ai.lowerIgnored === true)) && (!c.maxReason || (r.ai && r.ai.reason.length > 0 && r.ai.reason.length <= c.maxReason));
      rows.push({ id: c.id, group: "AI safety", desc: c.desc + ": \"" + c.text + "\"", expect: c.expect, got: r.category, gotRules: r.reasons.map(function (x) { return x.ruleId; }), pass: pass });
    });
    PARSE_CASES.forEach(function (c) {
      var p = engine.parseAiReply(c.text), got = p ? p.level : null;
      rows.push({ id: c.id, group: "AI reply", desc: c.desc, expect: c.expect || "rejected", got: got || "rejected", gotRules: [got || "rejected"], pass: got === c.expect });
    });
    return rows;
  }

  var api = { CASES: CASES, COMBINE_CASES: COMBINE_CASES, PARSE_CASES: PARSE_CASES, run: run };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    if (require.main === module) {
      var rows = run(require("../assets/js/engine.js"));
      rows.forEach(function (r) { console.log((r.pass ? "PASS " : "FAIL ") + r.id + "  expect " + r.expect + (r.expectRule ? "/" + r.expectRule : "") + "  got " + r.got + "/" + r.gotRules.join(",") + "  " + r.desc); });
      var failed = rows.filter(function (r) { return !r.pass; }).length;
      console.log("\n" + (rows.length - failed) + "/" + rows.length + " passed");
      process.exitCode = failed ? 1 : 0;
    }
  } else root.TriageTests = api;
})(typeof window !== "undefined" ? window : this);
