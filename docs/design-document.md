# The Book of Rates — Phase 1 design document

**Status:** research and design only. Nothing here is built beyond three display prototypes.
**Date:** 11 October 2026.
**Supporting research:** [`research/01-physiology.md`](../research/01-physiology.md),
[`research/02-safety.md`](../research/02-safety.md),
[`research/03-practices-and-music.md`](../research/03-practices-and-music.md),
[`research/04-style.md`](../research/04-style.md).

This document is not medical advice, and the safety rules in it should be reviewed by a
clinician before anything ships.

---

## 0. The one-paragraph version

Guided breath sequences that walk a user from where they are to a destination rate and a
destination state, drawn in a flat-colour, lineless, negative-space idiom, with a different
interaction and a different landscape for each of ten levels. The physiology that supports
this is narrower than the wellness market pretends: **slow breathing at roughly five to six
breaths a minute reliably produces large, measurable cardiovascular effects, and produces
small-to-moderate self-reported mood effects.** Almost everything else — that a 1:2 exhale
ratio beats an equal one, that box breathing is special, that a particular pranayama produces
a particular emotion — is either unproven or traditional. The app should be built on the part
that holds, be candid about the part that doesn't, and should treat breath retention as the
one genuinely dangerous thing it could offer.

---

## 1. What the evidence actually supports

Full detail and citations in [`research/01-physiology.md`](../research/01-physiology.md).
The honest summary, in the order it should govern design decisions:

### 1.1 Solid enough to build on

**Breathing at about 0.1 Hz (5–6 breaths/min) maximises heart-rate oscillation.** This is a
resonance effect: respiratory sinus arrhythmia and the baroreflex loop, which has a built-in
delay of a few seconds, come into phase and their amplitudes add. Laborde et al. (2022)
reviewed 223 studies and found voluntary slow breathing raised vagally-mediated HRV during
practice, after a single session, and after multi-session training. This is as close to a
settled finding as this field has.

**An individual's resonance frequency sits somewhere between about 4.5 and 6.5 breaths/min**,
varies between people, is inversely related to height, and is reasonably stable across
sessions. Whether training at a person's exact resonance frequency beats a generic 6/min is
much less clear.

**Cardiac vagal activity is gated to expiration** — heart rate slows on the exhale. This is
basic physiology and not in dispute.

**Slow breathing reduces self-reported stress and anxiety, modestly.** Goessl et al. (2017)
found g ≈ 0.83 for HRV biofeedback; Fincham et al. (2023) found g ≈ −0.32 to −0.40 across
breathwork RCTs generally. The second is the more sobering number, and every RCT it included
was at moderate or high risk of bias. There is no blinding possible in breathwork trials.

**An acute state shift takes minutes, not seconds.** Five minutes is a defensible session
floor. The minimum effective dose has not actually been established.

### 1.2 Believed much more firmly than the evidence warrants

**Exhale longer than inhale.** The mechanism is real — vagal activity is gated to
expiration — but the inference that a 1:2 ratio therefore calms you more than 1:1 does not
survive contact with the data. A 2024 study (N=26) and its replication (N=16) found no HRV
difference at a fixed 6/min. The wider tally: four studies favour the long exhale, three are
null, one favours equal, one favours a long inhale. **We may use exhale-extended patterns.
We may not claim they are better.**

**Box breathing.** No dedicated RCT exists. The "Navy SEALs use it" provenance is anecdotal.
In Balban's trial it was not significantly better than meditation. It is a fine pattern; it
is not an evidence-based one.

**Cyclic sighing.** Balban et al. (2023) is the best single trial we have and it is one trial:
N=108, only 24 in the meditation control arm, retrospectively registered. Cyclic sighing beat
meditation on *positive affect* only — not on anxiety — and **no arm showed any HRV or
resting heart-rate change at all.** That last detail is worth sitting with, because it means
the best-publicised breathwork trial found a mood effect with no cardiovascular correlate.

**Wim Hof.** Kox et al. (2014) had twelve people per arm and bundled three interventions
together so the breathing cannot be isolated. A 2024 systematic review rated the evidence
base very low quality. There is no 2022 brown-fat study; the imaging work is Muzik 2018 and
the brown-adipose activation was unremarkable.

**Buteyko.** Symptom scores and reliever use improve; FEV1 does not. That pattern looks like
self-management and breathing-anxiety reduction, not the CO2 story Buteyko tells about itself.

**BOLT / control pause.** Unvalidated. One 2024 study of 49 athletes found R² = 0.08 against
performance. No reliability data found. **The app must not use a BOLT score for anything.**

**Emotion-specific breathing patterns.** Philippot et al. (2002) is the study everyone cites
for "sad breathing" and "joyful breathing". Its demand characteristics are severe — the same
problem that sank facial-feedback replication. Treat as a hypothesis.

### 1.3 Things the app must never say

- **No LF/HF ratio, no "sympathovagal balance", no "vagal tone score".** Billman (2013)
  dismantles the ratio; at 6 breaths/min LF power is mostly the breathing oscillation itself.
  If we ever show HRV, show "breath-synchronised heart-rate swing" and nothing more.
- **No polyvagal framing.** It is contested and we don't need it.
- **No medical claims.** Not "treats anxiety", not "lowers blood pressure", not "for panic
  attacks". General wellness language only — relaxation, rest, focus (see §2.7).
- **No rodent findings stated as human facts.** The pre-Bötzinger → locus coeruleus arousal
  circuit (Yackle 2017) is ~175 neurons in mice. It is a lovely story and it is a mouse story.

### 1.4 How this maps to the basic emotional states

Rates are given as inhale / exhale in seconds. "Evidence" grades the link between *this
pattern* and *this named state*, which is almost always weaker than the link between slow
breathing and general calm.

| State | Pattern | Rate | Evidence for the state link | Notes |
|---|---|---|---|---|
| **Calm** | 4.5 / 6.5 | 5.45/min | **MODERATE** — closest to the resonance literature | The default: 22 beats at 120 BPM, split 10:12. See §3.3. |
| **Grounded** | 5.5 / 5.5 | 5.5/min | **MODERATE** (inherits the resonance evidence) | Equal ratio; "grounded" is our word, not a finding. |
| **Soothed** | 4 / 8 | 5/min | **WEAK** — mechanism solid, comparative claim unproven | Use it; don't claim superiority over 1:1. |
| **Sleepy** | 4 / 8 tapering to 4 / 9.3 | 5 → 4.5/min | **WEAK** | Slowing within a session is sensible and untested. |
| **Focused** | 4-4-4-4 box | 3.75/min | **WEAK** | Short 4 s holds are low-risk. Popular, not proven. |
| **Alert** | 3 / 4.5, no holds | 8/min | **WEAK** | Deliberately *not* hyperventilation. Cap at 3 min. |
| **Energised** | 3 / 4.5, no holds, with movement/audio drive | 8/min | **WEAK** | Same pattern; the arousal comes from the game, honestly labelled. |
| **Settled after distress** | double nasal inhale + long exhale, then 5 / 6 | ~5/min | **WEAK-MODERATE** (Balban) | Positive affect only, in one trial. |

**On more complex states.** The honest position is that we can't currently get from a
breathing pattern to "awe" or "resolve" or "tenderness" with any evidential backing. What we
*can* do is build those states out of the three layers we control — pattern, imagery, and
sound — and be clear in the copy that the imagery is doing most of that work. A level called
"Before the Storm" can produce anticipation; it will be the storm doing it, not the ratio.
That is legitimate design and illegitimate science, and the difference should be visible in
how we write about it.

### 1.5 Whose app this is, and what that licenses

*Added 23 October 2026, by the author. This governs the protocol decisions above and the
ones still to come.*

The Book of Rates is a personal project. I built it for my own benefit, to suit my own taste
and needs, and I intend to go on building a variety of breathing exercises here — including
unconventional ones, and including ones no commercial wellness product would ship, because
they are not aimed at a general population and are not sold to anybody.

Anyone else is welcome to use it, at will and with consideration: their own discretion, their
own judgement, their own body. That is an offer, not a recommendation, and it should be
stated that way wherever the app speaks to a user.

This changes what §1 is *for*. The evidence sections are not a bar a protocol must clear
before it may be included. They are an honest account of what is known and what is not, so
that the person choosing a practice chooses it knowingly. Two things it does not relax:

- **§1.3 stands in full.** The app may not say things that are not true. A personal project
  is still not licensed to misinform, and "it's just for me" is not a defence for a claim
  that reaches someone else.
- **The safety information in §2 stands in full.** Every hazard identified there stays
  identified and stays on screen. What changes is that a hazard may now be *disclosed and
  chosen* rather than designed out — the user carries the risk, so the user gets the facts
  and the decision.

Where those two hold, the question "is this proven?" stops being a gate and becomes a label.

### 1.6 The governing principle for protocol selection

*Added 23 October 2026, by the author. With §1.5, this governs which practices may appear in
the book. It supersedes the precautionary framing that preceded it.*

> **Established practices across cultures are safe to practise, as long as the practitioner
> is aware of the circumstances the practice requires. That awareness is at the
> practitioner's discretion and cannot be controlled through the app. The app's job is
> therefore the disclosure of circumstances, not the gatekeeping of practices.**

Pranayama — including forms with vigorous breathing and with retention — is practised daily,
for health, by a very large number of people, and has been for a long time. A framework that
concludes such a practice must not appear at all has not identified a hazard; it has
identified that it is not the one taking the risk. The app is not the practitioner. It cannot
see the room, the posture, the hour, or the body. What it can do is say, exactly and without
softening, what the practice requires — and then get out of the way.

**The one place this needs care, because the document and this principle have until now been
talking about two different claims.**

The hyperventilation-then-hold hazard that the literature is unambiguous about is a hazard
**in water**. Hypoxic blackout is a *drowning* mechanism. The blackout is survivable on a mat
and lethal in a pool, which is precisely why it is a lifeguarding rule rather than a yoga one.
Read the sources in §2.1 again with that in mind: the CDC case series is four drownings;
Craig's 58-case series is drownings; the RLSS position is a position about swimmers. None of
it is evidence that the same physiology, performed seated on a floor, kills people. On dry
land the realistic worst case is a faint.

This app is practised on land, in a room, seated or lying down. The water in it is imagery.

So the principle and the evidence are not in conflict, and the honest statement of both is the
same statement: **the hazard is conditional on circumstance; the circumstance here is dry land
and seated; and the practitioner is the one who knows their circumstance.** Which is also why
the rule that survives all of this intact is the water rule — stated plainly, and without
exception.

What this principle does **not** license:

- **Any weakening of §2.1 rule 1.** It is strengthened. Once the blanket prohibition is gone,
  the entire weight of the documented hazard rests on the water rule, so that rule carries
  more now, not less.
- **False claims.** §1.3 is untouched. Nor does "established across cultures" become a
  claim of efficacy: traditional is not the same as proven, and §1.2 still governs what may
  be said about outcomes.
- **Dropping the disclosure.** Holds stay short and equal to the other phases; countdowns
  point towards air; nothing is scored. Disclosure is the part the app is actually
  responsible for, so it is the part that must be good.

---

## 2. Safety: the architecture, not the disclaimer

Full dossier with sources in [`research/02-safety.md`](../research/02-safety.md). The
arrangement below is deliberately structural — these are constraints on what the app can
contain, not text to append to a settings screen.

### 2.1 The five hard rules

1. **Water.** No fast breathing and no breath-hold, ever, in or near water — bath, pool, sea,
   hot tub, ice bath, sauna plunge. An un-skippable warning before any protocol containing
   fast breathing or a hold. Hypoxic blackout is the single largest documented cause of death
   associated with this practice and it gives **no warning**: in the CDC's New York case
   series all four deaths were advanced or expert swimmers aged 17–22, in lifeguarded pools,
   with witnesses present. The RLSS position is that the swimmer cannot be expected to
   recognise it coming. Design accordingly: assume the user feels fine right up to the end.
2. **Seated or lying.** Confirmed at the start of every session containing fast breathing or
   a hold. Never standing, walking, in a vehicle.
3. **No hyperventilation followed by a breath-hold. Anywhere in the product.** This is the
   combination that kills people. There is no level, no unlock, no advanced mode where the
   app pairs them.

   > **AMENDED 23 October 2026, by the author.** The blanket form of this rule — *anywhere in
   > the product* — is withdrawn, on the principle at §1.6. The practice may appear.
   >
   > **The reasoning above is left standing, because it is correct about the thing it is
   > actually describing: a drowning mechanism.** Every death cited for this combination,
   > here and in the research dossier, happened in water. What changes is not the strength of
   > the rule but its location. The prohibition moves wholly onto **rule 1**, where the
   > evidence actually sits, and is stated there without exception and with no circumstance
   > in which it bends. On dry land, seated, the realistic worst case of the same physiology
   > is a faint, which is what **rule 2** exists to make safe.
   >
   > The app's obligation becomes disclosure: say precisely what circumstances the practice
   > requires, every time, and leave the practice to the practitioner. What the app may not
   > do is pair the two and imply the pairing is safe *in water*, because it is not, and no
   > framing makes it so.
   >
   > For the record: as of this date nothing built uses fast breathing. This amendment
   > removes a prohibition; it does not describe a shipped feature. Box breathing, the
   > protocol now in the pearl diver, is 3.75 breaths a minute — slower than anything this
   > app shipped before it.
4. **An always-visible stop.** One tap, always on screen, always works, kills audio and
   visuals immediately. Implemented in all three prototypes already.
5. **No driving or operating machinery.**

### 2.2 The screening gate

Before any protocol containing fast breathing or any hold. "Not sure" counts as "yes".
Blocking leaves slow breathing fully available, so a blocked user still has a usable app —
this matters, because an all-or-nothing gate trains people to lie to it.

Blocks fast breathing and holds: epilepsy or any seizure history; pregnancy; under 18; heart
disease, arrhythmia, long QT, unexplained fainting, or family history of sudden cardiac
death; stroke, TIA, aneurysm, sickle cell disease or trait; uncontrolled hypertension;
glaucoma, raised intraocular pressure or recent eye surgery; COPD or unstable asthma;
pneumothorax history; recent surgery; panic disorder or PTSD; psychosis or mania history.

**Epilepsy deserves its own line.** Hyperventilation is not merely risky for people with
epilepsy — it is used deliberately in EEG labs *to provoke seizures*. A UK national audit of
3,475 patients provoked seizures in 2.2% with three to five minutes of overbreathing, mostly
absences the person might not even notice. Over 90% of children with absence epilepsy show an
EEG response. This is a known, validated trigger, and we would be building it into a toy.

### 2.3 Symptom handling

Tingling, light-headedness and a tightening in the hands are **expected** with fast breathing
and should be described as such before they happen, so they don't frighten anyone. Fainting
is **not** expected. The copy must say "ease off at the first light-headedness" and must never
say anything resembling "push through".

Red flags that stop the session and show plain advice: chest pain, actual fainting or
near-fainting that doesn't clear in seconds of normal breathing, anything seizure-like, sudden
severe headache, visual loss, one-sided weakness.

### 2.4 The pearl-diver level — my recommendation

**You asked me to flag this explicitly, so here it is in full.**

The metaphor is fine. Diving is a beautiful frame for a breath level and the visual
possibilities are excellent. The danger is not the imagery; it is that a diving game has a
natural and almost irresistible shape — *stay under longer, get the deeper pearl* — and that
shape is the exact behaviour that kills people. The deaths in the literature are
overwhelmingly people who were trying to beat something. Craig's 58-case series and the
Australian case reports both note goal-fixation as a recurring feature. We would be teaching
the mental model and then hoping it stays in the app.

**What must never happen, in any version:**

- No fast or deep breathing before the dive. Not "a few big breaths to prepare". Not
  "oxygenate first". This is the lethal combination and it must not appear even as flavour.
- The hold duration is set by the app and shown as a **countdown to surfacing**, never as an
  elapsed timer. The pressure the UI creates must point up, towards air.
- No personal best, no streak, no depth record, no comparison to previous sessions, no
  "you held for 14 seconds" at the end. Nothing that makes duration a number the user owns.
- Surfacing early is not a failure. If the user lifts their finger, the diver surfaces and
  still has the pearl. There is no shorter-is-worse state in the game.
- Hold length does not increase as a reward for progress. If it ever becomes adjustable it is
  opt-in, hard-capped, and not tied to completing anything.

**DECIDED (11 Oct): no retention anywhere in v1.** The pearl diver ships as the
bottom-of-exhale version described below. Retention becomes a future unlockable — the design
for that lock is §2.4a.

> **AMENDED 23 October 2026, by the author.** The decision above is reversed for this
> author's own use. The pearl diver now runs as **box breathing, 4-4-4-4, with the submerged
> search inside the first hold** — which is precisely the thing this section argued against.
>
> **The analysis above is not withdrawn, and is deliberately left in place.** It was and
> remains the right reasoning for a product shipped to strangers. What changed is not the
> risk assessment; it is who the app is for. See §1.5.
>
> The specific worry in this section is a third-party one: that somebody who enjoys a
> rewarded underwater breath-hold carries that association to a pool. That worry is now
> **addressed by framing rather than by omission.** Concretely, in the build:
>
> - The app says plainly what it is — one person's project, built to his taste, offered
>   as-is, to be used with the user's own judgement. It does not present itself as a
>   general-purpose wellness product, because the general-purpose version of this level is
>   the one described below and it is still there.
> - It **names** the hazard instead of hiding it. The same argument §2.4a makes for showing
>   the locked state rather than concealing it — that a person who learns here why retention
>   is treated differently is better off than one who meets it first on YouTube — applies to
>   the practice itself once it is present.
> - It **screens before the first hold** (§2.2) and treats "not sure" as "yes".
> - Anybody who screens out is routed to **the no-retention version of this same level**,
>   which stays fully built and fully playable. §2.2's point holds: an all-or-nothing gate
>   trains people to lie to it, so the gate must leave a real exercise behind.
>
> **Unchanged, and not up for amendment:**
>
> - No fast breathing before, during or near the hold. §2.1 rule 3 — hyperventilation
>   followed by a breath-hold — is the combination that kills people and it is absent here.
>   Box breathing at 3.75/min is *slower* than the 5.45/min version it replaced.
> - The holds stay short and exactly equal to the other phases. They do not lengthen, ever,
>   and they are not adjustable by progress.
> - The hold is set by the app and shown as a **countdown pointing towards air**, never as
>   an elapsed timer.
> - Nothing is scored, streaked, recorded or compared across sessions. No duration is ever
>   shown to the user.
> - Every water rule in §2.1 stays on screen, including the un-skippable one: never in or
>   near water.

**What I recommended, and what we are doing: ship the pearl diver with no breath-hold at all.**

Make "underwater" the bottom of a long slow exhale rather than a retention. The diver sinks
through a four-second exhale, drifts along the bottom during a two-second pause at empty —
which is a rest, not a hold against urge, and is physiologically trivial — and rises on a
five-second inhale. You keep the whole image: the descent, the light going green and dim, the
pearl, the surfacing. You lose nothing visually and you remove the entire hazard class. If we
later decide a real retention is worth having, it should go in a level with no water in it at
all, so the app never associates holding your breath with being in water.

I'd also note a second-order point: even a dry-land hold game teaches a habit. The user who
enjoys the pearl diver is being trained that holding their breath is pleasant and rewarded.
Some fraction of them will be in a pool at some point. That's the real reason to keep the
ceiling low and the framing pointed at surfacing.

### 2.4a Retention as a locked future feature

> **Status note, 23 Oct 2026.** Superseded for the pearl diver only, by the amendment at
> §2.4: retention is present in that level now rather than locked. The lock design below is
> kept, both because it still applies to any *other* retention practice this app grows, and
> because its central argument — that a visible, explained lock teaches better than a silent
> omission — is the same argument now being made one step further on, for a visible,
> explained practice.

Decided: retention is **out of v1 and visible as locked**, presented as something offered
rather than something hidden. Two things have to be true at once — it must read as *not yet*
rather than as a paywall tease, and the eventual unlock has to carry the safety briefing as
part of the unlock rather than as a banner someone swipes away.

**Where it lives.** At the end of the ten levels, in the same list, in the same visual
language — not in a separate "premium" tray and not behind an upsell sheet. It is the
eleventh entry on a shelf of ten: `THE BREATH HELD · not yet`. One level, one lock.

**How the lock reads.** The difference between "not yet" and "pay up" is entirely in what the
lock *explains*. A paywall lock says nothing and makes you tap to find out. Ours says the
reason on the face of the card, before any interaction:

> **The Breath Held** — *not in this edition*
> Breath retention is the one practice here that has actually hurt people, so we have left it
> out until we can introduce it properly. When it arrives it will come with a proper
> explanation of why it is treated differently, and it will never be something you score.

No countdown, no "coming soon — subscribe", no notify-me capture, no blurred preview of
content. A single secondary link: *why this is locked* → the plain-language version of §2.1
and §2.4. **The locked state is itself a piece of safety education**, which is the whole
argument for showing it rather than hiding it: a user who learns here why retention is
treated differently is better off than one who meets it first on YouTube.

**Icon.** Not a padlock. A padlock is the visual grammar of paywalls and of things being kept
from you. Use a closed form from the scenery language instead — a shut sluice gate, a stone
set across a path, a lantern not yet lit — rendered in the same flat idiom as the level art,
desaturated. It should look like a part of the world that isn't open yet.

**How the unlock works, when it comes.** The unlock *is* the briefing. It cannot be skipped,
dismissed, or tapped through, and this is the one place in the app where I'd accept friction:

1. **Screening first, not last.** The §2.2 gate runs before any content is shown. A block
   here is final for this feature and is explained warmly — not as a rejection.
2. **A short, unskippable briefing**, perhaps ninety seconds, built as a level rather than a
   legal screen: the water rule, the seated rule, why hyperventilation plus a hold is the
   lethal combination, what light-headedness and tingling mean, what fainting means. Our own
   words, clinician-reviewed, not Othership's (§2.6).
3. **A comprehension check, not a checkbox.** Three or four plain questions — *where must you
   never do this?* — that must be answered correctly. This is not a legal device; it is the
   only way to know the briefing was read. Wrong answers re-show the relevant part rather
   than failing the user.
4. **Then the level**, at the lowest cap, with the cap fixed. Any later increase is opt-in, in
   settings, hard-ceilinged, and **never** granted by progress, streak or completion.
5. **The briefing re-runs** after a long absence, and the water warning shows every session
   regardless.

**What the unlock must never be:** a reward for finishing the other ten levels, a purchase, a
streak milestone, or anything that makes a user want to get to it. If the only path through
the door is understanding the risk, then wanting it badly doesn't help you — which is exactly
the incentive we want.

### 2.5 What else I'd cut

- **No cold-water, ice-bath, or plunge imagery anywhere near a fast-breathing protocol.** The
  cultural adjacency between Wim Hof breathing and cold water is exactly the association we
  don't want to reinforce. (Separately: press reporting quotes Prof. Mike Tipton saying
  breath-holding before cold immersion raised arrhythmia rates from 1–3% to 63% in healthy
  volunteers. That figure is secondhand and I have not read the primary study, so treat it as
  indicative rather than citable — but it points the same way.)
- **No hyperventilation offered to a user in acute distress.** If someone reports a panic
  attack, the only thing the app offers is slow exhale-weighted breathing with a visible exit.
  The panic evidence cuts both ways — hyperventilation provoked panic in 44–69% of
  panic-disorder patients in small provocation studies, while slow breathing that *raises* CO2
  is a cleared therapy — so the safe move is obvious.
- **No wearable-based clearance.** Never "your heart rate looks fine, carry on".

### 2.6 Prior art, with a caution

Othership's public safety article contains explanations that are physiologically wrong
(it states, among other things, that the eyes supply oxygen). Do not use it as a source or a
model for our copy. We should write our own and have a clinician read it.

### 2.7 Regulatory line

Staying inside the general-wellness boundary means claiming relaxation, rest, focus and sleep
support, and never claiming to treat, cure, diagnose or manage any condition. The moment the
copy says "for anxiety" rather than "for relaxation", the product is arguably making a medical
device claim. This is cheap to get right at the start and expensive to retrofit.

---

## 3. Sound and music

Supporting research: [`research/03-practices-and-music.md`](../research/03-practices-and-music.md)
(the breathing-and-music literature) and
[`research/05-loop-music.md`](../research/05-loop-music.md) (what makes short loops survive
repetition, and the valence/arousal basis for mapping feeling to sound).

### 3.1 Two different kinds of claim, two different standards

An earlier draft of this document applied one evidence standard across the whole project.
That was a category error and it is corrected here. There are two kinds of claim in this app
and they are not the same kind of thing:

**Claim type A — breathing rate and pattern produce physiological and emotional change.**
This is a health claim. It is testable, it has a literature, people have been hurt by
over-claimed versions of it, and a regulator would read it as one. **The evidence discipline
in §1 applies in full and does not relax.** If we say slow breathing does something to the
body, we must be able to point at the study and the effect size, and say where it is weak.

**Claim type B — music of a given tempo, texture and register is heard as calm, or urgent,
or bright.** This is not a health claim. It is an aesthetic and user-experience decision,
of exactly the same kind as choosing a palette for a storm scene, and demanding randomised
trials of it is the wrong instrument. Nobody asks for an RCT before scoring a film. We are
not claiming the music changes anyone's autonomic state; we are claiming it *sounds like*
something, which is a claim about perception, and a well-studied one.

The line between them is easy to hold in practice: **the breathing engine makes the
physiological claims, and the music makes none.** The moment a piece of copy says the music
does something to the listener's body, it has crossed into type A and needs type A evidence.
Everything short of that is craft, and we should be confident about it.

### 3.2 The basis for the music layer

There is a real empirical foundation here; it is just a different literature from the
physiological one. Perceived emotion in music — what listeners reliably say music *sounds
like* — is well studied and reasonably stable.

- **Russell's circumplex** (valence × arousal) and **Thayer's** energy/tension variant give us
  a two-axis space to place each level's destination in.
- **Eerola, Friberg & Bresin (2013)** manipulated six musical cues factorially across 200
  synthesised stimuli and found cue effects were **mostly linear and essentially additive**,
  explaining 77–89% of variance with almost no interactions. That is the finding that makes a
  parameter table legitimate rather than hand-waving: we can set tempo, mode, register and
  articulation more or less independently and predict roughly how the result will read.
- **MIR and audio-feature work** backs the arousal axis strongly. Vidas et al. (2026) found
  Spotify's `energy` correlated strongly with listener-rated energy; `valence` only moderately
  with perceived mood; `danceability` weakly.

Your formulation — intensity scales with BPM, and emotional quality can be derived from how
people actually describe music — is the right one, and the data supports it with one
qualification worth knowing: **arousal is the strong axis and valence is the weak one.**

| Parameter (increase) | Perceived arousal | Perceived valence | Consensus | For our loops |
|---|---|---|---|---|
| Tempo / event rate | **Up, strongly** | Slightly up | Arousal **A**, valence C | The main dial. Low event density for calm. |
| Loudness / dynamics | **Up, strongly** | Mixed | Arousal **A**, valence C | Keep quiet; no spikes. |
| Mode (major vs minor) | Little | Major positive, minor negative | Valence **A** (Western listeners) | Use modal and ambiguous — see §3.4. |
| Consonance vs dissonance | Dissonance up | Dissonance down | **B** | Open and consonant; sus and add9. |
| Timbral brightness | Up | Mixed; harsh bright is negative | Arousal **B**, valence C | Low-pass for calm. |
| Articulation (staccato) | Up | Slightly up | **B** | Soft attacks, legato. |
| Register (higher) | Up | Up | **B** | Mid-low for calm; high bells sparingly. |
| Rhythmic regularity | Regular lowers it | Regular is neutral-positive | **B** | Regular breath layer, irregular ornaments. |

**Design rule that falls out of this:** set each level's destination as a point in
valence/arousal space, then reach it with tempo, density, register and brightness. Treat
valence as something to nudge rather than to dial, because the literature says it won't
reliably obey.

### 3.3 The tempo arithmetic, and cascades

**Superseded note (11 Oct, second revision).** An earlier version of this section counted in
BARS and recommended a default of 88 BPM / 4 bars / 5.5 breaths per minute. That was correct
as far as it went, and it is no longer what we do. Counting in BEATS instead turned out to be
strictly more general and to unlock something the bar version could not do, so the 88 BPM
figure is withdrawn. It is recorded here only so a later reader does not find it elsewhere
and think it is live.

**The rule.** A breath cycle spans a whole number of beats, so

> **breaths per minute = BPM ÷ beats per breath**

The bar version — breaths/min = BPM ÷ (4 × bars) — is the special case where the beat count
happens to be a multiple of four.

**Why this matters: cascades come free.** A session should start near the rate the user is
actually breathing and step down to its destination, rather than dropping them cold into a
target rate. Because rate is BPM over beats, **a descending cascade needs no tempo change at
all**: hold the tempo and let the breath span two more beats at each rung. The music keeps
running, completely unbroken, while the breathing slows. At 120 BPM, stepping by two beats:

| beats | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32 |
|---|---|---|---|---|---|---|---|---|---|
| breaths/min | 7.50 | 6.67 | 6.00 | **5.45** | 5.00 | 4.62 | 4.29 | 4.00 | 3.75 |
| step | — | −11% | −10% | −9.1% | −8.3% | −7.7% | −7.1% | −6.7% | −6.2% |

The steps get gentler as the rate falls, which is the right shape: the slower you are already
breathing, the more a given proportional change is felt. Nothing should exceed about 12%.

**120 BPM is the cascade tempo for every calming journey.** It lands 7.5, 6.0, 5.0 and 3.75
breaths/min on exact integer beat counts.

**The one cost, accepted deliberately.** 5.5 breaths/min is not reachable at 120 BPM — it
needs 21.8 beats. The destination is therefore **22 beats = 5.45 breaths/min**. That is a 1%
difference from the old figure, physiologically meaningless, and it buys a cascade with no
tempo change anywhere in it. Decision recorded: seamless wins.

**Energising cascades do change tempo** (120 → 128), deliberately, because faster music is
part of what makes them read as energising (§3.2 — arousal is the strong axis). The breath
still spans whole beats at every rung.

**Box breathing keeps its own tempo.** At 60 BPM one beat is one second, so each side of the
box is exactly four beats and one bar, and the structure is audible without instruction.

**Design decisions on cascade behaviour**

- *Step size*: two beats per rung, 6–11%.
- *Where changes land*: on a breath boundary, which is a whole number of beats. Since the
  tempo does not change on a descending cascade, the lock is preserved trivially.
- *Announced?* No, but **visible in advance**. The Long Shore draws the terrain ahead of the
  traveller from the upcoming breath, so a longer breath arrives as a visibly longer dune
  several seconds before it is taken. The user sees the step coming rather than being told.
  No voice, no label, no chime.
- *Starting rate*: three cards, no numbers and no slider — Wound up (16 beats), Busy (20),
  Already calm (22). Stored as a preference, never shown back as a score. If the chosen start
  is already slower than the destination there is no cascade, rather than one running
  backwards.

**Evidence note.** Cascading is a design judgement about what is easy to follow, not a
physiological claim. The resonance literature is entirely fixed-rate. The nearest real
support is Leslie et al. 2019, where an audio envelope slowed breathing most effectively when
it targeted about 75% of the listener's own baseline rather than jumping to a destination. We
may say a cascade is easier to follow. We may not say it does more to the body.

### 3.4 What makes a short loop survive repetition

From [`research/05-loop-music.md`](../research/05-loop-music.md). These are the composition
rules, and all four sketches follow them.

1. **Keep the harmonic field static or very slow — modal, pedal or drone — and never cadence
   at the loop point.** This is counter-intuitive and it is the most important rule here: a
   satisfying resolution makes the restart *audible*, so a well-closed loop is a worse loop.
2. **Only the breath layer is strictly periodic.** Every other layer runs on a coprime number
   of bars so the combination takes a long time to come round. This is the single best trick
   in the research: Eno's *Discreet Music* used 63- and 68-second tape loops, which realign
   once every 71 minutes. Our equivalent — layers of 5, 7 and 8 bars — gives a 280-bar cycle.
   It only works over a static field, because every phase offset has to stay harmonically
   safe; rules 1 and 2 are a pair.
3. **Spend the variation budget on slow, low-salience dimensions** — filter, reverb, layer
   gain, ornament density — and leave the melodic identity alone.
4. **Place ornaments stochastically**, with probability gates, jittered timing and velocity,
   and plenty of real silence.
5. **Keep the sound soft:** low-passed, soft attacks, a noise bed, slight detune, long-decay
   plucked and bell timbres, and no limiter.
6. **No voice and no singable hook.** The earworm literature describes exactly the properties
   we need to avoid; memorability is a defect in functional music.
7. **Mark the breath turnaround with the envelope first.** An identical event every ten
   seconds becomes the most salient and most irritating thing in the mix. A soft, varied
   marker is a reasonable *second* cue, and is most useful at the bottom of the breath where
   the envelope carries least information. Offer a mode with no marker at all.
8. **Make the loop point invisible:** wrap the reverb tail onto the head, match the phase of
   every slow modulator at both ends, and avoid encoder padding. Synthesising in-app, as the
   sketches do, sidesteps most of this because the reverb simply never resets.

Three findings worth flagging because they contradict what you'd assume:

- **A sample-accurate, zero-crossing loop can still have an audible seam** — from a truncated
  reverb tail, a slow filter at a different phase at each end, or MP3/AAC padding.
- **Listeners implicitly learn even meaningless sound.** Agus and Pressnitzer found that
  repeated noise segments of up to four seconds were learned within a handful of exposures
  and remembered for weeks. So no fixed stretch can ever recur in an identical context, and
  irregular spacing of repeats makes them much harder to detect.
- **The inverted-U of liking against repetition mostly shows up under focused listening**, and
  in fewer than half of individuals. Incidental listening tolerates repetition well. Our risk
  is that a breathing app sits awkwardly between the two — it asks for partial attention.

### 3.5 Where the earlier caution still stands

Two things from the breathing-and-music literature remain true and are about type-A claims,
not about the music layer:

- **Music can speed breathing up as easily as slow it down.** Bernardi et al. (2006) found
  faster tempi raised respiration and arousal, and silence was more relaxing than any music
  tested. Breath entrainment to rhythm is partial — around half of subjects in Haas (1986) —
  and much weaker than gait entrainment. **So: ship a real silent mode and A/B it.**
- **Lead the listener down rather than starting at the destination.** Leslie et al. (2019)
  slowed breathing most effectively with a target set at about 75% of the listener's own
  baseline. Every level should open near where the user already is and descend.

And one genuine link worth keeping: musical phrase lengths cluster around a few seconds
because that is what a breath affords. Music inherited its phrasing from lungs. Writing in
phrases is writing in breaths — which is the one place the musical analogy is more than
analogy.

### 3.6 The four sketches

Built and playable: **[prototypes/04-breath-loops.html](https://book-of-rates.netlify.app/prototypes/04-breath-loops.html)**

| Sketch | State | BPM | Bars | Rate | Coprime layers |
|---|---|---|---|---|---|
| **The Long Shore** | Calm | 88 | 4 | 5.5/min | 5 and 7 bars — realign at 140 bars, ~6.4 min |
| **The Still Pool** | Soothed, exact 1:2 | 120 | 6 | 5.0/min | 7 and 8 bars — realign at 336 bars, ~11 min |
| **Kite Line** | Focused, box | 60 | 4 | 3.75/min | nested 16 / 4 / 2 beats, colotomic |
| **The Run** | Energised | 128 | 4 | 8.0/min | 3, 4 and 5 bars — realign at 60 bars, ~3.75 min |

Everything is synthesised live from oscillators, filtered noise and generated impulse
responses. The drone opens and closes with the breath, ornaments fire on probability gates
over coprime bar cycles, and nothing cadences.

### 3.7 How we stayed on the right side of copyright

The hard constraint is that we ship no existing recording or composition. The method:

- **The research identified properties, not pieces.** Where the research names a work, it
  names it to illustrate a technique and then describes the technique. There is no notation,
  no melody, no song-specific chord progression, and no drum or bass pattern anywhere in
  `research/05-loop-music.md`. The one structural pattern given in full is the generic
  gamelan colotomic template — a gong every sixteen beats, a middle stroke in groups of four
  — which is an anonymous traditional structure rather than anybody's composition.
- **The sketches are generated, not assembled.** There are no audio samples in the repository.
  Every sound is built at runtime from oscillators, noise and envelopes written for this
  project, and the note choices come from scale degrees and probability, not from
  transcription.
- **What we are working in is an idiom, not a work.** Modal drones, nested cyclic percussion,
  coprime layer lengths, long-decay struck tones and generative ambience are compositional
  techniques. Techniques are not owned; particular pieces are. The same distinction we are
  relying on for the visual style (§4.1) applies here, and the discipline is the same: stay
  at the level of method, and never get close enough to a specific piece to be recognisable.
- **Nothing is described as being "in the style of" a named artist** in any user-facing copy.

## 4. Visual style

Full reference, including construction recipes and SVG techniques, in
[`research/04-style.md`](../research/04-style.md).

### 4.1 The IP boundary, stated up front

An artistic style is not protected by copyright — 17 U.S.C. §102(b) and Copyright Office
Circular 33 cover specific expression, not ideas, methods or styles, and *Dr. Seuss v.
ComicMix* (2017) held that an artist's general style is not a trademark. Working in this
idiom is legitimate.

What is not legitimate: reproducing characters, specific frames, set-pieces, title lettering
or marks. **Everything in this app is original scenery and original figures.** No Jack, no
Aku, no recreations of shots. Two practical consequences:

1. The travelling figure in Prototype 1 is a generic silhouette with a staff. It must stay
   generic — no topknot, no two swords, no white robe, no specific costume reading.
2. **We don't market it as "Samurai Jack style".** We describe it as mid-century cartoon
   modern with ukiyo-e influence, which is both safer and more accurate, since that is where
   the style came from. Style similarity can still feed a substantial-similarity finding if
   the specifics drift, so the discipline is in the specifics, not the label.

### 4.2 The seven rules

1. **The rendering split.** Backgrounds are flat painted shapes with **no outlines**.
   Figures are crisp, clean-edged flat colour with minimal interior detail. The contrast
   between the two is the look.
2. **Form comes from value and hue, not line.** Two to four values per object. Every shadow
   is its own hard-edged polygon, and it shifts hue rather than simply darkening — purples
   and teals in shadow, not a darker version of the local colour.
3. **One dominant hue family per scene.** Tartakovsky's stated rule was no green grass and no
   blue sky. Scott Wills's version: any realistic colour solution "is not good for Genndy".
4. **Choose the sky first and let it be the loudest thing in the frame.**
5. **Depth is four to six discrete bands** that lighten and desaturate with distance. Never a
   continuous gradient. The one permitted gradient is the ukiyo-e *bokashi* wipe, and only in
   the sky.
6. **Extreme negative space.** A tiny figure, an off-centre horizon, a hard-cropped
   foreground, and long holds on stillness. Emptiness is the main compositional tool.
7. **Texture lives in the background layer only.** Wills painted keys small — around 4.5×6
   inches — in Cel Vinyl, with an airbrush, a hair dryer and a paper towel, then scanned and
   colour-corrected them. A low-opacity grain over scenery approximates this; keep it off the
   figures and the UI.

### 4.3 Palettes per emotional theme

All hex values are derived for this project from descriptions and reference, not lifted from
any source. Sky reads top-to-horizon; then the shadow colour, then the one accent.

| State / level theme | Sky | Shadow | Accent |
|---|---|---|---|
| Calm — dawn coast | `#2B1B4E` → `#8A2B6B` → `#F7A93B` | `#1A0F2E` | `#FDF1DC` |
| Grounded — desert dusk | `#E8553A` → `#F6B04A` | `#5B2A4A` | `#2FA39A` |
| Soothed — night pool | `#14183F` → `#2C3E8C` | `#080A22` | `#46D6C8` |
| Settled after distress — storm | `#5B4B7A` → `#B7C0D8` | `#2F3E4D` | flash `#FFF2A8` |
| Focused — high plateau, noon | `#9FC6D8` → `#E7E2C4` | `#2A3A4A` | `#E4572E` |
| Sleepy — night river | `#0E1230` → `#1E2A5C` | `#060818` | `#C9A86A` |
| Energised — cliffs at midday | `#F2E6A0` → `#BFE3B4` | `#173A44` | `#E4572E` |
| Alert — temple, hard shadows | `#D9E4EE` → `#F4E9D0` | `#2B2235` | `#C23B2E` |
| Composed — underwater | `#1B6A72` → `#0A2E3C` | `#06181F` | `#F2E3C8` |
| Arrived — above the clouds | `#2B1B4E` → `#E8473C` → `#F7A93B` | `#1A0F2E` | `#FFE9A8` |

### 4.4 Weather as the emotional carrier

This is where the style earns its place in a breathing app. The show carries mood almost
entirely through colour, weather and stillness rather than through detail or expression,
which is exactly what we need: a storm that passes over the course of a session does the
emotional work without any copy telling the user how to feel.

Construction, all as flat unstroked shapes: **rain** as long diagonal streaks; **lightning**
as hard angular forks plus a full-frame colour inversion for one or two frames; **fog** as
flat banded layers; **clouds** as hard-edged stacked lobes with a flat underside;
**mountains** as angular facets with one hard shadow split; **water** as flat bands with
stylised crests and reflections as offset flat shapes, never a mirror; **grass** as sheaves
of tapering triangles.

---

## 5. The three breath displays

All three are built, deployed and verified on a 375 px viewport. None uses an expanding
circle. All three share one breathing engine: a pure function of elapsed time with
smoothstep easing at the turns, so the turnarounds — where jarring actually lives — are
never a snap. All three have the always-visible stop.

**Live:**
[1 · The Long Shore](https://book-of-rates.netlify.app/prototypes/01-long-shore.html) ·
[2 · The Still Pool](https://book-of-rates.netlify.app/prototypes/02-still-pool.html) ·
[3 · The Tide](https://book-of-rates.netlify.app/prototypes/03-the-tide.html)

### 5.1 Prototype 1 — The Long Shore *(travelling camera; the breath drawn in space)*

A desert landscape scrolls past at a constant walking pace. The dune profile is not decorated
with the breath — **it is the breath**. For any pixel column on screen, the terrain height is
the breath level at the time the traveller will arrive there. So the slope rising ahead of
you is literally the inhale you are about to take, and you can see three breaths into the
future.

The distant ranges deliberately do *not* follow the breath; they are fixed geology drifting
past at parallax speed. An early version applied the breath curve to every layer and the
frame read as noise.

**Why I'd pick this one as the primary display.** It is the only one of the three that is
*predictive*. A pacing cue that shows you what is coming is categorically better than one
that shows you what is happening, because it lets the user prepare the turnaround instead of
reacting to it. Everything else here is an aesthetic preference; this is a functional
advantage.

### 5.2 Prototype 2 — The Still Pool *(fixed camera; an accumulating mark)*

Nothing scrolls and the camera never moves. A brush walks a slowly tightening spiral across
the surface of a night pool, and the breath pushes the line outward and draws it back in.
The ink persists, so the session draws itself and you finish with a picture you made by
breathing. Brush weight is heavier on the exhale, as a real brush would be.

The spiral tightens steadily across the whole session so the brush **arrives at the centre
exactly as the last breath ends** — the destination made spatial, which fits the Book of
Rates concept better than anything else here.

One design note worth recording: the first version ran one lap per breath, which collapsed
the radial signal into "which side of the circle you're on" — functionally a dot going round,
i.e. the thing we were trying to escape. Two breaths per lap makes the breath visible as the
line bulging out and drawing in twice per revolution. Period ≠ lap is the whole trick.

### 5.3 Prototype 3 — The Tide *(no indicator at all; the scene breathes)*

A dawn coast. The sea climbs the beach on the inhale and withdraws on the exhale; the light
warms and cools with it; the grass leans. There is no UI element and nothing is drawn on
screen that isn't part of the picture. Three marker stones sit at fixed heights up the beach
and are submerged or exposed depending on the tide, giving the waterline a readable scale
without ever drawing a gauge.

**This is the calmest and the least legible, and that trade is inherent, not a bug in the
implementation.** If you want a display that asks nothing of the user and can be half-watched
with the eyes unfocused, this is it — which makes it right for sleep and wind-down and wrong
for anything requiring precision. The marker stones recover some of the legibility; they
don't recover all of it.

### 5.4 Decision (11 Oct)

**Prototype 1, The Long Shore, is the display we build** — the desert-dusk landscape that
scrolls at breath pace, where the terrain ahead of the traveller is the breath about to be
taken. Chosen for the predictive property in §5.1: it is the only one of the three that shows
you the breath *before it arrives*.

**Prototype 3, The Tide,** is kept as a likely second mode, for sleep and wind-down, where
its lower legibility costs least.

**Prototype 2, The Still Pool,** is shelved, not deleted. It stays in the repository and
stays live. It is the only one that produces an artefact the user keeps, and that idea is
worth coming back to — most likely as an end-of-session summary rather than as the thing you
watch while breathing.

---

## 6. The ten levels

Every level pairs an emotional destination, a breathing protocol, a theme and one distinct
interaction.

**The governing principle, which you identified and which I think is the most important
design decision in the project: the interaction guarantees success.** The game exists to pace
breathing. It cannot be won and it cannot be lost. Nothing is scored, nothing is streaked,
nothing is failed. Concretely this means every interaction is *expressive* rather than
*causal* — the user's input changes how the scene looks and feels, while the thing that
actually advances is on the schedule. Lift your finger and the level continues. This is also
a safety property, not only a kindness: every documented breathwork death I found involved
somebody trying to beat something.

Levels 3, 6 and 7 are your three.

| # | Level | State | Protocol | Rate | Theme | Interaction |
|---|---|---|---|---|---|---|
| 1 | **First Light** | Calm | 5 / 6 | 5.5 | Dawn coast *(Prototype 3)* | None required. One optional tap places a stone you'll see next time. |
| 2 | **Still Pool** | Soothed | 4 / 8 | 5.0 | Night pool *(Prototype 2)* | Finger chooses the brush — wet, dry, broad. The app draws; you choose how. |
| 3 | **Kite Line** | Focused | 4-4-4-4 box | 3.75 | High plateau, wind, one kite in an empty sky | **Side slider, switchable left/right for handedness.** Pull up to inhale, hold at the top, down to exhale. |
| 4 | **Lantern Current** | Sleepy | 4 / 8 → 4 / 9.3 | 5.0 → 4.5 | Night river, drifting paper lanterns | Rest a finger anywhere to light a lantern. Screen dims across the session and ends dark. |
| 5 | **Bamboo Rain** | Settled, after distress | Double nasal inhale + long exhale, then 5 / 6 | ~5.0 | **Storm**: rain, hard angular lightning, full-frame flash | Each exhale pushes the rain band further off. The storm clears on schedule. |
| 6 | **The Run** | Energised | 3 / 4.5, no holds, 3 min cap | 8.0 | Cliffside flight at midday, speed lines | **Two buttons, bottom-left and bottom-right.** Left inhale, right exhale. |
| 7 | **Pearl Diver** | Composed | 4 / 2 at empty / 5 — **no retention** *(see §2.4)* | ~5.5 | Underwater: green light, flat kelp bands, surface from below | Finger held on screen keeps the diver down. Lift and she surfaces, pearl intact. |
| 8 | **Bell Tower** | Alert | Humming exhale (bhramari-style) | 5.0 | Mountain temple at noon, hard shadows | Hum into the mic; the bell's ring widens with your voice. Works silently too. |
| 9 | **Two Rivers** | Clear-headed | Alternate nostril, cued | 5.0 | Forest confluence, two channels of water | Thumb rests on the left or right half to mark which nostril is open. |
| 10 | **The Summit** | Grounded, arrived | The user's own resonance rate, found by a gentle 6.5 → 4.5 sweep | ~4.5–6.5 | Above the clouds at sunrise, enormous negative space | **Nothing at all.** The last page of the book. |

> **Table note, 23 Oct 2026.** Row 7, Pearl Diver, now has two protocols rather than one.
> The default is **box breathing, 4-4-4-4, 3.75/min**, with the descent and the search
> inside the first hold and the inhale taken above the surface. The row as written —
> 4 / 2 at empty / 5, no retention, 5.45/min — is still built, and is what the screening
> gate offers anybody for whom holds are contraindicated or who is unsure. The reasoning
> for the change, and the original reasoning against it, are both at §2.4; the authorial
> grounds are at §1.5.

### 6.1 Notes on the three you specified

**3 · Kite Line.** The Flappy-Bird reference is right about the *feel* and must be wrong about
the *rules*. The cloud gaps are generated from the breath schedule, so following the pacing
always clears them — and when the user drifts off pace, the gap widens rather than the kite
crashing. The slider position is expressive; the kite's survival is not in question. Box
breathing's 4-second holds are low-risk and this is the only level with holds at all besides
nothing. Handedness switch lives in settings and is also offered on first run.

**6 · The Run.** Note the protocol: 8 breaths/min with no holds. This is brisk, and it is
deliberately **not** hyperventilation — a Wim Hof-style round would be 30–40 breaths in well
under a minute. The arousal in this level comes from the speed, music and imagery, which is
honest as long as we don't dress it up as a physiological effect. Three-minute cap. The
glider cannot crash; the buttons change how it flies, not whether it survives.

**7 · Pearl Diver.** Recommendation in full at §2.4. Summary: keep the diver, keep the pearl,
keep the descent and the green light — and drop the breath-hold, making "underwater" the
bottom of a long exhale with a short rest at empty. Never preceded by fast breathing. The
lung indicator counts **down to surfacing**. No duration shown, ever.

### 6.2 Progression

Levels are a book to read, not a ladder to climb. Nothing is locked behind performance.
Anything is locked only behind the safety screening in §2.2, and nothing in the screening can
be unlocked by using the app more.

---

## 7. What I think is wrong or risky

In the order I'd worry about it.

1. **The pearl diver as originally described is the one genuinely dangerous idea in the
   project.** Hold games and breath-holding are a bad pairing for the reasons in §2.4. My
   recommendation is to keep the level and remove the retention. I don't think this costs
   the idea anything.

2. **The evidence is thinner than the concept implies.** "Walk the user through a series of
   emotional states to a destination state" promises more specificity than the literature
   can deliver. We can reliably get someone calmer; we cannot reliably take them to a named
   emotion by choosing a ratio. I'd rather the product's voice be quietly confident about
   the rate and openly playful about the states — "this one is for when you want to feel
   like this" rather than "this produces this". That framing is both more honest and, I
   think, more charming.

3. **The one-breath-per-cycle trap.** The Still Pool bug is the general case of a real risk:
   any animation whose period equals the breath period stops conveying the breath and starts
   conveying only position. Worth stating as a rule for every future level.

4. **Silence may beat our soundtrack.** Bernardi found silence more relaxing than any music
   tested. We should A/B this rather than assume, and ship a real silent mode. Note this is a
   claim about *physiological* effect, so it sits on the type-A side of §3.1 and does not
   undercut the music layer as design.

5. **Netlify's free-tier badge** sits over the bottom-right of the prototypes and slightly
   obscures the cue text in screenshots. Cosmetic, but worth knowing before you forward them.

6. **Research caveats to clear before any user-facing copy.** The research files grade every
   claim, and a number of them are marked unverified: the subagents could not reach PubMed's
   E-utilities, so several peer-reviewed claims rest on search summaries rather than full
   texts. Specifically unretrieved: the coroner reports, the Sunday Times investigation, RNLI
   and USA Swimming statements, FDA/MHRA primary text, and any obstetric guideline. The
   Metzger v. Hof civil case ended in July 2024 on lack of proof of causation, which is not a
   finding of safety; the death tallies of 11 to 34 come from journalism and from the critic
   Scott Carney, not from any official registry. **None of these should be cited in the
   product until someone reads the primaries.**

7. **An accessibility gap I haven't designed for.** Every display here is visual, and two of
   the three are colour-carried. We need an audio-primary and a haptic-primary mode, and
   haptics are probably the better pacing channel anyway for anyone who wants to close their
   eyes — which, for a breathing app, is quite a lot of people. Worth a Phase 2 prototype.

---

## 8. Decisions and open questions

### Settled on 11 October

1. **Display: The Long Shore** (prototype 1). The Tide kept as a second mode; the Still Pool
   shelved rather than deleted. §5.4.
2. **No retention anywhere in v1.** The pearl diver ships as the bottom-of-exhale version.
   Retention becomes a visible locked future feature, designed at §2.4a.
   > **AMENDED 23 Oct 2026:** relaxed by the author, for his own use, on the grounds set out
   > in §1.5. Retention is now permitted in the pearl diver as short equal holds inside box
   > breathing. The original decision and the whole of its reasoning are preserved at §2.4
   > and have not been deleted: this is a decision changed on purpose, not a constraint that
   > evaporated. The hazard is now disclosed and chosen rather than designed out, and the
   > no-retention version of the level remains built and is what anyone who screens out
   > gets. Everything in §2.1 still binds.
3. **Two evidence standards, separated.** Breathing-to-body claims keep the full discipline;
   the music layer is design and is not apologised for. §3.1.

### Still open

1. ~~Does the default move to 88 BPM / 5.5 breaths per minute?~~ **Settled 11 Oct:** no —
   superseded by counting in beats. 120 BPM throughout, destination 22 beats = 5.45
   breaths/min, because that makes cascades seamless. See §3.3.
2. Which of the four loop sketches is closest? They are deliberately different in density,
   and the right answer may be different per level rather than one house sound.
3. Phase 2 order: build the Long Shore as the real breath engine with audio attached, or
   prototype the haptic/audio-only display first (§7.7)?
4. How much of the honest-about-the-evidence voice do you want visible to users, versus just
   governing what we don't claim?
