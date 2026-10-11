# 03 - Established breathing practices, and the music link assessed honestly

Research notes for the breathwork app design document. Compiled 2026-10-11.

**How to read this.** Claims are tagged by source type. Where a number comes from a paper I actually opened (abstract or full text) it is cited. Where it comes from search-result summaries only, or from my own background knowledge, I say so. Evidence grades:

- **STRONG** - multiple controlled trials / meta-analysis, plausible mechanism, replicated.
- **MODERATE** - some RCTs or a systematic review, but small, heterogeneous, or low risk-of-bias quality.
- **WEAK** - few small trials, uncontrolled, or contradictory.
- **TRADITIONAL-ONLY** - textual/lineage claim with no meaningful controlled evidence (or evidence against).

Grades are about *measurable physiological/psychological effects of the technique as practised*, not about whether the tradition is valuable.

---

## 1. Headline findings (read this if nothing else)

1. **The only practices with a clean, well-characterised, replicated mechanism are slow paced breathing near 0.1 Hz (about 5-6 breaths/min) and the HRV-biofeedback protocol built on it.** The mechanism is baroreflex/respiratory-sinus-arrhythmia resonance. It is cardiovascular physics, not mysticism, and it is the natural place for a metronome-like pacing app.
2. **Long-exhale / "cyclic sighing" style patterns have the best recent head-to-head RCT evidence for mood** (Balban 2023), but it is one remote trial.
3. **Fast / forceful breathing (Wim Hof, kapalabhati, bhastrika, SKY's fast phase, "breath of fire") is a different category**: arousing, hyperventilatory, and carries real safety risk (syncope; drowning if combined with water). Evidence for benefit is small-sample and mostly acute.
4. **Most classical pranayama claims are TRADITIONAL-ONLY or WEAK.** The 1:4:2 kumbhaka ratio, the "cooling" effect of sheetali/sitkari, and surya/chandra bhedana effects are not supported by controlled data; the one direct test of sheetali/sitkari "cooling" found the opposite (a small rise in oxygen consumption).
5. **Music link: the *arithmetic* is real but trivial; the *entrainment* is partial and unreliable; the *physiological* effect of music tempo on breathing is real but pushes in the wrong direction for relaxation unless the tempo is slow; "healing frequencies" are decorative.** See Part B verdict.

---

## 2. Practices table

| Practice | Concrete timing / ratio | Claimed effect | Evidence grade | Safety flag |
|---|---|---|---|---|
| **Resonance-frequency (HRV biofeedback) breathing** (Lehrer-Gevirtz) | Individually found RF, usually 4.5-6.5 breaths/min (population mean about 5.5-6, 0.09-0.1 Hz; taller people and men tend lower). Paced inhale/exhale, smooth, often slightly longer exhale. Training typically about 10 weekly sessions + about 20 min/day home practice (protocol details from background knowledge of Lehrer 2000 manual; see 3.1) | Raises RSA/HRV amplitude, baroreflex gain; reduces anxiety, depression, anger; BP, asthma, performance | **STRONG** for the physiology; **MODERATE** for clinical outcomes (58 RCTs, small-to-moderate pooled effect, few per outcome) | Low. Avoid over-deep breathing (hypocapnia) - keep tidal volume normal. |
| **Generic slow paced breathing** | < 10/min (Zaccaro review); 4-6/min typical | Increased parasympathetic markers, EEG alpha up/theta down, less anxiety | **MODERATE** (15 studies in healthy adults; mechanisms still debated) | Low |
| **Cyclic sighing** (Balban 2023, Stanford) | Double inhale through nose (second sip tops up), long slow exhale; 5 min/day for 28 days | Greater mood improvement and bigger drop in resting respiratory rate than mindfulness meditation or box breathing / hyperventilation-retention | **MODERATE** (single remote RCT; self-report mood) | Low |
| **Diaphragmatic breathing training** | Abdominal-dominant breathing, often combined with slow rate (Ma 2017: about 4/min with feedback, 20 sessions over 8 weeks) | Lower stress, cortisol, improved attention | **WEAK-MODERATE** (48-RCT review: methodological quality a major concern; cortisol finding rests largely on one n=40 trial) | Low |
| **Nadi shodhana** (alternate nostril) | Classical: inhale L, retain, exhale R, inhale R, retain, exhale L; ratio progression 1:1:1 up to 1:4:2. Gheranda Samhita: 16:64:32 mantra repetitions (a 1:4:2 proportion). Modern teaching often 4-0-4 or 4-4-8 | Purifies nadis; balances "left/right" (parasympathetic/sympathetic); calm | **WEAK** (small trials, mostly BP/HRV/reaction time; no good sham-controlled data) | Low at modest ratios; breath retention at 1:4:2 can cause light-headedness, avoid in pregnancy/cardio disease without advice |
| **Bhramari** (humming bee) | Inhale nasally, long exhale with humming "mmm", ears often blocked with fingers; about 5-6 breaths/min natural because humming exhale is long | Calm, BP lowering, tinnitus, sleep | **WEAK** for BP/HRV (2023 RCT in 100 hypertensives: reaction time improved, HRV difference between groups non-significant). The **nasal NO effect is real**: humming raises nasal NO about 15x vs quiet exhalation (Weitzberg & Lundberg 2002), by sinus-ostium gas exchange; clinical value unproven | Low (do not press hard on ears; avoid with acute ear infection) |
| **Ujjayi** (ocean/victorious) | Slight glottic constriction giving audible "ocean" sound, nasal, long equal or exhale-biased breaths | Heat, focus, calming; sonic anchor | **WEAK** (small baroreflex study: ujjayi less effective than plain equal-ratio slow breathing; extra effort may add sympathetic activity) | Low |
| **Sheetali / sitkari** (cooling) | Inhale through rolled tongue (sheetali) or teeth (sitkari), exhale nose; often retain | Cools body, lowers BP and acidity | **TRADITIONAL-ONLY** (the one controlled test found oxygen consumption went *up* 9.0% / 7.6%, "does not support the cooling description"; small HR/BP effects in small trials) | Low |
| **Surya / chandra bhedana** (sun / moon piercing) | Inhale right (surya) or left (chandra) nostril only, exhale through the other; retention per tradition | Surya heating/activating, chandra cooling/calming | **TRADITIONAL-ONLY** (I did not find controlled data in this search; some small studies exist on unilateral-nostril breathing and autonomic state but I have not verified them) | Retention + hyperventilation component in some versions; caution in hypertension |
| **Kapalabhati** (skull-shining) | About 1-2 exhalations/sec (60-120/min), forceful abdominal contraction, passive inhale; rounds of 20-30 or up to 100+, then rest | Cleansing, energising, clearer mind | **WEAK** (acute sympathetic arousal documented; 2025 review of 4 RCTs claims lung/attention benefits with speculative mechanisms) | **HIGH-ish: fast, hyperventilatory.** Dizziness, tingling, syncope. Avoid in pregnancy, hypertension, epilepsy, cardiac disease, recent abdominal surgery. No dedicated harm trials found. |
| **Bhastrika** (bellows) | Rapid, forceful inhale AND exhale, about 1/sec or faster, rounds of 10-20+ then retention | Heat, energy, lung strength | **WEAK** (2023 review: 19 trials, only 4 randomised, positive claims exceed design) | **HIGH: hyperventilatory** (same cautions as kapalabhati) |
| **Kumbhaka ratios, 1:4:2** | Inhale 1 : retain 4 : exhale 2 (e.g. 4-16-8 s, or 16:64:32 mantra counts in the Gheranda Samhita). Taught as graded progression 1:1:1 -> 1:1:2 -> 1:2:2 -> 1:3:2 -> 1:4:2. Some sources add post-exhale hold (1:4:2:1) | Kundalini/prana mastery, mind steadiness, longevity | **TRADITIONAL-ONLY** (no controlled study of the ratio itself; breath-hold physiology is understood but benefit isn't shown) | Long holds at high ratio: CO2 build-up discomfort, BP surges; **do not use as default in an app** |
| **Wim Hof method** | 30-40 deep, fast, full inhale/relaxed exhale breaths (about 2 s per breath cycle), then exhale and hold (no breath) until urge to breathe (often 1-3 min), then deep inhale and hold about 15 s; repeat 3-4 rounds. Official app allows 25/30/35 breaths. Traditionally paired with cold exposure | Voluntary sympathetic activation, dampened inflammation, cold tolerance, energy | **WEAK-MODERATE** for acute adrenaline/IL-10 effects in the trained (n=12/arm); **WEAK** for any health claim; systematic review (8 trials) rates evidence very low quality | **HIGH.** Fainting during holds is common; 30+ reported deaths allegedly linked, mostly drowning when practised in/near water. Sitting or lying only, never before/in water or driving. Contraindicated: epilepsy, cardiovascular disease, pregnancy, panic disorder (per cited guidance). |
| **Buteyko** | "Control pause" (CP): after a normal exhale, pinch nose, count seconds until first definite urge to breathe. Then reduced / shallow nasal breathing, light air-hunger, nasal-only, taught alongside education about posture, diet, medication | Reverses "hidden hyperventilation", raises CO2, helps asthma, sleep apnea | **MODERATE for symptoms/quality of life/reliever use; none for lung function.** Cooper 2003 (n=90): bronchodilator use down by 2 puffs/day, no change in FEV1, exacerbations, or steroid dose. Mechanism (raised CO2) unproven | Moderate: deliberate air-hunger; do not replace asthma medication; not for severe asthma (not studied) |
| **Tactical / combat breathing** | Grossman: inhale 4 s, hold 4 s, exhale 4 s, hold 4 s (the 4-4-4-4 "square"). Often repeated 4+ cycles | Lower heart rate and arousal under threat; preserve fine motor control | **WEAK** for the specific pattern; nothing measured on this exact protocol in combat. Related slow breathing evidence is indirect (Balban: box breathing helped mood, but less than cyclic sighing) | Low; holds are brief |
| **Box breathing** | 4-4-4-4 (sometimes 5-5-5-5), about 3.75 breaths/min at 4-4-4-4 | Stress control, focus | **WEAK-MODERATE** (as above) | Low; the breath-holds make it slower than resonance rate, which is not harmful but is not optimal for RSA |
| **4-7-8 (Weil)** | Inhale 4 s through nose, hold 7 s, exhale 8 s through mouth (whoosh), 4 cycles to start; about 3 breaths/min | Relaxation, sleep onset, anxiety | **WEAK** (a few small, short trials; one 4-week RCT with null resting markers per a thesis; a 2026 trial in nursing students not verified at primary source). Rooted in pranayama ratio thinking (1:1.75:2) | Low-moderate: the 19 s cycle with 7 s hold is hard for novices; do not progress people past comfort |
| **Sudarshan Kriya Yoga (SKY)** | Ujjayi at 2-4 breaths/min, bhastrika (20-30 breaths/min, about 2 min), then "Sudarshan Kriya" rhythmic cycles slow-medium-fast (about 40-60 breaths/min), long guided sessions (about 20-45 min) | Stress, depression, anxiety relief | **WEAK-MODERATE** (many small uncontrolled/controlled trials; a conference-abstract meta-analysis vs medication/placebo found pooled SMD about 0 for depression and anxiety with enormous heterogeneity, I2 > 90%) | **HIGH in fast phases** (hyperventilation). Mania/bipolar, epilepsy, pregnancy, cardiovascular disease are concerns |

**Which practices are fast / hyperventilatory (safety-relevant):** Wim Hof, kapalabhati, bhastrika, the fast phases of SKY, and "cyclic hyperventilation with retention" (the Balban arm). These can produce hypocapnia, tingling, dizziness, loss of consciousness. Everything else in the table is slow or normal-rate and low-risk by comparison. The design implication is that fast breathing should be gated, never auto-progressed to, and kept behind screening and a seated/lying warning.

---
## 3. Part A detail

### 3.1 HRV biofeedback / resonance-frequency breathing (Lehrer-Gevirtz) - the anchor practice

**Mechanism (from Lehrer & Gevirtz 2014, opened in full).** Heart rate and blood pressure oscillate in a baroreflex loop with a delay. Because of that delay, there is a frequency (about 0.1 Hz; refined by Vaschillo et al. to about 0.09 Hz, 5.5 breaths/min, 11 s per breath on average) at which breathing, heart rate and blood pressure line up so that RSA is largest. At that frequency heart rate and breathing are in phase (0 degrees) and heart rate and blood pressure are 180 degrees out of phase - the signature of baroreflex resonance. Each slow breath then stimulates the baroreflex like an exercise rep. Taller people and men have lower resonance frequencies; age/weight do not matter independently. Resonance can also be driven by non-breathing rhythmic input (rhythmic muscle tension, rhythmic emotional pictures) - i.e. what matters is the **0.1 Hz periodic drive**, not breathing as such. That sentence is directly relevant to Part B.

**Protocol (what the training consists of).** The paper confirms the outline: find each person's resonance frequency, practise at home, then apply to the problem; the participant sees beat-by-beat heart rate and tries to maximise RSA into a sine-wave pattern, using a breath-pacing device. Practised twice daily over about 3 months it raised *resting* baroreflex gain (Lehrer 2003). From my background knowledge of the Lehrer, Vaschillo & Vaschillo (2000) manual - **not re-verified in this session** - the details are:

1. **RF assessment** (one session): the participant breathes at a descending series of paced rates, typically 6.5, 6.0, 5.5, 5.0, 4.5 breaths/min, for about 2-5 minutes each, while HRV and respiration are recorded. RF is picked as the rate with the highest low-frequency HRV peak amplitude / largest peak-to-trough heart-rate swing / strongest respiration-heart rate phase alignment.
2. **Training**: about 4-10 weekly sessions of 20-30 min of paced breathing at RF with live HRV feedback, generally with the emphasis on gentle abdominal breathing, nasal or pursed-lip, exhale about as long or slightly longer than inhale, and *not* deep or hyperventilatory (low tidal volume keeps CO2 normal).
3. **Home practice**: about 20 min per day (often two 10-min bouts), with or without a pacer app; ideally an HRV sensor.

**Outcomes.** Lehrer et al. 2020 systematic review/meta-analysis: 1,868 papers screened, 58 randomised studies included; a small-to-moderate overall effect favouring HRVB, not different from other effective treatments; strongest for anxiety, depression, anger and performance; weakest for PTSD, sleep, quality of life. The authors caution there are few studies per outcome. Mechanism is plausible but the baroreflex hypothesis is "most supported" rather than proven; the vagal-afferent-to-frontal-cortex pathway is newer and less established.

**Sceptical note for the design doc.** The resonance frequency is *individual*, and the benefit curve is broad and flat near 5-6/min. A one-size-fits-all "6 breaths/min" is within the useful band for most people; true RF assessment needs a heart-rate sensor. An app without HRV measurement should present 5-6/min with a user-adjustable range (4.5-6.5) rather than claim to find "your resonance frequency".

### 3.2 General slow breathing

Zaccaro et al. 2018 (PRISMA review, 2,461 abstracts, 15 included, healthy adults, slow = < 10/min): slow breathing associated with increased parasympathetic markers (HRV, LF power), higher EEG alpha and lower theta, and better emotional control. Russo et al. 2017 narrative review: slow breathing affects ventilation efficiency, haemodynamics, HRV, cardiorespiratory coupling and baroreflex; authors call for much more research. Both stress that mechanisms (interoception, nasal mechanoreceptors, vagal) are still debated. Gerritsen & Band 2018 propose a respiratory vagal stimulation model (long exhale -> vagal activity) as an integrating theory; it is a theory paper, not evidence.

### 3.3 Cyclic sighing, box breathing, hyperventilation-with-retention (Balban 2023)

Remote RCT (NCT05304000): 5 min/day for a month of cyclic sighing, box breathing, or cyclic hyperventilation with retention, versus mindfulness meditation. Breathwork beat meditation on daily mood; cyclic sighing (emphasis on long exhale) gave the biggest improvement in mood and the biggest fall in resting respiratory rate. Limitations: remote, self-reported mood, one trial. I did not retrieve the sample size or effect sizes; check the paper before quoting numbers.

### 3.4 Pranayama detail

- **Textual lineage.** The 1:4:2 (inhale:retain:exhale) ratio is widely attributed to the Hatha Yoga Pradipika, but I could not confirm the verse; what I could confirm is the **Gheranda Samhita** nadi-shodhana instruction of 16 : 64 : 32 repetitions of a seed mantra (bija), a 1:4:2 proportion measured in *mantra counts*, not seconds. The Hatha Yoga Pradipika tradition stresses *gradual* increase and not forcing retention. Treat 1:4:2 as a **traditional training target reached after long practice**, never a starting point. The "second hold" variant (1:4:2:1 or 1:4:2:2) has no textual basis I could find.
- **Sanskrit time unit.** Counts are in mantra repetitions or matras (a unit tied to a mantra or heartbeat), so the "seconds" versions on modern sites are teaching adaptations.
- **Systematic reviews.** Pranayama for mental disorders (2025, 6 RCTs, n=517; PTSD, depression, mixed): small effect vs passive control (SMD about -0.27 to -0.35), high risk of bias in 4 of 6 trials. Bhastrika (2023): 19 trials, only 4 randomised. Pranayama is generally *promising but low quality*; sham-controlled and breathing-rate-matched designs are rare, so most "pranayama effects" cannot be separated from "slow breathing" or "attention to the breath" or expectation.
- **Bhramari.** Humming's nasal NO effect is physiologically real: Weitzberg & Lundberg 2002, 10 healthy subjects, nasal NO about 15x higher during humming than during quiet exhalation; follow-up (Maniscalco 2003) showed it reflects sinus-ostium gas exchange driven by oscillating airflow (peak abolished with blocked ostia), not mucosal production. Whether this does anything for health (sinus ventilation, antimicrobial NO) is unproven. A real design hook: a hum is a **vocalised long exhale with built-in auditory feedback** - the user hears their own exhale length.
- **Ujjayi.** In 17 yoga-naive adults, equal-ratio slow breathing gave the largest baroreflex gain and BP drop; ujjayi gave less and no BP change; authors suggest increased intrathoracic pressure effort partially offsets benefit. Value of ujjayi in an app is mostly as an **audible pacing anchor**, not a physiological upgrade.
- **Sheetali / sitkari.** Telles et al. 2020 (17 men): oxygen consumption up 9.0% and 7.6%; conclusion: "does not support the description as cooling". A good example of tradition vs data.
- **Kapalabhati.** About 1-2 Hz forceful exhalations; acute HR/BP rise and sympathetic arousal, with kapalabhati more arousing than bhastrika in one comparison; EEG results inconsistent between small studies. The 1991 literature on high-frequency yogic respiration found a 0.1 Hz modulation of respiratory signals in 82% of experiments - an interesting curiosity relevant to resonance, but not a safety or efficacy result.
- **SKY.** Descriptive parameters (ujjayi 2-4/min, bhastrika 20-30/min, Sudarshan Kriya 40-60/min cycles) are from my background knowledge and unofficial step sheets; I did not find a primary source stating them, and could not confirm a "2-4-6-8" count. Evidence: many small trials; a conference-abstract meta-analysis shows near-zero pooled effects with I2 of 93-97% (not yet peer-reviewed in the form I saw). The Cramer 2013 yoga-for-depression meta-analysis gives moderate short-term evidence for yoga broadly vs usual care, but is not SKY-specific.

### 3.5 Wim Hof method (WHM)

- **Protocol.** (Secondary sources; I could not open the official page.) Round: 30 (range 25-40) strong full inhales through nose or mouth, passive relaxed exhale; after the 30th, exhale to about 90% and hold without breathing as long as comfortable; then one deep inhale and hold about 15 s; release. 3-4 rounds. Sit or lie down. Official guidance (per secondary sources) says never in or near water.
- **Kox et al. 2014, PNAS (opened).** 24 healthy young men, 12 trained (10-day programme of meditation, breathing, and cold exposure) vs 12 untrained; both given low-dose E. coli endotoxin. Trained group: intermittent respiratory alkalosis and hypoxia, large adrenaline rise, higher IL-10, lower TNF-alpha, IL-6, IL-8, fewer flu-like symptoms. Conclusion: voluntary sympathetic activation can suppress innate immune response. **Caveats:** n=12 per arm, all male, the intervention bundled three things (so the breathing's specific contribution is not isolated), funded by a rheumatology foundation, and the control group was untrained rather than active-controlled. No independent replication of the endotoxin result turned up in my searches.
- **Brain imaging.** The work I found is **Muzik et al. 2018, NeuroImage ("Brain over body")**, not 2022. n=1 plus controls (Wim Hof himself). fMRI showed activation of the periaqueductal grey (descending pain/cold modulation) during his technique. PET/CT brown fat activation was *unremarkable*, and he was asked to refrain from breathing exercises before the PET/CT scan. The WHM website nonetheless promotes brown-fat claims; peer-reviewed abstract says brown fat activation was unremarkable. I did not find a 2022 brown-adipose study of the breathing method; if the designer cites one, ask for the reference. (Do not take this as proof none exists - I ran two searches.)
- **Systematic review.** Almahayni & Hammond (2024): 9 papers / 8 trials, searched to July 2022; "promising" for inflammatory response but small samples, high risk of bias, very low overall quality; exercise-performance and respiratory findings mixed; no strong mood evidence beyond placebo.
- **Safety.** Breath-hold after hyperventilation suppresses the CO2 urge to breathe and can lead to hypoxic blackout without warning. Wikipedia lists 32 reported deaths allegedly connected to WHM as of March 2024 (allegation level, mostly drowning); journalist Scott Carney has documented more than a dozen. Cold-water immersion arrhythmia occurs in 1-3% of young healthy subjects but up to 63% when a breath-hold precedes immersion (secondary source, treat with care). AHA/BHF advise consulting a doctor before cold therapy. **Design recommendation:** if WHM-style breathing is ever offered, enforce seated/lying posture, timed guided holds with a hard cap, an explicit "not near water, not while driving" interlock, screening for epilepsy/cardiac/pregnancy/panic, and no cold-exposure coupling.

### 3.6 Buteyko

- **Technique (secondary summaries).** Control pause = hold after normal exhale until first urge, as a self-test. Training: nasal-only, quiet, reduced-volume breathing with tolerable air hunger, plus lifestyle education. The Bruton & Lewith (2005) review notes the "package" includes advice about medication use, diet, exercise and relaxation, so effects cannot be attributed to breathing alone.
- **Evidence.** Cooper 2003 RCT (Thorax, n=90 on inhaled steroids, 6 months, vs a pranayama-mimicking device and a placebo device): bronchodilator use down 2 puffs/day, **no difference in FEV1, exacerbations or inhaled steroid reduction**; authors conclude BBT can improve symptoms and reduce bronchodilator use but does not appear to change bronchial responsiveness or lung function. The Cochrane review of breathing exercises for adults with asthma (Santino 2020; 22 RCTs, 2,880 adults, mostly yoga; 4 trials of Buteyko/Papworth/diaphragmatic retraining): probably improves quality of life and hyperventilation symptoms; probably no difference in asthma control questionnaire (symptoms); some improvement in % predicted FEV1; certainty moderate to very low; severe asthma not assessable. A Cochrane protocol for a Buteyko-specific review exists (CD009158); a 2026 meta-analysis (Wu et al.) and a 2021 BMJ Open protocol also exist but I only saw their titles/abstract fragments. The mechanism (raised CO2) is unproven: Bruton & Lewith state it is unknown whether breathing alteration raises CO2 significantly.
- **Straight reading.** The pattern "feels better, uses less reliever, lungs measure the same" is consistent with learned self-management / perceived control / less dysfunctional breathing - which is real and useful - but not with the Buteyko theory of CO2 reversal of airway disease.

### 3.7 Tactical / box breathing

Grossman's tactical breathing (*On Combat*) is a counted four-count pattern (inhale, hold, exhale, hold, each about 4) that the US Defense Health Agency's Tactical Breather app credits to him with permission. "Box breathing" is separately associated with ex-Navy SEAL Mark Divine, who writes that he developed it after training. Popular articles claiming that the SEALs "use" it cite no primary source. Measured effects of the 4-4-4-4 pattern specifically are limited to generic slow-breathing evidence and the Balban arm. In app terms box breathing's breath-holds push the rate down to about 3.75/min, below the resonance band, so it is a different (and arguably more demanding) exercise than resonance breathing.

### 3.8 Diaphragmatic breathing

Ma et al. 2017: 40 healthy adults, 20 sessions over 8 weeks with real-time feedback at about 4 breaths/min; improved sustained attention, negative affect, lower salivary cortisol. Hamasaki 2020 narrative review: usefulness unclear due to poor study quality. Kwon 2025 (48 RCTs, secondary summary): only about 2% of outcomes low risk of bias; some acute cardiovascular benefit in healthy adults. Reasonable to treat diaphragmatic breathing as a **teaching layer** (how to breathe) rather than a standalone proven therapy.

---
## 4. Part B - The music link, assessed honestly

### 4.1 BPM-to-breath arithmetic (the part that is just maths)

Rule: **beats per breath cycle = tempo (BPM) / breaths per minute.** Cycle length in seconds = 60 / breaths per minute. 6 breaths/min = 0.1 Hz = a 10 s cycle. Any tempo whose BPM is a multiple of 6 gives a whole number of beats in a 10 s (6/min) cycle; any multiple of 5 does so for a 12 s (5/min) cycle. That is true of 60, 72, 84, 96, 108, 120 and it is the whole reason "comfortable musical tempi divide neatly into 5-6 breaths/min". It is divisibility, not harmony: 60-120 BPM spans 10-20 beats in 10 s, so something will always fit.

| Musical BPM | Beats per breath cycle | Breaths/min | Cycle (s) | Suggested in : hold : out (beats) | Notes |
|---|---|---|---|---|---|
| 24 | 4 (one 4/4 bar) | 6.0 | 10.0 | 2 : 0 : 2 (5 s / 5 s) | Very slow; "one bar = one breath". Equal ratio only; at 24 BPM the beat is a 2.5 s event and is barely a "pulse" |
| 48 | 8 (two 4/4 bars) | 6.0 | 10.0 | 3 : 0 : 5 (3.75 s / 6.25 s) | |
| 60 | 10 | 6.0 | 10.0 | 4 : 0 : 6 (4 s / 6 s) | One beat = one second, easiest to count aloud |
| 60 | 12 (3 bars of 4/4) | 5.0 | 12.0 | 5 : 0 : 7 (5 s / 7 s) | Lower end of RF range |
| 72 | 12 (3 bars of 4/4) | 6.0 | 10.0 | 5 : 0 : 7 (4.2 s / 5.8 s) | |
| 72 | 16 (4 bars of 4/4) | 4.5 | 13.3 | 6 : 0 : 10 (5.0 s / 8.3 s) | Slow end of RF range |
| 80 | 16 (4 bars) | 5.0 | 12.0 | 6 : 0 : 10 (4.5 s / 7.5 s) | |
| 84 | 14 | 6.0 | 10.0 | 2 : 8 : 4 (classical 1:4:2) = 1.4 s / 5.7 s / 2.9 s | Shows the 1:4:2 ratio squeezed to a 6/min cycle: a 5.7 s hold in a 10 s cycle is aggressive and not recommended for beginners |
| 90 | 15 | 6.0 | 10.0 | 6 : 0 : 9 (4 s / 6 s) | |
| 96 | 16 (4 bars of 4/4) | 6.0 | 10.0 | 6 : 0 : 10 (3.75 s / 6.25 s) | **A four-bar 4/4 phrase at 96 BPM is exactly 10 s = 0.1 Hz.** Cleanest "musical phrase = one breath" mapping |
| 100 | 20 (5 bars) | 5.0 | 12.0 | 8 : 0 : 12 (4.8 s / 7.2 s) | |
| 114 | 19 | 6.0 | 10.0 | 4 : 7 : 8 (Weil 4-7-8 shrunk to 10 s: 2.1 s / 3.7 s / 4.2 s) | Shows 4-7-8 proportions at resonance rate. Native 4-7-8 is 19 s = 3.2/min |
| 120 | 20 (5 bars) | 6.0 | 10.0 | 8 : 0 : 12 (4 s / 6 s) | |
| 120 | 24 (6 bars) | 5.0 | 12.0 | 8 : 0 : 16 (4 s / 8 s) or 10 : 0 : 14 | 1:2 in:out |
| 60 | 16 (4 bars of 4/4) | 3.75 | 16.0 | 4 : 4 : 4 : 4 (box) | Tactical/box breathing is below the resonance band |
| 60 | 19 | 3.16 | 19.0 | 4 : 7 : 8 | Native 4-7-8 |
| 60-120 | 1 beat per exhalation | 60-120 | 0.5-1.0 | pulse = one exhale | Kapalabhati: 1-2 forceful exhales per second maps to 1 per beat at 60-120 BPM. **Safety-gated only** |

Practical points from the table:
- **Grid, not meaning.** Fixing a tempo and counting beats gives a shared time base for a click, a drone swell, and a visual pacer to stay phase-locked. That is a real engineering benefit.
- **Rhythmic hierarchy (beat -> bar -> phrase)** gives a built-in way to subdivide a long cycle so the user does not have to count to 10 or 16 in their head; musicians already do this.
- **Asymmetric in:out are easy** in beat terms (6:0:10, 4:0:6), and the evidence base for slightly longer exhale (vagal outflow occurs on exhalation; Lehrer & Gevirtz 2014) is better than for any specific number.
- **5.5 breaths/min** (the commonly cited average RF, 10.9 s) has no neat integer mapping at common BPMs: 66 BPM -> 12 beats per 10.9 s; 55 BPM -> 10 beats. This is one reason to keep tempo as a continuous parameter rather than rounding to "musical" values.

### 4.2 What the evidence says about music and breathing

**Bernardi, Porta & Sleight 2006 (Heart; abstract and full text opened).** 12 practising musicians and 12 age-matched controls, supine, headphones, eyes closed, tapping prevented. Six styles (slow classical, fast classical, dodecaphonic, techno, rap, raga) in random order, 2 then 4 min, plus a 2-minute pause. Findings:
- Breathing rate, ventilation, blood pressure and heart rate rose with **faster tempo and simpler rhythmic structure**. The effect tracked tempo, not style, not preference (classical and techno behaved alike when equally fast; raga, slow classical and dodecaphonic all lowered responses).
- Slower music had a proportionally small effect, with raga the largest fall in heart rate. The **2-minute silence reduced HR, BP and ventilation below baseline** - more than the preceding 5-minute rest and more than any music.
- Ratio of tempo to breathing rate: about 4.1 beats per breath (raga), 4.7 (slow classical), 5.2 (dodecaphonic), 6.5 (rap), 8.0 (techno), 8.7 (fast classical). The authors read "about one breath per four crotchets" at the slowest and "one per eight" at the fastest as suggesting entrainment, but say it was "clearly absent in the intermediate rhythms", and that arousal vs entrainment remains speculative.
- Musicians had lower baseline breathing rates and larger breathing responses to tempo. The authors suggest musicians learn to synchronise breathing with phrases.
- No habituation across repetition.

What this means for the app: music *tempo* is not a neutral pacing cue; a fast pulse speeds breathing and arousal. At rest, slow music alone yields a small effect and **silence/pauses relax as much or more**. A designer using a clearly audible beat above about 60 BPM as a bed under a slow-breath cycle is working against Bernardi's finding unless the beat is clearly subordinated to the breath cue.

**Haas, Distenfeld & Axen 1986 (J Appl Physiol; abstract opened).** 10 musically trained and 10 untrained subjects tapped to a metronome and to four musical segments for 5 min each; 10 also listened without tapping. Variability of breath period (coefficient of variation) fell from 23% baseline to 15% listening to 10% listening + tapping. Significant correlation between rhythm and breath period (relative entrainment) in half of the subjects; integer ratios plus phase coupling (tight entrainment) in 12 of the 20 subjects but not consistently within each person. Authors: music acts as a zeitgeber whose power depends on its signal-to-noise ratio against the brain's own breathing drive; tapping reinforces it. Musicians entrained more.

**Leslie, Ghandeharioun, Zhou & Picard 2019 (MIT Media Lab, arXiv preprint).** The closest thing to a direct test of "can sound slow your breathing". Participants were doing an attention-demanding task and not attending to breathing or music. Ambient music had periodic amplitude (loudness) modulation: (1) fixed at 6/min; (2) a rate set to 75% of each person's baseline breathing rate; (3) the modulation envelope matched to the person's breathing in real time. **All three slowed breathing; the personalised 75%-of-baseline version gave the largest effect.** Electrodermal activity, heart rate and EEG slow cortical potentials fell with it. Caveats: preprint, sample size not retrieved, the manipulated cue was loudness swell, not metric tempo, and the measure was the lowered breath rate, not an HRV outcome.

**Rhythmic auditory stimulation (RAS) in Parkinson's disease: a comparison.**
- Ghai et al. 2018 (50 studies, 1,892 participants): auditory cueing improved gait velocity and stride length; effect on cadence was inconsistent (negative in the pooled analysis). Wang et al. 2022: velocity, step and stride length significant; cadence and stride width not. Another meta-analysis: gait speed +0.53 SD, evidence quality low.
- So even in the best-supported area of auditory entrainment the quality of evidence is rated *low* and the "cadence locks to the beat" story is less clean than the textbook version.
- **Is breathing comparable?** No. For gait there are dozens of RCTs; for breathing I found three relevant studies (Haas, Bernardi, Leslie), none a clinical RCT of music-paced breathing. Walking is a voluntary rhythmic movement with tight auditory-motor coupling; breathing is driven by a brainstem pattern generator that is automatic, tied to CO2, emotion and speech, and only loosely couples to sound. Locomotor-respiratory coupling (e.g. in runners) is a known phenomenon in the literature, but that is from my background knowledge and I did not verify it here. Treat the Parkinson's data as a plausible *analogy*, not support.

**Does breathing entrain to rhythm as reliably as movement? Limits found.**
1. Entrainment was partial: about half the participants in Haas 1986, none at intermediate tempi in Bernardi 2006.
2. It is stronger when the person does something motor (tapping doubles the effect on variability), and in trained musicians.
3. It runs *through arousal*: faster pulses speed breathing and sympathetic activity, so you cannot assume "faster beat -> faster breath" is neutral for a calming app.
4. Slow ranges (6/min = a beat or event only every 10 s) fall below the rate range in which the beat/pulse percept is robust; at around 0.1 Hz you are really presenting an *envelope* or *phrase*, not a beat. That is why the one positive paced-sound study (Leslie) used loudness swells.
5. Breathing needs to end a long exhale before the cue ends; cues that the user has to anticipate (a downbeat at the end of the exhale) are more demanding than cues that continuously indicate state (a rising/falling level).

**Pulse vs phrase vs harmony as a pacing cue (what can and cannot be said).**
- *Isochronous pulse*: strongest evidence for entraining motor behaviour. For breathing it works when the pulse is *the breath* (e.g. a slow click or swell per breath phase), and drives faster breathing when the pulse is quicker than the breath.
- *Melodic phrase / envelope*: matches how the body is already coupled to music. Bernardi's group reports (from the Milan repository summary; I attribute this to their 2009 Circulation paper from memory and have not verified it) that crescendos track skin vasoconstriction and BP rises while evenly emphasised music produces vasodilation and lower BP, and that rhythmic phrases repeating about every 10 s entrained cardiovascular autonomic variables. If right, that is the one place a musical structure at 0.1 Hz directly meets the physiological resonance. Treat as promising, unverified here.
- *Harmonic tension and resolution*: no study I found maps tension-release onto breath phase or shows it changes breathing. It may well alter arousal and expectation, and a dominant-to-tonic resolution on exhale is aesthetically natural, but it is decorative as a *pacing* mechanism.

**Singers and wind players as a natural experiment.**
- A secondary summary (Cleveland, Journal of Singing, of Thomasson & Sundberg 1997 and Hoit et al. 1996) gives mean classical-singer phrase duration about 5.2 s (males 4.9, females 5.4), starting at about 70% of vital capacity and flowing at about 7-9% of vital capacity per second. Wind players show rapid inspirations followed by prolonged discontinuous exhalations (Bouhuys). Studies are tiny (4-8 players); skilled brass players have more consistent end-inspiratory volume than a novice.
- **This is a genuine link, but the causality runs the other way.** Phrase length in sung and wind music was shaped by breath capacity, not the reverse: a 4-6 s phrase is about one exhale at a resonant-rate cycle (10 s with a 4-6 s exhale). This is the best argument that a "musical phrase = one breath" mapping is natural. It is not evidence that listening to such phrases will pace the listener's breathing.
- Singers and wind players probably do train long controlled exhalation, so they are a plausible "expert" user group (and a good source of usability testers), but I did not find data on whether they benefit more from paced-breathing apps.

### 4.3 Binaural beats and "healing frequencies"

- **Binaural beats.** Garcia-Argibay et al. 2019 meta-analysis: 22 studies, 35 effect sizes, pooled g = 0.45 (medium) across cognition, anxiety and pain; masking noise unnecessary; exposure before the task better; longer exposure better. Basu & Banerjee 2023 (memory/attention): "encouraging but uneven". Ingendoh, Posny & Heine 2023 (PLOS ONE, 14 studies on EEG/entrainment): very heterogeneous methods, results not comparable. A 2025 dental-anxiety review reports anxiety benefit but most trials at high risk of selection and detection bias. **Plain statement:** there are small positive signals on anxiety from short, heterogeneous, mostly unblinded studies; the claimed mechanism - the brain "following" the beat frequency into a target EEG band - is not reliably demonstrated; and nothing connects binaural beats to *breath pacing*. A binaural beat at 0.1 Hz is also far below the 1-30 Hz range usually tested (inference, not a sourced fact). Grade: WEAK. Don't build on it.
- **432 Hz.** A 2025 randomised cross-over trial in 43 cancer patients compared 432 Hz with 443 Hz (not 440): heart rate fell by median 3 bpm vs 1 bpm (p = 0.04); HRV increased only with 432 Hz; but psychological outcomes improved with both and differences were not significant on several measures. A University of Padua thesis review concluded results are mixed and limited. Other studies are small; calming effects are confounded with any quiet music. Grade: WEAK / not demonstrated.
- **Solfeggio frequencies (174-963 Hz).** No empirical evidence for the claimed biological functions; Science Feedback traces them to a pattern of verse numbers in the Book of Numbers popularised by a herbalist (Joseph Puleo) in the 1970s. Grade: TRADITIONAL-ONLY (and a recent tradition at that), i.e. pseudo-traditional.

### 4.4 Sonification: what makes a cue easy to breathe to, and does a ritardando lead you down?

Honest status: **almost none of this has been tested with controlled breathing outcomes.** The following separates sourced findings from design heuristics.

*Sourced:*
- A continuous loudness envelope at the target rate slowed breathing in people not attending to it (Leslie 2019). Starting at about 75% of the user's baseline was more effective than a fixed 6/min.
- Silence and pauses relax more than music (Bernardi 2006); keep silence as a designed element, e.g. at the end of an exhale.
- Fast, rhythmically simple pulses increase breathing rate and sympathetic activity (Bernardi 2006), so don't put a brisk beat under a calming exercise.
- Active motor engagement (tapping) increased entrainment (Haas 1986); a touch-and-hold interaction or finger-follow of a pacer is evidence-consistent.
- HRV-biofeedback pacers conventionally use a visual or auditory rise/fall cue and a smooth sinusoidal sweep (Lehrer-Gevirtz). The pacing curve shape is not itself the active ingredient; the frequency is.

*Heuristics (reasonable, untested here):*
- Inhale = rising pitch/filter cutoff/volume, exhale = falling, so the cue encodes phase continuously instead of marking events.
- Filtered noise shaped like a wave (cf. ocean sounds) gives a no-pitch, no-beat, non-cultural cue; a slow drone with a swell avoids implying a pulse.
- Avoid abrupt cues at phase boundaries (clicks) for the slow-breath setting; use clicks only for novices learning timing.
- Pitch height for inhale vs low for exhale is intuitive but has no breath-specific evidence.

*Gradual tempo reduction (ritardando).* I found **no controlled study showing that a gradually slowing tempo leads a listener's breathing down** the way a stepwise protocol would. The closest data: (a) Leslie's 75%-of-baseline design implies a modest "lead" beyond what the person currently does, and it worked; (b) Bernardi's authors speculate that a slowing of music tempo may be a key relaxing element; (c) clinical RF training reaches the target by stepping down. A reasonable rule: start near the user's measured rate, slow by small decrements (for example 0.5 breath/min every few minutes, tuned to the user's tracking) and stop at the user's comfort or RF, with closed-loop adaptation if breath is sensed. That is a design hypothesis, and the app should be built so it can be A/B tested.

---

## 5. Verdict on the music-theory idea

| Idea | Verdict |
|---|---|
| Tempo arithmetic (BPM / breaths per min) | **Real but trivial.** It is division. Useful as an engineering grid and as a counting scaffold; there is nothing mystical in the fact that 60-120 BPM divides into 5-6 breaths/min. |
| Phrase structure (bar/phrase as breath unit) | **Genuinely grounded.** Sung/wind phrases (about 5 s) were built around breath capacity; 4-bar phrases at 96 BPM = 10 s. Good cognitive scaffold; no proof it paces non-musicians. |
| Pulse entrainment of breathing | **Partial.** Works in some people, in some tempo ranges, better in musicians and with tapping; fast pulses speed breathing. Much weaker than gait entrainment. Evidence base: ~3 studies. |
| Adaptive or personalised sound envelope | **Best-supported design lever.** Leslie 2019. |
| Harmonic tension / resolution mapped to inhale-hold-exhale | **Decorative analogy.** May add pleasantness and expectation; no breath-pacing evidence. |
| Interval ratios (octave 1:2, fifth 2:3) as breath ratios | **Decorative.** Breath timing is perceived as duration at about 0.1 Hz, not as pitch at 100+ Hz; the same integer ratios appear in pranayama (1:2, 1:4:2) and music, but the coincidence is numerology. |
| Binaural beats / 432 Hz / solfeggio | **Not supported** (weak/mixed or none). Avoid health claims. |
| Music as pleasant carrier for a physiologically effective cycle | **Plausible and defensible.** The 0.1 Hz resonance is a property of the cardiovascular system; it responds to any 0.1 Hz drive, including breathing, so music is a carrier not a cause. |

**Bottom line:** the musical layer is best treated as an *interface and engagement layer* laid over a physiologically-grounded breathing engine (rate near 5-6/min, exhale-biased, optional adaptation), not as the active mechanism. Claim the pacing; don't claim the harmony.

---

## 6. Open questions / verification to do

- Confirm the Lehrer RF-assessment details (6.5 -> 4.5 breaths/min sweep, session counts, home dose) against the 2000 manual before putting them in design documents.
- Check the Balban 2023 sample size and effect sizes.
- Check whether the "2022 brown adipose" WHM study the designer has in mind exists; I found only Muzik 2018 (brain), which reported unremarkable BAT.
- Verify the Bernardi 2009 Circulation claims (10 s phrases, crescendo effects) from the primary paper.
- Pull the Santino 2020 Cochrane full text for the Buteyko-specific subset and reliever-use data (not retrieved).
- No evidence retrieved on surya/chandra bhedana; treat as traditional-only until searched properly.
- Hatha Yoga Pradipika verse for 1:4:2 not confirmed; Gheranda Samhita 16:64:32 mantra counts confirmed via secondary translation.

---

## 7. References (URLs as retrieved)

**Resonance / slow breathing / general**
- Lehrer PM, Gevirtz R. Heart rate variability biofeedback: how and why does it work? Front Psychol 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4104929/
- Lehrer PM et al. Heart rate variability biofeedback improves emotional and physical health and performance: a systematic review and meta-analysis. Appl Psychophysiol Biofeedback 2020;45:109-129. https://doi.org/10.1007/s10484-020-09466-z
- Lehrer PM, Vaschillo E, Vaschillo B. Resonant frequency biofeedback training to increase cardiac variability: rationale and manual for training. 2000. https://pubmed.ncbi.nlm.nih.gov/10999236/
- Lehrer PM et al. HRV biofeedback increases baroreflex gain and peak expiratory flow. Psychosom Med 2003. https://pubmed.ncbi.nlm.nih.gov/14508023/
- Zaccaro A et al. How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing. Front Hum Neurosci 2018. https://pubmed.ncbi.nlm.nih.gov/30245619/
- Russo MA, Santarelli DM, O'Rourke D. The physiological effects of slow breathing in the healthy human. Breathe 2017. https://pubmed.ncbi.nlm.nih.gov/29209423/
- Gerritsen RJS, Band GPH. Breath of life: the respiratory vagal stimulation model of contemplative activity. Front Hum Neurosci 2018. https://pmc.ncbi.nlm.nih.gov/articles/PMC6189422/
- Balban MY et al. Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Rep Med 2023. https://pmc.ncbi.nlm.nih.gov/articles/9873947/
- Ma X et al. The effect of diaphragmatic breathing on attention, negative affect and stress in healthy adults. Front Psychol 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5455070/
- Hamasaki H. Effects of diaphragmatic breathing on health: a narrative review. Medicines 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC7602530/

**Pranayama**
- Pranayama for mental disorders: systematic review and meta-analysis of RCTs (2025). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12392162/
- Cardiovascular and respiratory effect of yogic slow breathing in the yoga beginner (ujjayi baroreflex). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3655580/
- Telles S et al. Sheetali and sitkari oxygen consumption study. Med Sci Monit Basic Res 2020. https://basic.medscimonit.com/abstract/index/idArt/920107
- Weitzberg E, Lundberg JON. Humming greatly increases nasal nitric oxide. Am J Respir Crit Care Med 2002. https://pubmed.ncbi.nlm.nih.gov/12119224/
- Bhramari / nadi shodhana hypertensive RCT 2023 (as returned by search; paper not individually verified). https://pmc.ncbi.nlm.nih.gov/articles/PMC10388195
- Kapalabhati / high-frequency yogic breathing articles (as returned by search; not individually verified). https://pmc.ncbi.nlm.nih.gov/articles/PMC8963645 ; https://qigonginstitute.org/abstract-print/2930
- Nadi shodhana ratios, Hatha Yoga Pradipika attribution. https://www.nathas.org/en/dictionary/nadi-shodhana/
- Gheranda Samhita 16:64:32 translation (Nadi Samanu). https://namarupa.org/wp-content/uploads/2021/03/Nadi-Samanu.pdf
- Brown RP, Gerbarg PL. Sudarshan Kriya Yogic breathing, Part I and II. https://pubmed.ncbi.nlm.nih.gov/15750381/ ; https://pubmed.ncbi.nlm.nih.gov/16131297/
- SKY meta-analysis (conference abstract). https://www.populationmedicine.eu/Effectiveness-of-a-meditation-technique-sudarshan-kriya-yoga-sky-on-depression-and,164643,0,2.html
- Cramer H et al. Yoga for depression: systematic review and meta-analysis. https://pubmed.ncbi.nlm.nih.gov/23922209/
- 4-7-8 thesis (Simon Fraser University). https://summit.sfu.ca/_flysystem/fedora/2023-08/etd22539.pdf

**Wim Hof**
- Kox M et al. PNAS 2014. https://pubmed.ncbi.nlm.nih.gov/24799686/ ; full text https://pmc.ncbi.nlm.nih.gov/articles/PMC4034215
- Muzik O et al. "Brain over body" NeuroImage 2018. https://pubmed.ncbi.nlm.nih.gov/29438845/
- Almahayni O, Hammond L. Does the Wim Hof Method have a beneficial impact...? systematic review. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10936795/
- Protocol description (Healthline). https://www.healthline.com/health/wim-hof-method
- Safety guidance (Simply Psychology). https://www.simplypsychology.com/articles/wim-hof-method-evidence
- Deaths reporting (Wikipedia, secondary). https://en.wikipedia.org/wiki/Wim_Hof
- Breath-holding after hyperventilation (Active SG). https://activesgcircle.gov.sg/read/breath-holding-with-hyperventilation-an-invisible-danger

**Buteyko / asthma**
- Santino TA et al. Breathing exercises for adults with asthma. Cochrane 2020. https://pubmed.ncbi.nlm.nih.gov/32212422/ ; summary https://rehabilitation.cochrane.org/breathing-exercises-adults-asthma
- Cooper S et al. Effect of two breathing exercises (Buteyko and pranayama) in asthma. Thorax 2003. https://thorax.bmj.com/content/58/8/674
- Bruton A, Lewith GT. The Buteyko breathing technique for asthma: a review. Complement Ther Med 2005. https://qigonginstitute.org/abstract-print/2572
- Cochrane protocol, Buteyko breathing for asthma. https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD009158
- Wu S et al. Buteyko meta-analysis 2026. https://pubmed.ncbi.nlm.nih.gov/41930853/ ; Mendonça et al. protocol 2021. https://pubmed.ncbi.nlm.nih.gov/34663656/

**Tactical / box**
- Defense Health Agency, Tactical Breather app (credits Grossman, On Combat). https://health.mil/Reference-Center/Fact-Sheets/2023/08/03/Tactical-Breather-App
- Divine M. TIME essay on box breathing. https://www.time.com/4316151/breathing-technique-navy-seal-calm-focused

**Music and physiology**
- Bernardi L, Porta C, Sleight P. Cardiovascular, cerebrovascular, and respiratory changes induced by different types of music in musicians and non-musicians. Heart 2006;92:445-452. https://heart.bmj.com/content/92/4/445 ; commentary https://pmc.ncbi.nlm.nih.gov/articles/PMC1860853 ; repository abstract https://boa.unimib.it/handle/10281/9599
- Haas F, Distenfeld S, Axen K. Effects of perceived musical rhythm on respiratory pattern. J Appl Physiol 1986. https://pubmed.ncbi.nlm.nih.gov/3759758/
- Leslie G, Ghandeharioun A, Zhou D, Picard RW. Engineering music to slow breathing and invite relaxed physiology (2019, preprint). https://arxiv.org/abs/1907.08844
- Ghai S et al. Effect of rhythmic auditory cueing on parkinsonian gait. Sci Rep 2018. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5764963/
- Wang L et al. RAS on gait and motor function in Parkinson's disease: meta-analysis. Front Neurol 2022. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9053573/
- Singers and wind players (secondary reviews; small studies): https://www.nats.org/_Library/Kennedy_JOS_Files_2013/JOS-055-2-1998-053.pdf ; https://www.mattioli1885journals.com/index.php/lamedicinadellavoro/article/view/5454 ; https://hal.archives-ouvertes.fr/hal-00539763

**Binaural beats, 432 Hz, solfeggio**
- Garcia-Argibay M, Santed MA, Reales JM. Efficacy of binaural auditory beats in cognition, anxiety and pain perception: a meta-analysis. Psychol Res 2019. https://pubmed.ncbi.nlm.nih.gov/30073406/
- Basu S, Banerjee B. Potential of binaural beats for memory and attention. Psychol Res 2023. https://link.springer.com/article/10.1007/s00426-022-01706-7
- Binaural-beat anxiety reviews incl. 2025 dental review (as returned by search). https://pmc.ncbi.nlm.nih.gov/articles/PMC12451561
- 432 Hz vs 443 Hz randomised cross-over trial. BMC Complement Med Ther 2025. https://doi.org/10.1186/s12906-025-04758-5
- University of Padua thesis review on 432 Hz. https://thesis.unipd.it/bitstream/20.500.12608/59910/1/Marmolaro%20Mattia.pdf
- Science Feedback on solfeggio frequencies. https://science.feedback.org/review/no-evidence-support-claim-solfeggio-frequencies-remove-toxins-from-body/
