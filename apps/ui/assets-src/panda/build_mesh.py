# Step 1 of the panda asset build. Run inside Blender with design/3d/panda-mascot.blend open:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_mesh.py").read())
# Builds scene "PandaAsset" with PA_Panda: PlushBase with the fused Meshy arms melted back into the
# body shell, plus two separate sewn-on plush arms, PA_Arm_L and PA_Arm_R. Each arm has a
# ball-shaped shoulder centred on its arm bone's head, so it can swing without stretching any skin
# (ticket 01 verdict).
import bpy
import bmesh
from math import cos, sin, pi
from mathutils import Vector

SCENE = "PandaAsset"
BODY = "PA_Panda"

# Blender space: Z up, the panda faces -Y, character left is +X. Model centre is the origin.
SHOULDER = Vector((0.52, 0.18, 0.05))   # arm_L head (shared with build_rig.py)
PAW = Vector((0.74, -0.38, -0.30))      # arm_L tail
ARM_RADIUS = 0.24                       # body-shell verts this close to the arm bone are the old arm
MELT_RADIUS = 0.40                      # the melt fades out by here
MELT_ITERATIONS = 300
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
    return seg(Vector((abs(p.x), p.y, p.z)), SHOULDER, PAW)


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
    dec = ob.modifiers.new("Decimate", "DECIMATE")
    dec.ratio = min(1.0, BODY_FACES / len(ob.data.polygons))
    apply(ob, dec)

    # Join the rebuilt shell with the untouched parts (head, ears, legs, nose...).
    loose = [f for f in rest.faces if all(len(e.link_faces) == 1 for e in f.edges)]
    bmesh.ops.delete(rest, geom=loose, context="FACES")
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

ARM_RINGS = 28
ARM_SEGS = 24
SHOULDER_R = 0.19  # the shoulder ball, centred on the arm bone head
PAW_R = 0.17
BLACK = (0.018, 0.016, 0.016, 1.0)  # the mean of PlushBase's black fur


def arm_profile(t):
    """Radius along the arm (t = 0 shoulder ball centre, 1 paw tip)."""
    mid = 0.155
    if t < 0.5:
        s = t / 0.5
        return SHOULDER_R + (mid - SHOULDER_R) * (s * s * (3 - 2 * s))
    s = (t - 0.5) / 0.5
    return mid + (PAW_R - mid) * (s * s * (3 - 2 * s))


def build_arm(sc, side):
    a, b = (SHOULDER, PAW) if side == "L" else (mirror_x(SHOULDER), mirror_x(PAW))
    axis = (b - a).normalized()
    length = (b - a).length + 0.02
    # A gentle forward curve so the paw rests on the belly, not in it.
    bend = Vector((0, -1, 0)) - axis * axis.dot(Vector((0, -1, 0)))
    bend = bend.normalized() * 0.035 if bend.length > 1e-6 else Vector()
    u = axis.orthogonal().normalized()
    w = axis.cross(u)

    bm = bmesh.new()
    rings = []
    # Hemispherical caps: t runs past the ends by the end radii.
    ts = []
    for i in range(ARM_RINGS + 1):
        k = i / ARM_RINGS
        ts.append(k)
    for i, k in enumerate(ts):
        if k in (0.0, 1.0):
            continue
        # Map k into the cap-extended range so both ends round off.
        start, end = -SHOULDER_R, length + PAW_R
        s = start + (end - start) * k
        if s < 0:
            r = (SHOULDER_R ** 2 - s * s) ** 0.5
        elif s > length:
            r = (PAW_R ** 2 - (s - length) ** 2) ** 0.5
        else:
            r = arm_profile(s / length)
        centre = a + axis * s + bend * sin(pi * max(0.0, min(1.0, s / length)))
        ring = []
        for j in range(ARM_SEGS):
            ang = 2 * pi * j / ARM_SEGS
            ring.append(bm.verts.new(centre + (u * cos(ang) + w * sin(ang)) * max(r, 1e-4)))
        rings.append(ring)
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
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for d in col.data:
        d.color = BLACK
    me.materials.append(plush_material())
    ob = link_new(sc, f"PA_Arm_{side}", me)
    sub = ob.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = sub.render_levels = 1
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier="Subdiv")
    return ob


def run():
    sc = ensure_scene()
    body = rebuild_body(sc, bpy.data.objects["PlushBase"])
    arms = [build_arm(sc, s) for s in ("L", "R")]
    return sc, body, arms


if __name__ == "__main__" or True:
    _sc, _body, _arms = run()
    result = {"body_faces": len(_body.data.polygons), "arm_faces": [len(a.data.polygons) for a in _arms]}
