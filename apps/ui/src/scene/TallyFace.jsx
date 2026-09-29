// Tally (showcase-v1/03): a pagoda-roofed slate on tall posts, front right on the grass. The
// slate face is a canvas texture drawn from the pure view-model in tally-face.mjs (three small chalk
// charts). Clicking it opens the Dashboard; the keyboard route is the "Tally" chip in
// ChipLayer. Static: the face redraws only when the metrics change.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { TALLY } from "./banquet-layout.mjs";
import { roofTriangles } from "./stall-roof.mjs";

const SLATE = "#2f3a3d";
const CHALK = "#f2efe4";
const CHALK_DIM = "#b9c2bd";
const BAR = "#7fd0c8";
const INK = "#23262b";
const WOOD = "#b98a55";
const FACE_PX = { w: 512, h: 288 };
const B = TALLY;
const ROOF = { eave: B.faceBottom + B.faceHeight + 0.12, rise: 0.4 };

function drawFace(ctx, face) {
  const { w, h } = FACE_PX;
  const px = (r) => ({ x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h });
  ctx.fillStyle = SLATE;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = CHALK_DIM;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  const t = px(face.titleRect);
  ctx.fillStyle = CHALK;
  ctx.font = "34px 'Long Cang', cursive"; // display heading only; chart text stays sans
  ctx.textBaseline = "middle";
  ctx.fillText(face.title, t.x + 8, t.y + t.h / 2);
  for (const chart of face.charts) {
    const r = px(chart.rect);
    ctx.fillStyle = CHALK_DIM;
    ctx.font = "600 18px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(chart.title, r.x, r.y);
    const plot = { x: r.x, y: r.y + 26, w: r.w, h: r.h - 26 };
    if (chart.empty) {
      ctx.font = "16px sans-serif";
      ctx.fillText(chart.emptyText, plot.x, plot.y + 8);
      continue;
    }
    ctx.fillStyle = BAR;
    if (chart.orientation === "vertical") {
      const slot = plot.w / chart.bars.length;
      chart.bars.forEach((b, i) => {
        const bh = Math.max(2, b.fraction * (plot.h - 8));
        ctx.fillRect(plot.x + i * slot + slot * 0.15, plot.y + plot.h - bh, slot * 0.7, bh);
      });
    } else {
      const rowH = Math.min(34, plot.h / chart.bars.length);
      chart.bars.forEach((b, i) => {
        const y = plot.y + i * rowH;
        ctx.fillStyle = CHALK_DIM;
        ctx.font = "13px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(b.label.slice(0, 9), plot.x, y + rowH * 0.3);
        ctx.fillStyle = BAR;
        ctx.fillRect(plot.x, y + rowH * 0.5, Math.max(2, b.fraction * (plot.w - 34)), rowH * 0.3);
        ctx.fillStyle = CHALK;
        ctx.fillText(b.valueText, plot.x + Math.max(2, b.fraction * (plot.w - 34)) + 4, y + rowH * 0.65);
      });
    }
  }
}

export function TallyFace({ face, onOpen, stage }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = FACE_PX.w;
    c.height = FACE_PX.h;
    return c;
  }, []);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);
  const roof = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(roofTriangles(B.width + 0.3, B.depth + 0.3, ROOF), 3));
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => {
    if (!face) return;
    const draw = () => {
      drawFace(canvas.getContext("2d"), face);
      texture.needsUpdate = true;
    };
    draw();
    // Redraw once Long Cang arrives, so the heading does not stay in the fallback face.
    let live = true;
    document.fonts?.load("34px 'Long Cang'").then(() => live && draw()).catch(() => {});
    return () => { live = false; };
  }, [face, canvas, texture]);

  useEffect(() => {
    if (!stage) return undefined;
    stage.anchors.set("__tally", new THREE.Vector3(B.x, ROOF.eave + ROOF.rise + 0.1, B.z));
    return () => stage.anchors.delete("__tally");
  }, [stage]);

  const top = B.faceBottom + B.faceHeight;
  const postX = B.width / 2 + 0.05;
  return (
    <group
      name="tally"
      position={[B.x, 0, B.z]}
      onClick={onOpen ? (e) => { e.stopPropagation(); onOpen(); } : undefined}
      onPointerOver={onOpen ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onOpen ? () => { document.body.style.cursor = ""; } : undefined}
    >
      {[-postX, postX].map((x) => (
        <mesh key={x} position={[x, (top + 0.12) / 2, 0]}>
          <boxGeometry args={[0.1, top + 0.12, 0.1]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, B.faceBottom + B.faceHeight / 2, 0]}>
        <boxGeometry args={[B.width, B.faceHeight, 0.08]} />
        <meshStandardMaterial color={SLATE} />
      </mesh>
      <mesh position={[0, B.faceBottom + B.faceHeight / 2, 0.045]}>
        <planeGeometry args={[B.width - 0.12, B.faceHeight - 0.12]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh geometry={roof}>
        <meshStandardMaterial color={INK} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
