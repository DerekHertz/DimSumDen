// Tally (showcase-v1/07): a stone stele, an upright engraved tablet on a low plinth, on the leafy
// mound behind Bao. The face is a canvas texture drawn from the pure view-model in tally-face.mjs:
// the three small charts as glowing qi-teal lines, like carved characters catching light, stacked
// down the tablet. Clicking it opens the Dashboard; the keyboard route is the "Tally" chip in
// ChipLayer. Static: the face redraws only when the metrics change.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { TALLY } from "./banquet-layout.mjs";

const TABLET = "#4a4d4a";
const PLINTH = "#3d403d";
const QI = "#3aced3";
const FACE_PX = { w: 336, h: 480 };
const B = TALLY;
const BASE_Y = B.groundY - 0.1; // plinth bottom, a little sunk into the mound
const TABLET_Y = BASE_Y + B.plinth.height; // tablet bottom

function glow(ctx, on) {
  ctx.shadowColor = QI;
  ctx.shadowBlur = on ? 8 : 0;
}

function line(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawFace(ctx, face) {
  const { w, h } = FACE_PX;
  ctx.fillStyle = TABLET;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = QI;
  ctx.fillStyle = QI;
  ctx.lineCap = "round";
  glow(ctx, true);
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.globalAlpha = 1;
  ctx.font = "44px 'Long Cang', cursive"; // display heading only; chart text stays sans
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(face.title, w / 2, 52);
  ctx.textAlign = "left";
  const top = 92;
  const slot = (h - top - 18) / face.charts.length;
  face.charts.forEach((chart, n) => {
    const x = 28;
    const pw = w - 56;
    const y = top + n * slot;
    ctx.font = "600 17px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(chart.title, x, y);
    const plot = { x, y: y + 26, w: pw, h: slot - 42 };
    if (chart.empty) {
      ctx.font = "15px sans-serif";
      ctx.fillText(chart.emptyText, plot.x, plot.y + 6);
      return;
    }
    ctx.lineWidth = 4;
    if (chart.orientation === "vertical") {
      const step = plot.w / chart.bars.length;
      chart.bars.forEach((b, i) => {
        const bh = Math.max(3, b.fraction * plot.h);
        const cx = plot.x + i * step + step / 2;
        line(ctx, cx, plot.y + plot.h, cx, plot.y + plot.h - bh);
      });
    } else {
      const rowH = Math.min(30, plot.h / chart.bars.length);
      ctx.font = "12px sans-serif";
      ctx.textBaseline = "middle";
      chart.bars.forEach((b, i) => {
        const ry = plot.y + i * rowH;
        const len = Math.max(3, b.fraction * (plot.w - 60));
        ctx.fillText(b.label.slice(0, 9), plot.x, ry + rowH * 0.25);
        line(ctx, plot.x, ry + rowH * 0.65, plot.x + len, ry + rowH * 0.65);
        ctx.fillText(b.valueText, plot.x + len + 8, ry + rowH * 0.65);
      });
    }
  });
  glow(ctx, false);
}

export function TallyFace({ face, onOpen, stage }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = FACE_PX.w;
    c.height = FACE_PX.h;
    return c;
  }, []);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  useEffect(() => {
    if (!face) return;
    const draw = () => {
      drawFace(canvas.getContext("2d"), face);
      texture.needsUpdate = true;
    };
    draw();
    // Redraw once Long Cang arrives, so the heading does not stay in the fallback face.
    let live = true;
    document.fonts?.load("44px 'Long Cang'").then(() => live && draw()).catch(() => {});
    return () => { live = false; };
  }, [face, canvas, texture]);

  useEffect(() => {
    if (!stage) return undefined;
    stage.anchors.set("__tally", new THREE.Vector3(B.x, TABLET_Y + B.tablet.height + 0.1, B.z));
    return () => stage.anchors.delete("__tally");
  }, [stage]);

  return (
    <group
      name="tally"
      position={[B.x, 0, B.z]}
      onClick={onOpen ? (e) => { e.stopPropagation(); onOpen(); } : undefined}
      onPointerOver={onOpen ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onOpen ? () => { document.body.style.cursor = ""; } : undefined}
    >
      <mesh position={[0, BASE_Y + B.plinth.height / 2, 0]}>
        <boxGeometry args={[B.plinth.width, B.plinth.height, B.plinth.depth]} />
        <meshStandardMaterial color={PLINTH} />
      </mesh>
      <mesh position={[0, TABLET_Y + B.tablet.height / 2, 0]}>
        <boxGeometry args={[B.tablet.width, B.tablet.height, B.tablet.depth]} />
        <meshStandardMaterial color={TABLET} />
      </mesh>
      <mesh position={[0, TABLET_Y + B.tablet.height / 2, B.tablet.depth / 2 + 0.005]}>
        <planeGeometry args={[B.tablet.width - 0.08, B.tablet.height - 0.08]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
