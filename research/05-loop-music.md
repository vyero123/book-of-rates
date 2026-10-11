# 05 - Loop music: what keeps 30-90 s loops pleasant over many repeats

Scope: structural properties for composing ORIGINAL loops for a breathing app. Works are named only as illustrations of a technique. Provenance tags: **[S]** = found in a source this session; **[C]** = craft consensus or my own synthesis/inference (flagged because many practitioner claims are not experimentally tested); **[calc]** = my arithmetic.

---

## (a) DESIGN RULES

1. **Make the loop's pitch field static or slowly cycling, not cadential.** Use a modal centre, a pedal/drone, or a very slow harmonic rhythm (1-2 chords per breath cycle at most). Avoid a dominant-to-tonic arrival at the loop point; if any directional motion is wanted, let the last bar be "imperfect" and let the re-entry supply the arrival. (Sec 3; game-music analyses report loops "usually not composed of resolving cadences".)
2. **Do not rely on one long loop; rely on 2-4 layers of unequal, coprime length.** Layer loop lengths (in bars or seconds) that share no common factor, so the combined pattern repeats at the product, not the maximum. E.g. 5, 7 and 8 bars -> 280 bars before exact recurrence. (Sec 4; Eno's 63 s/68 s loops give a ~71 min cycle [calc].)
3. **Make the *breath* layer the only strictly periodic layer.** The breathing cue (rise/fall envelope) must repeat exactly every breath; everything else may drift against it. Breath period = bar or beat multiple (6 breaths/min = 10 s = 60 bpm, 10 beats, or 5 bars of 2 beats etc.). (Sec 9; Jamk tempo-breath equivalence.)
4. **Spend the variation budget on slow, low-salience dimensions**: filter cutoff, reverb send, layer gain, stereo position, ornament density. Keep melody/rhythm identity constant. Change one slow dimension at a time, over 20-60 s sweeps (hold-and-drift), never in steps. (Sec 4, 6.)
5. **Place ornaments stochastically, not on a grid.** Sparse plucked/bell notes drawn from the mode, with random timing offset (+/-10-30 ms humanise), velocity (+/- 10-15%), and a *probability gate* (e.g. 30-60% of eligible slots). Never allow a rest pattern to be fixed; fixed rest patterns are what the ear locks onto. (Sec 4; repetition-detection research, sec 2.)
6. **Keep the spectrum soft.** Low-pass or shelve above ~5-8 kHz, soft attacks (10-80 ms) for sustained parts, long-decay plucked/bell/inharmonic timbres for ornament, a noise bed, slight detune (+/-5-12 cents) and slow chorus. Avoid narrow resonant peaks, sharp transients, vocal-formant timbres, and brickwall loudness. (Sec 5; mostly [C] with weak direct evidence.)
7. **No voice, no lyrics, no vowel-like pads.** Lyrics are the most consistently implicated interference in background-music studies; vowel-formant timbres may read as speech [C]. (Sec 5.)
8. **Avoid earworm features.** Earworm-prone tunes have faster tempo, common global contours, and a few unusual intervals/repeated notes. Our loops should be slower than ~70 bpm in felt pulse, have *no singable top-line*, small intervals/arpeggiated figures that never stabilise as a "tune", and no repeated-note hook. (Sec 2.)
9. **Make the loop point invisible in four ways:** (i) cut at zero crossing / or crossfade, (ii) let the reverb/delay tail wrap (render >=1 extra pass, fold tail onto head), (iii) keep the DC/level/noise-floor identical at start and end, (iv) end and start on the *same phase* of every slow modulator (LFOs, filter sweeps, gain automation) - a sample-accurate loop can still seam if a slow envelope jumps. (Sec 1.)
10. **If the loop is synthesised in-app (not a rendered file), prefer procedural generation with a seeded RNG and a master-clock of the breath,** so there is no file seam at all and layers can have arbitrary coprime periods. (Sec 1, 4.)
11. **Mark the breath turnaround by the envelope first, an event second and softly.** Primary cue = the continuous rise/fall (filter opening + gain + pitch contour); optional secondary = a soft, low-passed, long-decay marker at the top (e.g. a muted bell) that is *not identical* every time (varied velocity/pitch within the mode). Provide a mode with no event for users who find it intrusive. (Sec 9; the Jamk guidance requires the phases to be distinguishable "from the music alone".)
12. **Use filtered noise as the breath analogue** (band-pass sweep up on inhale, down on exhale; or amplitude swell). It is ear-friendly, has no pitch to fatigue, and is nearly impossible to "recognise" as repeating. (Sec 5, 9.)
13. **Arousal is steered by tempo, loudness, brightness, attack and register; valence by mode/consonance, register and brightness - and valence is the weaker, less reliable axis.** Use the table in (c). For a calming app, keep arousal low and treat valence as "neutral-to-gently-positive": don't count on any single feature to produce it. (Sec 8.)
14. **Test with a long-run audition protocol**: render 20 minutes, listen for (a) the moment you can predict the next event, (b) any 'bump' at the loop boundary, (c) any single timbre that becomes salient after ~5 min. Fix by lowering that element's level or probability, not by adding more material. [C]
15. **Aim for "ignorable and interesting": below the threshold of capturing attention, above the threshold of boredom.** The breathing app's analogue of Eno's criterion: the music must tolerate the user *either* attending to the cue *or* attending inward. (Sec 6, 9.)

---

## (b) DETAILED SECTIONS

### 1. Loop mechanics

**Basic seam problems** [S + C]
- A cut away from a zero crossing creates a click/pop; practitioners report it as loud and obvious [S: game-composer discussion]. Remedies: cut at zero crossings in all channels, *or* (better) apply a short equal-power crossfade (5-50 ms for percussive/pitched material; longer, 100 ms - several seconds, for pad/noise/ambient beds) [C].
- **Zero-crossing is necessary but not sufficient.** A loop can be sample-accurate and still seam because: (1) a **reverb/delay tail is truncated** (the room "dies" at the loop point and is suddenly absent at the head, or conversely the head begins into a silent room); (2) **slow modulators are discontinuous** (an LFO, filter sweep, auto-pan or gain ramp is at a different phase at end vs start); (3) **a note or phrase is cut** or a sustained note's attack falls at the loop head with no preceding sustain; (4) **DC offset or noise-floor mismatch** (noise bed starts abruptly); (5) **rhythmic/metrical misalignment** - the loop length is not an integer number of beats/bars, so the pulse stumbles; (6) **codec/encoder padding** adds silence or priming samples. MP3 and some AAC encoders add padding, which breaks gapless loops; use WAV/Ogg or a gapless-capable container [S: warnings about export padding; C: format advice]. In the web, Web Audio `AudioBufferSourceNode` with loopStart/loopEnd on a decoded buffer, or synthesis, avoids the problem [C].

**The reverb-tail problem** [S + C]
Three standard solutions:
1. **Wrap the tail.** Render the piece with the reverb ringing out *past* the loop end for at least the RT60 of the reverb (typically 2-6 s for ambient). Copy that tail and mix (add) it onto the start of the file, then trim to the loop length. The head then contains the decay of the previous pass - exactly what would happen in a real room. This is what practitioners describe as overlapping the ring-out at the beginning on a separate track [S].
2. **Render the loop 2-3 times in a row and extract the middle pass**, so reverb is in steady state [S: "more than one repeat to reach a steady state"]. Simple and robust.
3. **Automate the wet/dry or decay toward the end** so the tail doesn't crash the head [S]. This works but produces an audible "pump" if overdone; it is a compromise for loops with long tails.
Also: bounce audio rather than MIDI-triggered round-robin samples, because different round-robins give different tails [S]. For in-app synthesis, run the reverb continuously and never reset it at loop boundaries - the problem disappears.
- Practical numbers: tail wrap length = longest decay in the mix (reverb RT60 plus delay feedback to -60 dB); for a 3 s plate-type reverb, keep a >=3-4 s overlap region. Crossfade lengths above are craft numbers [C], not from a measured source.

**Pre-roll / post-roll** [S]
- Middleware treats the file as pre-entry / body / post-exit. In Wwise the Entry and Exit cues define the looped region; audio before Entry (pre-entry) and after Exit (post-exit) exists so transitions can overlap and tails can ring. For a plain loop, community answers say disable "Play pre-entry" and "Play post-exit" in the playlist container's Transitions tab, otherwise material stacks/doubles [S: Audiokinetic Q&A]. Pre-entry/post-exit files must be authored with the tail baked in or the engine sets the overlap; behaviour differs between versions - **verify against official docs** (the Q&A threads are not authoritative).
- FMOD: loop regions are set on the music asset or a timeline loop region; for intro+loop one either uses an embedded loop region (engine plays intro once, then loops the region) or two files, INTRO and LOOP, sequenced by the engine with the second repeating [S: forum, secondary]. Transition markers / "transition timelines" and quantisation to bars/beats provide stingers and exits [C - my general knowledge; not verified by a fetched doc this session].
- **Stingers** (short one-shots layered or sequenced on top of the bed, quantised to beat/bar) are the middleware tool for marking events without changing the loop [C]. Relevant to the turnaround-marker question in sec 9.
- Honest gap: I could not retrieve official FMOD/Wwise docs; treat middleware specifics as practitioner reports.

**Intro-then-loop** [S/C]: an intro that is *not* part of the loop is useful for a breathing app (a few preparatory breaths, per the Jamk suggestion of 3-4 breath cycles of an explicit breath sound at the start [S]); the loop body must not need the intro to make sense.

### 2. Why repetition is tolerated at all

**Mere exposure and the inverted-U** [S]
- Berlyne's two-factor model: liking follows arousal potential; novelty initially raises arousal (rejecting), familiarity lowers it (liking rises), then satiety/boredom lowers liking. Arousal potential rises with tempo, loudness, complexity and falls with familiarity.
- Empirical: Szpunar, Schellenberg & Pliner (2004) found that under **incidental** listening, liking increased with exposure; under **focused** listening it formed an inverted-U for realistic stimuli. Schellenberg, Peretz & Vieillard (2008): linear increase in incidental condition; inverted-U (peak ~2 exposures, decline at 8-32) in focused condition. Hunter & Schellenberg (2011): fewer than half of individuals show the inverted-U; Openness to Experience moderates. Other 2017 work reports liking rising monotonically with repetition at all complexity levels, i.e. familiarity dominates; and the inverted-U may fail for extreme stimuli [S; abstracts only].
- **Implication for us:** the app's music is *incidental*, not focused - the best case for tolerance. The danger is that a breathing app asks for partial focus (users attend to a cue). Hence rule 15: make the music able to recede.

**Complexity x repeats** [S + C]: the inverted-U implies simpler material peaks sooner and wears out sooner; complex material takes longer to absorb. The practical consequence is that a *very simple* loop (few events) must be varied slowly, while a *complex* one can be left alone. Our design aims for low foreground complexity + high hidden combinatorial depth (sec 4).

**Margulis on repetition** [S]
- Core claim: repetition is far more prevalent in music than speech and is central to musical engagement; repetition invites participatory listening ("listening along with it") and acts as a "handprint of human intent". Beyond mere exposure.
- **Speech-to-song illusion:** looped spoken phrases begin to sound sung; Margulis' 2015 work found it occurs whether repetitions are regularly spaced or not, and more with hard-to-pronounce languages; a 2024 study found the effect survives a one-week delay (rapid phrase-specific learning). Repetition has also been shown to musicalise environmental sounds and, in Simchy-Gross & Margulis' work, random tone sequences.
- **Translation to our design:** repetition makes things sound like music and invites entrainment - useful (we *want* the user to entrain to the breath cycle). It also makes the specific content memorable - which is the cost: the listener learns the loop.

**Listeners learn repeating sounds fast and implicitly** [S]. Agus, Thorpe & Pressnitzer (2010): frozen noise bursts up to 4 s long, repeated within longer noise, were learned implicitly, near-perfectly after a few repetitions, and remembered for weeks. Later work (tone clouds) shows learning from melodies down to noise; detection is best when repeats are temporally regular (Rajendran et al. 2016). **Implications:** (1) Even an apparently random texture will be learned if a *fixed-length* segment recurs; to avoid it, never repeat an identical stretch within the perceptual window. (2) *Irregular* spacing of repeats makes detection harder - favouring non-grid ornament timing. (3) The detection results are for repeats of whole spectro-temporal patterns, not for single layers in a mix; mixing several layers of unequal period dilutes the chance of the whole pattern recurring.

**Earworms (what to avoid)** [S]
Jakubowski et al. (2017, *Psychol. Aesthetics, Creativity & the Arts*): from ~3,000 survey respondents, 100 earworm tunes vs 100 matched non-earworms. Earworms had **faster tempo**, **more common global melodic contour** (e.g. rise then fall), and **unusual intervals / more repeated notes** than typical (an "optimal complexity" for latching). Popularity and recency also matter. Earlier work (2015): earworms are recalled at close to the original tempo. **For functional music this is a property to AVOID** - an earworm intrudes and keeps playing in the head after the audio stops. Avoid: fast tempo, simple arch contours, a distinctive interval leap or repeated-note hook, a lyric. (Caveat: study is popular-music only; generalising to ambient is inference.)

### 3. Harmonic closure vs. non-resolution

- Craft consensus [S: several game-music commentators; C]: loops built from functional cadences can sound like a stutter on restart because each pass ends with a perfect cadence (tension released, "ending" gesture) and the restart then demands another departure. The listener hears a phrase boundary every N bars - the loop's period becomes salient.
- Loops "are usually not composed of resolving cadences"; the end may be "imperfect" with the re-triggered start supplying the resolution; or the loop can circulate with voice-leading that implies continuation (a game-music analysis describes a 13-bar loop that hooks back without a perfect cadence, relying on voice leading) [S].
- Another practitioner reports the opposite problem: a puzzle-game bed of one stable chord needed a deliberate V-I at the loop point [S]. So the rule is not "never cadence" but **match the *amount* of closure to the intended perceptual salience of the loop point**: for functional/unobtrusive music, minimise it.
- **Static harmonic field** [C, widely used]: drone/pedal on tonic or fifth; modal pitch collection (Dorian, Lydian, Mixolydian, pentatonic) with no leading tone; chords that are cluster-free but non-directional (sus, add9, open fifths). The absence of leading-tone pull and of V-I removes the "ending" signifier. Lydian/Dorian choices also differ in perceived valence (sec 8).
- **Nested trade-off:** Static field = no harmonic progress to mark the restart, but also no forward motion. Motion is supplied by slow timbre/density change and by non-harmonic layering.
- Caveat: I found no controlled experiment comparing cadential vs modal loops for tolerance; this section is craft consensus plus music-theory reasoning.

### 4. How much variation, and what kind

**Variation budget (practitioner concept)** [C; supported by the incidental-listening literature]. Decide a fixed amount of "change per minute" and allocate it to low-salience dimensions. A tentative budget for an ambient breathing loop (my synthesis, not a published standard): foreground melodic identity - 0% change; harmony - none to very slow; texture/density - slow (changes over 30-90 s); timbre (filter, reverb) - continuous drift; micro-timing/velocity - continuous random. Stems muted/unmuted at phrase boundaries (vertical layering) give audible-but-gentle form.

**Vertical layering vs. horizontal re-sequencing** [S]: vertical layering keeps harmony and tempo constant so changes feel natural; horizontal switches between sections at bar boundaries. Most projects combine both; layering is the lower-risk option for a loop that must stay the same "place".

**Coprime / polymetric loop lengths - the key trick** [S + calc]
- Eno's Discreet Music: two tape loops of 63 s and 68 s [S]. 63 = 3^2 x 7, 68 = 2^2 x 17, no common factor, so exact realignment = 63 x 68 = 4,284 s = **71 min 24 s** [calc]. In practice tape drift means it never repeats exactly [S/calc caveat]. Compare: either loop alone repeats every ~1 min.
- General rule: for loops of lengths L1, L2, ..., the combined period = LCM(L1, L2, ...). When lengths are coprime, LCM = product. For small integer bar counts: 2-bar + 3-bar = 6 bars; 3+4+5 = 60 bars; 5+7+8 = 280 bars; 7+11 = 77 bars; 5+7+9 = 315.
- **Two practical constraints:** (a) the *shared breath grid* should be an integer fraction of each loop (e.g. all loops are multiples of the 10 s breath), unless a layer is deliberately "free"; (b) the layers must be *harmonically compatible at every offset* - so the pitch field must be static or all layers modal in the same collection. This is why rule 1 and rule 2 go together: a static field is what makes arbitrary phase offsets safe.
- Another variant: same-length loops with different *start offsets* do not help; different *lengths* (periods) do. Also, to avoid hearing a full-mix repeat, vary the *number* of layers active at any time (stem muting by independent random processes, each with its own period) so the instantaneous mix is a different subset each time.
- **Phasing** (Reich): two copies of one figure at slightly different speeds drift; the process is audible [S]. Reich's own statement is that the process should be audible; for a *background* application the drift ratio should be much smaller (e.g. 1-2% ) so the effect is a slow shimmer rather than a foregrounded process [C]. Note the contrast: Reich wants the listener to follow; we want the listener not to need to.

**How long before a repeat is noticed?** [S + C]
- Hard numbers are thin. Laboratory: frozen-noise repeats of up to 4 s are detected and learned within a few exposures (Agus et al.), and learning persists for weeks [S]. This is the *worst case*: noise has no other cues, the task is detection, attention is on it.
- Music in the background is not attended; a single repeated 8-bar phrase is typically recognised on the 2nd-3rd pass when salient. Beyond that, no authoritative number exists. My working rule [C, unverified]: (i) any pattern of < ~10 s that is the *most salient* element will be recognised as a loop within 1-3 passes; (ii) a pattern whose total mix recurrence period exceeds ~5-10 minutes is effectively unrecognisable in passive listening; (iii) salience matters more than length: a prominent hook is detected immediately regardless of loop length.
- Therefore: design so that **no single prominent element recurs in an identical context within ~2-3 minutes** (coprime periods giving the mix a >= 10-20 min cycle suffices), while the *prominent* elements are drawn from a statistical pool (not a fixed sequence).

**Stochastic ornament placement** [C]: pick from a small pool of notes (e.g. 5-7 pitches of the mode), Poisson-like timing with minimum spacing, probability gates per bar, "rest bias" so silence is common; avoid repeating the same pitch twice in a row; weight lower pitches higher on strong breath phases. Draws should be independent of the loop position so the recurrence of the layer length is masked.

**Slow filter/reverb evolution** [C]: LFO periods unrelated to loop lengths (coprime in seconds), depth modest (e.g. cutoff +/-20-30%), shapes sine/random-walk (smooth). Never sync to loop length except the breath layer.

**Randomised velocity/timing/timbre** [C]: +/-10-15% velocity, +/-10-30 ms timing, round-robin or two-three sample variants for plucked/bell notes, +/-5-10 cents detune per note.

### 5. Timbre and register

**What fatigues** [S where marked; mostly C]
- Evidence is thin and mostly about loudness/compression, not timbre per se. A Polish book chapter reports declining spectral-change detection after long loud exposure, with the hearing system tiring faster at high frequencies, though mental fatigue is a confound [S]. Loudness-war literature: heavily compressed (2-3 dB dynamic range) music associated with listener fatigue claims; evidence inconclusive; the guinea-pig study is animal and not directly applicable [S]. Hypothesised mechanism: lack of quiet gaps for neural recovery [S - hypothesis].
- Craft consensus [C]: high-frequency energy (>4 kHz), sharp transients, narrow resonant peaks (resonant filters, ringing modal peaks), and strong vocal formants are fatiguing or attention-capturing. Vocal-like formants attract speech-processing attention. Heavy compression & high loudness remove dynamic breathing room.
- For lyrics: Cheah et al. (2022) review of 95 articles found music with lyrics tends to be more detrimental than instrumental to memory and language tasks, esp. difficult tasks and introverts, and listeners often wrongly believe instrumental music is beneficial [S]. Overall background-music effect on cognition is small/inconsistent. Vocal-containing loops are harder to tolerate - in the sense of interference; direct data on *repeat tolerance* with voice is absent [gap].

**What survives repetition** [C, with lo-fi practitioner support S]
- Soft attacks; low-passed spectra; noise-bed content (hiss/air/wind - non-repeating by nature); slight detune and chorus; plucked/bell/marimba-like inharmonic tones with long decay (energy sits in few partials, decays so there's no sustain to fatigue); round-robin variation.
- Lo-fi production practice (producer guides; commercial sources; not controlled studies): low-pass filtering to remove harshness, tape saturation, pitch wobble, added vinyl/tape noise, tempos ~70-90 bpm [S, low evidential weight]. A UCSB dissertation abstract frames such music as a "sonic shield" at the edge of attention [S].
- Suggested numbers for our palette [C]: spectral rolloff 6-8 kHz (gentle 12 dB/oct), nothing above ~10 kHz except noise at low level; attack >= 10 ms for sustained and >= 3 ms for plucked with softened transient; peak-to-RMS > 12 dB (no limiter); target loudness around -24 to -18 LUFS short-term, quiet and controlled by user volume.

### 6. Prior art - techniques, not tracks

**Process music / minimalism** [S + C]. Reich's 1968 essay: a process should be audible as it unfolds and happen extremely gradually; early tape-loop pieces used two identical loops drifting out of phase [S]. Additive process: add or remove one unit at a time [C]. Slow harmonic rhythm: harmony fixed for minutes [C]. Techniques to borrow: *gradual* single-parameter change; clearly bounded process; phase drift as shimmer.

**Eno: ambient / generative** [S]
- Stated criterion: ambient music "must be as ignorable as it is interesting" (liner-note phrase), accommodating many levels of attention without enforcing one; he wanted to defuse the tense atmosphere of airports [S].
- Method (Music for Airports): short compatible fragments made into tape loops of different lengths (one source cites very long loops, 22 in total, but flags uncertainty); fragments drift and realign differently on each pass [S]. Discreet Music: two loops (63 s and 68 s) [S]. **Structure:** a set of fixed-pitch-content fragments + incommensurate loop lengths + a static key area = an effectively non-repeating surface from finite material.
- The critical design property: fragments are *compatible at any offset* (same pitch collection), widely spaced in time (long silences), and soft in attack.

**Game music for indefinite looping** [S + C]
- Animal Crossing's hourly system: one track per hour (and weather variants), each looping, with the hourly clock chime as a natural break; its field music is composed in a deliberately gentle style (instrumentation often piano/guitar; one analysis reports the aim of leaving space for the listener's imagination) [S - limited sourcing]. Technique: **long-timescale variety through *different loops* by time, each simple**, instead of one complex loop. For us: rotate between several simple loops across sessions or levels.
- Minecraft-style: sparse piano/ambient cues separated by long silences - non-looping; silence between cues is a feature of how it is experienced (no developer intent statement found) [S]. Technique: **silence as a variation resource** - letting the sound field rest resets the listener's learning.
- Stealth/adaptive: vertical layering, state-driven stems [S]. Technique: stems with independent gain curves.
- Exploration/ambient zones: static harmony, drones, sparse leitmotif-free textures [C].

**Lo-fi hip hop** [S low weight + C]: slow tempo (70-90 bpm), repetitive drum loop with soft hats and laid-back snare, a short sampled harmonic loop (jazz-type 7th/9th colours), tape/vinyl noise, low-passed top, light pitch wobble. Why it works as background: no vocals, no dynamic surprises, dark spectrum, repeated 2-8 bar cycle with small human-feel variations. Its weakness for us: a fixed 4-8 bar loop, fully rhythmic - suitable for long listening only because attention is elsewhere.

**Gamelan colotomy - the richest nested-cycle source** [S + C]
- Colotomy: time divided into nested cycles; each instrument marks a level of the hierarchy. The largest gong (gong ageng) ends the full cycle (the gongan) and signals repetition or a new section; the kenong subdivides it; kempul subdivides again; ketuk/kempyang give the finest pulse [S].
- Worked structure (lancaran): 16-beat gongan; gong once per 16 beats; kenong divides into 4 parts of 4; kempul halves those; ketuk halves again. Ketawang: a 32-beat cycle in which the gong sounds once, kenong splits into 2, etc. [S: Wikipedia-level description]. The strong beat (seleh) falls at the *end* of a gatra, so the structural gong is an arrival, not a downbeat [S].
- Design principles to transfer [S/C]: (i) **a hierarchy of sparse markers at integer ratios (e.g. 2:1 nesting) lets one core melody loop without feeling like a loop, because the listener's sense of 'where we are' is carried by markers, not by the melody**; (ii) the biggest marker is the *rarest and lowest*; (iii) the cycle ends with an arrival on the final note; (iv) a core melody (balungan) is elaborated by faster layers that are loosely related and improvised (elaboration is different each time) [C - general knowledge]; (v) grouping in 4s at every level, with exceptions. For the app: the breath = the lowest-level 'kenong'; a 4-breath or 8-breath group = the 'gong'; ornaments = the elaborating layers. A tempo can slow (irama) while the core stays fixed [C].
- Caution: this is a technique description of the structure; we do not borrow any particular gendhing, pitch tuning or melody.

**Japanese court music (gagaku)** [S]
- Jo-ha-kyu: slow introduction -> build-up -> fast conclusion, applied from the programme to a single note; the change is a constant, extremely gradual acceleration [S]. Netori is a free-rhythm mode-setting prelude [S]. The three percussion instruments synchronise at a recurring point (obachi) that doubles as a reference for timbre changes; fewer sync points at slower phrases = slower rate of timbral change [S].
- Techniques to borrow: **free-rhythm opening to establish a mode/drone** (netori-like), **a rare, regular synchronisation point where independent cycles align and timbre shifts**, and the **jo-ha-kyu arc** (slow -> faster) across a session. For breathing, the reverse arc (gradual slow-down) is more relevant (jo-ha-kyu in reverse is a deceleration) [C].
- Other cyclic traditions worth noting (from general knowledge, not searched here) [C]: Indian tala/laya cycles with a clear sam; West African timeline/bell patterns with interlocking parts; Balinese interlocking (kotekan) and cyclic gong; Steve Reich's own interest in these. Not researched further.

### 7. Listener data

- **Scarratt et al. (2023, PLoS ONE)** analysed ~225,626 tracks from Spotify sleep playlists: sleep music was softer, slower, more often instrumental and acoustic than music in general; study and sleep playlists were very similar in features (slow tempo, repetitive, low energy/loudness, often lo-fi, ambient, classical, some pop) [S]. These are descriptive; no evidence the music causes focus or sleep. A related preprint reports sleep music with reduced melodic variance and higher repetition [S, less established].
- The Spotify audio-features are proprietary and unvalidated for these purposes [S].
- Repeat-listening and attention length: **I did not find reliable public statistics** on the typical length of attention or what is put on repeat in functional playlists. Streaming skip-rate analyses exist for songs (and suggest strong early skipping), but I did not retrieve them; treat as a gap.
- Background-music experiments (Cheah et al.) show small, inconsistent effects on cognition; harm concentrated in verbal tasks and with lyrics [S].
- **Implication:** functional listeners choose music of low energy, low vocals, slow tempo, high repetition - the same properties as our rules - which suggests those properties are tolerated for long stretches (hours), though it does not isolate *why*.

### 8. Valence/arousal basis

**Models** [S + C]. Russell's circumplex: valence (pleasant-unpleasant) x arousal (activated-deactivated); Thayer's model: energy x tension (energetic/tense axes), commonly mapped onto the same plane (Thayer's calm-energy / calm-tiredness / tense-energy / tense-tiredness). Warriner et al. (2013) norms give valence/arousal/dominance for ~14k English words (relevant if we ever label states with words; not music-specific) [C - not searched]. Distinguish **perceived/expressed** emotion (listener rates what the music sounds like - reliable, well-studied) from **felt** emotion (differs; Gabrielsson; Schubert 2013 found felt ratings are often equal or lower than perceived) and from physiological effects (not claimed here) [S].

**Consensus and strength** [S]
- Arousal: tempo, loudness (dominant in continuous-response study, Schubert 2004), brightness, articulation: **strong, stable consensus.** Valence: mode and harmonic consonance most commonly cited; **weaker and more variable**; spectral centroid did not give consistent predictions in one study [S].
- Eerola, Friberg & Bresin (2013): synthesized factorial manipulation of six cues (mode, tempo, dynamics, articulation, timbre, register) across four music examples, 200 stimuli rated on happy/sad/peaceful/scary; **cue effects mostly linear (77-89% variance), nearly no cue interactions - i.e. approximately additive** [S]. That justifies a table of independent parameter effects. (I couldn't retrieve per-cue weights.)
- Spotify features: Vidas et al. (2026, *Music Perception*, N=244, 40 excerpts of 20-30 s): Spotify energy correlated strongly with listener-rated energy, valence moderately with perceived mood, danceability weakly [S]. A Columbia poster found no detected effect of Spotify parameters on *felt* valence [S, preliminary]. Panda et al. (2021): energy, valence, acousticness relevant to Russell-quadrant classification but the 12-feature set underperforms state-of-the-art audio features (F1 58.5% vs 74.7%) [S]. In a 2023 study, energy was by far the strongest predictor of arousal [S]. **Takeaway:** use energy as a rough arousal proxy; treat "valence" as a noisy proxy and don't rely on it for design.

(Parameter table is in section (c).)

### 9. Breathing-specific

**Pacing design** [S]
- Resonance-frequency breathing: ~4.5-7 breaths/min, average optimum ~6/min; typical ratios 50/50 or 40/60 (longer exhale) [S, Jamk MUS&TE]. Tempo-breath equivalence: breaths/min = bpm when one beat = one breath (45-70 bpm for 4.5-7 /min) [S]; alternative is 1 breath = 2/4 beats etc.
- Cues: most compositions use arpeggiated chords or ascending/descending scales (up = inhale, down = exhale) [S]; trial protocol used tonal cues rising in pitch on inhale, falling on exhale [S]; patents describe number-of-notes countdown and cue spacing at fixed intervals, e.g. a 5.9 s breath period, which is about 10.2 breaths/min [S/calc].
- Mus&TE guidance: ~10 min songs; **loopable**; continuous breathing (no pause between phases); phases distinguishable "from the music alone"; this is crucial for 40/60; add 3-4 cycles of an actual breath sound at the start (most-requested feature in piloting); quiet beginning, build-up, quiet end; strike a balance between boring (elevator) and distracting; most listeners prefer acoustic instruments; time-stretching: speeding up is easier than slowing; stretch tracks separately [S].
- Biofeedback variant: tempo follows detected breath, slows gradually, supporting entrainment (Catch Your Breath, NIME 2009) [S]. Caution: a trial protocol deliberately omitted rhythmic cues from its control arm to avoid inducing entrainment - so rhythm *is* an entrainment mechanism [S].

**Envelope vs. event for the turnaround** [S + C - synthesis]
- Evidence: the cue conventions (pitch/note-count rising and falling) are envelope-based; the Jamk requirement that the inhale/exhale be identifiable from the music alone favours a continuous contour. An event marker has no direct evidence either way [gap].
- My recommendation [C]: **envelope primary; event secondary and optional.** Reasons: (1) a continuous contour makes the user's body follow a *ramp* rather than react to a *trigger*; (2) an identical event every 10 s is the most loop-salient element in the mix and can become the thing that irritates; (3) at the exhale-to-inhale turn (the bottom), a soft event is more helpful because the envelope there is least informative (low energy, flat). So: at the top, let the envelope peak/decay carry it; at the bottom, a very soft low swell or a sub-threshold marker; both with varied timbre/velocity.
- **Filtered noise as breath analogue** [C]: band-pass centre sweeping up (~300 -> 1500 Hz or similar) with gain swell on inhale, reverse on exhale; peaks at turnaround with a ~100-300 ms hold for audibility; for 40/60 the up-sweep is shorter than the down. **Drones:** a sustained drone can carry a 'filter opens/closes' breath without pitch cues; pitch is added by a slow 3-5 note arpeggio. Audibility of the turnaround: the cue is easiest to follow if the turning point has an obvious acoustic change of direction (derivative sign change) and a brief plateau; asymmetric ramps (slow rise to a soft peak, longer fall) match physiology [C].
- Also: at 6 breaths/min the breath period is 10 s; with a 4-8 breath loop, loop length = 40-80 s, which lands in the user's requested 30-90 s window and gives integer alignment with the breath grid [calc].

---

## (c) PARAMETER TABLE - perceived arousal and valence

All effects are on PERCEIVED/described emotion (what the music sounds like), not on listener physiology. Direction given for an *increase* of the parameter. Strength: **A** = strong, replicated consensus; **B** = moderate/consistent; **C** = weak, context-dependent or craft-only.

| Parameter (increase) | Perceived arousal | Perceived valence | Consensus | Notes for our loops |
|---|---|---|---|---|
| Tempo / event rate | Up (strong) | Slight up (fast+major = happy; fast+minor = anger/tension) | Arousal A; valence C | For calm: low event density; pulse ~45-70 bpm if beat is breath |
| Loudness / dynamics | Up (strong; dominant in continuous studies) | Slight up/mixed | Arousal A; valence C | Keep quiet; avoid loud spikes |
| Mode: major vs minor | Little | Major -> more positive; minor -> more negative | Valence A (within Western listeners), arousal C | Use modal/ambiguous; Lydian-Dorian are "bright vs dark" modes (craft) |
| Harmonic consonance vs dissonance | Dissonance up | Dissonance down | B | Prefer open, consonant; sus/add9 clusters |
| Timbral brightness (spectral centroid, high-frequency content) | Up | Mixed: moderate brightness raises positive; harsh bright lowers | Arousal B; valence C (spectral centroid not consistent in one study) | Low-pass for calm |
| Articulation: staccato vs legato | Staccato up | Staccato slightly up (happy); legato -> calm/sad | Arousal B; valence C-B | Soft attacks, legato |
| Attack time (sharper) | Up | Down for very sharp | B (craft) | Soft attacks |
| Pitch register (higher) | Up | Up (higher = happier, lower = sadder/serious) | B | Mid-low for calm; bells in mid-high sparingly |
| Rhythmic regularity / predictability | Regular -> lower; irregular -> higher | Regular -> neutral/positive; irregular -> negative or tension | B | Regular breath layer, irregular ornaments |
| Pitch range / melodic leap size | Larger up | Mixed | C | Small intervals |
| Vibrato/tremolo | Slight up | Mixed | C | Slight, slow |
| Reverb/space (larger) | Down (calm/distant) | Slightly up or neutral | C (craft) | Moderate-large reverb |
| Density / number of simultaneous layers | Up | Mixed | B | Few layers |
| Spotify-style "energy" | Up (strong correlation, r high) | n/a | A (arousal) | Use as rough proxy |
| Spotify-style "valence" | Weak | Moderate correlation with perceived valence | B-C | Don't rely |
| Spotify "danceability" | Little | Little | Weak agreement with human ratings | Ignore |
| Acousticness | Down (calmer) | Mixed | C-B | Acoustic/plucked timbres |

Cue combination is approximately additive (Eerola et al. 2013), so you can set parameters nearly independently. The model for calm-positive (low arousal, mild-positive valence): slow event rate, soft dynamics, legato/soft attack, dark-to-mid brightness, consonant, mode ambiguous-bright (Lydian/Ionian-ish) or neutral-open, mid register, regular pulse. For calm-sad/low: darker mode (Aeolian/Dorian), lower register, slower still. For alert-but-not-anxious: raise rate, brightness, register; keep consonance.

---

## (d) HOW THE COPYRIGHT CONSTRAINT WAS OBSERVED

The brief asked for structural properties only. I did not reproduce, transcribe or describe the notes, chords, rhythms, drum patterns or basslines of any specific copyrighted piece. Named works (Eno's loop albums, Reich's phasing pieces, Animal Crossing, Minecraft, gamelan/gagaku repertoire) appear only as illustrations of a technique (loop-length incommensurability, phase process, per-hour loops, silence as resource, nested colotomic cycles, jo-ha-kyu). The only note-like content quoted is the generic colotomic pattern of lancaran/ketawang forms, which are traditional, anonymous structural templates describing which instruments sound at which beat - not a melody or a copyrighted composition - and I have restated them as ratios (gong 1 per 16 beats, kenong in 4s, etc.). No notation or tab was written. Where a source described a particular track, I kept the technique and dropped the track.

---

## (e) REFERENCES

Loop mechanics / middleware
- Loopsmith (tail-overlap tool description, vendor): https://austinhaynes.itch.io/loopsmith
- Game-audio loop and reverb-pop forum threads: https://gamedev.net/forums/topic/654979-looping-a-sound-with-reverb-causes-a-34pop34-at-loop/5143108/ ; https://vi-control.net/community/threads/seamless-looping-game-audio-cubase-cant-do-it-video.172493/ ; https://www.moddb.com/tutorials/making-a-loop-loop-better
- Audiokinetic community Q&A (loop pre-entry/post-exit): https://www.audiokinetic.com/qa/6608/music-playlist-doesnt-loop-well ; https://audiokinetic.com/qa/1332/problem-using-music-playlist-container-to-loop-music ; Wwise loop tutorial https://edu.maximegoulet.com/?p=995 ; https://edu.maximegoulet.com/?p=1040
- Audiokinetic blog, interactive music: https://www.audiokinetic.com/en/blog/how-to-use-interactive-music-to-score-gameplay/
- Hybrid horizontal/vertical structure (GDC 2021 summary): https://www.gamedeveloper.com/game-platforms/hybrid-horizontal-vertical-structure-for-game-music-composers-from-spyder-to-sackboy-gdc-2021-
- Game-music loop/cadence analyses: https://gamemusicanalysisclub.substack.com/p/5-stage-1-gradius-arcade-1985 ; https://www.player2.net.au/2026/07/cadence-music-as-puzzles/
- Gold Fire Studios, adaptive music: https://cms.goldfirestudios.com/the-sound-of-arctic-awakening-adaptive-music-in-video-games

Psychology of repetition
- Szpunar, Schellenberg & Pliner (2004): https://sites.utm.utoronto.ca/sites/sites.utm.utoronto.ca.glenn_website/files/download/Szpunar.pdf
- Schellenberg, Peretz & Vieillard (2008): https://sites.utm.utoronto.ca/sites/sites.utm.utoronto.ca.glenn_website/files/download/SP&V2008.pdf
- Hunter & Schellenberg (2011): https://sites.utm.utoronto.ca/sites/sites.utm.utoronto.ca.glenn_website/files/download/HunterSchellenberg2011.pdf
- Familiarity vs complexity (2017): https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2017.00147/pdf ; https://journals.sagepub.com/doi/10.1177/0276237417732683
- Margulis 2013 perspective: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00167/pdf ; 2015 speech-to-song: https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00048/pdf ; Aeon essay: https://aeon.co/essays/why-repetition-can-turn-almost-anything-into-music ; random tone sequences: https://sonicfield.org/library/repetition-enhances-the-musicality-of-randomly-generated-tone-sequences ; 2024 memory: https://sonicfield.org/library/rapid-learning-and-long-term-memory-in-the-speech-to-song-illusion
- Jakubowski earworms (press summaries of the 2017 paper): https://gold.ac.uk/news/scientists-find-key-to-writing-catchy-pop-hits ; https://www.newswise.com/articles/psychologists-identify-key-characteristics-of-earworms
- Agus et al. repetition in noise: https://www.sciencedaily.com/releases/2010/06/100601072644.htm ; https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2016.00009/pdf ; https://pure.qub.ac.uk/en/publications/repetition-detection-and-rapid-auditory-learning-for-stochastic-tone-clouds/

Prior art
- Eno, Music for Airports / Discreet Music loop lengths: https://reverbmachine.com/blog/deconstructing-brian-eno-music-for-airports/ ; https://makingmusic.ableton.com/asynchronous-or-polyrhythmic-loops ; https://www.synthtopia.com/content/2003/12/15/brian-eno-ambient-1-music-for-airports/
- Reich / process music: https://en.wikipedia.org/wiki/Process_music
- Colotomy: https://en.wikipedia.org/wiki/Colotomy
- Gagaku (Stanford): https://gagaku.stanford.edu/en/theory/form ; Osaka Univ. jo-ha-kyu paper: https://ir.library.osaka-u.ac.jp/repo/ouka/all/100497/ghre1_092.pdf
- Animal Crossing: https://nookipedia.com/wiki/Kenta_Nagata ; https://societymusictheory.org/node/1162
- Lo-fi: https://escholarship.org/uc/item/9w27s169 ; https://ampedstudio.com/blog/what-is-lofi-music/

Timbre/fatigue/background music
- Loudness and listening fatigue: https://www.intechopen.com/chapters/53140 ; https://repository.uwl.ac.uk/id/eprint/2068/ ; https://cdm.link/from-the-trenches-of-the-loudness-wars-a-broad-survey-of-research/
- Cheah et al. (2022) background music review: https://livrepository.liverpool.ac.uk/3166444/
- Scarratt et al. (2023) sleep/study playlists: https://pmc.ncbi.nlm.nih.gov/articles/PMC9847986 ; https://health.au.dk/en/display/artikel/spotify-studie-musik-til-fokus-og-soevn-har-store-ligheder

Emotion
- Schubert (2013) felt vs expressed: https://pmc.ncbi.nlm.nih.gov/articles/PMC3865445/
- Eerola, Friberg & Bresin (2013): https://pmc.ncbi.nlm.nih.gov/articles/PMC3726864
- Spotify features validity: https://labs.sonicfield.org/library/validating-spotifys-valence-energy-and-danceability-audio-features-for-music-psy ; https://eden.dei.uc.pt/~ruipedro/publications/Conferences/SMC_2021_Panda.pdf ; https://arxiv.org/pdf/2302.13321 ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9522267/
- Survey of multimodal MER: https://arxiv.org/pdf/2504.18799

Breathing
- Jamk MUS&TE recommendations for composers (CC BY-SA 4.0): https://oppimateriaalit.jamk.fi/en/muste/welcome-to-the-muste-project/breathing-music/recommendations-for-composers/
- Musically-guided paced breathing trial: https://clinicaltrials.gov/study/NCT06988800
- Patents on breath cue timing: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7255672
- Catch Your Breath (NIME 2009): https://nime.org/proc/nime2009_siwiak/

## Gaps and cautions
- Several claims in sections 4-5 and 9 are [C] craft synthesis; there is no controlled evidence for specific numbers (crossfade lengths, rolloff frequency, gate probabilities, 5-10 min unrecognisable threshold). Treat as starting values to test.
- Official FMOD/Wwise docs and Margulis' book were not retrieved; no streaming-scale repeat/skip statistics found; Warriner norms and non-gagaku/gamelan cyclic traditions were not searched.
