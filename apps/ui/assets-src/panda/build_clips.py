# Step 3 of the panda asset build. Run after build_rig.py, inside Blender:
#   exec(open(r"<repo>/apps/ui/assets-src/panda/build_clips.py").read())
# Authors every clip as a Blender action on PA_Rig, 30 fps. All clips stay in place (travel is procedural).
# Clip timing uses the design tokens: dur-breath 2.8 s = 84 f, dur-heartbeat 1.2 s = 36 f.
# Action custom properties export as glTF animation extras:
#   loop: the clip repeats (the asset contract holds it to at least dur-heartbeat).
#   faceFrames: [{t: seconds, frame: name}, ...] face-atlas frames the clip selects; "" hands the face back.
import bpy
import os
from mathutils import Quaternion, Vector
from math import radians

SRC = globals().get("PANDA_SRC") or os.path.dirname(globals().get("__file__", ""))
exec(open(os.path.join(SRC, "rig_spec.py")).read(), globals())  # WAVE_AIM_R

RIG = bpy.data.objects["PA_Rig"]
FPS = 30
BREATH = 84
BEAT = 36

X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
# Blender space: the panda faces -Y. Tilting "forward" (nose down) is +X rotation.


def rest_q(bone):
    return RIG.data.bones[bone].matrix_local.to_quaternion()


def W(bone, axis, deg):
    """A rotation about a world axis through the bone head, as a local pose rotation."""
    R = rest_q(bone)
    return R.inverted() @ Quaternion(axis, radians(deg)) @ R


def AIM(bone, target_dir, extra=None):
    """Swing the bone from its rest direction to point along target_dir (world)."""
    b = RIG.data.bones[bone]
    rest_dir = (b.tail_local - b.head_local).normalized()
    qw = rest_dir.rotation_difference(Vector(target_dir).normalized())
    if extra:
        qw = qw @ Quaternion(rest_dir, radians(extra))  # twist about the rest axis first
    R = rest_q(bone)
    return R.inverted() @ qw @ R


def OUT(side, deg):
    """Swing an arm outward/up (sideways) by deg; negative swings it in."""
    return W("arm_" + side, Y, -deg if side == "L" else deg)


def UP(bone, dz):
    """World-up translation as a local pose location."""
    return rest_q(bone).inverted() @ Vector((0, 0, dz))


def SQ(height, width):
    """Scale for a vertical bone (local Y is world up)."""
    return Vector((width, height, width))


def mul(*qs):
    out = Quaternion()
    for q in qs:
        out = out @ q
    return out


def key_clip(name, frames, end, loop=False, face=None):
    """frames: {frame: {bone: {"rot": Quaternion, "loc": Vector, "scale": Vector}}}.
    Every bone is keyed at every listed frame; unlisted channels go back to rest."""
    old = bpy.data.actions.get(name)
    if old:
        bpy.data.actions.remove(old)
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    RIG.animation_data_create()
    RIG.animation_data.action = act
    for f in sorted(frames):
        pose = frames[f]
        for pb in RIG.pose.bones:
            ch = pose.get(pb.name, {})
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = ch.get("rot", Quaternion())
            pb.location = ch.get("loc", Vector())
            pb.scale = ch.get("scale", Vector((1, 1, 1)))
            pb.keyframe_insert("rotation_quaternion", frame=f, group=pb.name)
            pb.keyframe_insert("location", frame=f, group=pb.name)
            pb.keyframe_insert("scale", frame=f, group=pb.name)
    act.use_frame_range = True
    act.frame_start, act.frame_end = 0, end
    act.use_cyclic = loop
    act["loop"] = loop
    if face:
        act["faceFrames"] = [{"t": round(f / FPS, 4), "frame": fr} for f, fr in face]
    elif "faceFrames" in act:
        del act["faceFrames"]
    RIG.animation_data.action = None
    return act


def hold(name, pose, end=BEAT):
    return key_clip(name, {0: pose, end: pose}, end)


# ---------- loops ----------

def breathe(name="breathe", length=BREATH, extra=None, face=None):
    extra = extra or {}
    rest = {k: dict(v) for k, v in extra.items()}
    peak = {k: dict(v) for k, v in extra.items()}
    peak.setdefault("body", {})["scale"] = SQ(1.025, 1.04)
    peak.setdefault("head", {})["scale"] = Vector((1 / 1.02, 1 / 1.01, 1 / 1.02))
    peak["head"]["rot"] = mul(extra.get("head", {}).get("rot", Quaternion()), W("head", X, -1.5))
    for s in ("L", "R"):
        peak.setdefault("arm_" + s, {})["rot"] = mul(OUT(s, 3), extra.get("arm_" + s, {}).get("rot", Quaternion()))
    return key_clip(name, {0: rest, length // 2: peak, length: rest}, length, loop=True, face=face)


def paw_raise():
    up = AIM("arm_R", (-0.3, -0.75, 0.55))
    wave_a = mul(W("arm_R", Y, -7), up)
    wave_b = mul(W("arm_R", Y, 7), up)
    head = W("head", Y, -5)  # tilt toward the raised paw
    low = {"arm_R": {"rot": wave_a}, "head": {"rot": head}}
    high = {"arm_R": {"rot": wave_b}, "head": {"rot": mul(head, W("head", X, -3))},
            "root": {"loc": UP("root", 0.045)}}
    return key_clip("paw_raise", {0: low, BEAT // 2: high, BEAT: low}, BEAT, loop=True)


def waddle():
    def step(side):  # side +1: lean onto the left foot, lift the right
        lift = "leg_R" if side > 0 else "leg_L"
        plant = "leg_L" if side > 0 else "leg_R"
        return {
            "root": {"rot": mul(W("root", Y, side * 7), W("root", Z, side * 4)), "loc": UP("root", 0.035)},
            lift: {"rot": W(lift, X, -22)},
            plant: {"rot": W(plant, X, 4)},
            "arm_L": {"rot": W("arm_L", X, side * 10)},
            "arm_R": {"rot": W("arm_R", X, -side * 10)},
            "head": {"rot": W("head", Y, -side * 3)},
        }
    mid = {"root": {"scale": SQ(0.985, 1.01)}}
    return key_clip("waddle", {0: mid, 9: step(1), 18: mid, 27: step(-1), 36: mid}, BEAT, loop=True)


def doze():
    nod = {"head": {"rot": W("head", X, 12)},
           "ear_L": {"rot": W("ear_L", Y, 12)}, "ear_R": {"rot": W("ear_R", Y, -12)}}
    return breathe("doze", BREATH * 2, nod, face=[(0, "sleepy")])


# ---------- one-shots ----------

def blink():
    """The eyes close for 4 frames; the ears give the smallest flick so the clip has a body."""
    flick = {"ear_L": {"rot": W("ear_L", Y, 4)}, "ear_R": {"rot": W("ear_R", Y, -4)}}
    return key_clip("blink", {0: {}, 2: flick, 6: {}}, 6, face=[(0, "blink"), (4, "")])


def hop():
    arms_back = lambda d: {"arm_L": {"rot": W("arm_L", X, d)}, "arm_R": {"rot": W("arm_R", X, d)}}
    arms_up = lambda d: {"arm_L": {"rot": OUT("L", d)}, "arm_R": {"rot": OUT("R", d)}}
    tuck = lambda d: {"leg_L": {"rot": W("leg_L", X, d)}, "leg_R": {"rot": W("leg_R", X, d)}}
    f = {
        0: {},
        6: {"root": {"scale": SQ(0.82, 1.10)}, "head": {"rot": W("head", X, 6)}, **arms_back(12)},
        10: {"root": {"scale": SQ(1.12, 0.94)}, "head": {"rot": W("head", X, -4)}, **arms_up(35), **tuck(18)},
        16: {"root": {"scale": SQ(1.03, 0.99)}, **arms_up(25), **tuck(12)},
        22: {"root": {"scale": SQ(1.07, 0.96)}, **arms_up(15), **tuck(-6)},
        25: {"root": {"scale": SQ(0.80, 1.12)}, "head": {"rot": W("head", X, 5)}, **arms_up(-5)},
        30: {"root": {"scale": SQ(1.04, 0.98)}, "head": {"rot": W("head", X, -2)}},
        36: {},
    }
    return key_clip("hop", f, BEAT)


def wave():
    up = AIM("arm_R", WAVE_AIM_R)  # the palm faces the viewer at this aim (see build_mesh.py)
    a = {"arm_R": {"rot": mul(W("arm_R", Y, -22), up)}, "head": {"rot": W("head", Y, -6)}}
    b = {"arm_R": {"rot": mul(W("arm_R", Y, 22), up)}, "head": {"rot": W("head", Y, -6)}}
    return key_clip("wave", {0: {}, 10: a, 18: b, 26: a, 34: b, 42: a, 56: {}}, 56)


# ---------- held poses ----------

POSES = {
    "sit_still": {},
    "arms_folded": {
        # The paws cross in front of the belly; the right arm tucks under the left.
        "arm_L": {"rot": AIM("arm_L", (-0.50, -1.0, -0.22))},
        "arm_R": {"rot": AIM("arm_R", (0.50, -1.0, -0.36))},
        "head": {"rot": mul(W("head", Z, 12), W("head", X, 4))},
    },
    "lean_back": {
        "root": {"rot": W("root", X, -9)},
        "head": {"rot": W("head", X, -8)},
        "arm_L": {"rot": OUT("L", 10)}, "arm_R": {"rot": OUT("R", 10)},
        "leg_L": {"rot": W("leg_L", X, -10)}, "leg_R": {"rot": W("leg_R", X, -10)},
    },
    "slump": {
        "body": {"rot": W("body", X, 8), "scale": SQ(0.96, 1.02)},
        "head": {"rot": W("head", X, 18)},
        "arm_L": {"rot": AIM("arm_L", (0.25, -0.25, -0.93))},
        "arm_R": {"rot": AIM("arm_R", (-0.25, -0.25, -0.93))},
        "ear_L": {"rot": W("ear_L", Y, 28)}, "ear_R": {"rot": W("ear_R", Y, -28)},
    },
}


def run():
    bpy.context.scene.render.fps = FPS
    made = [breathe(), paw_raise(), waddle(), doze(), blink(), hop(), wave()]
    made += [hold(n, p) for n, p in POSES.items()]
    for pb in RIG.pose.bones:
        pb.rotation_quaternion, pb.location, pb.scale = Quaternion(), Vector(), Vector((1, 1, 1))
    return {a.name: (a.frame_start, a.frame_end) for a in made}


CLIPS = run()
