# 01 - Physiology: breathing rate/pattern and autonomic/emotional state

Evidence report for the breathwork app design document. Compiled 2026-10-11.

Grading key: **STRONG** = multiple RCTs / meta-analyses; **MODERATE** = several small controlled studies, broadly consistent; **WEAK** = single/small/uncontrolled studies or mixed results; **TRAD/SPEC** = no good human evidence.

Method note: findings tagged **[verified]** were read in this session from the paper or its abstract/full text (Balban was read in full text). Findings tagged **[bg]** come from background knowledge or secondary summaries and were NOT re-verified; check the primary source before putting them in user-facing copy. Several search summaries could not retrieve full text; those limits are stated where they matter.

---

## Bottom line

| # | Claim | Evidence strength | One-line caveat |
|---|---|---|---|
| 1 | Paced breathing at ~5-6/min (0.1 Hz) maximises RSA / HRV amplitude and engages baroreflex | **STRONG** (for the HRV/RSA amplitude effect); MODERATE for baroreflex gain | It is a large mechanical/oscillatory effect; "bigger HRV" is not the same as "more vagal tone" or better health |
| 1b | Slow breathing raises vagally-mediated HRV during practice and (smaller) after training | **STRONG** (Laborde 2022 meta-analysis, 223 studies) | Heterogeneous; most outcomes are short-term; effect sizes not verified by me |
| 1c | LF power / LF/HF = "sympathetic" or "sympatho-vagal balance" | **Not valid** - a measurement the app must not claim | During 6/min breathing LF power is dominated by the respiratory oscillation itself and baroreflex activity |
| 1d | Breathing at ~0.1 Hz reduces stress/anxiety (HRV biofeedback) | **MODERATE** (Goessl 2017 meta-analysis g~0.8; Fincham 2023 breathwork meta-analysis g~-0.3 to -0.4) | Mostly self-report, no blinding possible, moderate/high risk of bias, little long-term follow-up |
| 2 | Individual resonance frequency lies ~4.5-6.5/min, varies between people, inversely related to height, stable across sessions | **MODERATE** | Derived from small samples; whether training at exact RF beats a generic 6/min is less clear |
| 3 | Cardiac vagal activity is gated to expiration (HR slows on exhale) | **STRONG** (basic physiology) | Mechanism of RSA; "gating" is the classic account, with debate about central vs. baroreflex vs. stretch contributions |
| 3b | Longer exhale than inhale (e.g. 1:2) gives more vagal HRV / calm than equal ratio | **WEAK / MIXED** | 4 studies favour long exhale, 3 null, 1 favours equal, 1 favours long inhale; a 2024 original study (N=26) plus replication (N=16) at 6/min found no HRV difference |
| 3c | Longer exhale reduces anxiety/emotional arousal | **WEAK** (one small study with relaxation self-report; Balban partial) | Mostly inferred from HRV, not demonstrated as a distinct emotional outcome |
| 4 | 5 min/day cyclic sighing improves mood (positive affect) more than mindfulness over 28 days | **WEAK-MODERATE** (single RCT, N=108, retrospectively registered) | No HRV/HR effects; small groups (N=30); state anxiety fell equally in meditation; effect on positive affect, not anxiety |
| 4b | Spontaneous sighs reset respiratory variability and coincide with relief | **WEAK-MODERATE** (Vlemincx lab; mechanical lung physiology is strong) | An *instructed* sigh did not produce the relief of a spontaneous one in the 2010 study |
| 5 | Box breathing (4-4-4-4) is a validated stress tool | **WEAK** | No dedicated box-breathing RCT found; military/tactical claims are anecdotal; in Balban it performed no worse than others but not significantly better than meditation |
| 6 | Breath-holding causes CO2 rise, chemoreflex drive, sympathetic activation, diving response | **STRONG** physiology (laboratory studies) | Responses are modest in short, non-immersed holds; the diving reflex needs cold-water face immersion to be strong |
| 6b | Breath holds as a "relaxation" tool | **TRAD/SPEC** | Acute effect is sympathetic activation; any calming is post-hold relief/attention |
| 7 | Voluntary hyperventilation lowers CO2, causes alkalosis, cerebral vasoconstriction, tingling, carpopedal spasm | **STRONG** | Light-headedness and paraesthesia are expected; true syncope is unusual when seated, but hypocapnia before breath-hold underwater is a known drowning mechanism |
| 8 | Slow breathing alters EEG (alpha up, theta down) and brain oscillations | **WEAK-MODERATE** | Zaccaro review: 15 small studies; only one fMRI study |
| 8b | Nasal breathing entrains piriform/amygdala/hippocampus oscillations (humans) | **MODERATE as physiology; WEAK as behaviour** | Intracranial EEG in a small number of epilepsy patients (N not verified; ~7 per memory); behavioural effects (fear, memory) modest, lab tasks |
| 8c | A small preBötC neuron group (Cdh9/Dbx1) projects to locus coeruleus and sets arousal | **RODENT ONLY** | ~175 neurons in mice; no human demonstration; the "breathing slows -> LC quiet" link is a hypothesis |
| 9 | Nasal breathing delivers nasal/sinus NO to the lung and improves oxygenation | **WEAK-MODERATE** (small physiology studies) | Real, small effect; claims about chronic disease, anxiety, posture from mouth breathing are unproven |
| 10 | BOLT / "control pause" measures CO2 tolerance and predicts anxiety/fitness | **WEAK / unvalidated** | One 2024 study (N=49 athletes) found no relationship with performance (R2 0.08); no reliability data found |
| 11 | Changing breathing pattern changes emotion (not just correlates) | **WEAK-MODERATE** | Philippot 2002 shows instructed breathing induces emotion-congruent feelings but demand characteristics are a serious confound |
| 12 | Single session ~5-10 min shifts state; weeks of daily practice add cumulative effect | **MODERATE** (acute) / **WEAK-MODERATE** (chronic) | Few dose-response studies; minimum effective dose has not been established |

---

## 1. Resonance / coherent breathing (~0.1 Hz)

### 1.1 What is claimed
Breathing at about 0.1 Hz (6/min; 10-second cycle) maximises heart-rate oscillations ("resonance") and so engages the baroreflex like a gym for the cardiovascular regulatory system, producing calm and stress resilience.

### 1.2 Why ~0.1 Hz - the mechanisms **[verified from review abstracts; some numbers bg]**
Lehrer & Gevirtz (2014) lay out the resonance model:
- Two oscillators exist in the cardiovascular system. (a) Respiratory sinus arrhythmia (RSA): heart rate rises on inhalation and falls on exhalation. (b) The baroreflex: blood-pressure changes are sensed by baroreceptors and HR is adjusted with a delay.
- The baroreflex loop has a built-in lag (on the order of a couple of seconds from pressure change to the heart-period response; **[bg]** roughly 5 s lag between BP and HR oscillation at ~0.1 Hz). A closed feedback loop with delay has a natural resonant frequency near 0.1 Hz. When breathing drives the system at this frequency, RSA and baroreflex oscillations become in-phase and amplitudes add, giving very large HR, BP and vascular-tone oscillations (Vaschillo et al. 2006 describe "large oscillations in heart rate, blood pressure, vascular tone and pulse amplitude").
- Lehrer & Gevirtz call baroreflex strengthening the best-supported explanation of why resonance biofeedback has effects; secondary candidates (vagal afferent projections to frontal cortex, gas-exchange efficiency, emotional reactivity, inflammatory effects) are less settled. They explicitly note that conditions as varied as asthma and IBS seem to respond, which makes single-mechanism accounts hard.
- Bernardi et al. (BMJ 2001) found that reciting the rosary Ave Maria or a yoga mantra, both of which pace breathing at ~6/min, increased cardiovascular rhythms and baroreflex sensitivity (9.5 to 11.5 ms/mmHg, p<0.05, N=23, no non-practising control). Useful historically (explains why many traditions converge on ~6/min) but it is a small uncontrolled comparison.

### 1.3 What HRV metrics actually change
- **Peak-to-trough HR (and RSA amplitude)**: increases robustly and is the most direct, mechanical effect at the resonance rate. **[verified in principle - Brown/Beightol/Koh/Eckberg: R-R power at respiratory and low frequencies changes strongly with breathing rate and tidal volume]**.
- **SDNN** (overall variability) rises mostly because the oscillation amplitude is larger.
- **LF power (0.04-0.15 Hz)** rises dramatically in power, because the breathing frequency itself now sits inside the LF band. This is a respiratory/baroreflex effect, not a measurement of sympathetic activity.
- **HF power (0.15-0.4 Hz)** typically falls when breathing is slower than 9/min, because respiratory frequency moves out of the HF band. This does NOT mean vagal tone dropped.
- **RMSSD**: beat-to-beat; results vary with how the breath cycle is aligned. Laborde 2022 (see below) reports vmHRV increases overall, but RMSSD interpretation at 6/min differs from at spontaneous rates.
- Brown et al. (J Appl Physiol 1993) showed that respiratory rate and tidal volume strongly influence not only HF but also LF spectral power, and that this was "largely ignored" in the literature (only 51% of surveyed studies controlled breathing rate, 11% tidal volume). Design implication: any HRV the app shows must be interpreted relative to the user's own paced breathing, not compared across different breathing rates.

### 1.4 Does LF power index "vagal tone"? Does LF/HF index "sympatho-vagal balance"? (Honest answer)
- **LF/HF as sympatho-vagal balance is not valid.** Billman (2013, Frontiers in Physiology) argues the ratio rests on assumptions that fail: that LF reflects mostly cardiac sympathetic activity, that HF is purely parasympathetic, and that the two branches act reciprocally/linearly. LF/HF can rise when both branches decrease. Even the 1996 Task Force that popularised the ratio was more cautious than its later reputation.
- Evidence on what LF does reflect: supine LF power correlates with baroreflex gain (log LF vs log BRS r = 0.72) and was unrelated to cardiac sympathetic innervation or norepinephrine spillover (Moak et al., Heart Rhythm 2007 **[from search snippet; verify]**). So LF is mostly baroreflex-related oscillation, with contributions from both branches.
- **RSA/HF is not a pure vagal tone index either.** Grossman & Taylor (2007) caution that respiratory parameters confound the RSA-vagal tone relationship, within-person associations are strong but between-person associations are modest, and physical activity biases comparisons. Eckberg's classic work (1983, "Human sinus arrhythmia as an index of vagal cardiac outflow") and later work show RSA reflects vagal *modulation* but also respiratory depth/rate, and sympathetic restraint of RSA exists (Taylor et al. 2001).
- Design implication: show "heart-rate oscillation amplitude" or "breath-synchronised HR swing" if showing HRV at all; do not display or claim "sympathetic/parasympathetic balance" or "vagal tone score" or LF/HF. Polyvagal-theory language is also contested (an international expert evaluation published in a clinical neuropsychiatry journal argues it is untenable; Grossman & Taylor disputed its evolutionary claims).

### 1.5 Outcome evidence
- **Laborde et al. 2022, Neurosci Biobehav Rev**: systematic review + meta-analysis, 223 studies (172 during practice, 16 immediately after one session, 49 after multi-session interventions). Voluntary slow breathing increased vagally-mediated HRV at all three time points. **STRONG** for HRV direction. (Effect sizes not verified here.)
- **Zaccaro et al. 2018, Front Hum Neurosci**: systematic review of slow breathing (<10/min) in healthy people, 15 studies of 2,461 screened abstracts: slow breathing raises HRV and RSA; EEG alpha up/theta down; one fMRI study; psychologically more relaxation, comfort, lower arousal/anxiety/depressive symptoms. Authors flag small evidence base and inability to disentangle breathing from other meditation components. **MODERATE**.
- **Goessl, Curtiss & Hofmann 2017, Psychol Med**: meta-analysis of HRV biofeedback for stress/anxiety, 24 studies, 484 participants; between-group Hedges g = 0.83 vs controls (pre-post g=0.81). Not moderated by number of sessions or anxiety disorder status. Authors call for better-controlled studies. **MODERATE** (self-report outcomes).
- **Fincham et al. 2023, Sci Rep**: meta-analysis of breathwork RCTs (785 adults): stress g=-0.35, anxiety g=-0.32, depression g=-0.40; no significant moderation by slow vs fast breathing, delivery mode, or clinical status; all included RCTs at moderate/high risk of bias; no long-term follow-up. **MODERATE**; honest takeaway is that "breathwork" in general gives small-to-medium effects and the specific pattern is not clearly proven to matter.

---

## 2. Individual resonance frequency (RF)

- **Range**: **[bg]** typically about 4.5-6.5 breaths/min in adults (Lehrer et al.); children and shorter people tend to be faster.
- **Body-size relation [verified from abstract summary]**: Vaschillo et al. 2006 (Appl Psychophysiol Biofeedback 31:129-142; 32 adults with asthma, 24 healthy) found RF negatively associated with height (a secondary source gives r ~ -0.55), with men having lower RF than women, no association with age, weight or asthma; RF was stable across 10 biofeedback sessions; authors suggested a link to blood volume.
- **How determined (standard clinical protocol) [bg]**: Lehrer et al. (2000) protocol - the person breathes at a series of fixed rates (e.g., 6.5, 6.0, 5.5, 5.0, 4.5/min) for ~2-3 minutes each, with HR and (ideally) respiration/BP recorded; RF is the rate giving the maximal low-frequency HR oscillation / peak-to-trough amplitude and highest phase alignment between HR and breathing. Software now automates this. (Not re-verified: the Lehrer 2000 paper itself was not retrieved.)
- **Evidence strength**: MODERATE for existence and stability of RF; WEAK that training at the exact personal RF yields better outcomes than a generic ~6/min (Fincham's meta-analysis finds style does not significantly moderate stress outcomes).
- **App implication**: a rate sweep (e.g., 4.5 to 6.5 in 0.5 steps) judged by PPG/camera HR swing is plausible but would be noisy; a simple fallback is 5.5-6 per minute with height-informed adjustment (taller -> slower) labelled as an approximation.

---

## 3. Exhale longer than inhale

### 3.1 Mechanism (cardiac vagal activity is gated to expiration)
- Eckberg (2003, J Physiol "The human respiratory gate") describes RSA as a gating of cardiac vagal outflow by central respiratory activity: vagal motoneurones to the heart are inhibited during inspiration and released in expiration, so heart period lengthens on exhale. Baroreflex and lung-stretch afferents add to this. **[from search snippet; verify]**
- Balban et al. discuss the same logic: inhales raise HR and exhales lower it via RSA, so exhale-emphasised patterns "should" increase vagal influence. This is a hypothesis stated in the paper that was only partially supported (see section 4).
- Gerritsen & Band (2018, Front Hum Neurosci) propose a "respiratory vagal stimulation" model: slow breathing with relatively long exhale phasically increases vagal activity and tonically shifts autonomic balance. It is a theoretical review, not data.

### 3.2 What has been measured
- **Van Diest et al. 2014** (Appl Psychophysiol Biofeedback; N=30): 6 vs 12 breaths/min, I/E ratio 0.42 vs 2.33. Low I/E ratio (long exhale) gave increased relaxation, stress reduction, mindfulness and positive-energy ratings and more HF-HRV power, but only at the slow rate. **WEAK-MODERATE; the closest support for emotional benefit.**
- **Lin et al. 2014** (N=47): 5:5 vs 4:6 at 6 and 5.5/min; best result (higher SDNN and LF power) was 5.5/min with 5:5 - i.e., equal ratio won.
- **2024 paper "Do Longer Exhalations Increase HRV During Slow-Paced Breathing?"** (PMC11310264): original N=26 and replication N=16 comparing 1:2 vs 1:1 at 6/min found no effect of I:E ratio on time/frequency/nonlinear HRV. Its literature tally: 4 studies favour longer exhale, 3 null, 1 favours equal, 1 favours longer inhale; methodological problem of participants not actually hitting target rate/ratios.
- Specific ratios appearing in literature: 0.42 (about 3:7), 2.33, 1:2, 4:6, 5:5.
- **Verdict**: mechanism is physiologically plausible (STRONG basic physiology) but benefit of a long exhale over equal timing is UNPROVEN at slow rates; effect on HRV is small or absent when rate is held constant. Emotional/anxiety outcomes are mostly inferred from HRV or from one small study. The app can offer a longer exhale as a comfortable, widely used pacing choice but should not claim it is proven superior to 1:1 at 6/min.
- Practical note: at faster natural rates (10-15/min) a 1:2 pattern makes the breath slower, so rate and ratio are confounded in many demonstrations.

---

## 4. The physiological sigh / cyclic sighing

### 4.1 Balban et al. 2023 (Cell Rep Med 4:100895) **[verified, full text read]**
- Title: "Brief structured respiration practices enhance mood and reduce physiological arousal." Authors: Melis Yilmaz Balban, Eric Neri, Manuel M. Kogon, Lara Weed, Bita Nouriani, Booil Jo, Gary Holl, Jamie M. Zeitzer, David Spiegel, Andrew D. Huberman.
- Design: remote randomized controlled study (NCT05304000, registered **retrospectively**; originally exploratory pilot for a larger trial), conducted June-Sept 2020 during COVID. 28 days, 5 minutes/day.
- N: 140 consented, 114 invited, **108 enrolled**: mindfulness meditation 24 (control), cyclic sighing 30, box breathing 21, cyclic hyperventilation with retention 33. Block randomization (block of 8) but 8 households were co-randomized, giving unbalanced groups. Mostly Stanford undergraduates. Participants completed on average ~17.7 (meditation) and ~19.6 (breathwork) of 28 days.
- Protocols: 
  - Cyclic sighing: inhale slowly through the nose, then a second brief "top-up" inhale to fully fill the lungs, then slow full exhale (ideally via mouth); 5 min. Exhale-emphasised; no fixed counts given.
  - Box breathing: equal inhale/hold/exhale/hold, with durations 3-4 s, 5-6 s, or 8-10 s chosen from a "CO2 discard time" test (a slow-exhale time test); 5 min.
  - Cyclic hyperventilation with retention: 30 breaths (deep nasal inhale, passive mouth exhale), then exhale fully and hold empty lungs 15 s; repeat for 5 min (Wim Hof-style).
  - Mindfulness meditation: eyes closed, attention to the area between eyebrows, return when distracted; 5 min.
  - Instruction was via pre-recorded videos by Huberman.
- Outcomes: daily pre/post PANAS (positive/negative affect) and STAI state anxiety; WHOOP wrist strap for respiratory rate, resting HR, HRV (PPG-derived); sleep and trait anxiety pre/post.
- Results:
  - All four groups reduced state anxiety and negative affect and increased positive affect on the day of practice (state anxiety change per day about -3.0 to -3.95 on STAI; cyclic hyperventilation smallest at -1.81 +/- 2.97; cyclic sighing -3.85 +/- 4.88; box -3.75 +/- 2.83; meditation -3.95 +/- 4.16). No between-group difference in anxiety or negative affect.
  - Breathwork (combined) increased daily positive affect more than mindfulness, with a significant interaction by number of days practiced. Of the three, **only cyclic sighing was significantly higher than meditation**; the other two were numerically higher, not significant.
  - Respiratory rate (resting, over month) fell more in breathwork than meditation (p<0.05), significant for cyclic sighing individually; reduction in resp rate correlated with gain in positive affect (r = -0.24, p<0.05).
  - **No significant changes in HRV or resting heart rate** in any group. Trait anxiety unchanged.
- Effect sizes: the paper reports mixed-model coefficients and p-values; I did not extract a standardised effect size. Differences were modest.
- Limitations (authors' own + mine): not pre-registered; remote with self-reported adherence; no passive/no-treatment control, so cannot separate practice effect from time/expectation; control was an active comparator (meditation) with only 24 people; small per-arm sample size ("limiting power to compare individual breathwork groups" - authors); 4 weeks only; student sample; wrist PPG-HRV and respiratory rate algorithm; instructed by a prominent public figure (expectancy); high attrition during the month; box breathing pace tied to an unvalidated test. Multiple comparisons not corrected for. **The headline is positive affect improvement and lower respiratory rate, not an anxiety or HRV advantage.** Authors (Huberman, Spiegel) have a public-facing interest in the result.
- Evidence grade for claim "cyclic sighing is best breathing practice for mood": **WEAK-MODERATE** (single trial).

### 4.2 Older sigh physiology
- Bendixen and colleagues (early 1960s): sigh/large breaths during anaesthesia improved compliance and gas exchange; the sigh is thought to re-expand collapsing alveoli and release surfactant. A 2022 review (Psychophysiology of the sigh I, PubMed 35288214) states sighs control lung compliance by preventing alveolar collapse. Citation details for the Bendixen papers could not be pinned down in my searches (a 1963 anaesthesia study and Bendixen, Smith & Mead 1964 J Appl Physiol 19:195-198 "Pattern of ventilation in young adults" appeared). **Mechanical physiology: STRONG.**
- Li et al. 2016 (Nature): in mice, the sigh generator is a peptidergic circuit (neuromedin B / GRP from RTN/pFRG neurons to ~200 receptor-expressing preBötC neurons); ablating them removes sighs. **RODENT.**
- Vlemincx lab: Vlemincx et al. 2010 (Physiol Behav) - a spontaneous sigh was followed by reduced EMG and increased structured respiratory variability (relief); an *instructed* sigh did not do the same ("appeared to inhibit recovery from mental stress"). Later work frames the sigh as a respiratory-variability "reset." Sighs occur more during negative low-arousal states or high arousal. **WEAK-MODERATE.** (Details of 2011/2015 studies come from secondary descriptions.)
- Design caveat: Balban's "cyclic sighing" is a *voluntary, repeated, exhale-emphasised* pattern; Vlemincx's relief finding was for spontaneous sighs and an instructed single sigh was not helpful. The leap from the natural sigh to a 5-minute repeated protocol is an inference.
- "Physiological sigh" in popular use = double inhale + long exhale; the effect on 1-3 repetitions in real-time stress is plausible but unmeasured in controlled trials.

---

## 5. Box breathing / equal-ratio breathing

- Direct evidence: **thin**. Search found no dedicated peer-reviewed RCT or meta-analysis of the 4-4-4-4 pattern. A 2025 mini-review on box breathing for chronic pain acknowledges direct evidence is limited and extrapolates from similar controlled breathing interventions. Some 2026 items reported on a consumer health site (a review concluding HRV increases, a virtual TSST study) could not be traced to primary papers and should be disregarded unless checked.
- In Balban (above), box breathing reduced state anxiety similarly to other groups (-3.75), but its positive-affect advantage over meditation was not significant, and there was no HRV effect.
- Box breathing involves holds, so the average rate depends on the length: a 4-4-4-4 cycle is 16 s = 3.75 cycles/min, i.e. slower than resonance; the 5-6 s version is 2.5 cycles/min.
- Popular claim: Navy SEAL / military "tactical breathing" for stress control. These are doctrine and anecdote (e.g. books, commentary) rather than measured outcomes **[bg]**; I found no controlled evidence in the military context from these searches. **TRAD/SPEC for the "SEAL-proven" framing; WEAK for stress benefit.**
- Slow, regular breathing in general (including diaphragmatic) has a larger evidence base (Hopper 2019 JBI review of diaphragmatic breathing for stress **[cited indirectly; not verified]**).

---

## 6. Breath retention (apnea)

What breath-holding actually does acutely (strong human physiology, mostly from freedivers/lab studies):
- **CO2 rises and O2 falls** during the hold; the urge to breathe is driven mainly by CO2/H+ via central chemoreceptors (retrotrapezoid nucleus) and carotid-body oxygen/CO2 sensing; the first involuntary diaphragm contractions mark the "struggle phase". (Chemoreflex mini-review, Front Physiol 2022.)
- **Sympathetic activation**: marked sympathoexcitation occurs during maximal voluntary apnea (muscle sympathetic nerve activity and BP rise) — the review notes this in young swimmers. Breath-hold is acutely sympathetic-arousing, not "parasympathetic."
- **Diving response**: bradycardia (HR can fall to 20-30 bpm in deep/immersed divers), peripheral vasoconstriction, and **splenic contraction** releasing red-cell-rich blood (Comprehensive Physiology breath-hold diving review). The effect is amplified by cold-water face immersion; for dry static holds it is weaker. Splenic contraction is progressive over repeated apneas; recovery takes >1 h; trained divers show larger responses. **STRONG for divers; effects in a casual dry hold are small.**
- Pairing bradycardia (vagal) with peripheral vasoconstriction (sympathetic) is a co-activation ("autonomic conflict"), which is why breath holds can occasionally provoke arrhythmias.
- Training adaptation: divers show lower chemoreflex sensitivity and longer holds. Ability to hold longer largely reflects lower CO2 sensitivity and psychological tolerance, plus (in divers) spleen volume.
- Post-hold: CO2 sensitivity and parasympathetic rebound may produce a feeling of calm/relief - plausible but not demonstrated as an emotional outcome. **SPEC.**
- Safety flag (see also section 7): breath-holds after hyperventilation delay the urge to breathe (CO2 low) while O2 falls, which is a recognised cause of hypoxic blackout, especially in or near water. Never combine in water.
- Lung-empty holds and holds after a big inhale have different physiology (lung volume affects the diving response and O2 store) **[bg]**.

---

## 7. Fast breathing / voluntary hyperventilation

- **Hypocapnia -> respiratory alkalosis**: CO2 washout raises blood pH.
- **Cerebral vasoconstriction**: cerebral blood flow falls about 2-4% per mmHg drop in PaCO2 across 20-80 mmHg (TCD literature, nonlinear/sigmoid). At PaCO2 20-25 mmHg a trauma-care review gives a 40-50% reduction in CBF (this is the extreme end). Vasoconstriction both raises cerebrovascular resistance and reduces effective perfusion pressure. **STRONG.**
- **Light-headedness, visual changes, derealisation**: expected consequences of falling cerebral perfusion and altered neuronal excitability. (Bg: these resemble panic symptoms, so for anxious individuals they can be misinterpreted and escalate — central to "hyperventilation syndrome" literature and to why CO2 inhalation/breathing retraining are used clinically.)
- **Paraesthesia, carpopedal spasm, tetany**: alkalosis increases albumin binding of calcium, lowering ionised Ca2+ (about 0.05 mmol/L per 0.1 pH unit), which lowers the threshold for Na-channel firing and causes spontaneous action potentials in peripheral nerves; K+ drops about 0.5 mmol/L per 10 mmHg fall in PaCO2 and hypomagnesaemia contribute. Typical presentation: tingling in fingers, toes, perioral region; muscle cramps; carpopedal spasm. **STRONG.**
- **Syncope**: reduced CBF plus peripheral vasodilation and (if standing) orthostatic pooling can cause faint. Voluntary hyperventilation seated usually causes dizziness without loss of consciousness; the practical risks are (a) standing up quickly, (b) driving/water, (c) combination with Valsalva or breath-holds. The paradoxical danger is not syncope from alkalosis but hypoxic blackout when CO2-driven urge to breathe is suppressed — i.e., hypocapnia then breath-hold. **[bg for the "fainting is unusual when seated" statement; verify with a clinical review before copy.]**
- Catecholamines: an older experimental study found adrenaline rose ~360% and noradrenaline ~151% during 20 min of air hyperventilation but not when CO2-enriched air was breathed — the adrenaline surge is driven by hypocapnic alkalosis, not hyperventilation per se. Relevant to Wim Hof breathing: Kox et al. 2014 (PNAS) showed trained subjects had attenuated endotoxin responses; components not separately tested; the Almahayni & Hammond 2024 systematic review (PLOS One) rated all included studies at high concern for bias. **WEAK.**
- In Balban the hyperventilation-with-retention arm had the smallest state-anxiety reduction (-1.81) of the breathwork groups and 10% overall reported negative experiences.
- Safety: Live Science / experts warn about drowning and arrhythmia risk with Wim Hof method in water; a lawsuit was filed in 2022. Treat as context.
- App implications: expect tingling/lightheadedness in fast rounds; make it explicit as normal and reversible; do not frame the sensations as "toxins releasing" or "energy"; contraindicate for pregnancy, epilepsy, cardiovascular disease, panic disorder (see safety dossier, separate document).

---

## 8. Slow breathing and the brain

| Finding | Species | Strength |
|---|---|---|
| Slow breathing: EEG alpha up, theta down (Zaccaro 2018, small studies) | Human | WEAK-MODERATE |
| One fMRI study: slow breathing activates prefrontal, parietal cortex, thalamus, hypothalamus, PAG, pons (Zaccaro) | Human | WEAK (N small) |
| **Nasal respiration entrains oscillations in piriform cortex, amygdala, hippocampus at ~0.16-0.33 Hz; mouth breathing abolishes the effect; recognition of fearful faces faster on inhale; memory retrieval better on inhale** (Zelano et al., J Neurosci 2016) | Human intracranial EEG (7 epilepsy patients) + behavioural cohorts | MODERATE for the neural entrainment finding; the behavioural effects are small, lab-based |
| Cdh9/Dbx1 preBötC neurons (~175) project to locus coeruleus (noradrenergic); ablation makes mice calmer, with less time aroused (Yackle et al., Science 2017) | **Mouse only** | RODENT; extrapolation to humans is a hypothesis |
| Sigh peptide circuit (NMB/GRP) (Li et al. 2016) | **Mouse only** | RODENT |
| Nasal vault mechanoreceptors -> olfactory bulb -> cortical modulation as mechanism for slow-breathing effects (Zaccaro proposal) | Mixed; mostly rodent | SPEC |
| Interoceptive pathways (vagal afferents, insula) | Human | Plausible, little direct data |

Notes:
- The "breathing -> LC/noradrenaline -> arousal" idea comes primarily from Yackle. Press releases overstated it as "How slow breathing induces tranquility." The paper shows the preBötC cell group sets arousal in mice; it does not show that slowing breathing in humans reduces LC firing. A related human LC-breathing literature exists (e.g. Melnychuk 2018 on breath-focus and LC activity) but I did not verify it here.
- Zelano's finding is that oscillations are tied to *phase* (inspiration), and that nasal not oral airflow generates them. It does not show that deliberately slow breathing produces calm.
- Honest synthesis: there is a believable, partly rodent-supported story that breathing rhythm feeds arousal circuits; human proof that slow breathing exerts its calming effect via these circuits is lacking.

---

## 9. Nasal vs. mouth breathing; nitric oxide

- Lundberg's group: the main upper-airway NO source is the paranasal sinuses; NO is carried into the lungs on nasal inspiration. Measured inhaled NO via nose ~64 ppb vs ~11 ppb via mouth vs ~4 ppb tracheal (1999 study, 7 healthy + 10 tracheotomised subjects). Nasal vs oral breathing in healthy subjects: arterial oxygenation was higher with nasal breathing (Lundberg 1996, Acta Physiol Scand). **WEAK-MODERATE; small studies.** NO acts as a pulmonary vasodilator that may improve ventilation-perfusion matching.
- The nose also filters, warms and humidifies air and (Zelano) is required for the piriform/limbic respiratory oscillations.
- Popular claims (Nestor, *Breath*, 2020): mouth breathing causes snoring, sleep apnoea, high BP, anxiety, ADHD, psoriasis. The book's centrepiece is a 20-day self-experiment (10 days nose blocked, 10 days mouth taped) with a Stanford team — N=2 (author + one other), not a controlled trial. Reviewers describe the book's claims as scattershot. **TRAD/SPEC for chronic disease claims; the physical NO/oxygenation findings are valid but small.**
- Practical: a nasal inhale is reasonable default for slow paced breathing (humidifies, limbic entrainment findings, quieter); mouth breathing is appropriate during exercise or when congested. Forcing nasal-only during vigorous breathing is an unproven preference.

---

## 10. CO2 tolerance, "control pause", BOLT

- BOLT (Body Oxygen Level Test; Patrick McKeown, Buteyko tradition): after a normal exhale pinch the nose and time to the first definite desire to breathe. Proponents interpret scores <20 s as poor CO2 tolerance.
- Evidence: Frontiers in Physiology 2024 (49 elite speedskaters): BOLT not associated with exercise performance (R2 = 0.08, RMSE 9.8 s). Authors: BOLT "has not yet been scientifically validated." A validation trial (NCT06236490) is registered; results not found. No published BOLT test-retest reliability found; endpoint is subjective.
- Breath-hold duration in general has moderate stability (a 2013 study found r=0.67 over a year, N=34) and associations with trait anxiety, anxiety sensitivity, fear of suffocation, distress tolerance; but other factors (motivation, lung volume, practice) strongly affect it. Not specific to CO2 chemosensitivity.
- Verdict: **WEAK / unvalidated** as a clinical or fitness indicator; reasonable as a motivational self-tracking number only if presented as "how long you can comfortably hold" and not as a diagnostic of anything. Avoid medical claims (e.g., "low score means dysfunctional breathing").
- Note that Balban's box-breathing arm used a related "CO2 discard time" test to set pace; that is also unvalidated.

---

## 11. Interoception, anxiety, and whether changing breath changes emotion

- **Philippot, Chapelle & Blairy (2002), Cognition and Emotion 16(5):605-627**, "Respiratory feedback in the generation of emotion." Two studies. Study 1: participants asked to produce joy, anger, fear, sadness and to describe the breathing patterns that fit; the reported patterns resembled patterns recorded objectively in earlier psychophysiology (Bloch et al. 1991 — see below). Study 2: participants performed breathing patterns for each emotion (with memory/fantasy conditions and breathing-only conditions); the patterns induced the anticipated emotion "to varying but significant degrees" (secondary description). Summary patterns in the popular literature (joy: slow/deep with long exhale; anger: fast/deep/forceful; fear: rapid/shallow/irregular; sadness: slow/shallow with sighs) are from blog summaries and should be checked against the paper's tables.
  - Related: Bloch et al. 1991 ("Specific respiratory patterns distinguish among human basic emotions", Int J Psychophysiol) - actors' respiratory-facial-postural patterns; reproducing the pattern evoked the congruent feeling.
  - **Weaknesses**: (1) emotion-specific instructions carry strong demand characteristics — participants know what emotion the breathing is "meant" to induce (the facial-feedback replication crisis is a direct analogue: Many Labs/Wagenmakers 2016 multi-lab replication of the pen-in-mouth study failed to replicate the original effect **[bg]**); (2) outcome is self-reported emotion with small samples; (3) the instructions bundled breathing with posture/face in Bloch-style procedures; (4) no control for non-emotional arousal; (5) breath instructed on top of memory/fantasy confounds. Treat as WEAK-MODERATE support for "breath pattern can bias emotional experience," not as evidence that a particular rate "cures" an emotion.
- Interoception: Balban propose that breath practice enhances interoceptive processing, a sense of control, and modulation of vagal function; these are discussion points, not measured. Because anxious people can misread bodily sensations (panic disorder, anxiety sensitivity), breath-focus can amplify symptoms in some individuals; the authors note interoceptive awareness "is ambiguous."
- Causality evidence: HRV-biofeedback and breathwork RCTs reduce self-reported anxiety (Goessl; Fincham) but cannot isolate whether it is the breath rhythm, relaxation, attention, expectancy or sense of control. Fincham's finding that fast vs slow style did not moderate effects suggests non-specific factors contribute heavily. Zaccaro also flags inability to separate breathing from meditation components. **Verdict: breathing manipulation reliably changes arousal-linked physiology; effect on emotion is real but small-to-moderate and likely multi-factorial. "Correlates" is too weak; "causes specific emotion" is too strong.**

---

## 12. Dose and duration

- **Acute (single session)**: Laborde 2022 found vagally-mediated HRV increases *during* slow breathing (172 studies) and also immediately after one session (16 studies) — i.e., the HRV swing is present within minutes at 6/min; the lasting after-effect is smaller. In Balban, one 5-minute session produced same-day reductions in state anxiety and increases in positive affect in all groups (including meditation), averaging about 3-4 STAI points. Resonance HR oscillations appear within roughly 1-2 minutes **[bg]**; a typical resonance practice block is 10-20 minutes (clinical HRVB protocols use ~20-30 min practice at home, 10 weekly sessions of 20-30 min in lab **[bg]**).
- **Chronic**: Balban found that positive-affect gains were larger with more days practiced, and cyclic sighing's advantage grew with cumulative days; respiratory-rate slope declined over 4 weeks; no HRV or resting HR change. Laborde found vmHRV increases after multi-session interventions (49 studies). Goessl found no moderation by number of sessions (the data do not say more sessions = better).
- **Minimum effective dose**: not established (Balban authors state this explicitly: future studies should identify "the minimum effective daily dose and minimum amount of adherence"). No long-term follow-up in Fincham or Balban.
- **Design recommendations (evidence-based)**: (a) first perceptible shift typically within 1-3 minutes of slow paced breathing; (b) 5 min is a defensible minimum; 10-20 min for deep sessions; (c) hold users to realistic claims: "most people feel calmer after 5 minutes" is supportable, "rewires your nervous system in weeks" is not.

---

## Cross-cutting cautions for the app

1. Never display LF/HF or call anything "sympathetic/parasympathetic balance." Use "heart-rate swing" or RMSSD, with a note that values depend on breathing rate.
2. Distinguish rodent findings (Yackle, Li) from human findings.
3. Keep "resonance at 0.1 Hz" separate from "calming effect" — oscillation amplitude is strongly evidenced; calming effect has moderate evidence and unclear mechanism.
4. Fast-breathing and breath-hold modules need explicit safety framing (see safety dossier).
5. Prefer claims phrased by evidence level, e.g. "In a 28-day trial of 108 people, five minutes of exhale-focused breathing improved positive mood more than meditation."
6. Wearable/camera HRV during paced breathing needs validation; Balban's HRV from wrist PPG may have been too noisy to detect effects.

---

## References

(Items marked * were fully read; others from abstracts/search summaries.)

1. *Balban MY, Neri E, Kogon MM, ... Spiegel D, Huberman AD. Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Rep Med 2023;4:100895. https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/ ; trial NCT05304000.
2. Lehrer PM, Gevirtz R. Heart rate variability biofeedback: how and why does it work? Front Psychol 2014;5:756. https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00756/full
3. Billman GE. The LF/HF ratio does not accurately measure cardiac sympatho-vagal balance. Front Physiol 2013;4:26. https://pmc.ncbi.nlm.nih.gov/articles/PMC3576706/
4. Zaccaro A, Piarulli A, Laurino M, et al. How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing. Front Hum Neurosci 2018;12:353. https://pmc.ncbi.nlm.nih.gov/articles/PMC6137615/
5. Fincham GW, Strauss C, Montero-Marin J, Cavanagh K. Effect of breathwork on stress and mental health: a meta-analysis of randomised-controlled trials. Sci Rep 2023;13:432. https://www.nature.com/articles/s41598-022-27247-y (PDF: https://sussex.figshare.com/articles/journal_contribution/Effect_of_breathwork_on_stress_and_mental_health_a_meta-analysis_of_randomised-controlled_trials/23494097/1)
6. Laborde S, Allen MS, Borges U, et al. Effects of voluntary slow breathing on heart rate and heart rate variability: a systematic review and meta-analysis. Neurosci Biobehav Rev 2022;138:104711. https://eprints.bournemouth.ac.uk/38169/ (doi 10.1016/j.neubiorev.2022.104711)
7. Vaschillo EG, Vaschillo B, Lehrer PM. Characteristics of resonance in heart rate variability stimulated by biofeedback. Appl Psychophysiol Biofeedback 2006;31:129-142. https://link.springer.com/doi/10.1007/s10484-006-9009-3
8. Lehrer PM, Vaschillo E, Vaschillo B. Resonant frequency biofeedback training to increase cardiac variability: rationale and manual for training. Appl Psychophysiol Biofeedback 2000;25:177-191 (not retrieved; cited from secondary reference).
9. Brown TE, Beightol LA, Koh J, Eckberg DL. Important influence of respiration on human R-R interval power spectra is largely ignored. J Appl Physiol 1993;75:2310-2317. https://pmc.ncbi.nlm.nih.gov/articles/PMC2990812 (match uncertain; verify)
10. Eckberg DL. The human respiratory gate. J Physiol 2003;548:339-352. https://pmc.ncbi.nlm.nih.gov/articles/PMC2342859 (verify link)
11. Eckberg DL. Human sinus arrhythmia as an index of vagal cardiac outflow. J Appl Physiol 1983;54:961-966.
12. Grossman P, Taylor EW. Toward understanding respiratory sinus arrhythmia: relations to cardiac vagal tone, evolution and biobehavioral functions. Biol Psychol 2007;74:263-285. https://doi.org/10.1016/j.biopsycho.2005.11.014
13. Goessl VC, Curtiss JE, Hofmann SG. The effect of heart rate variability biofeedback training on stress and anxiety: a meta-analysis. Psychol Med 2017;47:2578-2586. https://www.cambridge.org/core/journals/psychological-medicine/article/effect-of-heart-rate-variability-biofeedback-training-on-stress-and-anxiety-a-metaanalysis/A839E9C968E54774DF5C8FB186764EF0
14. Bernardi L, Sleight P, Bandinelli G, et al. Effect of rosary prayer and yoga mantras on autonomic cardiovascular rhythms: comparative study. BMJ 2001;323:1446-1449. https://www.bmj.com/content/323/7327/1446 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC61046
15. Russo MA, Santarelli DM, O'Rourke D. The physiological effects of slow breathing in the healthy human. Breathe 2017;13:298-309. https://pubmed.ncbi.nlm.nih.gov/29209423/
16. Gerritsen RJS, Band GPH. Breath of life: the respiratory vagal stimulation model of contemplative activity. Front Hum Neurosci 2018;12:397. https://pmc.ncbi.nlm.nih.gov/articles/PMC6189422/
17. Van Diest I, Verstappen K, Aubert AE, et al. Inhalation/exhalation ratio modulates the effect of slow breathing on heart rate variability and relaxation. Appl Psychophysiol Biofeedback 2014;39:171-180. https://research.vu.nl/en/publications/inhalationexhalation-ratio-modulates-the-effect-of-slow-breathing/
18. Lin IM, Tai LY, Fan SY. Breathing at a rate of 5.5 breaths per minute with equal inhalation-to-exhalation ratio increases heart rate variability. Int J Psychophysiol 2014;91:206-211.
19. (Authors per paper) Do longer exhalations increase HRV during slow-paced breathing? Appl Psychophysiol Biofeedback 2024. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11310264/
20. Vlemincx E, Van Diest I, Lehrer PM, Aubert AE, Van den Bergh O. Respiratory variability preceding and following sighs: a resetter hypothesis. Biol Psychol 2010;84:82-87; and Vlemincx E et al. Take a deep breath: the relief effect of spontaneous and instructed sighs. Physiol Behav 2013;. https://research.vu.nl/en/publications/take-a-deep-breath-the-relief-effect-of-spontaneous-and-instructe/ (year/venue to verify)
21. Bendixen HH, Smith GM, Mead J. Pattern of ventilation in young adults. J Appl Physiol 1964;19:195-198. (and Bendixen et al., 1963 sigh/anaesthesia study; verify)
22. Psychophysiology of the sigh I: the sigh from the physiological perspective. Biol Psychol 2022. https://pubmed.ncbi.nlm.nih.gov/35288214/
23. Li P, Janczewski WA, Yackle K, et al. The peptidergic control circuit for sighing. Nature 2016;530:293-297. https://pmc.ncbi.nlm.nih.gov/articles/PMC4852886
24. Philippot P, Chapelle G, Blairy S. Respiratory feedback in the generation of emotion. Cogn Emot 2002;16:605-627. doi 10.1080/02699930143000392. https://dial.uclouvain.be/pr/boreal/object/boreal:42305
25. Bloch S, Lemeignan M, Aguilera-T N. Specific respiratory patterns distinguish among human basic emotions. Int J Psychophysiol 1991;11:141-154. https://pubmed.ncbi.nlm.nih.gov/1748589/
26. Yackle K, Schwarz LA, Kam K, et al. Breathing control center neurons that promote arousal in mice. Science 2017;355:1411-1415. https://pmc.ncbi.nlm.nih.gov/articles/PMC5505554
27. Zelano C, Jiang H, Zhou G, et al. Nasal respiration entrains human limbic oscillations and modulates cognitive function. J Neurosci 2016;36:12448-12467. https://pmc.ncbi.nlm.nih.gov/articles/PMC5148230
28. Lundberg JON et al. Nasal vs oral nitric oxide and oxygenation: Acta Physiol Scand 1996 (nasal breathing and arterial oxygenation); Lundberg & Weitzberg, airborne NO. https://openarchive.ki.se/xmlui/handle/10616/44272 (details to verify)
29. Nestor J. Breath: The New Science of a Lost Art. Riverhead; 2020 (popular book; self-experiment).
30. Body oxygen level test (BOLT) is not associated with exercise performance in highly-trained individuals. Front Physiol 2024;15:1430837. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2024.1430837/full ; PMC11406178
31. Chemoreflex control as the cornerstone in immersion water sports: possible role on breath-hold. Front Physiol 2022;13:894921. https://frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.894921/full
32. Breath-hold diving (Comprehensive Physiology review). https://comprehensivephysiology.com/WileyCDA/CompPhysArticle/refId-c160008.html
33. Hyperventilation in severe TBI brief review (CBF ~3%/mmHg). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7991081/ ; Clinical tetany/alkalosis: https://www.ccjm.org/content/80/6/360.full.pdf ; https://pmc.ncbi.nlm.nih.gov/articles/PMC4173627/
34. Kox M, van Eijk LT, Zwaag J, et al. Voluntary activation of the sympathetic nervous system and attenuation of the innate immune response in humans. PNAS 2014;111:7379-7384 (not retrieved). Almahayni O, Hammond L. Does the Wim Hof Method have a beneficial impact on physiological and psychological outcomes in healthy and non-healthy participants? A systematic review. PLOS ONE 2024. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10936795/
35. Reyes del Paso GA, Langewitz W, Mulder LJM, et al. The utility of low frequency heart rate variability as an index of sympathetic cardiac tone: a review. Psychophysiology 2013;50:477-487. (bibliographic only)
36. LF power and baroreflex: Moak JP et al. Supine low-frequency power of heart rate variability reflects baroreflex function, not cardiac sympathetic innervation. Cleve Clin J Med/Heart Rhythm 2007. https://mdedge.com/ccjm/article/95180/supine-low-frequency-power-heart-rate-variability-reflects-baroreflex-function (verify)
37. Polyvagal critique: Grossman P. et al., "Why the polyvagal theory is untenable" (international expert evaluation). https://www.clinicalneuropsychiatry.org/download/why-the-polyvagal-theory-is-untenable-an-international-expert-evaluation-of-the-polyvagal-theory-and-commentary-upon-porges-s-w-2025-polyvagal-theory-current-status-clinical-applications-and/
38. Hopper SI et al. Effectiveness of diaphragmatic breathing for reducing physiological and psychological stress in adults. JBI Database System Rev Implement Rep 2019;17:1855-1876 (cited indirectly).
