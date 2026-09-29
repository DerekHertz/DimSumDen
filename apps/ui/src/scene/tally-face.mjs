// showcase-v1/03: the face of Tally in the grove. Pure view-model over dashboardModel: three
// small charts with short chalk titles and a layout in face fractions (0..1, y down). The renderer
// (TallyFace.jsx) only draws it. On the face, incidents read as "spills"; the panel keeps its wording.
export const TALLY_LABEL = "Tally";
export const TALLY_ARIA_LABEL = "Tally: open the dashboard";

const SHORT_TITLE = { throughput: "Resolved", tokens: "Tokens", incidents: "Spills" };
const VERTICAL_BARS = 8;
const HORIZONTAL_BARS = 4;

const TITLE_RECT = { x: 0.04, y: 0.04, w: 0.92, h: 0.16 };
const PANEL = { y: 0.24, h: 0.72, w: 0.29, gap: 0.03, x0: 0.04 };

export function tallyFace(model) {
  return {
    title: TALLY_LABEL,
    titleRect: TITLE_RECT,
    charts: model.charts.map((chart, i) => ({
      id: chart.id,
      title: SHORT_TITLE[chart.id] ?? chart.title,
      orientation: chart.orientation,
      empty: chart.empty,
      emptyText: chart.emptyText,
      bars: (chart.orientation === "vertical" ? chart.bars.slice(-VERTICAL_BARS) : chart.bars.slice(0, HORIZONTAL_BARS)).map((b) => ({
        label: b.label,
        valueText: b.valueText,
        fraction: b.fraction,
      })),
      rect: { x: PANEL.x0 + i * (PANEL.w + PANEL.gap), y: PANEL.y, w: PANEL.w, h: PANEL.h },
    })),
  };
}
