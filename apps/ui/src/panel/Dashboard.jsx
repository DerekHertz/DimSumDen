// Dashboard section (dimsumden-ui-v0/11): inline-SVG bar charts drawn from dashboard-model.mjs.
// One series colour (qi); categories sit on the axis. Each svg has title, desc and a hidden table.
import { useCallback, useEffect, useState } from "react";
import { dashboardModel } from "./dashboard-model.mjs";

const W = 408;
const H = 140;

function VerticalBars({ bars }) {
  const top = 16;
  const bottom = 30;
  const slot = W / bars.length;
  const bw = Math.min(28, slot * 0.6);
  const plotH = H - top - bottom;
  return (
    <>
      <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} className="chart-grid" />
      {bars.map((b, i) => {
        const h = b.fraction * plotH;
        const cx = slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={H - bottom - h} width={bw} height={h} className="chart-bar" />
            <text x={cx} y={H - bottom - h - 3} textAnchor="middle" className="chart-value">{b.valueText}</text>
            <text x={cx} y={H - 16} textAnchor="middle" className="chart-axis">{b.label.slice(4, 6)}</text>
            <text x={cx} y={H - 5} textAnchor="middle" className="chart-axis">{b.label.slice(7)}</text>
          </g>
        );
      })}
    </>
  );
}

function HorizontalBars({ bars }) {
  const labelW = 96;
  const valueW = 44;
  const plotW = W - labelW - valueW;
  const rowH = Math.min(28, H / bars.length);
  return (
    <>
      <line x1={labelW} x2={labelW} y1="0" y2={H} className="chart-grid" />
      {bars.map((b, i) => {
        const y = i * rowH;
        const w = b.fraction * plotW;
        return (
          <g key={b.label}>
            <text x={labelW - 6} y={y + rowH / 2 + 4} textAnchor="end" className="chart-axis">{b.label}</text>
            <rect x={labelW} y={y + 3} width={w} height={rowH - 6} className="chart-bar" />
            <text x={labelW + w + 4} y={y + rowH / 2 + 4} className="chart-value">{b.valueText}</text>
          </g>
        );
      })}
    </>
  );
}

function Chart({ chart }) {
  const titleId = `chart-title-${chart.id}`;
  const descId = `chart-desc-${chart.id}`;
  return (
    <figure className="chart">
      <figcaption id={titleId} className="overline">{chart.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title>{chart.title}</title>
        <desc id={descId}>{chart.desc}</desc>
        {chart.empty ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="chart-empty">{chart.emptyText}</text>
        ) : chart.orientation === "vertical" ? (
          <VerticalBars bars={chart.bars} />
        ) : (
          <HorizontalBars bars={chart.bars} />
        )}
      </svg>
      {chart.empty ? null : (
        <table className="visually-hidden">
          <caption>{chart.title}</caption>
          <tbody>
            {chart.bars.map((b) => (
              <tr key={b.label}><th scope="row">{b.label}</th><td>{b.valueText}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

export function Dashboard({ metricsRevision = 0 }) {
  const [metrics, setMetrics] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /metrics ${res.status}`);
      setMetrics(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, metricsRevision]);
  const m = dashboardModel(metrics, { error: failed });
  return (
    <>
      {m.status === "error" ? (
        <p className="small chart-error" role="alert">
          {m.errorText} <button type="button" className="link-btn" onClick={load}>{m.retryLabel}</button>
        </p>
      ) : null}
      {m.charts.map((c) => <Chart key={c.id} chart={c} />)}
    </>
  );
}
