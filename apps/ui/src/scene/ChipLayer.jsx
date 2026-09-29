// DOM status chips over each plush (drei is not approved): world anchors are projected to screen
// every frame and written straight to each button's style, so React does not re-render per frame.
import { useEffect, useRef } from "react";
import { chipModel, stackChips } from "./chip-model.mjs";
import { BOARD_ARIA_LABEL, BOARD_LABEL } from "./board-face.mjs";

export const BOARD_CHIP_ID = "__board";

// `hearts` is a Set of cell refs that just received a handoff (showcase-v1/04): a heart bubble shows.
export function ChipLayer({ cells, tickets, selected, onSelect, stage, hearts, onOpenBoard }) {
  const nodes = useRef(new Map());
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const { camera, size } = stage;
      if (camera && size) {
        const pts = [];
        for (const [ref] of nodes.current) {
          const a = stage.anchors.get(ref);
          if (!a) continue;
          const v = a.clone().project(camera);
          pts.push({ ref, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height });
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
      {onOpenBoard ? (
        <button
          type="button"
          ref={(el) => (el ? nodes.current.set(BOARD_CHIP_ID, el) : nodes.current.delete(BOARD_CHIP_ID))}
          className="chip chip-idle chip-board"
          aria-label={BOARD_ARIA_LABEL}
          style={{ visibility: "hidden" }}
          onClick={onOpenBoard}
        >
          {BOARD_LABEL}
        </button>
      ) : null}
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
