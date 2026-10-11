# 02 - Safety dossier: guided-breathing app

Compiled 2026-10-11. Purpose: define what the app may and may not do. Accuracy over completeness.

**Confidence labels used throughout**
- [A] primary/official source fetched and read in full (CDC MMWR, ILS Federation, RLSS UK, ANS/BSCN guideline, MJA case report, Wim Hof Method published disclaimer as quoted in secondary sources).
- [B] reputable secondary reporting (Live Science, The National, DutchNews) or a search-result summary of a primary paper that I did not open in full.
- [C] commercial/practitioner material, animal data, or my own physiological reasoning. Treat as design heuristics, not evidence.

**Limits of this research (read first)**
- The PubMed E-utilities calls returned empty, so I could not run structured PubMed searches. Several peer-reviewed claims below come from search-result summaries and are marked [B].
- I did NOT retrieve: Breathwrk's terms of use, iBreathe's disclaimer, any USA Swimming or RNLI statement on hyperventilation, the Sunday Times 2024 investigation itself, the coroner reports themselves, or any HRV-biofeedback screening protocol. These are listed as gaps at the end of section (i). Do not cite them as checked.
- I found **no peer-reviewed systematic review of breathwork harms** and no PubMed case report of pneumothorax caused by breathwork. Absence of evidence here mostly reflects an absent literature, not proven safety.
- This is not legal or medical advice. Have a clinician and a regulatory lawyer review the final screening wording.

---

## (a) Hard rules - non-negotiable in the app

Ordered by severity of harm. "Block" means the protocol cannot be started, not merely warned about.

| # | Rule | Why / source |
|---|------|--------------|
| 1 | **Water rule.** Never offer or play any protocol that involves fast/deep breathing, hyperventilation, or breath-holds while the user is in, on, or next to water (bath, shower is lower risk but still seated rule applies, pool, sea, hot tub, ice bath, sauna plunge). Show a mandatory, un-skippable, full-screen warning before ANY protocol containing fast breathing or a hold. Warning text must say "never before or during swimming, bathing, diving or driving". | Shallow-water/hypoxic blackout is fatal and gives no warning: ILS Federation MPS-16 [A]; RLSS UK GS005 "Hyperventilation should not be permitted prior to breath-holding" [A]; CDC MMWR 64(19) [A]; Wim Hof Method's own published disclaimer [B]. |
| 2 | **Seated or lying only** for any protocol with hyperventilation, retention, or Valsalva-like effort. Never standing, walking, in a car, on a bike, on stairs, in a bath. The app should require the user to confirm posture at the start of each such session. | Syncope with fall injury risk; MJA case report shows a post-dive posture change (standing up) likely triggered anoxic convulsions [A]. Wim Hof Method guidance: sit or lie down [B]. |
| 3 | **No breath-holds after hyperventilation unless the user has passed screening AND confirmed not in/near water AND is seated/lying.** Default every consumer protocol to no forced post-hyperventilation retention at all. If retention exists, cap it, require "release at first urge/discomfort", and never frame a long hold as a goal, score, streak, or leaderboard item. | Mechanism of hypoxic blackout (see (b)); competition and goal-fixation recur in case series: Craig 1976 (58 cases) and MJA 2010 note victims were often trying to beat a record [A]. ILS: goal preoccupation may override warnings [A]. |
| 4 | **Do not drive or operate machinery** during or immediately after fast-breathing/retention protocols. Block start if the app detects driving/motion (CoreMotion/Activity Recognition) where feasible; otherwise a mandatory confirmation. Slow, relaxed, non-forced breathing (e.g. 4-6 per min, no holds) is a different risk class; still advise not to use while driving as it is attention-diverting. | Wim Hof disclaimer: "never practice... before or during diving, driving, swimming, taking a bath" [B]. Syncope mechanism (b). |
| 5 | **Hard stop on any red-flag symptom** (chest pain, fainting/near-faint that does not clear within seconds of normal breathing, seizure-like activity, severe sudden headache, visual loss, one-sided weakness). The app must provide a one-tap "stop - breathe normally" control that is always visible and always works, and must stop all audio/visual pacing prompts when pressed. | ANS/BSCN guideline stops HV for chest pain, ST changes or rhythm disturbance [A]; general clinical practice [C]. |
| 6 | **Contraindication gate before first fast-breathing session** (screening questions in (e)). A "yes" or "not sure" to a high-risk item blocks fast breathing, hyperventilation-type and breath-hold protocols, leaving only gentle slow-breathing options. Re-screen at intervals and when protocol intensity increases. | ANS/BSCN absolute/relative contraindications [A]; Wim Hof Method disclaimer [B]; practitioner lists [C]. |
| 7 | **Epilepsy/seizure history blocks all cyclic hyperventilation and extended holds.** | Hyperventilation is used deliberately to PROVOKE seizures in EEG labs: ANS/BSCN guideline [A]. See (c). |
| 8 | **Pregnancy blocks fast breathing and breath holds.** Slow, comfortable breathing only. | No human outcome data; animal and mechanistic concern plus universal practitioner contraindication [C]. See (c). |
| 9 | **Minimum age: block hyperventilation/retention protocols for under-18s** (and treat under-16 accounts as slow-breathing only). | Teen deaths in case series: Madelyn Metzger (17), CDC NY case series ages 7-47, average 17 [A/B]. No safety data in minors for these protocols; adult screening cannot be self-completed by a child. [C for the cut-off choice.] |
| 10 | **No medical claims.** Never state or imply the app treats, cures, or manages anxiety disorder, panic, PTSD, hypertension, asthma, etc. Stay inside "general wellness: relaxation / stress". | FDA general wellness policy (see (g)) [B]. |
| 11 | **No hard "feel the burn / push through" language.** Tingling, dizziness are expected, but the app must say "ease off at the first light-headedness", never "push through". | Symptom triage (d); Craig/RLSS: warnings are weak or absent before blackout [A]. |
| 12 | **Do not rely on the user to recognise impending blackout.** Design rules must be safe even for someone who feels fine. | RLSS UK: "the swimmer cannot be expected to recognise nearing the limit" [A]; ILS: unconscious "without warning" in majority of survivors [A]. |
| 13 | **Do not use hyperventilation protocols as a response to a user reporting a panic attack or acute distress.** In-the-moment calming = slow exhale-weighted breathing only. | Panic evidence in (b)/(c) cuts both ways [B]. |
| 14 | **Do not infer clinical status from wearable data** to clear someone as safe (e.g. "your HR looks normal so proceed"). Screening is self-report plus doctor advice. | Wellness-vs-device boundary (g) [B]; also unreliable [C]. |

---

## (b) Fatality and harm evidence in detail

### b1. Shallow-water / hypoxic blackout - mechanism

**Authoritative statement (ILS Federation MPS-16, 2011) [A]**
- Defines shallow water blackout as "loss of consciousness and sudden unexplained death in the water" following hyperventilation with apnoea (breath-hold) diving. No standard definition or classification exists, so incidence records are vague. Australian snorkelling deaths 1987-1998: 12 of 60 (20%) attributed to hypoxia from breath-holding and hyperventilation.
- **Core mechanism (Craig 1976, 58 cases):** hyperventilation lowers arterial PaCO2, "thus removing the respiratory drive". Meanwhile tissues keep consuming oxygen until the brain stops functioning. In most survivors (34), the person had an urge to breathe but still lost consciousness "without warning".
- **Why the CO2 warning disappears but O2 is not gained:** the urge to breathe is driven by rising PaCO2/[H+] at the central and peripheral chemoreceptors. Hyperventilation blows off CO2, so breakpoint is delayed. Hyperventilation adds little oxygen because haemoglobin is already about 97-99% saturated at rest on room air (my physiology note [C]; the secondary summary says hyperventilation "removes CO2" without a gain in O2). So the body can reach a critically low O2 before CO2 reaches the usual trigger.
- **Why exercise makes it worse:** O2 consumption rises, and the PACO2 at breakpoint is the same as at rest, so hypoxia gets closer faster (ILS; MJA 2010 [A]).
- **Cerebral effects of hypocapnia:** reduced cerebral blood flow, and a leftward shift of the oxyhaemoglobin curve impairing tissue O2 delivery (ILS lists both) [A].
- **Ascent / latent hypoxia:** on ascent, lung volume expands, lowering the alveolar partial pressures of both CO2 (less respiratory drive) and O2 (hypoxic gas mixture). ILS notes this effect is usually seen beyond about 5 m and cannot explain the many shallow incidents [A]. So blackout occurs in shallow pools too. RLSS UK: "can also occur in any depth of water" [A].
- **Other contributing mechanisms listed by ILS [A]:** reduced free calcium after respiratory alkalosis (motor control loss, swim failure); "samba" loss of motor control; air embolism from straining against a closed glottis. ILS flags that several are hypotheses.
- **Valsalva effect:** the MJA 2010 report notes Valsalva can cause syncope early in a breath-hold dive by cutting venous return and cardiac output [A].
- **Rescue window is shorter than in cardiac arrest** because blood, lungs and tissues are already depleted of O2 (ILS) [A].

**Epidemiology**
- **CDC MMWR 64(19), 22 May 2015 [A]:** 16 cases (NY State, 1988-2011), 4 fatal, all four fatalities aged 17-22, "advanced to expert swimmers", and all four engaged in intentional hyperventilation. 15 of 16 occurred at lifeguarded pools; 15 of 16 had witnesses. Two healthy young men died in a NYC pool in 2011 after hyperventilation + submersion exercises while preparing for a military fitness test. Behaviours: intentional hyperventilation, static apnea, hypoxic training. Coactivity (multiple behaviours) raised fatality risk. NYC Health Code since 2014 requires signage warning that intentional hyperventilation is dangerous. Note: an erratum exists (mm6425a6); check it before quoting numbers.
- **Australia, Franklin, Peden, Pearn, MJA 2018 [B, via summary]:** 22 hypoxic-blackout drowning deaths 2002-2015, all male, most young adults; 12 in pools, 9 in ocean/harbour (5 spearfishing, 4 freediving). Authors say true numbers are likely higher because such deaths can be coded simply as drowning.
- **MJA 2010 case report (Kumar and Ng) [A]:** two fit 27-year-old men in a "Dolphin Dive" competition hyperventilated first; both lost consciousness at the end of the dive (60-85 m, 40-90 s) with myoclonic jerks (<1 min). Rescued by onlookers; no lasting harm. Lessons: syncope can look like a seizure; hyperventilation is "the main causative factor"; Craig's series had 56 of 58 male, all good swimmers, 23 fatal.
- **Official positions:** RLSS UK GS005 (v1 Jan 2020, updated Apr 2025): "Hyperventilation should not be permitted prior to breath-holding"; breathing should return to normal before repeating; never swim alone; lifeguards should intervene for swims over 25 m underwater [A]. ILS: hyperventilation "should actively be discouraged due to the potentially fatal consequences"; underwater breath-hold swimming is safer if no hyperventilation, no glottis closure, depth under 5 m, effective activity continues [A]. NYC Health Code [A].

### b2. Wim Hof Method (WHM) and "Wim Hof style" breathing

**What the method is [B].** Roughly 30-40 deep, fast breaths (deliberate hyperventilation), then a breath-hold after exhale "until you feel the urge to breathe", then a recovery breath-hold, repeated. Combined in the brand with cold exposure.

**Documented incidents and legal cases**
- **Madelyn Metzger (17), California, August 2022 [B].** Found at the bottom of the family pool by her father, attorney Raphael Metzger, who believes she was practising WHM breathing. LA County coroner ruled the death accidental, clean toxicology, no sign of arrhythmia or structural abnormality [B, via search summary of Outside]. Her father sued Wim Hof and Innerfire (Hof's company) in December 2022 seeking about $67m and an injunction against promoting the method in California. **Outcome (July 2024):** judgment for Hof on lack of proof. DutchNews reports Hof's lawyers argued the question was not whether the breathing can lead to drowning but whether it was proven she was doing the exercises in the pool at the time and that this caused the drowning; the judge agreed no such proof was submitted. It was a civil case (media called it "acquitted"). Metzger's lawyer said he would appeal on the timing of the ruling. I have not verified whether an appeal was filed or decided as of Oct 2026. **Important:** the court did not find the breathing safe; it found causation unproven.
- **Count of deaths [B/C].** Het Parool (2016) reported at least three deaths in water; DutchNews says "a dozen drownings" linked, first court case; Sunday Times (June 2024) reportedly found 11 cases where families claim loved ones died after WHM or similar breathing plus cold water; journalist-critic Scott Carney claims 31 (Live Science, April 2024) to 34 linked deaths. **These totals come from an advocate's own compilation of news reports and private tips, not an official registry; none had been confirmed to involve WHM in a court of law (Live Science).** I could not retrieve the coroner reports themselves. Treat the counts as "credible reports of multiple deaths; exact number unverified".
- **Kellie Poole (39), UK, April 2022 [B].** Coroner: undiagnosed heart condition, sudden cardiac arrhythmia on entering 10.7 C river during a cold-water therapy session. This is cold shock, not necessarily hyperventilation, but relevant to "WHM-style" sessions.
- **Cold shock + breath-hold arrhythmia [B].** Prof Mike Tipton (Portsmouth): in young healthy volunteers, a 1-3% chance of arrhythmia in cold water rose to 63% when they held their breath beforehand (quoted via The National / The Times). "Autonomic conflict": diving response slows the heart while cold shock speeds it. Tipton called Hof's 2021 video of repeated deep breaths followed by head-under breath-hold "about the most dangerous thing you can do when you go into cold water" (Live Science).

**What the Hof organisation says [B].** The WHM website, safety videos and the published book disclaimer tell users to sit or lie down, never to practise breathing before or during immersion in or over water, driving, bathing or diving; not to practise in pregnancy or with epilepsy; consult a doctor for cardiovascular/respiratory/other conditions. Spokespeople say social media clips are "extreme feats", not the method, and that copycats outside the organisation ignore safety. Critics (Carney, quoted in Live Science) note Hof's own videos show the dangerous combination, creating mixed messages. Detailed protocols and autonomic-conflict warnings are in paid instructor training, not freely visible (Live Science).

**Implication for the app:** the harm vector is combined messaging. A breathing app must not show water imagery, cold-plunge cues, or "challenge" framing next to hyperventilation content.

### b3. Syncope and injury on land

- **Hyperventilation syncope [B].** A J Appl Physiol review ("Hyperventilation, cerebral perfusion, and syncope"; 2014, authors not verified) says hypocapnia constricts cerebral vessels and lowers cerebral perfusion, but hyperventilation plus postural stress alone does not usually reduce flow enough to cause transient loss of consciousness; the risk rises when combined with cardiovascular stress (cold immersion, reduced cardiac output). So pure seated hyperventilation is low risk of fainting in most healthy people, but the margin shrinks with standing, cold, hold/Valsalva, dehydration, heat, or heart disease. I could not retrieve a verified per-mmHg figure for cerebral blood flow; do not quote one.
- **Syncope can look like a seizure** (anoxic convulsions, multifocal myoclonic jerks) [A, MJA 2010], so bystander/user may misread it.
- **Fall injury** is the main land-based harm mechanism: head strike, fractured bones. I did not find a published case series of head injury from breathwork syncope; this is an inference from syncope mechanism [C].
- **Valsalva / breath-hold:** reduced venous return -> reduced cardiac output -> cerebral hypoperfusion [A, MJA 2010]. Breath-hold-induced vagal asystole is documented in a susceptible young man (11 s asystole after a <10 s breath-hold with an inhaler; PMC5242115) [B]; rare but shows breath-hold can trigger reflex bradycardia in susceptible individuals.
- **Ocular:** Valsalva retinopathy (preretinal/macular haemorrhage with sudden central vision loss) has multiple case reports after weightlifting, coughing, vomiting, strenuous Valsalva (e.g. PMC12105803, PMC10773676, PMC3862668) [B]. Anaemia may be a risk factor. Prognosis is often good but some need vitrectomy. Valsalva raises IOP; studies show mixed averages with large inter-individual variation (up to +9.5 mmHg in one study) [B]. No study shows breath-holding causes lasting glaucoma progression.
- **Pneumothorax/pneumomediastinum:** I found no breathwork case report; hyperventilation-associated pneumomediastinum exists in the general literature but I did not verify it here. Keep as a theoretical risk with forced breath-hold/Valsalva or straining; do not state as a documented breathwork outcome. [Gap]
- **Cardiac:** ANS/BSCN audit of 3,475 EEG hyperventilation sessions found no significant cardiac, respiratory or cerebrovascular complications [A], but mild tachycardia is expected, and those patients are pre-screened with ECG available. Note the exposure there was 3-5 min at 20-30 breaths/min, supervised.

### b4. Holotropic breathwork, rebirthing, other intense facilitated breathwork

- **Evidence is thin and mostly not safety-designed.**
- A 2013 MAPS bulletin on holotropic breathwork in 11,000 psychiatric inpatients over 12 years reports "no complaints of adverse reactions". This is an uncontrolled, author-promotional report; weak evidence of safety [B].
- A small cross-sectional questionnaire study (27 past participants) reported 15% adverse effects and 4% would not continue [B, via summary]. Self-selected, imprecise.
- Hand/mouth cramping from the hyperventilation phase is described [B].
- **Findhorn Foundation suspended its breathwork programme** after a 1993 report commissioned by the Scottish Charities Office raised concerns that hyperventilation could trigger seizure or psychosis in vulnerable people (secondary source; I did not see the original) [B/C]. A Glasgow psychiatrist raised similar concerns in the press in 1993.
- **Psychosis/mania:** I found **no breathwork-specific case report**. Case literature exists for meditation-associated psychosis (a review with 28 cases) [B]. For rapid cyclic breathing, a practitioner guidance document flags risk of dissociative/psychotic episodes in schizophrenia/schizoaffective disorder [C]. Treat psychosis risk as plausible but unquantified.
- **Altered states:** a preliminary study reports psychedelic-like acute effects in experienced breathwork practitioners vs meditation [C/B], supporting the plausibility of destabilisation in vulnerable people.
- I found no documented deaths from facilitated holotropic breathwork in these searches. That does not mean none occurred; I did not search coroner databases.

### b5. Panic: does evidence go both ways? Yes.

**Breathing as provocation [B]**
- Voluntary hyperventilation provocation in panic disorder patients: Brazilian studies report panic attacks in 44% of PD patients vs 11.5% of controls (4 min at 30 breaths/min) and 69% vs 9% (3 min, n=13). Dutch work found the test poorly sensitive and that severity of reported panic tracks anxiety level rather than hyperventilation tendency [B]. The figures are not comparable across protocols; no single consensus rate.
- Relaxation-induced anxiety (RIA) / panic during relaxation: described since the 1980s; 1988 review proposes a hyperventilation interpretation (low metabolism during rest with unchanged breathing -> low CO2) [B]; ironic-process and sensitivity-to-emotional-shifts accounts [B]. Occurs in a minority, mainly GAD/panic populations. Attending to breathing itself can raise anxiety in sensitive people (interoceptive focus) [C].
- CO2 hypersensitivity is linked to panic and PTSD [B].

**Breathing as treatment [B]**
- Capnometry-assisted respiratory training (Meuret/Ritz/Wilhelm) teaches raising end-tidal CO2 (i.e. slower, shallower, less hyperventilating) in panic disorder. A 37-patient RCT showed improvement vs delayed treatment; authors call evidence preliminary. A home device (Freespira) received FDA clearance for panic disorder in 2013 [B]. Note the treatment direction: **raise CO2 / reduce ventilation**, the opposite of cyclic hyperventilation.
- Cochrane review of breathing exercises for dysfunctional breathing/hyperventilation syndrome: one small RCT, no credible evidence either way [B].

**Design inference:** slow, gentle, not-overbreathing protocols with a visible "I feel unsettled" exit are plausible and low risk; fast breathing is a plausible panic trigger for susceptible users and should be gated.

---

## (c) Contraindication table

Legend for "Protocols to block": FB = fast/cyclic hyperventilation-style breathing (e.g. Wim Hof, holotropic, Breath of Fire, Kapalabhati, box-breathing at high rate), RET = extended breath holds / retention, VAL = anything with forced exhalation against closed glottis/straining, SLOW = slow paced breathing (about 4-7 breaths/min, no holds). Recommendation column is my design recommendation; "Source" gives the evidence behind it and its grade.

| Condition | Risk | Block | Source / grade |
|---|---|---|---|
| **Epilepsy / seizure disorders** (incl. history of seizures, unexplained blackouts) | Hyperventilation is used deliberately to provoke seizures in diagnostic EEG. In a UK national audit (3,475 patients; 3,170 with suspected epilepsy) HV for 3-5 min at 20-30 breaths/min provoked seizures in 2.2% (69), 81% of which were absences; only 1 generalised tonic-clonic (0.03%). Yield of EEG abnormalities 12.2%. Child absence epilepsy: >90% show generalised spike-wave on HV; absences usually within 90 s. HV is thus a validated trigger. | **FB, RET** (and any prolonged overbreathing). SLOW allowed after clinician OK. | ANS/BSCN Guidelines for Hyperventilation During EEG (2013) [A]. Absence-epilepsy numbers: 2024 J Child Neurol review and 2015 paediatric study per search summary [B]. Wim Hof disclaimer: no practice if epileptic [B]. |
| **Pregnancy** | Hypocapnia vasoconstricts uteroplacental vessels in animals (rabbit: maternal placental flow -43% at PaCO2 18 mmHg, anaesthetised, mechanically ventilated). No human data showing voluntary breathwork harms the fetus. Breath-holds reduce maternal O2 briefly; fetus has reserve. Also EEG guideline lists pregnancy as a situation where adequate HV may not be possible. | **FB, RET, VAL.** SLOW only; short sessions. | Animal study (1972) [C]; ANS/BSCN mention [A]; WHM disclaimer and practitioner lists [B/C]. Caution: no obstetric guideline found (gap). |
| **Cardiovascular disease** (angina, MI, heart failure, valve disease, structural heart disease) | HV can provoke coronary vasospasm, arrhythmia; tachycardia; breath-hold plus any autonomic trigger can cause arrhythmia (Tipton: 63% arrhythmia with pre-immersion breath-hold). ANS/BSCN absolute contraindication: MI or stroke within 12 months, poorly controlled/unstable angina; relative: stable ischaemic heart disease, previous MI, angina. | **FB, RET, VAL** for any known heart disease; SLOW allowed after clinician OK. | ANS/BSCN [A]; Tipton via The National [B]; WHM disclaimer [B]. |
| **Arrhythmia / long QT / syncope history / family history of sudden cardiac death / unexplained fainting** | Breath-hold and hypocapnia can provoke arrhythmias or reflex asystole in susceptible people; undiagnosed channelopathies are a candidate cause in cold-water deaths (e.g. coroner finding, Kellie Poole). | **FB, RET, VAL.** | Coroner finding via The National [B]; asystole case PMC5242115 [B]; family-history item in CNN-sourced contraindication list per Wim Hof coverage [B/C]. |
| **Uncontrolled hypertension** | Valsalva and breath-hold surges BP; strenuous HV causes BP swings. | **RET, VAL, FB**; SLOW fine. | Practitioner/consumer lists [C]; The National quoting physicians [B]. No guideline found. |
| **Stroke / TIA history, cerebral aneurysm, moyamoya, sickle cell disease or trait** | Hypocapnic cerebral vasoconstriction (moyamoya: re-build-up stroke after HV is a recognised hazard); Valsalva spikes ICP/BP. | **FB, RET, VAL.** | ANS/BSCN absolute contraindications: stroke or intracranial/subarachnoid haemorrhage within 12 months, sickle cell disease/trait, moyamoya [A]. Aneurysm: Othership/practitioner lists [C]. |
| **Glaucoma, raised IOP, recent eye surgery, retinal detachment risk, severe myopia, diabetic retinopathy** | Valsalva raises IOP (individual variation large, up to +9.5 mmHg in one study); Valsalva retinopathy case reports. Weightlifting breath-hold raised IOP more than normal breathing (4.3 vs 2.2 mmHg in 30 men). No proof of glaucoma progression from breathwork. | **RET, VAL**; FB discouraged. | IOP studies and retinopathy case reports (PMC12105803, PMC10773676, PMC3862668) [B]; sports-medicine recommendation to avoid breath-holding for glaucoma patients [B]. |
| **Asthma / COPD / other lung disease** | ANS/BSCN: COPD that causes breathlessness at rest = absolute contraindication; asthma = relative (risk/benefit). HV can trigger bronchospasm (cold dry air, hyperventilation-induced bronchoconstriction) [C]. Pneumothorax history or bullae: forced breath-holding and straining risk [C]. | **FB, RET** for COPD/unstable asthma/pneumothorax history; SLOW allowed. | ANS/BSCN [A]; WHM disclaimer ("respiratory conditions consult doctor") [B]. |
| **Diabetes (insulin-treated, unstable)** | No direct evidence found about breathwork. Concern: dizziness/light-headedness symptoms overlap with hypoglycaemia, so a user may misattribute; tingling may mask neuropathy. | Warn, not block; "do not use if feeling hypo". | Unstable diabetes appears in a CNN-sourced contraindication list for cold-water immersion [B]; otherwise my inference [C]. |
| **Recent surgery** (esp. chest, abdominal, eye, neurosurgery) | Straining and Valsalva raise intrathoracic/abdominal/intraocular/intracranial pressure; wound dehiscence. Othership lists recent injury or surgery. | **VAL, RET, FB** until cleared. | Othership [C]; physiology reasoning [C]. |
| **Panic disorder / high anxiety sensitivity / PTSD** | HV and CO2 sensitivity can trigger panic in a substantial minority of PD patients (about 44-69% in small provocation studies vs about 10% controls). Relaxation-induced anxiety occurs. But slow breathing with raised CO2 is also a therapy. | **FB, RET** by default for diagnosed PD/PTSD or if user reports past panic; offer SLOW with an exit. | Provocation studies and RIA literature [B]; Meuret CART trial and Freespira [B]. |
| **Psychosis, schizophrenia, bipolar mania history, dissociation** | Plausible destabilisation from intense breathwork/altered states; no case reports found specific to breathwork. Othership and practitioner screens exclude. Cosmopolitan reports holotropic facilitators screen schizophrenia. | **FB, RET** (and any "journey/ecstatic" content). SLOW allowed. | Practitioner and secondary sources [B/C]; Findhorn suspension (1993) [B/C]. |
| **Psychiatric medications** (antipsychotics, benzodiazepines, lithium, MAOIs, stimulants) | Othership flags antipsychotics. Sedatives may blunt warning; stimulants raise HR. Mechanism not documented. | Warn; SLOW OK; FB/RET require clinician OK. | Othership [C]; my inference. |
| **Children and adolescents** | Teen deaths in blackout series; no safety data; the first major WHM lawsuit involved a 17-year-old. EEG labs do HV in children but supervised, with ECG, for epilepsy. | **FB, RET** for under 18. | CDC MMWR (mean age 17) [A]; WHM lawsuit [B]; ANS/BSCN (supervision) [A]. |
| **Anaemia, high altitude, CO/carboxyhaemoglobin, sleep apnoea** | Reduced O2 reserve makes RET riskier; Valsalva retinopathy linked to anaemia. | RET. | Anaemia/Valsalva retinopathy case report [B]; rest my reasoning [C]. |
| **Osteoporosis, rib/spine injury, hernia, diastasis** | Forced breathing/straining may hurt. | VAL, forceful exhalation (Kapalabhati, Breath of Fire). | Othership [C]. |
| **Anyone in or near water, driving, standing, or alone with fast breathing** | See rules 1-4. | FB, RET. | See (a). |
| **Anyone who has fainted during breathing exercises before** | Demonstrated susceptibility. | FB, RET permanently unless cleared. | [C] logic. |

---

## (d) Symptom triage table

**Source note:** The ANS/BSCN guideline lists "dizziness, distress, confusion, paraesthesias, tetany and prolonged over breathing" as potential adverse events in supervised EEG HV, alongside seizures; the other symptom classification below is based on general clinical practice and the physiology in (b) and should be reviewed by a clinician [A for the list, C for the triage].

| Symptom | Category | Mechanism | App should say / do |
|---|---|---|---|
| Tingling in hands, feet, lips ("pins and needles"), mild numbness | **Expected** | Respiratory alkalosis -> reduced ionised calcium and nerve excitability | "This is a normal effect of fast breathing. Slow your breathing to ease it." Offer a one-tap return to slow breathing. |
| Light-headedness, mild dizziness, "spacey" feeling | **Expected but cautionary** | Cerebral vasoconstriction | "Stop fast breathing, breathe normally, stay seated. Do not stand until it passes." If it returns each time, reduce intensity. |
| Muscle tightening in fingers, mouth (early carpopedal spasm), hand cramping | **Cautionary** | Falling ionised calcium (tetany) | Stop fast breathing now; breathe slowly and gently; relax hands. Do not breathe into a paper bag (no longer recommended: hypoxia risk, per clinical source). Seek medical help if it does not ease within a few minutes. |
| Emotional release (crying, laughing, anxiety, memories) | **Expected / may be benign** | Altered state, low CO2, emotional processing | Normalise, but offer a "stop and ground" button: slow breathing, name five things you see. If distress persists, stop and seek support. Encourage people with trauma history not to use FB alone. |
| Heart racing, palpitations | **Cautionary** | Sympathetic activation | Stop. If settles within 1-2 minutes, fine; if irregular, persistent, or with chest pain/faintness -> medical help. |
| Visual dimming, tunnel vision, "greying out", ringing in ears | **Alarming (pre-syncope)** | Cerebral hypoperfusion | **Stop immediately**; lie down; breathe normally; feet raised. Do not resume that session. |
| Fainting or loss of consciousness | **Red flag** | Syncope | After recovery: do not resume; tell a doctor; no FB/RET until reviewed. If witnessed, treat as medical event: recovery position, call emergency services if not responding promptly, or injury. |
| Seizure-like activity (jerking, staring, confusion) | **Red flag** | Anoxic convulsion or true seizure (indistinguishable to laypeople) | Emergency services. Not a remote self-care situation. |
| Chest pain / pressure / tightness spreading to arm/jaw | **Red flag** | Possible cardiac | Stop. Call emergency services if it does not resolve quickly. |
| Severe sudden headache ("worst of life") | **Red flag** | Possible haemorrhage | Emergency services. |
| Visual loss or a new floating dark area (possibly after straining) | **Red flag** | Valsalva retinopathy / vascular event | Urgent eye or emergency assessment. |
| Face/arm weakness, slurred speech | **Red flag** | Stroke | Emergency services. |
| Shortness of breath that does not ease, wheeze | **Cautionary -> red flag** | Bronchospasm / pneumothorax | Stop; use own reliever; seek urgent help if persisting or sudden one-sided chest pain. |
| Persisting symptoms after the session (hours-days): numbness, anxiety, dissociation | **Cautionary** | | Advise stopping fast breathing and seeing a clinician if lasting more than about a day. |

**General app behaviour:** the app must never frame symptoms as "release" or "detox" or "blockage clearing". Wording should be "common effect of overbreathing" with plain physiology. [C]

---

## (e) Suggested onboarding screening and disclaimer language

### Screening flow (draft, for clinician and legal review)

Show before first fast-breathing/retention session. Two tiers: all users see the safety panel; only those wanting FB/RET see the questionnaire. Provide a "I don't know / prefer not to say" answer, which is treated as "yes".

**Tier 1 - Everyone (slow breathing)**
1. "Are you under 16?" (block FB/RET; consider parental/age gate rules per jurisdiction.)
2. "Are you currently driving, in or near water, or standing/walking?" (checkbox confirm at each session start.)

**Tier 2 - Required to unlock FB/RET (any yes or unsure = locked, with explanation and "talk to a clinician" link)**
1. Have you ever been told you have epilepsy, or had a seizure or unexplained blackout?
2. Are you pregnant or think you might be?
3. Do you have, or have you been told you might have, any heart condition (including heart attack, angina, heart failure, valve problem, arrhythmia, long QT), or a family history of sudden unexplained death under 50?
4. Have you ever fainted or nearly fainted (other than from a clear trigger like blood draw)?
5. Do you have high blood pressure that is not controlled, or have you had a stroke, TIA, brain aneurysm or bleed?
6. Do you have glaucoma, raised eye pressure, a retinal condition, or recent eye surgery?
7. Do you have asthma that is not well controlled, COPD, a collapsed lung (pneumothorax) in the past, or other lung disease?
8. Have you had surgery in the last 3 months (chest, abdomen, eye, head or spine especially)?
9. Do you have sickle cell disease or trait, or anaemia?
10. Do you have panic disorder or have you had panic attacks, or PTSD?
11. Have you ever experienced psychosis, mania, or dissociation, or do you take antipsychotic or mood-stabilising medication?
12. Do you have unstable diabetes or take insulin? (warn rather than block)
13. Are you under 18? (block)
Closing: "Do you agree to practise fast breathing only when seated or lying down, never in or near water, never while driving, and to stop immediately if you feel faint or unwell?" (Required.)

**Re-prompts:** each fast-breathing session start: posture/water/driving confirmation (single tap). After any report of faintness or red-flag symptoms: lock FB/RET until user acknowledges clinician review. Rescreen every 90 days or on profile change.

### Disclaimer text (draft)

**Short banner (every FB/RET protocol, un-skippable):**
> Fast breathing and breath-holds can make you faint, even if you feel fine. Only do this sitting or lying down, **never in or near water, never while driving or standing**. Stop at the first sign of dizziness, vision changes, chest pain or tingling that doesn't ease. This isn't suitable for people with epilepsy, heart conditions, pregnancy, or other conditions in the safety check. Not a medical device and not a substitute for medical advice.

**Water warning (stand-alone, always visible in the protocol library):**
> Never practise fast or deep breathing, or breath-holds, before or during swimming, diving, bathing or being in or near water. Overbreathing can cause you to black out without warning, and people have died. This applies to pools, baths, hot tubs, the sea, and ice baths.

**General statement:**
> This app offers general wellness breathing exercises for relaxation and stress awareness. It does not diagnose, treat, cure or prevent any disease. If you have a health condition or are unsure, speak to a doctor first. If you feel chest pain, faint, have a seizure, sudden severe headache, or lose vision, stop and get emergency help.

Legal note: consent text should be reviewed by counsel for each market (US state law, UK/EU consumer law). A click-through disclaimer does not remove a duty to design safely.

---

### How reputable products handle this (what I could verify)

| Product / body | What I found | Grade |
|---|---|---|
| **Othership (app + studios)** | Public article lists 10 pre-conditions to "consult your doctor" about: respiratory issues, cardiovascular issues, pregnant/breastfeeding, medication (esp. antipsychotics), recent injury/surgery, osteoporosis, vision issues (glaucoma, retinal detachment), severe mental illness, seizure disorders, history of aneurysm; and 10 side effects including dizziness, tingling, chest pain, palpitations, muscle spasms, clouded vision, tinnitus, increased distress, psychosis, seizures. Their FAQ separately says they don't recommend breathwork while pregnant. Weakness: marketing content with some physiologically wrong explanations (e.g. that the eyes provide oxygen, that tingling is "less oxygen"). I did not see the app's in-app screening screens. Do not copy the explanations. | [B/C] |
| **Breathwrk** | Could not retrieve terms; owned by Peloton. FAQ does not address medical conditions. **Not verified.** | Gap |
| **iBreathe** | Not retrieved. **Not verified.** | Gap |
| **Wim Hof Method official** | Published disclaimer (book, per Sounds True): no practice in pregnancy or epilepsy; consult a doctor for cardiovascular/respiratory/other conditions; never before or during diving, driving, swimming, bathing or any circumstance where loss of consciousness could cause harm; warm-up, gradual cold exposure. Website FAQ advises consulting a doctor. | [B] |
| **Clinical HRV biofeedback / resonance-frequency breathing (Lehrer, Gevirtz)** | I found no safety/contraindication section in the sources retrieved; a 2023 systematic review notes nearly two-thirds of HRVB studies did not report enough protocol detail (breath duration, I:E ratio, posture). The protocols are slow (about 6/min), low-ventilation breathing, which is a different risk class from hyperventilation. Clinical practice states are likely to screen for arrhythmia and seizure, but I could not verify this. | Gap [C] |
| **Capnometry-assisted respiratory training / Freespira (FDA cleared for panic disorder 2013)** | Delivered with a clinician-supervised, capnometer-guided protocol aimed at raising CO2. The contrasting example: a regulated device is feedback-guided and prescribed. | [B] |
| **EEG labs (ANS/BSCN)** | Informed consent, 3-5 min max at 20-30/min, patient can stop, single-lead ECG, absolute and relative contraindications, staff prepared to manage seizures. The strongest precedent for a screening list in the sources I found. | [A] |
| **Professional bodies on breathwork** | I did not find a regulator or professional-body guideline specific to breathwork safety (e.g. from a medical royal college). The Breathwork community has multiple trainer associations but I could not verify any. Gap. | Gap |

**Takeaway:** best-practice from clinical sources is (1) informed consent, (2) explicit contraindication list, (3) the user can stop at will, (4) time-limited, (5) supervision or monitoring, (6) known plan for adverse events. An app cannot supply (5), so it must be more conservative than an EEG lab on FB/RET, not less.

---

## (f) Water rule and driving - summary

- **Water:** no fast breathing or retention before or in water, any depth, any temperature [A: ILS, RLSS, CDC]. Even unintentional hyperventilation (hard exercise, cold shock gasping) can cause blackout [A: RLSS], so the rule is about the activity combination, not only intent. Cold water adds cold-shock and autonomic-conflict arrhythmia risk [B].
- **Showers/baths:** treat bath as water; showers: seated and not in a slippery standing position. Never in a bath.
- **Driving/machinery:** do not combine with FB/RET; for slow breathing, advise eyes open, not while driving. [B: WHM disclaimer; C: reasoning]
- **Lifeguard guidance for pools:** never swim alone, breath-hold activities supervised, allow breathing to return to normal first (RLSS) [A].
- **Wearable/HR cues:** an app cannot reliably detect water. Phone water-lock modes and Apple Watch water detection exist but should not be relied on. Use confirmation + prohibition.

---

## (g) Regulatory angle (brief) [B - verify with counsel]

- **FDA (US):** "General Wellness: Policy for Low Risk Devices" (updated; search summaries mention a January 2026 revision - confirm current text before relying). Products intended for general wellness (maintaining or encouraging a healthy lifestyle) and unrelated to diagnosis/cure/mitigation/prevention/treatment of a disease are outside device enforcement when low risk. Relaxation or stress-management claims are cited as acceptable; example of low-risk: app playing relaxation music for stress. A breathing coaching app can reference living well with a chronic condition only with literature support. Claims about treating anxiety disorder, panic, insomnia disorder, hypertension, PTSD move it into device territory. Freespira (panic disorder) is the example of a cleared device with a medical claim.
- **MHRA (UK):** software with a medical purpose (diagnosis, monitoring, treatment of disease) is a medical device under UK MDR 2002; general wellness is not. I did not retrieve MHRA guidance; verify. EU MDR is similar in principle.
- **Practical line:** avoid the words treat, cure, heal, anxiety disorder, panic disorder, PTSD, depression, hypertension, "clinically proven", symptom relief. Do not use sensor data to give diagnostic or risk outputs (e.g. "irregular rhythm detected"). Do not claim that the app screens you as safe. App-store review guidelines (Apple 1.4.1 on medical apps providing inaccurate data/health claims) apply independently [C, unverified].
- **Liability reality:** a wellness classification does not shield from product liability or negligence. The Metzger suit shows litigation risk even absent proven causation; design for foreseeable misuse (water). Keep records of the safety design.

---

## (h) Things more dangerous than commonly assumed

1. **Blackout gives no warning, and strong swimmers die.** In the CDC series all four deaths were advanced/expert swimmers aged 17-22, in lifeguarded pools, in front of witnesses [A].
2. **It happens in shallow water**; depth/ascent latent hypoxia is not required [A: ILS, RLSS].
3. **The unreliable "I feel fine" signal:** loss of consciousness may occur without the urge to breathe [A].
4. **Fainting can look like a seizure**, and vice versa [A: MJA].
5. **Hyperventilation is a seizure trigger used on purpose in clinics** (2.2% provoked seizures in a general-referral sample; >90% EEG response in childhood absence epilepsy) [A/B]. Mostly absences, which a user may not notice.
6. **Breath-hold plus cold = 63% arrhythmia in healthy volunteers** (Tipton, via press) [B]: the dangerous variable is the combination.
7. **Wim Hof's own safety warnings coexist with his videos in water**; brand mixed signalling is itself a harm vector [B].
8. **Valsalva retinopathy** is a real, documented cause of sudden central vision loss after straining [B].
9. **A court not finding causation is not evidence of safety**; the Metzger case turned on proof, not physiology [B].
10. **Panic cuts both ways:** HV provokes panic in a large minority of panic-disorder patients, yet raising CO2 via slow breathing is evidence-based treatment [B].

---

## (i) References with URLs

**Water / hypoxic blackout**
1. ILS Federation, Medical Position Statement MPS 16, Shallow Water Blackout (2011) [A]. https://www.ilsf.org/wp-content/uploads/2018/11/MPS-16-2011-Shallow-water-black-out.pdf
2. RLSS UK, Shallow Water Blackout, Hyperventilation, and Breath Holding (GS005), v1 Jan 2020, updated Apr 2025 [A]. https://www.rlss.org.uk/shallow-water-blackout-hyperventilation-and-breath-holding-gs005
3. Boyd C et al., CDC MMWR 2015;64(19):518. Fatal and Nonfatal Drowning Outcomes Related to Dangerous Underwater Breath-Holding Behaviors, New York State 1988-2011 [A] (erratum: https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6425a6.htm). https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6419a3.htm
4. Kumar KR, Ng K. Don't hold your breath: anoxic convulsions from coupled hyperventilation-underwater breath-holding. Med J Aust 2010;192(11):663-4 [A]. https://www.mja.com.au/journal/2010/192/11/dont-hold-your-breath-anoxic-convulsions-coupled-hyperventilation-underwater
5. Franklin RC, Peden AE, Pearn JH. Drowning deaths in Australia caused by hypoxic blackout, 2002-2015. Med J Aust 2018;208(6) [B, summary only]. https://www.mja.com.au/journal/2018/208/6/drowning-deaths-australia-caused-hypoxic-blackout-2002-2015
6. Craig AB Jr. Summary of 58 cases of loss of consciousness during underwater swimming and diving. Med Sci Sports 1976;8:171-5 [cited in 1, 4; not read directly].
7. Lindholm P, Lundgren CE. The physiology and pathophysiology of human breath-hold diving. J Appl Physiol 2009;106:284-92 [cited in 4; not read directly].

**Wim Hof / cold water**
8. DutchNews, "Iceman" Wim Hof cleared of causing death of American teenager, 3 Jul 2024 [B]. https://dutchnews.nl/2024/07/iceman-wim-hof-cleared-of-causing-death-of-american-teenager
9. Live Science (Pester P), 'Gambling with your life': Experts weigh in on dangers of the Wim Hof method, 5 Apr 2024 [B]. https://livescience.com/health/gambling-with-your-life-experts-weigh-in-on-dangers-of-the-wim-hof-method
10. The National (Gillett K), Ice bath deaths: Is Wim Hof-backed cold water therapy really safe?, 1 Jul 2024 (summarises Sunday Times investigation and Tipton) [B]. https://thenationalnews.com/lifestyle/wellbeing/2024/07/01/ice-bath-safety-wim-hof-deaths
11. Outside Online, Wim Hof California lawsuit (not opened; appeared in search) [B]. https://www.outsideonline.com/outdoor-adventure/exploration-survival/wim-hof-california-lawsuit/
12. Scott Carney's death tally (advocate source, not opened). https://www.scottcarney.com/blog/tag/Breathwork
13. Wim Hof Method book medical disclaimer, as quoted via Sounds True (not opened in full). https://summit.soundstrue.com/?p=16092

**Epilepsy / EEG hyperventilation**
14. ANS/BSCN Guidelines for Hyperventilation During EEG Recordings (v1.3, 2013) [A]. https://www.bscn.org.uk/data/files/Guidelines/Hypervent.pdf
15. Kane N et al. Hyperventilation during electroencephalography: safety and efficacy. Seizure 2014;23:129-34 (cited in 14).
16. Review of hyperventilation activation in childhood absence epilepsy, J Child Neurol 2024 (search summary only). https://www.ebsco.com/articles/health-and-medicine/d7e55daa-0873-5155-b32b-7237364a6a3e/a-review-of-hyperventilation-activation-in-diagnosis-and-management-of-childhood-absence-epilepsy

**Panic / CO2**
17. Hyperventilation provocation test in panic disorder (Amsterdam UMC record) [B]. https://pure.amsterdamumc.nl/en/publications/the-hyperventilation-provocation-test-in-panic-disorder/
18. Brazilian Journal of Medical and Biological Research hyperventilation test in panic disorder (summaries only). https://scielo.br/j/bjmbr/a/qVZLw5RZGmvzkRPTChBj7hQ/?lang=en
19. Panic attacks during relaxation and relaxation-induced anxiety: a hyperventilation interpretation (1988) [B]. https://pubmed.ncbi.nlm.nih.gov/3148637/
20. Meuret AE et al., capnometry-assisted respiratory training (PMC2890048, PMC3327292 - search results, not opened). https://pmc.ncbi.nlm.nih.gov/articles/PMC2890048
21. Cochrane CD009041, Breathing exercises for dysfunctional breathing/hyperventilation syndrome in adults. https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD009041

**Syncope / ocular**
22. Hyperventilation, cerebral perfusion, and syncope (J Appl Physiol 2014; search summary). https://research.regionh.dk/da/publications/hyperventilation-cerebral-perfusion-and-syncope/
23. Valsalva retinopathy case reports: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12105803/ ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10773676/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC3862668
24. Valsalva and IOP: https://pmc.ncbi.nlm.nih.gov/articles/PMC6942388 (not opened); https://bmcophthalmol.biomedcentral.com/counter/pdf/10.1186/s12886-019-1275-y.pdf (not opened)
25. Breath-hold vagal asystole case: https://pmc.ncbi.nlm.nih.gov/articles/PMC5242115 [B]

**Holotropic / psychiatric**
26. MAPS Bulletin, holotropic breathwork in 11,000 psychiatric inpatients (2013) [B, promotional]. https://maps.org/news/bulletin/a-clinical-report-of-holotropic-breathwork-in-11000-psychiatric-inpatients-in-a-community-hospital-setting/
27. Cross-sectional study of the effects of holotropic breathwork (Shapiro; 27 participants) [B]. https://deanehshapirojr.org/?p=3041
28. Adverse events in meditation practices and meditation-based therapies: systematic review (Acta Psychiatr Scand 2020) [B]. https://pubmed.ncbi.nlm.nih.gov/32820538/
29. Discover Magazine, holotropic breathing safety [B/C]. https://www.discovermagazine.com/holotropic-breathing-promises-psychedelic-like-trips-without-the-drugs-is-it-42429

**Apps / products**
30. Othership, breathwork side effects and safety considerations (Feb 2026) [B/C]. https://www.othership.us/learn/breathwork-side-effects
31. Breathwrk (not retrieved). https://www.breathwrk.com/generalfaqs

**Regulatory**
32. FDA, General Wellness: Policy for Low Risk Devices (via commentary: https://innolitics.com/articles/fda-guidance-general-wellness-policy-for-low-risk-devices/ ; https://dhr.research.northeastern.edu/new-published-fda-guidance-general-wellness-devices-and-software/). Primary FDA page not fetched.

**Pregnancy**
33. Hyperventilation and uteroplacental flow in rabbits, 1972 (search summary only; no direct URL retrieved). Related: https://www.frontiersin.org/articles/10.3389/fphys.2024.1490154/full (hypoxia and uteroplacental vascular function, not opened).

### Gaps to close before launch
- Fetch primary FDA guidance text and MHRA software-as-medical-device guidance.
- Obtain Breathwrk and iBreathe terms and in-app screens.
- Find USA Swimming rule text and RNLI statement.
- Read the Sunday Times investigation and any published coroner reports for WHM-linked deaths; check the Metzger appeal status.
- Run structured PubMed searches for breathwork/hyperventilation adverse events (pneumothorax, pneumomediastinum, tetany, rhabdo, seizures).
- Pregnancy: find an obstetric/ACOG statement.
- HRV biofeedback: find clinical protocol screening criteria.
- Have a clinician and lawyer review the screening list and disclaimer.
