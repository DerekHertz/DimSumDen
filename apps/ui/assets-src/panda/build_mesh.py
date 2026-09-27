# Step 1 of the panda asset build. Run inside Blender with design/3d/panda-mascot.blend open:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_mesh.py").read())
# Builds scene "PandaAsset" with PA_Panda: PlushBase with the fused Meshy arms melted back into the
# body shell, plus two separate sewn-on plush arms, PA_Arm_L and PA_Arm_R. Each arm has a
# ball-shaped shoulder centred on its arm bone's head, so it can swing without stretching any skin
# (ticket 01 verdict).
import bpy
import bmesh
import os
from math import cos, sin, pi
from mathutils import Vector

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
exec(open(os.path.join(SRC, "rig_spec.py")).read(), globals())

SCENE = "PandaAsset"
BODY = "PA_Panda"

# Blender space: Z up, the panda faces -Y, character left is +X. Model centre is the origin.
OLD_SHOULDER = Vector((0.52, 0.18, 0.05))  # where the fused Meshy arm (character left) runs
OLD_PAW = Vector((0.74, -0.38, -0.30))
ARM_RADIUS = 0.24                       # body-shell verts this close to the arm bone are the old arm
MELT_RADIUS = 0.40                      # the melt fades out by here
MELT_ITERATIONS = 300
FLANK_ITERATIONS = 30                   # a gentle final smooth for the Meshy dents on the lower flanks
VOXEL = 0.012
VOXEL_FUSE = 0.024                      # coarse first remesh: fuses the crevice where the old paw met the belly
BODY_FACES = 36000


def mirror_x(v):
    return Vector((-v.x, v.y, v.z))


def ensure_scene():
    sc = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    sc.render.fps = 30
    bpy.context.window.scene = sc
    return sc


def seg(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def arm_dist(p):
    return seg(Vector((abs(p.x), p.y, p.z)), OLD_SHOULDER, OLD_PAW)


def melt_weight(p):
    """1 on the old arm, fading to 0 at MELT_RADIUS: how strongly the side is smoothed away."""
    return (smoothstep(MELT_RADIUS, ARM_RADIUS + 0.02, arm_dist(p))
            * smoothstep(0.30, 0.40, abs(p.x)) * smoothstep(-0.72, -0.6, p.z))


def link_new(sc, name, me):
    """Links a fresh object, replacing any old one (and its mesh) so re-runs keep clean names."""
    old = bpy.data.objects.get(name)
    if old:
        data = old.data
        bpy.data.objects.remove(old)
        if data and data.users == 0 and data != me:
            bpy.data.meshes.remove(data)
    stale = bpy.data.meshes.get(name + "Mesh")
    if stale and stale != me and stale.users == 0:
        bpy.data.meshes.remove(stale)
    me.name = name + "Mesh"
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    return ob


def split_parts(me):
    """Splits a mesh into its loose parts; returns (largest part, the rest) as bmeshes."""
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    comp = [-1] * len(bm.verts)
    sizes = []
    for v in bm.verts:
        if comp[v.index] >= 0:
            continue
        k = len(sizes)
        stack, n = [v], 0
        comp[v.index] = k
        while stack:
            x = stack.pop()
            n += 1
            for e in x.link_edges:
                o = e.other_vert(x)
                if comp[o.index] < 0:
                    comp[o.index] = k
                    stack.append(o)
        sizes.append(n)
    big = max(range(len(sizes)), key=sizes.__getitem__)
    shell, rest = bm.copy(), bm.copy()
    for part, keep_big in ((shell, True), (rest, False)):
        part.verts.ensure_lookup_table()
        bmesh.ops.delete(part, geom=[v for v in part.verts if (comp[v.index] == big) != keep_big], context="VERTS")
    bm.free()
    return shell, rest


def remesh(ob, size):
    ob.data.remesh_voxel_size = size
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        bpy.ops.object.voxel_remesh()


def apply(ob, mod):
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def blur_colours(me, passes):
    """Softens the colour edges on the melted side."""
    col = me.color_attributes["Col"].data
    w = [melt_weight(v.co) for v in me.vertices]
    nbrs = [[] for _ in me.vertices]
    for e in me.edges:
        a, b = e.vertices
        nbrs[a].append(b)
        nbrs[b].append(a)
    c = [Vector(d.color) for d in col]
    for _ in range(passes):
        nxt = list(c)
        for i, ns in enumerate(nbrs):
            if w[i] > 0 and ns:
                avg = sum((c[j] for j in ns), Vector((0, 0, 0, 0))) / len(ns)
                nxt[i] = c[i].lerp(avg, 0.8 * w[i])
        c = nxt
    for d, v in zip(col, c):
        d.color = v


def flank_weight(p):
    """The lower flanks, where the arm, belly and thigh meet."""
    return smoothstep(0.35, 0.5, abs(p.x)) * smoothstep(-0.85, -0.7, p.z) * smoothstep(0.15, 0.0, p.z)


def is_chin_disc(p):
    """A stray pale disc sits under the chin where the head meets the body."""
    return abs(p.x) < 0.11 and -0.46 < p.y < -0.36 and 0.03 < p.z < 0.11


def band_weight(p):
    """The black shoulder band: over the shoulders and across the upper chest and back, so the
    arms read as growing out of one black saddle. 1 inside, easing to 0 at the edges."""
    ax = abs(p.x)
    # The band's lower edge dips at the shoulders, where it meets the arms, and sits under the chin in front.
    low = -0.10 - 0.08 * smoothstep(0.30, 0.62, ax)
    front = smoothstep(0.1, -0.2, p.y)  # 1 on the chest
    low += 0.04 * front
    return smoothstep(low - 0.04, low + 0.04, p.z)


def front_flank_weight(p):
    """The front of the flank behind the resting arm, above the thigh. Painted belly-white so the
    black arms keep their outline instead of merging with black sides."""
    return (smoothstep(0.15, -0.45, p.y) * smoothstep(1.0, 0.6, abs(p.x))
            * smoothstep(-0.55, -0.32, p.z) * smoothstep(0.02, -0.18, p.z))


def paint_shoulder_band(me):
    col = me.color_attributes["Col"].data
    black, white = Vector(BLACK), Vector(BELLY)
    for v in me.vertices:
        c = Vector(col[v.index].color).lerp(white, front_flank_weight(v.co))
        col[v.index].color = c.lerp(black, band_weight(v.co))


def rebuild_body(sc, src):
    shell, rest = split_parts(src.data)

    # Colour source: the shell without its arms, so the side takes the torso's colours.
    armless = shell.copy()
    bmesh.ops.delete(armless, geom=[v for v in armless.verts if arm_dist(v.co) < ARM_RADIUS and abs(v.co.x) > 0.4],
                     context="VERTS")
    armless_me = bpy.data.meshes.new("PA_Armless")
    armless.to_mesh(armless_me)
    armless.free()

    # Close the shell, voxel-remesh it, then melt the old arms into the torso like a sculpt
    # smooth brush. A second remesh cleans up after the melt.
    bmesh.ops.holes_fill(shell, edges=shell.edges[:], sides=0)
    shell_me = bpy.data.meshes.new("PA_BodyShell")
    shell.to_mesh(shell_me)
    shell.free()
    ob = link_new(sc, "PA_BodyShell", shell_me)
    remesh(ob, VOXEL_FUSE)
    vg = ob.vertex_groups.new(name="melt")
    for v in ob.data.vertices:
        w = melt_weight(v.co)
        if w > 0:
            vg.add([v.index], w, "REPLACE")
    melt = ob.modifiers.new("Melt", "SMOOTH")
    melt.factor, melt.iterations, melt.vertex_group = 1.0, MELT_ITERATIONS, "melt"
    apply(ob, melt)
    ob.vertex_groups.clear()
    remesh(ob, VOXEL)
    vg = ob.vertex_groups.new(name="flank")
    for v in ob.data.vertices:
        w = flank_weight(v.co)
        if w > 0:
            vg.add([v.index], w, "REPLACE")
    flank = ob.modifiers.new("Flank", "SMOOTH")
    flank.factor, flank.iterations, flank.vertex_group = 0.5, FLANK_ITERATIONS, "flank"
    apply(ob, flank)
    ob.vertex_groups.clear()

    # Colours back from the armless shell (nearest surface), softened, then decimate.
    ob.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    src_ob = link_new(sc, "PA_ArmlessSrc", armless_me)
    dt = ob.modifiers.new("Colour", "DATA_TRANSFER")
    dt.object = src_ob
    dt.use_vert_data = True
    dt.data_types_verts = {"COLOR_VERTEX"}
    dt.vert_mapping = "POLYINTERP_NEAREST"
    apply(ob, dt)
    bpy.data.objects.remove(src_ob)
    bpy.data.meshes.remove(armless_me)
    blur_colours(ob.data, passes=6)
    paint_shoulder_band(ob.data)
    dec = ob.modifiers.new("Decimate", "DECIMATE")
    dec.ratio = min(1.0, BODY_FACES / len(ob.data.polygons))
    apply(ob, dec)

    # Join the rebuilt shell with the untouched parts (head, ears, legs, nose...).
    loose = [f for f in rest.faces if all(len(e.link_faces) == 1 for e in f.edges)]
    bmesh.ops.delete(rest, geom=loose, context="FACES")
    bmesh.ops.delete(rest, geom=[v for v in rest.verts if is_chin_disc(v.co)], context="VERTS")
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    rest_me = bpy.data.meshes.new("PA_Rest")
    rest.to_mesh(rest_me)
    rest.free()
    bm.from_mesh(rest_me)
    body_me = bpy.data.meshes.new(BODY + "Mesh")
    bm.to_mesh(body_me)
    bm.free()
    bpy.data.objects.remove(ob)
    for m in (shell_me, rest_me):
        bpy.data.meshes.remove(m)
    body = link_new(sc, BODY, body_me)
    body_me.color_attributes.active_color = body_me.color_attributes["Col"]
    for uv in list(body_me.uv_layers):
        body_me.uv_layers.remove(uv)
    for p in body_me.polygons:
        p.use_smooth = True
    body_me.materials.clear()
    body_me.materials.append(plush_material())
    return body


def plush_material():
    """The plush look lives in the vertex colours (the web build bakes fur; spec: "Faces" and ADR 0006)."""
    mat = bpy.data.materials.get("panda_plush") or bpy.data.materials.new("panda_plush")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Col"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Roughness"].default_value = 0.9
    return mat


# ---------- the new arms ----------

ARM_RINGS = 32
ARM_SEGS = 28
SHOULDER_R = 0.22  # the shoulder ball, centred on the arm bone head
WRIST_R = 0.17     # the arm tapers to a wrist...
WRIST_T = 0.78     # ...this far along the bone...
PAW_R = 0.19       # ...then swells into the paw ball, centred on the bone tail
BLACK = (0.018, 0.016, 0.016, 1.0)  # the mean of PlushBase's black fur
BELLY = (0.80, 0.765, 0.703, 1.0)   # PlushBase's belly white
PAD = (0.115, 0.103, 0.095, 1.0)    # the back paws' pad colour


def arm_profile(t):
    """Radius along the arm (t = 0 shoulder ball centre, 1 paw ball centre): a limb that tapers
    to the wrist, not a log."""
    if t < WRIST_T:
        return SHOULDER_R + (WRIST_R - SHOULDER_R) * smoothstep(0.0, WRIST_T, t)
    return WRIST_R + (PAW_R - WRIST_R) * smoothstep(WRIST_T, 1.0, t)


def palm_direction(side, axis):
    """The palm faces whichever way turns toward the viewer (-Y) when the paw is raised to wave."""
    aim = Vector(WAVE_AIM_R)
    if side == "L":
        aim.x = -aim.x
    lift = axis.rotation_difference(aim.normalized())
    palm = lift.inverted() @ Vector((0, -1, 0))
    return (palm - axis * palm.dot(axis)).normalized()


def paint_pads(me, paw, axis, palm):
    """A big pad and three toe pads on the palm side of the paw, like the back paws."""
    across = axis.cross(palm)
    spots = [(paw + palm * PAW_R, 0.085)]
    for k in (-1, 0, 1):
        d = (palm * cos(0.95) + axis * sin(0.95)).normalized()
        d = (d + across * 0.42 * k).normalized()
        spots.append((paw + d * PAW_R, 0.038))
    col = me.color_attributes["Col"].data
    for v in me.vertices:
        for c, r in spots:
            t = smoothstep(r + 0.01, r - 0.01, (v.co - c).length)
            if t > 0:
                col[v.index].color = Vector(col[v.index].color).lerp(Vector(PAD), t)


def build_arm(sc, side):
    a, b = Vector(ARM_HEAD), Vector(ARM_TAIL)
    if side == "R":
        a, b = mirror_x(a), mirror_x(b)
    axis = (b - a).normalized()
    length = (b - a).length
    # A gentle forward curve so the arm hugs the belly rather than cutting straight through it.
    bend = Vector((0, -1, 0)) - axis * axis.dot(Vector((0, -1, 0)))
    bend = bend.normalized() * 0.03 if bend.length > 1e-6 else Vector()
    u = axis.orthogonal().normalized()
    w = axis.cross(u)

    bm = bmesh.new()
    rings = []
    start, end = -SHOULDER_R, length + PAW_R  # hemispherical caps past both ends
    for i in range(1, ARM_RINGS):
        s = start + (end - start) * i / ARM_RINGS
        if s < 0:
            r = (SHOULDER_R ** 2 - s * s) ** 0.5
        elif s > length:
            r = (PAW_R ** 2 - (s - length) ** 2) ** 0.5
        else:
            r = arm_profile(s / length)
        centre = a + axis * s + bend * sin(pi * max(0.0, min(1.0, s / length)))
        rings.append([bm.verts.new(centre + (u * cos(2 * pi * j / ARM_SEGS) + w * sin(2 * pi * j / ARM_SEGS)) * r)
                      for j in range(ARM_SEGS)])
    for r0, r1 in zip(rings, rings[1:]):
        for j in range(ARM_SEGS):
            bm.faces.new((r0[j], r0[(j + 1) % ARM_SEGS], r1[(j + 1) % ARM_SEGS], r1[j]))
    tip0 = bm.verts.new(a - axis * SHOULDER_R)
    tip1 = bm.verts.new(a + axis * (length + PAW_R))
    for j in range(ARM_SEGS):
        bm.faces.new((tip0, rings[0][(j + 1) % ARM_SEGS], rings[0][j]))
        bm.faces.new((tip1, rings[-1][j], rings[-1][(j + 1) % ARM_SEGS]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(f"PA_Arm_{side}Mesh")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(plush_material())
    ob = link_new(sc, f"PA_Arm_{side}", me)
    sub = ob.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = sub.render_levels = 1
    apply(ob, sub)
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for d in col.data:
        d.color = BLACK
    paint_pads(me, b, axis, palm_direction(side, axis))
    return ob


def run():
    sc = ensure_scene()
    body = rebuild_body(sc, bpy.data.objects["PlushBase"])
    arms = [build_arm(sc, s) for s in ("L", "R")]
    return sc, body, arms


if __name__ == "__main__" or True:
    _sc, _body, _arms = run()
    result = {"body_faces": len(_body.data.polygons), "arm_faces": [len(a.data.polygons) for a in _arms]}
