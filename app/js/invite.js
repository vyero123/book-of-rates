/* The Book of Rates — AN AFFORDANCE THAT TEACHES THE PROTOCOL.
 *
 * THE RULE, stated once here because every interactive chapter wants it
 * and none of them should re-invent it:
 *
 *   The thing that invites a press only invites it WHEN PRESSING IS
 *   CORRECT, and goes quiet otherwise.
 *
 * That makes the affordance itself the teacher. A reader who presses
 * whenever the figure is pulsing has, without being told anything,
 * pressed on the inhale — because the pulse was only ever there on the
 * inhale. No legend, no tutorial, no text that has to be read once and
 * then gets in the way for ever.
 *
 * AND IT IS AN INVITATION, NOT AN INSTRUCTION. This is the standing
 * "recommended, not required" principle applied to the affordance
 * layer: the pulse must never imply obligation, so
 *
 *   - it changes nothing but appearance. Nothing here touches the
 *     breath, the schedule, the scene state or the protocol. Ignore it
 *     entirely and the chapter is exactly the chapter.
 *   - it never scolds. There is no "you missed one" state, because
 *     there is no missing: an invitation declined is just an invitation
 *     declined.
 *   - IT STOPS. Once the reader has shown they have understood — they
 *     pressed while it was asking, `cycles` times — it goes away and
 *     does not come back for the session. A prompt that keeps prompting
 *     someone who already knows is nagging, and nagging is a mild form
 *     of requiring.
 *
 * THE VIBRATION IS VISUAL. An earlier plan had a haptic alongside the
 * signage. Haptics are out: the shimmer IS the vibration, it works
 * identically on every device, and it is visible in a photograph, a
 * screenshot and a recording, which the project's whole verification
 * route depends on.
 *
 * WHAT IT PRODUCES, every frame, as three scalars a chapter can paint
 * with however it likes:
 *
 *   invite  0..1, oscillating, non-zero only while input is wanted and
 *           has not yet been understood. The shimmer.
 *   held    0..1, eased, how much the reader is pressing right now.
 *   after   0..1, set to 1 the moment a press ENDS and decaying from
 *           there. The release is a thing in its own right, not the
 *           absence of a press, and a chapter that wants a release
 *           gesture needs a scalar that only exists then.
 *
 * It owns no colour, no geometry and no DOM. What a chapter does with
 * the three numbers is the chapter's own idiom.
 */

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;

/**
 * @param {object} o
 * @param {number} o.cycles  how many understood presses before it stops
 *                           asking. Two: one could be an accident.
 * @param {number} o.rate    shimmer frequency, Hz. Slow enough to read
 *                           as breathing rather than as an alarm.
 * @param {number} o.rise    how fast the shimmer fades in and out, per
 *                           second. The invitation should arrive and
 *                           leave softly or it is itself a flash.
 * @param {number} o.grip    how fast `held` follows the press.
 * @param {number} o.fade    how fast `after` decays, per second.
 * @param {number} o.minHold seconds of press that count as "understood".
 *                           A brush of the glass is not comprehension.
 */
export function invite({ cycles = 2, rate = 0.55, rise = 2.6,
                         grip = 7.0, fade = 0.85, minHold = 0.35 } = {}){
  let amp = 0, osc = 0, held = 0, after = 0;
  let understood = 0, learned = false;
  let wasTaken = false, heldFor = 0, countedThis = false;

  const api = {
    /**
     * @param {number} dt
     * @param {object} s
     * @param {boolean} s.wanted  is input the right thing to do now?
     * @param {boolean} s.taken   is the reader giving it?
     * @returns {{invite:number, held:number, after:number, learned:boolean, asking:boolean}}
     */
    step(dt, { wanted = false, taken = false } = {}){
      // --- did they understand? Only a press that happens while the
      //     invitation is out counts. A press at the wrong moment is
      //     not a wrong answer, it just is not an answer to THIS.
      if(taken){
        heldFor += dt;
        if(wanted && !countedThis && heldFor >= minHold){
          countedThis = true;
          if(++understood >= cycles) learned = true;
        }
      } else {
        if(wasTaken) after = 1;          // the falling edge, and only it
        heldFor = 0; countedThis = false;
      }
      wasTaken = taken;

      // --- the shimmer. Present only when a press is wanted, not
      //     already happening, and not already understood.
      const asking = wanted && !taken && !learned;
      amp += ((asking ? 1 : 0) - amp) * Math.min(1, dt * rise);
      osc += dt * rate * Math.PI * 2;
      if(osc > Math.PI * 2) osc -= Math.PI * 2;

      held  += ((taken ? 1 : 0) - held) * Math.min(1, dt * grip);
      after  = Math.max(0, after - dt * fade);

      return {
        // 0..1: a raised cosine, so it leaves and returns to rest
        // rather than sitting at a mid value when amp is small
        invite: clamp01(amp * (0.5 - 0.5 * Math.cos(osc))),
        held: clamp01(held),
        after: clamp01(after),
        learned, asking
      };
    },

    /** The reader has clearly understood — stop asking. For a chapter
     *  that can tell by other means (they lit a lantern, they flew a
     *  gate) and does not want to wait for the count. */
    teach(){ learned = true; },

    /** A new session is a new reader as far as this is concerned. */
    reset(){ amp = 0; held = 0; after = 0; understood = 0; learned = false;
             wasTaken = false; heldFor = 0; countedThis = false; },

    get learned(){ return learned; },
    get understood(){ return understood; }
  };
  return api;
}
