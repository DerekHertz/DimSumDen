# PROTOTYPE (ticket 01, throwaway). Run after build_rig.py and build_clips.py, inside Blender:
#   exec(open(r"<repo>/prototypes/motion-test/blender/export_glb.py").read())
# Writes ../panda-motion-test.glb (rig + mesh + every action as a named animation)
# and ../panda-motion-test.blend (just the MotionTest scene).
import bpy
import os

# Set MOTION_TEST_DIR in the exec globals to write elsewhere.
OUT_DIR = globals().get("MOTION_TEST_DIR") or r"D:\claude_sessions\agent_office\.claude\worktrees\motion-test-prototype-7828b7\prototypes\motion-test"
GLB = os.path.join(OUT_DIR, "panda-motion-test.glb")
BLEND = os.path.join(OUT_DIR, "blender", "panda-motion-test.blend")

sc = bpy.data.scenes["MotionTest"]
bpy.context.window.scene = sc
rig = bpy.data.objects["MT_Rig"]
mesh = bpy.data.objects["MT_Panda"]

# Vertex colours carry the plush look (the source material's face texture is not needed here).
me = mesh.data
if "WDebug" in me.color_attributes:
    me.color_attributes.remove(me.color_attributes["WDebug"])
me.color_attributes.active_color = me.color_attributes["Col"]
mat = bpy.data.materials.get("MT_PlushVC") or bpy.data.materials.new("MT_PlushVC")
if not mat.node_tree:
    mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes.get("Principled BSDF")
vc = nt.nodes.get("Color Attribute") or nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.9
me.materials.clear()
me.materials.append(mat)

# Rest pose, no active action, so the exported node defaults are the bind pose.
rig.animation_data_create()
rig.animation_data.action = None
for pb in rig.pose.bones:
    pb.matrix_basis.identity()
sc.frame_set(0)

for o in sc.objects:
    o.select_set(o in (rig, mesh))
bpy.context.view_layer.objects.active = rig

bpy.ops.export_scene.gltf(
    filepath=GLB,
    export_format="GLB",
    use_selection=True,
    use_active_scene=True,           # other scenes in panda-mascot.blend have their own selections
    export_animation_mode="ACTIONS",
    export_def_bones=False,          # keep the paw/hat sockets (non-deform bones)
    export_vertex_color="ACTIVE",
    export_all_vertex_colors=False,
    export_texcoords=False,
    export_morph=False,
    export_anim_slide_to_zero=True,
    export_force_sampling=True,
    export_frame_range=False,
    export_yup=True,
    export_image_format="NONE",
)

keep = {sc, rig, rig.data, mesh, me, mat, bpy.data.objects["MT_Cam"]}
keep |= {a for a in bpy.data.actions if a.use_fake_user and a.name in {
    "breathe", "paw_raise", "waddle", "doze", "hop", "wave",
    "sit_still", "arms_folded", "lean_back", "slump"}}
bpy.data.libraries.write(BLEND, keep, fake_user=True, compress=True)
result = {"glb": GLB, "glb_bytes": os.path.getsize(GLB), "blend": BLEND, "blend_bytes": os.path.getsize(BLEND)}
