// DOM status chips over each plush (drei is not approved): world anchors are projected to screen
// every frame and written straight to each button's style, so React does not re-render per frame.
import { useEffect, useRef } from "react";
import { chipModel, stackChips } from "./chip-model.mjs";

export function ChipLayer({ cells, tickets, selected, onSelect, stage }) {
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
          </button>
        );
      })}
    </div>
  );
}
