"""Abstract silk backdrop for the process section.

A subdivided sheet is displaced by a sum of sines whose phases all advance by
whole multiples of 2*pi across the shot, so the last frame runs back into the
first and the loop is seamless. Colour comes from three big area lights rather
than from the material, which is what gives the surface its lit-from-within
falloff and the bright rim along each fold.
"""

import math
import sys

import bpy
import numpy as np

# --- args -------------------------------------------------------------------
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = bpy.path.abspath(argv[0]) if argv[0].startswith("//") else argv[0]
FRAMES = int(argv[1]) if len(argv) > 1 else 180
RES_X = int(argv[2]) if len(argv) > 2 else 1600
RES_Y = int(argv[3]) if len(argv) > 3 else 900
SAMPLES = int(argv[4]) if len(argv) > 4 else 48
SINGLE = argv[5] if len(argv) > 5 else ""

# --- clean slate ------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# --- the sheet --------------------------------------------------------------
NX, NY = 340, 260
SIZE_X, SIZE_Y = 30.0, 26.0

xs = np.linspace(-SIZE_X / 2, SIZE_X / 2, NX)
ys = np.linspace(-SIZE_Y / 2, SIZE_Y / 2, NY)
gx, gy = np.meshgrid(xs, ys, indexing="ij")
FX, FY = gx.ravel(), gy.ravel()

verts = [(float(x), float(y), 0.0) for x, y in zip(FX, FY)]
faces = []
for i in range(NX - 1):
    for j in range(NY - 1):
        a = i * NY + j
        faces.append((a, a + NY, a + NY + 1, a + 1))

mesh = bpy.data.meshes.new("silk")
mesh.from_pydata(verts, [], faces)
mesh.update()
sheet = bpy.data.objects.new("silk", mesh)
scene.collection.objects.link(sheet)
with bpy.context.temp_override(object=sheet, selected_objects=[sheet]):
    bpy.ops.object.shade_smooth()

# Waves: every phase coefficient is a whole number, so all of them return to
# their starting value together at the end of the loop.
WAVES = (
    # amplitude, kx, ky, phase multiple
    (0.58, 0.60, 0.15, 1),
    (0.42, 0.21, 0.70, -1),
    (0.27, 0.47, 0.53, 2),
    (0.17, 0.93, -0.68, -3),
    (0.10, 1.38, 1.02, 4),
)

FLAT = np.zeros(FX.size * 3)
FLAT[0::3] = FX
FLAT[1::3] = FY


def deform(frame):
    p = 2.0 * math.pi * (frame - 1) / FRAMES
    z = np.zeros_like(FX)
    for amp, kx, ky, mult in WAVES:
        z += amp * np.sin(kx * FX + ky * FY + mult * p)
    FLAT[2::3] = z
    mesh.vertices.foreach_set("co", FLAT)
    mesh.update()


SWAY = []


def on_frame(scn, _depsgraph=None):
    deform(scn.frame_current)
    t = 2.0 * math.pi * (scn.frame_current - 1) / FRAMES
    # Driven here rather than keyframed: Blender 5's slotted actions make
    # keyframe access version-dependent, and this loops by construction.
    for obj, base, sway in SWAY:
        obj.location = (
            base[0] + sway * math.sin(t),
            base[1] + sway * 0.6 * math.cos(t),
            base[2] + sway * 0.3 * math.sin(2 * t),
        )


bpy.app.handlers.frame_change_pre.append(on_frame)

# --- material ---------------------------------------------------------------
# Near-black and glossy: the lights supply every colour in frame.
mat = bpy.data.materials.new("silk")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.26
bsdf.inputs["Metallic"].default_value = 0.0
if "Coat Weight" in bsdf.inputs:
    bsdf.inputs["Coat Weight"].default_value = 0.5
    bsdf.inputs["Coat Roughness"].default_value = 0.1

# Colour is painted across the sheet rather than lit into it: separated lights
# all land on an upward-facing surface and just average to one hue. A ramp
# along a diagonal of the object's own coordinates keeps the reference's
# navy -> orange -> pink -> blue run no matter how the folds move.
coord = nt.nodes.new("ShaderNodeTexCoord")
mapping = nt.nodes.new("ShaderNodeMapping")
mapping.inputs["Rotation"].default_value[2] = math.radians(28)
mapping.inputs["Scale"].default_value = (0.135, 0.135, 0.135)
mapping.inputs["Location"].default_value = (0.5, 0.5, 0.0)
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")

stops = [
    (0.00, (0.020, 0.035, 0.075)),
    (0.20, (0.055, 0.075, 0.150)),
    (0.40, (0.900, 0.190, 0.040)),
    (0.56, (0.960, 0.120, 0.230)),
    (0.72, (0.760, 0.140, 0.420)),
    (1.00, (0.090, 0.230, 0.720)),
]
ramp.color_ramp.elements[0].position = stops[0][0]
ramp.color_ramp.elements[0].color = (*stops[0][1], 1)
ramp.color_ramp.elements[1].position = stops[-1][0]
ramp.color_ramp.elements[1].color = (*stops[-1][1], 1)
for pos, col in stops[1:-1]:
    el = ramp.color_ramp.elements.new(pos)
    el.color = (*col, 1)

nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
nt.links.new(mapping.outputs["Vector"], sep.inputs["Vector"])
nt.links.new(sep.outputs["X"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
# A little self-glow so the saturated areas stay lit in the shadowed folds.
emit = nt.nodes.new("ShaderNodeMixRGB")
emit.blend_type = "MULTIPLY"
emit.inputs["Fac"].default_value = 1.0
emit.inputs["Color2"].default_value = (0.55, 0.55, 0.55, 1)
nt.links.new(ramp.outputs["Color"], emit.inputs["Color1"])
nt.links.new(emit.outputs["Color"], bsdf.inputs["Emission Color"])
bsdf.inputs["Emission Strength"].default_value = 0.30
mesh.materials.append(mat)


def area_light(name, energy, colour, loc, rot, size):
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.color = colour
    data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    obj.rotation_euler = rot
    scene.collection.objects.link(obj)
    return obj


D = math.radians
ENERGY = [float(v) for v in (argv[6].split(",") if len(argv) > 6 else "380,300,340,90".split(","))]
# Orange from the left, magenta overhead, blue raking in from the right.
warm = area_light("warm", ENERGY[0], (1.0, 0.26, 0.03), (-8.5, -2.0, 2.6), (D(66), 0, D(-52)), 6)
rose = area_light("rose", ENERGY[1], (1.0, 0.06, 0.30), (0.2, 2.6, 3.8), (D(28), 0, D(4)), 8)
cool = area_light("cool", ENERGY[2], (0.10, 0.32, 1.0), (9.0, 0.5, 2.8), (D(68), 0, D(62)), 7)
# A small hot key makes the crest of the fold read as a lit edge.
rim = area_light("rim", ENERGY[3], (0.92, 0.96, 1.0), (-2.4, -6.4, 2.6), (D(72), 0, D(-18)), 1.6)

# The lights breathe on the same loop as the sheet.
for obj, sway in ((warm, 0.30), (rose, -0.26), (cool, 0.24), (rim, 0.16)):
    SWAY.append((obj, tuple(obj.location), sway))

# --- world ------------------------------------------------------------------
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.03, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
scene.world = world

# --- camera -----------------------------------------------------------------
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 40
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 6.0
cam_data.dof.aperture_fstop = 2.2
cam = bpy.data.objects.new("cam", cam_data)
# Low and close, looking along the sheet so the folds sweep across frame.
cam.location = (0.4, -4.4, 4.5)
cam.rotation_euler = (D(46), 0, D(-12))
scene.collection.objects.link(cam)
scene.camera = cam

# --- render -----------------------------------------------------------------
engines = bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys()
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
ee = scene.eevee
if hasattr(ee, "taa_render_samples"):
    ee.taa_render_samples = SAMPLES
for attr, val in (("use_bloom", True), ("bloom_intensity", 0.04), ("use_gtao", True)):
    if hasattr(ee, attr):
        setattr(ee, attr, val)
if hasattr(ee, "use_raytracing"):
    ee.use_raytracing = True

scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.film_transparent = False
for attr, val in (("view_transform", "AgX"), ("look", "AgX - Medium High Contrast")):
    try:
        setattr(scene.view_settings, attr, val)
    except TypeError as exc:
        print("view setting", attr, "skipped:", exc)

# Glare gives the crest of each fold the bloom the reference has. Blender 5
# moved the compositor onto a node group, so build whichever the build has.
def build_glare():
    if hasattr(scene, "compositing_node_group"):
        nt = bpy.data.node_groups.new("comp", "CompositorNodeTree")
        scene.compositing_node_group = nt
        rl = nt.nodes.new("NodeGroupInput")
        out = nt.nodes.new("NodeGroupOutput")
        nt.interface.new_socket("Image", in_out="INPUT", socket_type="NodeSocketColor")
        nt.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        src, dst = rl.outputs[0], out.inputs[0]
    elif hasattr(scene, "use_nodes"):
        scene.use_nodes = True
        nt = scene.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        rl = nt.nodes.new("CompositorNodeRLayers")
        out = nt.nodes.new("CompositorNodeComposite")
        src, dst = rl.outputs["Image"], out.inputs["Image"]
    else:
        return

    glare = nt.nodes.new("CompositorNodeGlare")
    if hasattr(glare, "glare_type"):
        glare.glare_type = "BLOOM"
        glare.quality = "HIGH"
        glare.mix = -0.72
        glare.threshold = 0.72
    else:
        # 5.x: parameters moved onto sockets.
        for name, val in (
            ("Type", "Bloom"), ("Quality", "High"), ("Threshold", 0.9),
            ("Strength", 0.38), ("Size", 8), ("Smoothness", 0.4),
        ):
            sock = glare.inputs.get(name)
            if sock is None:
                continue
            try:
                sock.default_value = val
            except (TypeError, ValueError) as exc:
                print("glare socket", name, "skipped:", exc)
    nt.links.new(src, glare.inputs["Image"])
    nt.links.new(glare.outputs["Image"], dst)


# Left unused: in Blender 5 the scene compositor is a node group whose input
# is not the render result, and wiring it that way returns a white frame.
# The bloom is added in CSS over the video instead.
if len(argv) > 7 and argv[7] == "glare":
    try:
        build_glare()
    except Exception as exc:
        print("glare skipped:", exc)

scene.frame_start = 1
scene.frame_end = FRAMES

if SINGLE:
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = SINGLE
    scene.frame_set(int(argv[8]) if len(argv) > 8 else int(FRAMES * 0.37))
    bpy.ops.render.render(write_still=True)
else:
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = OUT
    bpy.ops.render.render(animation=True)
