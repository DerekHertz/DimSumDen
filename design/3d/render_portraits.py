"""Render transparent 3/4 isometric portraits of each panda, one at a time.

Run inside Blender after the models exist:
    exec(open(r"D:/claude_sessions/agent_office/design/3d/render_portraits.py").read())
    render_portraits()                       # all
    render_portraits(["Cell_Security"])      # some
"""
import bpy, math, os
from mathutils import Vector

OUT = "D:/claude_sessions/agent_office/design/3d/renders/portraits"
ROOTS = {
    "Panda": "mascot", "Cell_Orchestrator": "orchestrator", "Cell_Product": "product",
    "Cell_Architect": "architect", "Cell_Developer": "developer", "Cell_Scout": "scout",
    "Cell_Security": "security", "Cell_QA": "qa",
}
HIDDEN_ALWAYS = {"Orch_FanRibs"}


def set_vis(root, vis):
    o = bpy.data.objects.get(root)
    if not o: return
    o.hide_render = not vis
    for c in o.children_recursive:
        c.hide_render = (not vis) or c.name in HIDDEN_ALWAYS


def render_portraits(names=None, az_deg=-68, el_deg=24, scale=3.8):
    scn = bpy.context.scene; cam = bpy.data.objects["Cam"]
    os.makedirs(OUT, exist_ok=True)
    scn.render.film_transparent = True
    scn.render.resolution_x = scn.render.resolution_y = 800
    g = bpy.data.objects.get("Ground")
    if g: g.hide_render = True
    key, fill, rim = (bpy.data.objects[n] for n in ("Key", "Fill", "Rim"))
    az, el = math.radians(az_deg), math.radians(el_deg)
    d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    for name in names or list(ROOTS):
        for r in ROOTS: set_vis(r, r == name)
        base = bpy.data.objects[name].location.copy()
        target = Vector((base.x, base.y, 1.2))
        cam.location = target + d * 20
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.ortho_scale = scale
        for l, off in ((key, (3, -4, 6)), (fill, (-5, -2, 3)), (rim, (0, 5, 4))):
            l.location = base + Vector(off)
            l.rotation_euler = (base + Vector((0, 0, 0.8)) - l.location).to_track_quat('-Z', 'Y').to_euler()
        scn.render.filepath = f"{OUT}/{ROOTS[name]}.png"
        bpy.ops.render.render(write_still=True)
    for r in ROOTS: set_vis(r, True)
