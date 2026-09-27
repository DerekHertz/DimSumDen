# Ticket 07 (spec.md "Export": "Props and hats are separate assets attached to sockets by name").
# Builds the three Brain-type habit props as small standalone meshes, each in its own local space
# (object origin at (0,0,0) is where it meets the socket, so a runtime attach with an identity
# transform under the paw_L/paw_R/hat socket node holds it naturally in the paw). Run inside
# Blender from the Python console or the Blender MCP:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_props.py").read(), {"PANDA_SRC": r"<repo>/apps/ui/assets-src/panda"})
# Writes apps/ui/public/models/props/{fan,scroll,blueprint}.glb.
import bpy
import bmesh
import colorsys
import math
import os

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
OUT_DIR = os.path.normpath(os.path.join(SRC, "..", "..", "public", "models", "props"))
SCENE = "PropAssets"

# Design bounce (ticket 07, MEDIUM): the design system artifact's cell-types.md (not checked into
# this repo; see handoffs/07-designer-1.md) says a cell type's personality comes from a hat and held
# prop "in its organ hue". Orchestrator/product/architect are all Brain (organ-brain = wisteria, the
# artifact's tokens.json #674698 light / #c3a5f9 dark, hue ~264deg). The three props stay in that
# hue family, varied by lightness/saturation for shape-driven distinguishability rather than by
# swapping to unrelated narrative colours.
WISTERIA_HUE = 264 / 360


def wisteria(lightness, saturation):
    return colorsys.hls_to_rgb(WISTERIA_HUE, lightness, saturation)


# Design bounce (ticket 07, HIGH): a prop's object origin sat exactly at the socket's origin with no
# offset outward into the grip, so scroll and blueprint were centred inside the paw's fist geometry
# instead of extending out of it. GRIP_OFFSET nudges those two out along local +Z, which the paw_L
# socket's rest orientation carries to world +Z (toward the camera, out of the fist) — see
# apps/ui/assets-src/panda/README.md and the ticket 07 designer handoff for the axis derivation.
GRIP_OFFSET = 0.06


def ensure_scene():
    sc = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    bpy.context.window.scene = sc
    for o in list(sc.objects):
        sc.collection.objects.unlink(o)
    return sc


def new_object(name, bm, color):
    mesh = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    if mesh.vertices:
        mesh.clear_geometry()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.get(name) or bpy.data.objects.new(name, mesh)
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)
    mat = bpy.data.materials.get(name + "Mat") or bpy.data.materials.new(name + "Mat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*color, 1.0)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.6
    mesh.materials.clear()
    mesh.materials.append(mat)
    return obj


def make_fan():
    """A folding fan, open: a pie-wedge held closed-edge-first at the paw (paw_R). Wisteria (organ
    Brain hue, cell-types.md), a mid lightness so it reads distinctly from the scroll and blueprint.

    Design bounce (ticket 07, HIGH): the arc used to spread in local X/Z with the thin (solidify)
    axis on local Y. paw_R's rest orientation carries local Y to world Y (up) and local Z to world
    Z (depth) — the opposite of what a held-up fan needs — so the fan's *tall* dimension landed on
    depth (foreshortened, wasted) and its *thin* dimension landed on world-up, making the whole fan
    a near-invisible horizontal sliver from the front/three-quarter view used to look at a working
    cell. Swapping the arc to spread in local X/Y (thin axis on local Z) puts the tall dimension on
    world-up and the thin solidify axis on world-depth, so the fan's face reads front-on instead of
    edge-on. See apps/ui/assets-src/panda/README.md and the ticket 07 designer handoff for the full
    axis derivation (measured from the exported panda.glb's paw_R world matrix).

    Unlike the scroll and blueprint, the fan gets no GRIP_OFFSET: its hinge is the socket contact
    point by design (the pie-wedge radiates outward from it, per the original "closed-edge-first"
    grip), so shifting the hinge off-origin would push the grip point itself out of the fist rather
    than clearing a body that's centred on the origin. The scroll/blueprint problem — a shape whose
    origin sits at its own centre, burying it in the fist — doesn't apply here.
    """
    bm = bmesh.new()
    radius, angle_deg, segs, thickness = 0.16, 110, 10, 0.012
    hinge = bm.verts.new((0, 0, 0))
    arc = []
    start = -angle_deg / 2
    for i in range(segs + 1):
        a = math.radians(start + angle_deg * i / segs)
        arc.append(bm.verts.new((radius * math.sin(a), radius * math.cos(a), radius * math.cos(a) * 0.15)))
    for i in range(segs):
        bm.faces.new((hinge, arc[i], arc[i + 1]))
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=thickness)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object("Prop_Fan", bm, wisteria(0.42, 0.45))


def make_scroll():
    """A rolled scroll, held horizontally in the paw (paw_L). Wisteria (organ Brain hue), lighter
    than the fan and blueprint so the three read as distinct at a glance.

    Design bounce (ticket 07, HIGH): the scroll's object origin sat exactly at the socket's origin,
    centred inside the paw's fist geometry instead of extending out of it. Offset outward along
    local Z (GRIP_OFFSET) by a few cm so its body clears the fist.
    """
    from mathutils import Matrix
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=16,
                           radius1=0.045, radius2=0.045, depth=0.30, matrix=Matrix.Identity(4))
    for v in bm.verts:
        v.co = (v.co.z, v.co.y, v.co.x + GRIP_OFFSET)  # depth axis along local X (across the palm); see GRIP_OFFSET above
    return new_object("Prop_Scroll", bm, wisteria(0.66, 0.42))


def make_blueprint():
    """An unrolled blueprint sheet, held in the left paw (paw_L is the attach socket) and steadied
    with both arms as build_clips.py's blueprint_unroll plays. Wisteria (organ Brain hue), darker
    than the fan and scroll so the three read as distinct at a glance.

    Design bounce (ticket 07, HIGH): same centring problem as the scroll — offset outward along
    local Z (GRIP_OFFSET) so the sheet clears the fist instead of sitting centred inside it.
    """
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 0.20
        v.co.y *= 0.012
        v.co.z = v.co.z * 0.26 + GRIP_OFFSET  # see GRIP_OFFSET above
    return new_object("Prop_Blueprint", bm, wisteria(0.28, 0.50))


def export_one(obj):
    sc = bpy.context.scene
    for o in sc.objects:
        o.select_set(o is obj)
    bpy.context.view_layer.objects.active = obj
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, obj.name.replace("Prop_", "").lower() + ".glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, use_active_scene=True,
        export_yup=True, export_image_format="AUTO",
    )
    return path


def run():
    ensure_scene()
    objs = [make_fan(), make_scroll(), make_blueprint()]
    paths = [export_one(o) for o in objs]
    return {o.name: os.path.getsize(p) for o, p in zip(objs, paths)}


RESULT = run()
