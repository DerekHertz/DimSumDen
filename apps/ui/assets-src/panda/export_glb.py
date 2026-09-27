# Step 5 of the panda asset build. Run after build_clips.py, inside Blender:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/export_glb.py").read(), {"PANDA_SRC": r"<repo>/apps/ui/assets-src/panda"})
# Writes apps/ui/public/models/panda.glb (rig, mesh, face decal + atlas, every action as a named
# animation, extras for the face atlas and clip metadata) and panda.blend (just the PandaAsset scene).
# Check the result with: npm test
import bpy
import os

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
GLB = os.path.normpath(os.path.join(SRC, "..", "..", "public", "models", "panda.glb"))
BLEND = os.path.join(SRC, "panda.blend")

CLIPS = ["sit_still", "breathe", "blink", "paw_raise", "arms_folded", "slump", "lean_back", "doze", "wave",
         "hop", "waddle", "fan_tap_and_point", "scroll_unroll", "blueprint_unroll"]

sc = bpy.data.scenes["PandaAsset"]
bpy.context.window.scene = sc
rig = bpy.data.objects["PA_Rig"]
body = bpy.data.objects["PA_Panda"]
face = bpy.data.objects["face"]

# Rest pose, no active action, so the exported node defaults are the bind pose.
rig.animation_data_create()
rig.animation_data.action = None
for pb in rig.pose.bones:
    pb.matrix_basis.identity()
sc.frame_set(0)

# Only this asset's actions go in the glb (panda-mascot.blend holds other scenes' actions too).
for a in bpy.data.actions:
    a.use_fake_user = a.name in CLIPS
missing = [c for c in CLIPS if c not in bpy.data.actions]
assert not missing, f"run build_clips.py first; missing {missing}"

for o in sc.objects:
    o.select_set(o in (rig, body, face))
bpy.context.view_layer.objects.active = rig
os.makedirs(os.path.dirname(GLB), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=GLB,
    export_format="GLB",
    use_selection=True,
    use_active_scene=True,           # other scenes in panda-mascot.blend have their own selections
    export_extras=True,              # face atlas + clip loop/faceFrames metadata
    export_animation_mode="ACTIONS",
    export_def_bones=False,          # keep the paw/hat sockets (non-deform bones)
    export_vertex_color="ACTIVE",
    export_all_vertex_colors=False,
    export_texcoords=True,
    export_morph=False,
    export_anim_slide_to_zero=True,
    export_force_sampling=True,
    export_frame_range=False,
    export_yup=True,
    export_image_format="AUTO",
)

keep = {sc, rig, rig.data, body, body.data, face, face.data}
keep |= {m for o in (body, face) for m in o.data.materials}
keep |= {bpy.data.images["face_atlas"]}
keep |= {bpy.data.actions[c] for c in CLIPS}
bpy.data.libraries.write(BLEND, keep, fake_user=True, compress=True)
result = {"glb": GLB, "glb_bytes": os.path.getsize(GLB), "blend": BLEND, "blend_bytes": os.path.getsize(BLEND)}
