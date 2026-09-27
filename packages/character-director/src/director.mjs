// The character director (ADR 0007, spec.md "Character director"): a pure module, no renderer
// dependency. It takes cell-state changes (and, later, handoff events, perch anchors and time) and
// answers `tick(cellId, now)` with a clip name, a face frame and a cross-fade hint. State→clip
// names come from the panda asset contract (apps/ui/src/assets/panda-contract.mjs) so the two
// stay in lockstep.

export const STATES = [
  "idle", "working", "waiting_on_user", "blocked",
  "done", "failed", "throttled", "terminated",
];

// Design system motion tokens (project/tokens.json in the design system artifact).
export const DUR_FAST = 0.16;
export const DUR_HEARTBEAT = 1.2;

const BLINK_DURATION = 0.12;

// Each state maps to a looping clip, an entry one-shot, a face frame and a held pose for reduced
// motion (spec.md, "State → clip map"). Every clip named here must exist in the asset contract's
// CLIPS list (enforced by director.test.mjs, not re-imported here to keep this module dependency-free).
export const STATE_MAP = {
  idle: { loop: "sit_still", enter: "blink", face: "half_lidded", heldPose: "sit_still", enterDuration: 0.5 },
  working: { loop: "breathe", enter: "breathe", face: "focused_squint", heldPose: "breathe", enterDuration: 0 },
  waiting_on_user: { loop: "paw_raise", enter: "paw_raise", face: "wide_eyes", heldPose: "paw_raise", enterDuration: 0 },
  blocked: { loop: "arms_folded", enter: "arms_folded", face: "narrowed", heldPose: "arms_folded", enterDuration: 0 },
  done: { loop: "lean_back", enter: "lean_back", face: "content_squint", heldPose: "lean_back", enterDuration: 0 },
  failed: { loop: "slump", enter: "slump", face: "sour_pucker", heldPose: "slump", enterDuration: 0 },
  throttled: { loop: "doze", enter: "doze", face: "sleepy", heldPose: "doze", enterDuration: 0 },
  terminated: { loop: "wave", enter: "wave", face: "eyes_shut_savoring", heldPose: "wave", enterDuration: 0 },
};

const DEFAULT_STATE = "idle";

function newCell(state, now) {
  return { state, since: now, nextBlinkAt: undefined };
}

/**
 * Creates a character director. `reducedMotion` and `random` (an injectable RNG, for
 * deterministic tests of the calm rule) are the only options; everything else arrives through
 * `setState`/`tick`.
 */
export function createCharacterDirector({ reducedMotion = false, random = Math.random } = {}) {
  const cells = new Map();

  function cellOf(cellId, now) {
    let cell = cells.get(cellId);
    if (!cell) {
      cell = newCell(DEFAULT_STATE, now);
      cells.set(cellId, cell);
    }
    return cell;
  }

  return {
    setReducedMotion(value) {
      reducedMotion = value;
    },

    /** Pushes a cell-state-changed event. Interrupts immediately, even mid one-shot or mid loop. */
    setState(cellId, state, now) {
      if (!STATE_MAP[state]) throw new Error(`unknown state "${state}"`);
      cells.set(cellId, newCell(state, now));
    },

    /** Samples the clip, face frame and cross-fade hint for `cellId` at time `now` (seconds). */
    tick(cellId, now) {
      const cell = cellOf(cellId, now);
      const mapping = STATE_MAP[cell.state];
      const sinceChange = now - cell.since;
      const crossFade = sinceChange < DUR_FAST ? DUR_FAST : 0;

      if (reducedMotion) {
        return { clip: mapping.heldPose, loop: false, face: mapping.face, crossFade: 0 };
      }

      const entering = sinceChange < mapping.enterDuration;
      const clip = entering ? mapping.enter : mapping.loop;

      // The calm rule: blinks are spaced no closer than dur-heartbeat, scheduled independently of
      // the body clip since the face is a separate texture-atlas channel (spec.md, "Faces").
      if (cell.nextBlinkAt === undefined) {
        cell.nextBlinkAt = now + DUR_HEARTBEAT + random() * DUR_HEARTBEAT;
      }
      let face = mapping.face;
      if (now >= cell.nextBlinkAt) {
        if (now < cell.nextBlinkAt + BLINK_DURATION) {
          face = "blink";
        } else {
          cell.nextBlinkAt = now + DUR_HEARTBEAT + random() * DUR_HEARTBEAT;
        }
      }

      return { clip, loop: !entering, face, crossFade };
    },
  };
}
