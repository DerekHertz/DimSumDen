"""Sculpt chubby pandas as single organic meshes.

Run inside Blender (Text editor > Run, or via the Blender MCP):
    exec(open(r"D:/claude_sessions/agent_office/design/3d/panda_build.py").read())
    build_panda("Panda")                                   # the default mascot
    build_panda("Dev", pose={"arm_R": ...}, at=(3, 0, 0))  # a variant

Method: metaball ellipsoids blend into one surface -> voxel remesh -> smooth.
Markings are painted into a vertex color attribute "Col" from region tests, so
they survive glTF export. Poses are data: override any POSE key per panda.
"""
import bpy, bmesh, math
from mathutils import Vector, Matrix

POSE = {
    # limb = (start, end, start radius, end radius); _L limbs are mirrored to -x
    "arm_L": ((0.62, -0.02, 1.02), (0.86, -0.3, 0.62), 0.2, 0.17),
    "arm_R": ((0.62, -0.02, 1.02), (0.86, -0.3, 0.62), 0.2, 0.17),
    "leg_L": ((0.42, -0.35, 0.2), (0.52, -0.82, 0.19), 0.21, 0.2),
    "leg_R": ((0.42, -0.35, 0.2), (0.52, -0.82, 0.19), 0.21, 0.2),
    "ear": (0.44, 0.0, 1.95),
    "head": (0.0, -0.12, 1.5),
    "eye_open": 1.0,   # 1 = round bead, ~0.3 = content squint
    "fluff": 1.0,      # tuft length multiplier; 0 = smooth vinyl
}

WHITE = Vector((0.9, 0.84, 0.74))
BLACK = Vector((0.014, 0.012, 0.013))
PAD = Vector((0.45, 0.28, 0.22))
BLUSH = Vector((0.95, 0.42, 0.42))
NOSE = Vector((0.005, 0.005, 0.006))


def mirror(p, s):
    return (s * p[0], p[1], p[2])


def limbs(pose):
    """Yield (name, side, start, end, r0, r1) in object space."""
    for kind in ("arm", "leg"):
        for s, tag in ((-1, "L"), (1, "R")):
            a, b, r0, r1 = pose[f"{kind}_{tag}"]
            yield kind, s, mirror(a, s), mirror(b, s), r0, r1


def build_meta(name, pose):
    mb = bpy.data.metaballs.get(name + "Meta") or bpy.data.metaballs.new(name + "Meta")
    mb.elements.clear()
    mb.resolution, mb.render_resolution, mb.threshold = 0.03, 0.02, 0.6
    obj = bpy.data.objects.get(name + "Meta")
    if not obj:
        obj = bpy.data.objects.new(name + "Meta", mb)
        bpy.context.scene.collection.objects.link(obj)
    obj.hide_viewport = obj.hide_render = False

    # A metaball's visible surface sits well inside its radius; f() converts
    # the intended surface radius to a field radius for a given stiffness.
    f = lambda s: math.sqrt(1 - (mb.threshold / s) ** (1 / 3))

    def ball(co, R, s=5.0):
        e = mb.elements.new(type='BALL'); e.co = co; e.stiffness = s; e.radius = R / f(s)

    def ell(co, rx, ry, rz, s=5.0):
        e = mb.elements.new(type='ELLIPSOID'); e.co = co; e.stiffness = s
        m = max(rx, ry, rz); e.radius = m / f(s)
        e.size_x, e.size_y, e.size_z = rx / m, ry / m, rz / m

    ell((0, 0.05, 0.6), 0.74, 0.68, 0.64, 3.0)      # body
    ell((0, -0.12, 0.4), 0.68, 0.6, 0.42, 3.0)      # belly
    ell(pose["head"], 0.62, 0.54, 0.5)
    hx, hy, hz = pose["head"]
    for s in (-1, 1):
        ball((hx + s * 0.27, hy - 0.22, hz - 0.12), 0.27)      # cheeks
        ex, ey, ez = pose["ear"]
        ell((hx + s * ex, hy + 0.12 + ey, ez + hz - 1.5), 0.17, 0.1, 0.16)
    for kind, s, a, b, r0, r1 in limbs(pose):
        a, b = Vector(a), Vector(b); n = 7 if kind == "arm" else 6
        for i in range(n):
            t = i / (n - 1); ball(a.lerp(b, t), r0 + (r1 - r0) * t)
    ball((hx, hy - 0.48, hz - 0.12), 0.13)                     # muzzle
    ball((0, 0.7, 0.28), 0.12, 4.0)                            # tail
    if pose.get("fluff", 1.0) > 0:
        add_tufts(mb, pose, f)
    return obj


def add_tufts(mb, pose, f):
    """Cartoon fur: pointed tufts that break the silhouette into scallops.

    Each tuft is an ellipsoid whose long axis points outward from the surface;
    low stiffness lets it melt into the body so the tip reads as a soft point.
    """
    amt = pose.get("fluff", 1.0)
    hx, hy, hz = pose["head"]

    def tuft(base, direction, length, width, s=3.0):
        d = Vector(direction).normalized()
        e = mb.elements.new(type='ELLIPSOID'); e.stiffness = s
        L, W = length * amt, width
        e.co = Vector(base) + d * L * 0.35
        e.radius = L / f(s); e.size_x, e.size_y, e.size_z = 1.0, W / L, W / L
        e.rotation = Vector((1, 0, 0)).rotation_difference(d)

    black = pose.setdefault("_black_tufts", [])
    for s in (-1, 1):
        # cheek fluff: three short scallops low on each cheek, fanning downward
        for dz, tilt, L in ((-0.02, -0.15, 0.13), (-0.16, -0.6, 0.12), (-0.28, -1.1, 0.1)):
            tuft((hx + s * (0.56 + dz * 0.25), hy - 0.2, hz + dz), (s * 1.0, -0.25, tilt), L, 0.085)
        # elbow tufts on the outside of each arm (painted black with the arm)
        a, b, *_ = pose["arm_R" if s > 0 else "arm_L"]
        a = Vector(mirror(a, s)); b = Vector(mirror(b, s)); mid = a.lerp(b, 0.5)
        out = Vector((s, 0.4, -0.35)).normalized()
        base = mid + out * 0.1
        tuft(base, out, 0.17, 0.08)
        black.append(tuple(base + out * 0.12))
    # crown cowlick: one tuft curling forward, one smaller beside it (off under hats)
    if pose.get("crown", True):
        tuft((hx - 0.02, hy + 0.0, hz + 0.45), (-0.15, -0.55, 1.0), 0.2, 0.065)
        tuft((hx + 0.1, hy + 0.06, hz + 0.43), (0.5, -0.1, 1.0), 0.13, 0.055)
    # tail puff
    tuft((0, 0.72, 0.3), (0, 1, 0.3), 0.12, 0.08)


def to_mesh(name, src, at):
    scn = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(dg))
    old = bpy.data.objects.get(name)
    if old:
        for c in list(old.children):
            bpy.data.objects.remove(c, do_unlink=True)
        bpy.data.objects.remove(old, do_unlink=True)
    p = bpy.data.objects.new(name, me); scn.collection.objects.link(p)
    src.hide_viewport = src.hide_render = True
    me.remesh_voxel_size = 0.015
    for o in scn.objects: o.select_set(False)
    bpy.context.view_layer.objects.active = p; p.select_set(True)
    bpy.ops.object.voxel_remesh()
    bpy.ops.object.shade_smooth()
    m = p.modifiers.new("Smooth", 'CORRECTIVE_SMOOTH')
    m.factor, m.iterations, m.use_only_smooth = 0.5, 10, True
    bpy.ops.object.modifier_apply(modifier="Smooth")
    me.materials.append(fur_material())
    zmin = min(v.co.z for v in me.vertices)
    p.location = (at[0], at[1], at[2] - zmin)
    return p


def fur_material():
    mat = bpy.data.materials.get("PandaFur")
    if mat: return mat
    mat = bpy.data.materials.new("PandaFur"); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    ca = nt.nodes.new("ShaderNodeVertexColor"); ca.layer_name = "Col"
    nt.links.new(ca.outputs["Color"], bsdf.inputs["Base Color"]); nt.links.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Sheen Weight"].default_value = 0.15
    bsdf.inputs["Subsurface Weight"].default_value = 0.08
    return mat


def paint(p, pose):
    me = p.data
    def seg(pt, a, b):
        a, b = Vector(a), Vector(b); ab = b - a
        t = max(0, min(1, (pt - a).dot(ab) / ab.length_squared)); return (a + ab * t - pt).length
    def sm(e0, e1, x):
        t = max(0, min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
    def ell(pt, c, r, rot=0.0):
        d = Matrix.Rotation(-rot, 3, 'Y') @ (pt - Vector(c))
        return math.sqrt((d.x / r[0]) ** 2 + (d.y / r[1]) ** 2 + (d.z / r[2]) ** 2)

    hx, hy, hz = pose["head"]; ex, ey, ez = pose["ear"]
    L = list(limbs(pose))
    feet = []
    for kind, s, a, b, *_ in L:
        if kind == "leg":
            feet.append(Vector(b) + (Vector(b) - Vector(a)).normalized() * 0.18)
    attr = me.color_attributes.get("Col") or me.color_attributes.new("Col", 'FLOAT_COLOR', 'POINT')
    cols = [0.0] * (len(me.vertices) * 4)
    for v in me.vertices:
        co, n, k = v.co, v.normal, 0.0
        for s in (-1, 1):
            k = max(k, 1 - sm(0.2, 0.25, (co - Vector((hx + s * ex, hy + 0.12 + ey, ez + hz - 1.5))).length))
            k = max(k, 1 - sm(0.95, 1.03, ell(co, (hx + s * 0.25, hy - 0.43, hz - 0.03), (0.15, 0.25, 0.2), s * 0.6)))
        for kind, s, a, b, *_ in L:
            if kind == "arm":
                k = max(k, 1 - sm(0.25, 0.28, seg(co, a, b)))
            else:
                foot = Vector(b) + (Vector(b) - Vector(a)).normalized() * 0.18
                k = max(k, 1 - sm(0.28, 0.31, seg(co, a, foot)))
        for t in pose.get("_black_tufts", []):
            k = max(k, 1 - sm(0.16, 0.2, (co - Vector(t)).length))
        if co.y > -0.35:  # shoulder band over the back
            band = 1 - sm(0.13, 0.16, abs(co.z - (1.0 - 0.08 * max(0, co.y))))
            k = max(k, band * sm(-0.35, -0.2, co.y))
        c = WHITE.lerp(BLACK, k)
        c = c.lerp(NOSE, 1 - sm(0.95, 1.03, ell(co, (hx, hy - 0.62, hz - 0.06), (0.08, 0.06, 0.055))))
        for s in (-1, 1):
            bk = (1 - sm(0.0, 0.12, (co - Vector((hx + s * 0.37, hy - 0.48, hz - 0.2))).length)) * 0.55
            c = c.lerp(BLUSH, bk * (1 - k))
        for foot in feet:
            pk = (1 - sm(0.1, 0.14, (co - foot).length)) * sm(0.5, 0.8, -n.y)
            c = c.lerp(PAD, pk)
        i = v.index * 4; cols[i:i + 4] = (c.x, c.y, c.z, 1.0)
    attr.data.foreach_set("color", cols)
    me.color_attributes.active_color = attr


def eye_material():
    m = bpy.data.materials.get("PandaEye")
    if m: return m
    m = bpy.data.materials.new("PandaEye"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1)
    b.inputs["Roughness"].default_value = 0.08; b.inputs["Coat Weight"].default_value = 1.0
    return m


def add_eyes(p, pose):
    hx, hy, hz = pose["head"]
    bpy.context.view_layer.update()
    for s, tag in ((-1, "L"), (1, "R")):
        name = f"{p.name}_Eye_{tag}"
        origin = p.matrix_world @ Vector((hx + s * 0.22, -3, hz + 0.02))
        ok, loc, nrm, _ = p.ray_cast(p.matrix_world.inverted() @ origin, Vector((0, 1, 0)))
        if not ok: continue
        me = bpy.data.meshes.new(name); bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=0.055)
        bm.to_mesh(me); bm.free()
        for poly in me.polygons: poly.use_smooth = True
        me.materials.append(eye_material())
        e = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(e)
        e.parent = p
        e.location = loc - nrm * 0.02
        e.scale = (1, 0.6, 1.15 * pose["eye_open"])


def build_panda(name="Panda", pose=None, at=(0, 0, 0)):
    full = dict(POSE); full.update(pose or {})
    p = to_mesh(name, build_meta(name, full), at)
    paint(p, full)
    add_eyes(p, full)
    p["pose"] = str(full)
    return p
