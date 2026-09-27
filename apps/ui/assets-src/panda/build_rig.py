# Step 2 of the panda asset build. Run after build_mesh.py, inside Blender:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_rig.py").read())
# Builds PA_Rig, the shared hand-placed panda rig (ADR 0006), and skins PA_Panda to it.
# The sewn-on arms are bound rigidly to their arm bones; the rest uses smooth procedural weights.
import bpy
import os
from mathutils import Vector

SCENE = "PandaAsset"
BODY = "PA_Panda"
RIG = "PA_Rig"

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
exec(open(os.path.join(SRC, "rig_spec.py")).read(), globals())  # BONES, ALL_BONES, DEFORM


def build_armature(sc):
    old = bpy.data.objects.get(RIG)
    if old:
        data = old.data
        bpy.data.objects.remove(old)
        bpy.data.armatures.remove(data)
    arm = bpy.data.armatures.new(RIG)
    rig = bpy.data.objects.new(RIG, arm)
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
        eb.roll = 0
    for name, h, t, parent, deform in ALL_BONES:
        if parent:
            arm.edit_bones[name].parent = arm.edit_bones[parent]
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


def body_weights(mesh_obj):
    """Head/body split by height, with ears and legs blended in. No arm weights: the body has no arms."""
    me = mesh_obj.data
    cols = me.color_attributes["Col"].data
    b = {n: (Vector(h), Vector(t)) for n, h, t, _, _ in ALL_BONES}
    ear_c = {"L": Vector((0.45, 0.23, 0.84)), "R": Vector((-0.45, 0.23, 0.84))}
    groups = {n: {} for n in DEFORM}
    for v in me.vertices:
        p = v.co
        c = cols[v.index].color
        dark = 1.0 - smooth(0.15, 0.55, (c[0] + c[1] + c[2]) / 3)  # 1 on black fur
        limb = {}
        for s in ("L", "R"):
            if (p.x > 0) != (s == "L"):
                continue
            limb["ear_" + s] = smooth(0.26, 0.15, (p - ear_c[s]).length) * smooth(0.62, 0.72, p.z)
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


def set_groups(ob, weights):
    ob.vertex_groups.clear()
    for n in DEFORM:
        g = ob.vertex_groups.new(name=n)
        for i, w in weights.get(n, {}).items():
            g.add([i], w, "REPLACE")


def skin(sc, rig):
    body = bpy.data.objects[BODY]
    set_groups(body, body_weights(body))
    arms = [bpy.data.objects[f"PA_Arm_{s}"] for s in ("L", "R")]
    for s, arm in zip(("L", "R"), arms):
        set_groups(arm, {f"arm_{s}": {v.index: 1.0 for v in arm.data.vertices}})
    # One skinned mesh: join the arms into the body (vertex groups merge by name).
    for o in sc.objects:
        o.select_set(o in arms or o == body)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    # Keep one colour layer, "Col", as both active and render colour, so the exporter writes COLOR_0.
    attrs = body.data.color_attributes
    for a in [a for a in attrs if a.name != "Col"]:
        attrs.remove(a)
    attrs.active_color = attrs["Col"]
    attrs.render_color_index = attrs.active_color_index
    body.modifiers.clear()
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    body.parent = rig
    return body


def run():
    sc = bpy.data.scenes[SCENE]
    bpy.context.window.scene = sc
    rig = build_armature(sc)
    body = skin(sc, rig)
    return sc, rig, body


if __name__ == "__main__" or True:
    _sc, _rig, _body = run()
    result = {"groups": [g.name for g in _body.vertex_groups], "verts": len(_body.data.vertices)}
