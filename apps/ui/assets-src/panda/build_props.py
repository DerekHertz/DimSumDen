# Ticket 07 (spec.md "Export": "Props and hats are separate assets attached to sockets by name").
# Builds the three Brain-type habit props as small standalone meshes, each in its own local space
# (object origin at (0,0,0) is where it meets the socket, so a runtime attach with an identity
# transform under the paw_L/paw_R/hat socket node holds it naturally in the paw). Run inside
# Blender from the Python console or the Blender MCP:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_props.py").read(), {"PANDA_SRC": r"<repo>/apps/ui/assets-src/panda"})
# Writes apps/ui/public/models/props/{fan,scroll,blueprint}.glb.
import bpy
import bmesh
import math
import os

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
OUT_DIR = os.path.normpath(os.path.join(SRC, "..", "..", "public", "models", "props"))
SCENE = "PropAssets"


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
    """A folding fan, open: a pie-wedge held closed-edge-first at the paw (paw_R). Warm lacquer red."""
    bm = bmesh.new()
    radius, angle_deg, segs, thickness = 0.16, 110, 10, 0.012
    hinge = bm.verts.new((0, 0, 0))
    arc = []
    start = -angle_deg / 2
    for i in range(segs + 1):
        a = math.radians(start + angle_deg * i / segs)
        arc.append(bm.verts.new((radius * math.sin(a), radius * math.cos(a) * 0.15, radius * math.cos(a))))
    for i in range(segs):
        bm.faces.new((hinge, arc[i], arc[i + 1]))
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=thickness)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object("Prop_Fan", bm, (0.62, 0.11, 0.11))


def make_scroll():
    """A rolled scroll, held horizontally in the paw (paw_L). Parchment tan."""
    from mathutils import Matrix
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=16,
                           radius1=0.045, radius2=0.045, depth=0.30, matrix=Matrix.Identity(4))
    for v in bm.verts:
        v.co = (v.co.z, v.co.y, v.co.x)  # lay the cylinder's depth axis along local X (across the palm)
    return new_object("Prop_Scroll", bm, (0.80, 0.70, 0.48))


def make_blueprint():
    """An unrolled blueprint sheet, held in both paws (paw_L is the attach socket). Slate blue
    with a cream border strip standing in for a printed border."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 0.20
        v.co.y *= 0.012
        v.co.z *= 0.26
    return new_object("Prop_Blueprint", bm, (0.42, 0.55, 0.68))


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
