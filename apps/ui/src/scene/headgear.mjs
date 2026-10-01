// den-scene-v1/09: procedural role headgear, handheld props and the shared scarf (user rescope 2026-10-01).
// Pure: each spec is a list of parts {name, kind, params, position, rotation?, scale?, material, color}; Den.jsx
// builds three.js meshes from them (gear-object.mjs). `params` use the three.js constructor argument names.
// Frames: headgear in the panda's "hat" socket (origin on the crown, y up, front +z); the prop in the role's
// paw socket (long axis +y); the scarf in the "body" bone frame (neck at y ~ 1). Colour comes only from
// stationHue (station-tinted parts) or the neutral tokens below; panda fur is never tinted.
import { stationHue } from "./station-hues.mjs";

export const ROLES = ["orchestrator", "product", "architect", "developer", "scout", "debugger", "qa", "security", "designer"];

// The role's station hue key (station-hues.mjs). banquet-layout's stationOf keeps the Pass roles under their own
// names and sends the debugger to the cub row; the den map (den-map.md:40) makes the debugger a Steamers role.
const ROLE_STATION = {
  orchestrator: "pass", product: "pass", architect: "pass",
  developer: "steamers", scout: "steamers", debugger: "steamers",
  qa: "tea", security: "pantry", designer: "front-of-house",
};
const stationOfRole = (role) => (typeof role === "string" && Object.hasOwn(ROLE_STATION, role) ? ROLE_STATION[role] : null);

const NEUTRALS = { cream: "#f4ecd8", ink: "#1b1d20", wood: "#b98a55", glass: "#bfe3ee" };
const MATTE = { roughness: 0.9, metalness: 0 };

/** Soft-matte material properties for a part's material token. */
export function materialProps(token) {
  if (token === "glass") return { ...MATTE, roughness: 0.8, opacity: 0.45 };
  if (token === "ink") return { ...MATTE, roughness: 0.85 };
  return { ...MATTE };
}

const hueFor = (station, theme) => (station ? stationHue(station, theme) ?? stationHue(station, "light") : undefined);

// Builds the spec's parts for one role: `make({seg, tint})` returns parts with material tokens; `seg(crowd, hero)`
// picks a segment count by level of detail. Colours are resolved here, in one place.
function resolve(role, opts, make) {
  const station = stationOfRole(role);
  const theme = opts?.theme ?? "light";
  const hero = opts?.lod === "hero";
  const hue = hueFor(station, theme);
  const seg = (crowd, high) => (hero ? high : crowd);
  return make({ seg }).map((p) => {
    const material = p.material === "station" && !hue ? "cream" : p.material;
    return { ...p, material, color: material === "station" ? hue : NEUTRALS[material] };
  });
}

const part = (name, kind, params, position, material, extra = {}) => ({ name, kind, params, position, material, ...extra });
const box = (name, [width, height, depth], position, material, extra = {}) => part(name, "box", { width, height, depth }, position, material, extra);
const ring = (name, radius, tube, radialSegments, tubularSegments, position, material, extra = {}, arc) =>
  part(name, "torus", { radius, tube, radialSegments, tubularSegments, ...(arc ? { arc } : {}) }, position, material, extra);

const HALF = Math.PI / 2;
const alongZ = [HALF, 0, 0]; // a cylinder's axis turned from y to z
const alongX = [0, 0, HALF];

const HEADGEAR = {
  // Chef's toque: a station-hued band under a tall puffed crown. The tallest hat.
  orchestrator: ({ seg }) => [
    part("toque:band", "cylinder", { radiusTop: 0.44, radiusBottom: 0.44, height: 0.2, radialSegments: seg(8, 16), openEnded: true }, [0, 0.0, 0], "station"),
    part("toque:puff", "lathe", { points: [[0.42, 0], [0.62, 0.2], [0.6, 0.5], [0.38, 0.62], [0, 0.64]], segments: seg(8, 16) }, [0, 0.1, 0], "cream"),
  ],
  // Round spectacles: two ink rims and a bridge across the face.
  product: (ctx) => spectacles(ctx),
  architect: (ctx) => spectacles(ctx),
  // Headphones: an ink band over the crown and two ear cups.
  developer: ({ seg }) => [
    ring("headphones:band", 0.7, 0.04, 4, seg(8, 16), [0, -0.42, 0], "ink", { scale: [1, 0.65, 1] }, Math.PI),
    part("headphones:cup_L", "cylinder", { radiusTop: 0.2, radiusBottom: 0.2, height: 0.14, radialSegments: seg(8, 16) }, [0.68, -0.42, 0], "ink", { rotation: alongX }),
    part("headphones:cup_R", "cylinder", { radiusTop: 0.2, radiusBottom: 0.2, height: 0.14, radialSegments: seg(8, 16) }, [-0.68, -0.42, 0], "ink", { rotation: alongX }),
  ],
  // Goggles pushed up on the forehead: strap, two rimmed lenses, bridge.
  scout: ({ seg }) => [
    part("goggles:strap", "cylinder", { radiusTop: 0.58, radiusBottom: 0.58, height: 0.1, radialSegments: seg(8, 16), openEnded: true }, [0, -0.2, 0], "ink"),
    part("goggles:rim_L", "cylinder", { radiusTop: 0.2, radiusBottom: 0.2, height: 0.1, radialSegments: seg(8, 16) }, [0.24, -0.2, 0.56], "ink", { rotation: alongZ }),
    part("goggles:rim_R", "cylinder", { radiusTop: 0.2, radiusBottom: 0.2, height: 0.1, radialSegments: seg(8, 16) }, [-0.24, -0.2, 0.56], "ink", { rotation: alongZ }),
    part("goggles:lens_L", "cylinder", { radiusTop: 0.14, radiusBottom: 0.14, height: 0.04, radialSegments: seg(8, 16) }, [0.24, -0.2, 0.62], "glass", { rotation: alongZ }),
    part("goggles:lens_R", "cylinder", { radiusTop: 0.14, radiusBottom: 0.14, height: 0.04, radialSegments: seg(8, 16) }, [-0.24, -0.2, 0.62], "glass", { rotation: alongZ }),
    box("goggles:bridge", [0.12, 0.06, 0.06], [0, -0.2, 0.58], "ink"),
  ],
  // Headlamp: strap, a lamp on the brow with a bright lens, a band over the crown.
  debugger: ({ seg }) => [
    part("headlamp:strap", "cylinder", { radiusTop: 0.56, radiusBottom: 0.56, height: 0.08, radialSegments: seg(8, 16), openEnded: true }, [0, -0.15, 0], "ink"),
    part("headlamp:lamp", "cylinder", { radiusTop: 0.15, radiusBottom: 0.15, height: 0.18, radialSegments: seg(8, 16) }, [0, -0.12, 0.6], "ink", { rotation: alongZ }),
    part("headlamp:lens", "cylinder", { radiusTop: 0.1, radiusBottom: 0.1, height: 0.03, radialSegments: seg(8, 16) }, [0, -0.12, 0.7], "cream", { rotation: alongZ }),
    box("headlamp:over", [0.08, 0.04, 1.0], [0, 0.0, 0], "ink"),
  ],
  // Straw douli: a wide shallow cone, the widest hat.
  qa: ({ seg }) => [
    part("douli:cone", "lathe", { points: [[0, 0.4], [0.35, 0.28], [0.7, 0.1], [1.0, -0.02]], segments: seg(8, 16) }, [0, -0.1, 0], "wood"),
  ],
  // Cap: a station-hued dome and a short brim.
  security: ({ seg }) => [
    part("cap:dome", "sphere", { radius: 0.68, widthSegments: seg(8, 16), heightSegments: seg(3, 6), thetaLength: HALF }, [0, -0.14, 0], "station", { scale: [1, 0.6, 1] }),
    box("cap:brim", [0.8, 0.04, 0.4], [0, -0.14, 0.7], "station"),
  ],
  // Beret: a flat station-hued disc worn to one side, with a stalk.
  designer: ({ seg }) => [
    part("beret:disc", "sphere", { radius: 0.72, widthSegments: seg(8, 16), heightSegments: seg(4, 8) }, [0.06, 0.0, 0], "station", { scale: [1, 0.35, 1], rotation: [0, 0, -0.2] }),
    box("beret:stalk", [0.08, 0.1, 0.08], [0.0, 0.27, 0], "station"),
  ],
};

function spectacles({ seg }) {
  return [
    ring("spectacles:rim_L", 0.17, 0.03, 4, seg(8, 16), [0.27, -0.42, 0.62], "ink"),
    ring("spectacles:rim_R", 0.17, 0.03, 4, seg(8, 16), [-0.27, -0.42, 0.62], "ink"),
    box("spectacles:bridge", [0.2, 0.04, 0.04], [0, -0.38, 0.62], "ink"),
  ];
}

const PROPS = {
  // Ladle: wooden handle, ink bowl.
  orchestrator: ({ seg }) => [
    part("ladle:handle", "cylinder", { radiusTop: 0.03, radiusBottom: 0.03, height: 0.7, radialSegments: seg(6, 8) }, [0, 0, 0], "wood"),
    part("ladle:bowl", "sphere", { radius: 0.14, widthSegments: seg(6, 12), heightSegments: seg(3, 6), thetaLength: HALF }, [0, 0.35, 0], "ink", { rotation: [Math.PI, 0, 0] }),
  ],
  // Open menu: two covers with cream pages, splayed like a book.
  product: () => [
    box("menu:cover_L", [0.22, 0.5, 0.03], [0.11, 0, -0.01], "wood", { rotation: [0, -0.35, 0] }),
    box("menu:cover_R", [0.22, 0.5, 0.03], [-0.11, 0, -0.01], "wood", { rotation: [0, 0.35, 0] }),
    box("menu:page_L", [0.18, 0.44, 0.02], [0.11, 0, 0.01], "cream", { rotation: [0, -0.35, 0] }),
    box("menu:page_R", [0.18, 0.44, 0.02], [-0.11, 0, 0.01], "cream", { rotation: [0, 0.35, 0] }),
  ],
  // Order slips on a clip board.
  architect: () => [
    box("slips:board", [0.3, 0.45, 0.03], [0, 0, 0], "wood"),
    box("slips:clip", [0.12, 0.06, 0.05], [0, 0.22, 0.02], "ink"),
    box("slips:slip_1", [0.24, 0.1, 0.01], [0, 0.08, 0.025], "cream"),
    box("slips:slip_2", [0.24, 0.1, 0.01], [0, -0.06, 0.025], "cream"),
  ],
  // The npm test tablet (user verdict 2026-09-30): an ink slab, a thin screen plane, two result lines.
  developer: () => [
    box("tablet:slab", [0.4, 0.55, 0.06], [0, 0, 0], "ink"),
    box("tablet:screen", [0.34, 0.45, 0.02], [0, 0, 0.035], "cream"),
    box("tablet:line_1", [0.24, 0.04, 0.01], [0, 0.1, 0.05], "ink"),
    box("tablet:line_2", [0.24, 0.04, 0.01], [0, 0.0, 0.05], "ink"),
  ],
  // Magnifier (replaces the lantern): a ring and a handle.
  scout: ({ seg }) => [
    ring("magnifier:ring", 0.2, 0.035, 5, seg(8, 16), [0, 0.2, 0], "ink"),
    part("magnifier:handle", "cylinder", { radiusTop: 0.035, radiusBottom: 0.035, height: 0.4, radialSegments: seg(6, 8) }, [0, -0.2, 0], "wood"),
  ],
  // Chopsticks lifting a stray hair.
  debugger: ({ seg }) => [
    part("chopsticks:stick_1", "cylinder", { radiusTop: 0.02, radiusBottom: 0.03, height: 0.7, radialSegments: seg(6, 8) }, [0.03, 0, 0], "wood", { rotation: [0, 0, 0.04] }),
    part("chopsticks:stick_2", "cylinder", { radiusTop: 0.02, radiusBottom: 0.03, height: 0.7, radialSegments: seg(6, 8) }, [-0.03, 0, 0], "wood", { rotation: [0, 0, -0.04] }),
    ring("hair:strand", 0.05, 0.012, 3, seg(6, 12), [0, 0.42, 0], "ink", {}, Math.PI),
  ],
  // Teacup with a handle.
  qa: ({ seg }) => [
    part("teacup:cup", "lathe", { points: [[0, 0], [0.1, 0], [0.16, 0.14], [0.15, 0.15]], segments: seg(8, 16) }, [0, 0, 0], "cream"),
    ring("teacup:handle", 0.06, 0.015, 3, seg(6, 12), [0.17, 0.08, 0], "cream", {}, Math.PI),
  ],
  // Pantry seal: a wooden grip over a station-hued stamp face.
  security: ({ seg }) => [
    part("seal:grip", "cylinder", { radiusTop: 0.07, radiusBottom: 0.1, height: 0.25, radialSegments: seg(8, 16) }, [0, 0.12, 0], "wood"),
    part("seal:stamp", "cylinder", { radiusTop: 0.15, radiusBottom: 0.15, height: 0.06, radialSegments: seg(8, 16) }, [0, -0.04, 0], "station"),
  ],
  // Garnished plate.
  designer: ({ seg }) => [
    part("plate:dish", "cylinder", { radiusTop: 0.3, radiusBottom: 0.24, height: 0.05, radialSegments: seg(8, 16) }, [0, 0, 0], "cream"),
    part("plate:garnish", "sphere", { radius: 0.07, widthSegments: seg(6, 12), heightSegments: seg(3, 6) }, [0, 0.07, 0], "station"),
  ],
};

// One scarf for every role: a wrap round the neck and a tail down the front, all station-hued.
const SCARF = ({ seg }) => [
  part("scarf:wrap", "torus", { radius: 0.5, tubularSegments: seg(8, 16), radialSegments: seg(5, 8), tube: 0.13 }, [0, 0.98, -0.02], "station", { rotation: [HALF, 0, 0] }),
  box("scarf:tail", [0.22, 0.5, 0.08], [0.18, 0.74, 0.5], "station"),
];

const specFor = (table) => (role, opts) => {
  const make = typeof role === "string" && Object.hasOwn(table, role) ? table[role] : null;
  return make ? resolve(role, opts, make) : [];
};

/** Headgear parts for a role, in the hat socket frame; an unknown role has none. */
export const headgearSpec = specFor(HEADGEAR);
/** Handheld prop parts for a role, in its paw socket frame; an unknown role has none. */
export const propSpec = specFor(PROPS);
/** The shared scarf parts in the body frame; an unknown role still gets a neutral (cream) scarf. */
export const scarfSpec = (role, opts) => resolve(role, opts, SCARF);
