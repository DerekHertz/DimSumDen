# The shared panda rig (ADR 0006): bone names and rest positions, shared by build_mesh.py (the
# sewn-on arms are built along their bones) and build_rig.py. Load it with:
#   exec(open(os.path.join(PANDA_SRC, "rig_spec.py")).read(), globals())
# Blender space: Z up, the panda faces -Y, character left is +X. Model centre is the origin.
# Names use _L/_R (three.js strips dots from glTF node names).

ARM_HEAD = (0.60, 0.06, 0.0)       # the shoulder ball's centre
ARM_TAIL = (0.72, -0.64, -0.40)    # the paw ball's centre (arm length ~0.8; the paw stays inside the body's outline)

BONES = [
    # name, head, tail, parent, deform
    ("root", (0, 0, -1.0), (0, 0, -0.7), None, True),
    ("body", (0, -0.05, -0.9), (0, -0.05, 0.1), "root", True),
    ("head", (0, 0, 0.1), (0, 0, 0.9), "body", True),
    ("ear_L", (0.40, 0.20, 0.72), (0.47, 0.24, 0.95), "head", True),
    ("arm_L", ARM_HEAD, ARM_TAIL, "body", True),
    ("leg_L", (0.40, 0.05, -0.50), (0.66, -0.75, -0.74), "root", True),
    ("paw_L", ARM_TAIL, (ARM_TAIL[0], ARM_TAIL[1] - 0.17, ARM_TAIL[2]), "arm_L", False),
    ("hat", (0, 0, 0.97), (0, 0, 1.17), "head", False),
]


def _mirror(b):
    name, h, t, parent, deform = b
    m = lambda v: (-v[0], v[1], v[2])
    swap = lambda n: n[:-2] + "_R" if n and n.endswith("_L") else n
    return (swap(name), m(h), m(t), swap(parent), deform)


ALL_BONES = BONES + [_mirror(b) for b in BONES if b[0].endswith("_L")]
DEFORM = [b[0] for b in ALL_BONES if b[4]]

# The arm's palm faces this way at rest (character left; mirror x for the right). It is the
# direction that ends up facing the viewer when build_clips.py raises the paw for a wave.
WAVE_AIM_R = (-0.4, -0.7, 0.55)
