"""Toon-vinyl look: a soft 3-band light ramp, warm shadows, a rim light, an ink outline.

Run inside Blender after the models exist:
    exec(open(r"D:/claude_sessions/agent_office/design/3d/toon.py").read())
    apply_toon()

This is the look target for the three.js material (MeshToonMaterial with a
3-step gradient map + an inverted-hull outline); the numbers below carry over.
"""
import bpy

RAMP = [(0.0, (0.62, 0.55, 0.58)), (0.32, (0.84, 0.8, 0.8)), (0.55, (1.0, 1.0, 1.0))]  # shadow is warm-violet, not grey
RIM = 0.18
FUZZ = 0.35  # fur bump strength on PandaFur only
OUTLINE_HEX = "#2a1f1c"
OUTLINE_WIDTH = 0.018
SKIP = {"PandaEye", "Ground", "ToonOutline", "Qi", "Grass", "ContactShadow"}


def toon_group():
    g = bpy.data.node_groups.get("ToonShade")
    if g: return g
    g = bpy.data.node_groups.new("ToonShade", 'ShaderNodeTree')
    g.interface.new_socket("Color", in_out='INPUT', socket_type='NodeSocketColor')
    g.interface.new_socket("Shader", in_out='OUTPUT', socket_type='NodeSocketShader')
    n, l = g.nodes, g.links
    gi = n.new("NodeGroupInput"); go = n.new("NodeGroupOutput")
    diff = n.new("ShaderNodeBsdfDiffuse")
    s2r = n.new("ShaderNodeShaderToRGB")
    bw = n.new("ShaderNodeRGBToBW")
    ramp = n.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = 'EASE'
    els = ramp.color_ramp.elements
    while len(els) > 1: els.remove(els[-1])
    els[0].position, els[0].color = RAMP[0][0], (*RAMP[0][1], 1)
    for pos, col in RAMP[1:]:
        e = els.new(pos); e.color = (*col, 1)
    mul = n.new("ShaderNodeMix"); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1
    lw = n.new("ShaderNodeLayerWeight"); lw.inputs[0].default_value = 0.25
    rimramp = n.new("ShaderNodeMapRange"); rimramp.inputs[1].default_value = 0.55; rimramp.inputs[2].default_value = 0.75
    rimramp.inputs[4].default_value = RIM
    add = n.new("ShaderNodeMix"); add.data_type = 'RGBA'; add.blend_type = 'ADD'
    add.inputs[7].default_value = (1, 0.97, 0.9, 1)
    emit = n.new("ShaderNodeEmission")
    l.new(diff.outputs[0], s2r.inputs[0])
    # fur: fine stretched noise bumps the shading normal, so band edges break up like fur
    g.interface.new_socket("Fuzz", in_out='INPUT', socket_type='NodeSocketFloat')
    tc = n.new("ShaderNodeTexCoord"); mp = n.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.0, 1.0, 3.0)
    noise = n.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 60.0
    noise.inputs["Detail"].default_value = 4.0; noise.inputs["Roughness"].default_value = 0.7
    bump = n.new("ShaderNodeBump"); bump.inputs["Distance"].default_value = 0.02
    l.new(tc.outputs["Object"], mp.inputs[0]); l.new(mp.outputs[0], noise.inputs[0])
    l.new(noise.outputs["Fac"], bump.inputs["Height"]); l.new(gi.outputs[1], bump.inputs["Strength"])
    l.new(bump.outputs[0], diff.inputs["Normal"])
    l.new(s2r.outputs[0], bw.inputs[0]); l.new(bw.outputs[0], ramp.inputs[0])
    l.new(gi.outputs[0], mul.inputs[6]); l.new(ramp.outputs[0], mul.inputs[7])
    l.new(lw.outputs["Facing"], rimramp.inputs[0]); l.new(rimramp.outputs[0], add.inputs[0])
    l.new(mul.outputs[2], add.inputs[6])
    l.new(add.outputs[2], emit.inputs[0]); l.new(emit.outputs[0], go.inputs[0])
    return g


def toonify(mat):
    if mat.name.endswith("·dormant"): return   # dormant twins are built from toon materials already
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    src = out.inputs[0].links[0].from_node if out.inputs[0].links else None
    if src and src.type == 'GROUP': return
    if src is None:  # re-toonifying: the original Principled is still in the tree
        src = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    grp = nt.nodes.new("ShaderNodeGroup"); grp.node_tree = toon_group()
    if src and src.type == 'BSDF_PRINCIPLED':
        bc = src.inputs["Base Color"]
        if bc.links: nt.links.new(bc.links[0].from_socket, grp.inputs[0])
        else: grp.inputs[0].default_value = bc.default_value
    grp.inputs["Fuzz"].default_value = FUZZ if mat.name == "PandaFur" else 0.0
    nt.links.new(grp.outputs[0], out.inputs[0])


def outline_material():
    m = bpy.data.materials.get("ToonOutline")
    if m: return m
    m = bpy.data.materials.new("ToonOutline"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    h = OUTLINE_HEX.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    e = nt.nodes.new("ShaderNodeEmission"); e.inputs[0].default_value = (*c, 1)
    o = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(e.outputs[0], o.inputs[0])
    m.use_backface_culling = True
    return m


def add_outline(obj, width=OUTLINE_WIDTH):
    if obj.modifiers.get("Outline"): return
    om = outline_material()
    if om.name not in obj.data.materials: obj.data.materials.append(om)
    m = obj.modifiers.new("Outline", 'SOLIDIFY')
    m.thickness = width; m.offset = 1; m.use_flip_normals = True; m.use_rim = False
    m.material_offset = len(obj.data.materials) - 1


def apply_toon(root_prefixes=("Panda", "Cell_", "Orch_", "Prod_", "Arch_", "Dev_", "Scout_", "Sec_", "QA_")):
    scn = bpy.context.scene
    scn.view_settings.view_transform = 'Standard'; scn.view_settings.look = 'None'
    for m in bpy.data.materials:
        if m.name in SKIP or not m.use_nodes: continue
        toonify(m)
    for o in scn.objects:
        if o.type != 'MESH' or not o.name.startswith(root_prefixes): continue
        if "_Eye_" in o.name or o.name.startswith("Eye_") or "Screen" in o.name: continue
        add_outline(o, OUTLINE_WIDTH if o.name.startswith(("Panda", "Cell_")) else OUTLINE_WIDTH * 0.6)
