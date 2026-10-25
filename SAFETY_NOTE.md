# Safety note (Sanket)
What this prototype does to stay safe, and what it does not do.
## What it is
An administrative sorting aid for the front desk of a community clinic. It suggests one of three lanes (routine appointment, same-day human review, emergency guidance) for staff to check. It is not a medical device, gives no diagnosis or medical advice, and is not tested on real patients.
## Emergencies are never delayed
- The 108 / 112 strip is on every screen, and the form tells people not to use it in an emergency.
- When a red flag fires, the requester immediately sees "Call 108 or 112 now" instead of a booking. For self-harm words the Tele-MANAS line 14416 is shown too.
- Red-flag rules run first, without the AI, so a slow or failed AI call can never hold back emergency guidance.
- Ticking "This feels like an emergency" always gives emergency guidance.
## Past history can only raise a lane
- Known conditions, regular medicines, pregnancy, a recent hospital stay and a repeat visit are asked in one optional step, by the patient or by staff on the phone.
- Each history rule (H1 to H11) needs a history item and something in today's text, for example heart disease and chest discomfort, or a blood thinner and a fall. History never lowers a lane and never names a condition.
## No diagnosis
- Rules describe what was written ("mentions chest pain"), never what it might be.
- The AI is asked only when staff press Ask AI, after the rules. It returns a lane, short quotes from the request and one short reason line (cut to 160 characters, asked to name no disease). Quotes that don't appear in the request are thrown away, and a lower lane is shown but ignored.
- The requester only sees "call 108 / 112" or "staff will review your request".
## Safe fallback
- Routine needs positive evidence. Unclear, very short, unsure or unmatched requests go to same-day human review.
- A red flag written with a negation ("no chest pain", "saans ki dikkat nahi") is not ruled out by the tool; a person checks it.
- The rules read English and Hinglish. Text in any Indian script (Devanagari, Tamil, Bengali and others) goes to a person.
- If the AI check fails, a routine result is raised to human review.
- The framing guard stops reassurance from family members ("ghar wale bolte hain gas hai") from lowering the lane.
## People stay in charge
- Every suggestion shows the rule IDs and highlights the exact words that triggered them.
- Staff accept or change every lane with a reason, and every decision is logged. Overrides to a more urgent lane are counted as misses and should drive rule changes.
- The tool is meant to be used under a named clinician who owns the policy and reviews the log.
## Data and privacy
- Only made-up requests are used. The demo asks for no phone numbers or ID numbers, in line with data minimisation under India's DPDP Act 2023.
- Requests are stored only in this browser. The optional AI check sends the request text (with reassurance removed), age and ticked history to Google Gemini or Anthropic Claude, with no name. The API key is kept only in the browser's localStorage.
## Known limits
- Keyword rules miss unusual wording and spelling. The AI check helps, but neither is validated clinically.
- Hinglish coverage is a starter list. Other Indian scripts are not read yet; they fall back to a person.
- The tests are made up by the team, not taken from real clinic data.
- Future work: review by a clinician, testing on consented real requests, regional language support, and a check against CDSCO guidance for medical software before any real use.
