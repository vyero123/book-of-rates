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
| **Calm** | 5 / 6 | 5.5/min | **MODERATE** — closest to the resonance literature | The default. Everything else is a variation on it. |
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

**What I actually recommend for v1: ship the pearl diver with no breath-hold at all.**

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

## 3. The music question, answered honestly

You thought musical theory might be a basis for this. Here is where that is real and where it
is decoration. Detail in [`research/03-practices-and-music.md`](../research/03-practices-and-music.md).

### 3.1 Genuine

**The arithmetic is exact, and it is also trivial.** 6 breaths/min is 0.1 Hz is a ten-second
cycle. A four-bar phrase of 4/4 at 96 BPM is exactly ten seconds. That is a real and useful
correspondence — it means a composer can write to the breath without fighting it — but it is
division, not music theory. Nothing follows from it that wouldn't follow from a metronome.

| Musical tempo | Beats per breath cycle | Breaths/min | Suggested in : hold : out, in beats |
|---|---|---|---|
| 96 BPM | 16 (four bars of 4/4) | 6.0 | 7 : 0 : 9 |
| 66 BPM | 12 (three bars of 4/4) | 5.5 | 5 : 0 : 7 |
| 60 BPM | 11 | 5.45 | 5 : 0 : 6 |
| 72 BPM | 16 | 4.5 | 6 : 2 : 8 |
| 80 BPM | 16 (4-4-4-4) | 5.0 | 4 : 4 : 4 (+4 empty) |
| 110 BPM | 20 (five bars) | 5.5 | 8 : 0 : 12 |

**The phrase-equals-breath link is real, and the causality runs the right way.** Sung phrases
cluster around five seconds because that is what a breath affords. Music inherited its
phrase lengths from lungs, not the other way round. This is the one place where the musical
analogy is more than analogy: **writing in phrases means writing in breaths, because that is
where phrases came from.** Singers and wind players are a natural experiment in long
controlled exhalation and worth studying for the sound design.

**Adaptive loudness envelopes work.** Leslie et al. (2019) slowed listeners' breathing with
an audio envelope, and the best results came from setting the target rate at about 75% of
the user's own baseline rather than jumping straight to 6/min. **That is a concrete design
instruction: measure first, then lead down gradually, rather than starting at the
destination.** It should shape how every level opens.

### 3.2 Decorative

- **Harmonic tension mapped to breath phase.** Appealing, unsupported, fine as an aesthetic
  choice as long as nobody writes marketing copy about it.
- **Interval ratios as breath ratios** (a 3:2 fifth as a 3:2 inhale:exhale). This is numerology.
- **432 Hz, solfeggio frequencies, "healing frequencies".** No. If we use them we are lying.
- **Binaural beats.** A pooled g ≈ 0.45 exists for anxiety and cognition, which is not
  nothing, but the literature is weak and heterogeneous. Not a foundation.

### 3.3 The warning that matters most

**Music can speed breathing up as easily as slow it down.** Bernardi et al. (2006) found
faster tempi increased respiration and arousal, and — the finding that should give us
pause — **silence was more relaxing than any of the music tested.** Breathing entrains to
auditory rhythm only partially: around half of subjects in Haas (1986), and not at all at
intermediate tempi in Bernardi. It is far weaker than gait entrainment, and gait entrainment's
own evidence base is rated low quality.

I also found no controlled evidence that a *ritardando* leads a listener's breathing down,
which is a shame, because it is the most obvious thing we'd want to do.

**Verdict: music is an interface layer over a physiologically grounded breathing engine, not
the mechanism.** Build the engine on the rate. Let the music serve it. And ship a
properly silent mode, because the evidence says some people will do better with it.

---

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

### 5.4 Recommendation

Ship all three as selectable displays rather than picking one, because they fail in different
directions and users differ. Default to **The Long Shore**. Offer **The Still Pool** as the
ritual/record mode for people who want something to keep. Offer **The Tide** for sleep. If we
only build one, build the Long Shore, for the predictive reason above.

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
   tested. We should A/B this rather than assume, and ship a real silent mode.

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

## 8. Open questions for you

1. Pearl diver: agreed on removing the retention for v1?
2. Should Phase 2 build out the Long Shore as the real breath engine, or prototype the
   haptic/audio-only display first?
3. How much of the honest-about-the-evidence voice do you want visible to users, versus
   just governing what we don't claim?
