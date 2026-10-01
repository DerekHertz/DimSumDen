// DOM status chips over each plush (drei is not approved): world anchors are projected to screen
// every frame and written straight to each button's style, so React does not re-render per frame.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { chipModel, stackChips } from "./chip-model.mjs";
import { TALLY_ARIA_LABEL, TALLY_CARD_ID, TALLY_LABEL } from "./tally-face.mjs";
import { stationLabels } from "./station-labels.mjs";
import { stationOf, tallyAnchor } from "./banquet-layout.mjs";
import { ROAMER_TYPES } from "./roam.mjs";

export const TALLY_CHIP_ID = "__tally";

// `hearts` is a Set of cell refs that just received a handoff (showcase-v1/04): a heart bubble shows.
export function ChipLayer({ cells, tickets, selected, onSelect, stage, hearts, onToggleTally, tallyOpen = false, tally }) {
  const nodes = useRef(new Map());
  // Station labels (showcase-v1/05): plain text on a rice-paper pill, placed over each stall roof.
  const labelNodes = useRef(new Map());
  const labels = useMemo(() => {
    const counts = {};
    for (const c of cells) counts[stationOf(c.cellType)] = (counts[stationOf(c.cellType)] ?? 0) + 1;
    for (const type of ROAMER_TYPES) {
      if (cells.some((c) => c.cellType === type)) continue;
      const station = stationOf(type);
      counts[station] = (counts[station] ?? 0) + 1;
    }
    return stationLabels(counts);
  }, [cells]);
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const { camera } = stage;
      // The orthographic frustum is sized in the rig's frame; project with the viewport it was built from, so a
      // resize never pairs the new size with the old camera (the rig stamps it on the camera).
      const size = camera?.userData.viewport ?? stage.size;
      if (camera && size) {
        // The camera moves in useFrame, before render; refresh its matrices so chips never lag it.
        camera.updateMatrixWorld();
        const pts = [];
        for (const [ref] of nodes.current) {
          // Tally hangs from a pure world point, not a registry entry that could go stale.
          const a = ref === TALLY_CHIP_ID ? tallyAnchor() : stage.anchors.get(ref);
          if (!a) continue;
          const v = (a.isVector3 ? a.clone() : new THREE.Vector3(a.x, a.y, a.z)).project(camera);
          pts.push({ ref, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height });
        }
        for (const l of labelsRef.current) {
          const el = labelNodes.current.get(l.id);
          if (!el) continue;
          const v = new THREE.Vector3(l.x, l.y, l.z).project(camera);
          el.style.left = `${((v.x + 1) / 2) * size.width}px`;
          el.style.top = `${((1 - v.y) / 2) * size.height}px`;
          el.style.visibility = "visible";
        }
        const placed = stackChips(pts);
        for (const [ref, p] of placed) {
          const el = nodes.current.get(ref);
          el.style.left = `${p.x}px`;
          el.style.top = `${p.y}px`;
          el.style.visibility = "visible";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const titles = new Map((tickets ?? []).map((t) => [t.ref, t.title]));
  return (
    <div className="chip-layer">
      {labels.map((l) => (
        <span
          key={l.id}
          ref={(el) => (el ? labelNodes.current.set(l.id, el) : labelNodes.current.delete(l.id))}
          className="station-label"
          style={{ visibility: "hidden" }}
        >
          {l.text}
        </span>
      ))}
      {onToggleTally ? (
        <button
          type="button"
          ref={(el) => (el ? nodes.current.set(TALLY_CHIP_ID, el) : nodes.current.delete(TALLY_CHIP_ID))}
          className="chip chip-idle chip-tally"
          aria-label={TALLY_ARIA_LABEL}
          aria-haspopup="dialog"
          aria-expanded={tallyOpen}
          aria-controls={tallyOpen ? TALLY_CARD_ID : undefined} /* the card exists only while open; a dangling aria-controls is an axe finding (07) */
          style={{ visibility: "hidden" }}
          onClick={onToggleTally}
        >
          {TALLY_LABEL}
        </button>
      ) : null}
      {/* Visually hidden meters for the two usage rods. While the card is open its rows are the meters. */}
      {tally && !tallyOpen
        ? tally.rods.filter((r) => r.kind === "usage").map((r) => (
            <span
              key={r.id}
              className="visually-hidden"
              role="meter"
              aria-label={r.ariaLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={r.valueNow ?? undefined}
            />
          ))
        : null}
      {cells.map((c) => {
        const chip = chipModel(c, titles.get(c.ref));
        return (
          <button
            key={c.ref}
            type="button"
            ref={(el) => (el ? nodes.current.set(c.ref, el) : nodes.current.delete(c.ref))}
            className={`chip chip-${chip.tone}`}
            data-ref={c.ref}
            aria-label={chip.ariaLabel}
            aria-pressed={selected === c.ref}
            style={{ visibility: "hidden" }}
            onClick={() => onSelect(c.ref)}
          >
            <span className="chip-glyph" aria-hidden="true" />
            {chip.label}
            {hearts?.has(c.ref) ? (
              <svg className="chip-heart" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.9 1.2 5.3 3.1 1.4-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.500 16.400 12 21 12 21z" />
              </svg>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
