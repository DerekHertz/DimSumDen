# PROTOTYPE (ticket 01, throwaway). Run inside Blender with panda-mascot.blend open:
#   exec(open(r"<repo>/prototypes/motion-test/blender/build_rig.py").read())
# Builds scene "MotionTest": a copy of PlushBase, a hand-placed rig, and procedural skin weights.
import bpy
from mathutils import Vector

SCENE = "MotionTest"
MESH_OBJ = "MT_Panda"
RIG_OBJ = "MT_Rig"

# Blender space: Z up, the panda faces -Y, character left is +X. Model centre is the origin.
BONES = [
    # name, head, tail, parent, deform
    ("root", (0, 0, -1.0), (0, 0, -0.7), None, True),
    ("body", (0, -0.05, -0.9), (0, -0.05, 0.1), "root", True),
    ("head", (0, 0, 0.1), (0, 0, 0.9), "body", True),
    ("ear_L", (0.40, 0.20, 0.72), (0.47, 0.24, 0.95), "head", True),
    ("arm_L", (0.52, 0.18, 0.05), (0.74, -0.38, -0.30), "body", True),
    ("leg_L", (0.40, 0.05, -0.50), (0.66, -0.75, -0.74), "root", True),
    ("paw_L", (0.74, -0.38, -0.30), (0.74, -0.55, -0.30), "arm_L", False),
    ("hat", (0, 0, 0.97), (0, 0, 1.17), "head", False),
]


def mirror(b):
    name, h, t, parent, deform = b
    m = lambda v: (-v[0], v[1], v[2])
    swap = lambda n: n[:-2] + "_R" if n and n.endswith("_L") else n
    return (swap(name), m(h), m(t), swap(parent), deform)


ALL_BONES = BONES + [mirror(b) for b in BONES if b[0].endswith("_L")]


def ensure_scene():
    sc = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    sc.render.fps = 30
    bpy.context.window.scene = sc
    return sc


def ensure_mesh(sc):
    p = bpy.data.objects.get(MESH_OBJ)
    if not p:
        src = bpy.data.objects["PlushBase"]
        p = bpy.data.objects.new(MESH_OBJ, src.data.copy())
        p.data.name = MESH_OBJ + "Mesh"
    if p.name not in sc.collection.objects:
        sc.collection.objects.link(p)
    return p


def build_armature(sc):
    old = bpy.data.objects.get(RIG_OBJ)
    if old:
        arm_data = old.data
        bpy.data.objects.remove(old)
        bpy.data.armatures.remove(arm_data)
    arm = bpy.data.armatures.new(RIG_OBJ)
    rig = bpy.data.objects.new(RIG_OBJ, arm)
    sc.collection.objects.link(rig)
    rig.show_in_front = True
    bpy.context.view_layer.objects.active = rig
    for o in sc.objects:
        o.select_set(o == rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, h, t, parent, deform in ALL_BONES:
        eb = arm.edit_bones.new(name)
        eb.head, eb.tail = Vector(h), Vector(t)
        eb.use_deform = deform
    for name, h, t, parent, deform in ALL_BONES:
        eb = arm.edit_bones[name]
        eb.roll = 0
        if parent:
            eb.parent = arm.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def seg(p, a, b):
    ab = b - a
    t = (p - a).dot(ab) / ab.length_squared
    tc = max(0.0, min(1.0, t))
    return (p - (a + ab * tc)).length, t


def compute_weights(mesh_obj):
    me = mesh_obj.data
    cols = me.color_attributes["Col"].data
    b = {n: (Vector(h), Vector(t)) for n, h, t, _, _ in ALL_BONES}
    ear_c = {"L": Vector((0.45, 0.23, 0.84)), "R": Vector((-0.45, 0.23, 0.84))}
    groups = {n: {} for n, *_ , d in ALL_BONES if d}
    for v in me.vertices:
        p = v.co
        c = cols[v.index].color
        dark = 1.0 - smooth(0.15, 0.55, (c[0] + c[1] + c[2]) / 3)  # 1 on black fur
        limb = {}
        for s in ("L", "R"):
            side = 1 if (p.x > 0) == (s == "L") else 0
            if not side:
                continue
            limb["ear_" + s] = smooth(0.26, 0.15, (p - ear_c[s]).length) * smooth(0.62, 0.72, p.z)
            d, t = seg(p, *b["arm_" + s])
            w = smooth(0.23, 0.17, d) * smooth(-0.15, 0.3, t) * smooth(0.30, 0.45, abs(p.x))
            limb["arm_" + s] = w * dark * smooth(0.25, 0.05, p.z)
            d, t = seg(p, *b["leg_" + s])
            w = smooth(0.40, 0.26, d) * smooth(-0.2, 0.25, t)
            limb["leg_" + s] = w * (0.4 + 0.6 * dark) * smooth(-0.22, -0.38, p.z)
        L = min(1.0, sum(limb.values()))
        hw = smooth(-0.02, 0.2, p.z)
        raw = {"head": hw * (1 - L), "body": (1 - hw) * (1 - L), **limb}
        tot = sum(raw.values()) or 1.0
        for n, w in raw.items():
            if w / tot > 0.002:
                groups[n][v.index] = w / tot
    return groups


def apply_weights(mesh_obj, rig):
    mesh_obj.vertex_groups.clear()
    for n, vw in compute_weights(mesh_obj).items():
        g = mesh_obj.vertex_groups.new(name=n)
        for i, w in vw.items():
            g.add([i], w, "REPLACE")
    mesh_obj.modifiers.clear()
    mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    mesh_obj.parent = rig


def debug_weight_colors(mesh_obj):
    """Paint a 'WDebug' colour attribute showing the dominant bone per vertex."""
    palette = {"body": (0.6, 0.6, 0.6), "head": (0.2, 0.8, 0.3), "root": (0, 0, 0)}
    for s, k in (("L", 1.0), ("R", 0.6)):
        palette["ear_" + s] = (k, k, 0)
        palette["arm_" + s] = (k, 0, 0)
        palette["leg_" + s] = (0, 0, k)
    me = mesh_obj.data
    attr = me.color_attributes.get("WDebug") or me.color_attributes.new("WDebug", "FLOAT_COLOR", "POINT")
    names = {g.index: g.name for g in mesh_obj.vertex_groups}
    for v in me.vertices:
        acc = Vector((0, 0, 0))
        for ge in v.groups:
            acc += Vector(palette[names[ge.group]]) * ge.weight
        attr.data[v.index].color = (*acc, 1)
    return attr


def run():
    sc = ensure_scene()
    mesh = ensure_mesh(sc)
    rig = build_armature(sc)
    apply_weights(mesh, rig)
    return sc, mesh, rig


if __name__ == "__main__" or True:
    _sc, _mesh, _rig = run()
