"""Create the editable Blender scene, web GLB and a rendered hero poster.

Run from the repository root:
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
    --python scripts/create-dream-scene.py

An original procedural reconstruction inspired by 'The dream _ abstract scene'
by haykel-shaba: https://sketchfab.com/3d-models/32b9dcb5c9a34744b4bc110996e5f6e0
No source model or textures are used.
"""

import math
import os
import random
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.noise import noise_vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artwork" / "dream"
WEB = ROOT / "public" / "assets" / "dream"
SOURCE.mkdir(parents=True, exist_ok=True)
WEB.mkdir(parents=True, exist_ok=True)
random.seed(17)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene


def material(name, color, metallic=0, roughness=0.4, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat


def finish(obj, name, mat, smooth=False):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if smooth:
        for face in obj.data.polygons:
            face.use_smooth = True
    return obj


def bevel(obj, amount=0.05, segments=3):
    mod = obj.modifiers.new("Soft machined edges", "BEVEL")
    mod.width = amount
    mod.segments = segments
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    mod.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=mod.name)


def box(name, pos, scale, mat, edge=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, mat)
    if edge:
        bevel(obj, edge, 4)
    return obj


def sphere(name, pos, scale, mat, segments=40, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=pos)
    obj = bpy.context.object
    obj.scale = scale if isinstance(scale, tuple) else (scale,) * 3
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, True)


def mesh(name, vertices, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    return finish(obj, name, mat, True)


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, position, color, power, size, target, size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y or size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, target)
    return obj


chrome = material("Chrome / midnight blue", (0.42, 0.45, 0.53), 0.97, 0.18)
silver = material("Architecture / pearl aluminium", (0.55, 0.57, 0.61), 0.72, 0.23)
floor = material("Floor / polished indigo", (0.025, 0.044, 0.115), 0.76, 0.27)
velvet = material("Curtain / liquid midnight", (0.023, 0.026, 0.073), 0.78, 0.26)
chair_mat = material("Chair / ink leather", (0.014, 0.019, 0.040), 0.32, 0.28)
edge_mat = material("Chair / polished frame", (0.055, 0.063, 0.12), 0.93, 0.18)
moon_mat = material("Moon / ivory emission", (0.66, 0.79, 1.0), 0, 0.7, 3.5)
star_mat = material("Stars / cold white", (0.22, 0.48, 1.0), 0, 0.5, 2.5)

# A baked gradient is portable between Blender and glTF, unlike a world shader.
sky = material("Sky / Martian twilight", (1, 1, 1), 0, 1)
pixels = []
for j in range(256):
    t = j / 255
    # Dusty rose horizon to near-black violet at the zenith.
    low, high = (0.40, 0.20, 0.29), (0.085, 0.028, 0.14)
    s = min(1, max(0, (t - 0.12) / 0.83))
    c = tuple(low[k] * (1 - s) + high[k] * s for k in range(3))
    for i in range(8):
        pixels.extend((*c, 1))
sky_image = bpy.data.images.new("Blue hour gradient", width=8, height=256)
sky_image.pixels = pixels
sky_image.pack()
nodes, links = sky.node_tree.nodes, sky.node_tree.links
texture = nodes.new("ShaderNodeTexImage")
texture.image = sky_image
bsdf = nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
bsdf.inputs["Emission Strength"].default_value = 0.8
links.new(texture.outputs["Color"], bsdf.inputs["Emission Color"])
bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 32, 11), rotation=(math.pi / 2, 0, 0))
backdrop = bpy.context.object
backdrop.scale = (55, 23, 1)
finish(backdrop, "Blue hour horizon", sky)

box("Reflective room floor", (0, -0.5, -0.16), (35, 16, 0.3), floor, 0.04)

# Separate architectural panels create the offset cross seams in the reference.
holes = [(-1.55, 3.63, 2.55), (2.12, 4.6, 1.05)]
for col, (left, right) in enumerate([(-4.36, -0.13), (-0.07, 1.72), (1.78, 3.36)]):
    for row, (bottom, top) in enumerate([(0.02, 4.65), (4.71, 8.2 if col == 0 else 6.65)]):
        panel = box(f"Portal panel {col + 1}.{row + 1}", ((left + right) / 2, 3.6, (bottom + top) / 2), (right - left, 0.18, top - bottom), silver)
        for x, z, radius in holes:
            bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=radius, depth=2, location=(x, 3.6, z), rotation=(math.pi / 2, 0, 0))
            cutter = bpy.context.object
            bpy.context.view_layer.objects.active = panel
            mod = panel.modifiers.new("Circular opening", "BOOLEAN")
            mod.operation = "DIFFERENCE"
            mod.solver = "EXACT"
            mod.object = cutter
            bpy.ops.object.modifier_apply(modifier=mod.name)
            bpy.data.objects.remove(cutter, do_unlink=True)
        bevel(panel, 0.028, 3)

# Sculpted dunes have broad silhouettes and subtle smaller ripples.
dune_mat = material("Dunes / copper violet", (0.38, 0.22, 0.28), 0.78, 0.32)
dune_nodes = dune_mat.node_tree.nodes
vcol = dune_nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "Dune tint"
# A broad warm pool corresponds to the sunset glow behind the figure.
geometry_node = dune_nodes.new("ShaderNodeNewGeometry")
separate = dune_nodes.new("ShaderNodeSeparateXYZ")
dune_mat.node_tree.links.new(geometry_node.outputs["Position"], separate.inputs[0])
def scalar_math(operation, a, b=None):
    node = dune_nodes.new("ShaderNodeMath")
    node.operation = operation
    for index, value in enumerate([a, b]):
        if value is None:
            continue
        if isinstance(value, (int, float)):
            node.inputs[index].default_value = value
        else:
            dune_mat.node_tree.links.new(value, node.inputs[index])
    return node.outputs[0]
px = scalar_math("DIVIDE", scalar_math("ADD", separate.outputs["X"], 1), 5)
py = scalar_math("DIVIDE", scalar_math("SUBTRACT", separate.outputs["Y"], 9), 5)
distance_sq = scalar_math("ADD", scalar_math("MULTIPLY", px, px), scalar_math("MULTIPLY", py, py))
warmth = scalar_math("EXPONENT", scalar_math("MULTIPLY", distance_sq, -1))
dune_bsdf = dune_nodes.get("Principled BSDF")
dune_bsdf.inputs["Emission Color"].default_value = (1, 0.171, 0.197, 1)
dune_mat.node_tree.links.new(scalar_math("MULTIPLY", warmth, 0.38), dune_bsdf.inputs["Emission Strength"])
for band in range(1):
    vertices, faces = [], []
    nx, ny = 144, 80
    for j in range(ny + 1):
        y = 4.9 + j / ny * 30
        for i in range(nx + 1):
            x = -26 + i / nx * 52
            z = 0.35 + band * 0.1
            z += 0.60 * math.sin(x * 0.42 + y * 0.50 + band * 2)
            z += 0.35 * math.sin(x * 0.71 - y * 0.3)
            z += 0.20 * math.cos(y * 1.0 + x * 0.21)
            z += 0.06 * noise_vector(Vector((x * 0.8, y * 0.8, 0)))[0]
            vertices.append((x, y, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    obj = mesh(f"Liquid dunes / ridge {band + 1}", vertices, faces, dune_mat)
    colors = obj.data.color_attributes.new(name="Dune tint", type="FLOAT_COLOR", domain="POINT")
    for i, (x, y, z) in enumerate(vertices):
        tint = (math.sin(x * 0.28 + y * 0.48) + 1) / 2
        colors.data[i].color = (0.22 + 0.14 * tint, 0.17 + 0.10 * tint, 0.35 + 0.10 * tint, 1)

moon = sphere("Moon", (-7.5, 10, 8.0), 1.1, moon_mat, 64, 40)
# Restrained flat lunar patches, embedded in the glowing sphere's surface.
crater_mat = material("Moon / soft lunar markings", (0.32, 0.44, 0.72), 0, 1, 2.0)
for index, (dx, dz, radius) in enumerate([(-0.31, 0.20, 0.15), (0.30, 0.27, 0.12), (0.22, -0.28, 0.19), (-0.12, -0.36, 0.12)]):
    dx, dz, radius = dx * 1.47, dz * 1.47, radius * 1.47
    dy = -math.sqrt(1.1 ** 2 - dx ** 2 - dz ** 2)
    sphere(f"Lunar marking {index + 1}", (-7.5 + dx, 10 + dy + 0.021, 8.0 + dz), (radius, 0.025, radius * 0.65), crater_mat, 20, 12)

star_parts = []
for i in range(95):
    star_parts.append(sphere(f"Star {i:02}", (random.uniform(-25, 25), 29.5, random.uniform(2.1, 17)), random.uniform(0.014, 0.032), star_mat, 8, 4))
bpy.ops.object.select_all(action="DESELECT")
for obj in star_parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = star_parts[0]
bpy.ops.object.join()
bpy.context.object.name = "Constellation"

# Analytic cloth folds keep the scene editable and avoid a simulation dependency.
vertices, faces = [], []
nx, nz = 160, 36
for j in range(nz + 1):
    z = j / nz * 6.95
    for i in range(nx + 1):
        x = 3.42 + i / nx * 3.8
        phase = (x - 3.42) * 8.4
        y = 3.03 + 0.23 * math.sin(phase) + 0.08 * math.sin(phase * 2 + 0.3)
        y += 0.07 * math.sin(z * 0.6 + phase * 0.5) * (1 - z / 12)
        vertices.append((x, y, z + 0.035 * math.cos(phase)))
for j in range(nz):
    for i in range(nx):
        a = j * (nx + 1) + i
        faces.append((a, a + 1, a + nx + 2, a + nx + 1))
mesh("Full height folded curtain", vertices, faces, velvet)

# A single smooth chrome sculpture, assembled from anatomical volumes and fused.
parts = []


def body(name, pos, scale):
    obj = sphere(name, pos, scale, None, 24, 16)
    parts.append(obj)
    return obj


def limb(name, start, end, radius):
    start, end = Vector(start), Vector(end)
    obj = body(name, (start + end) / 2, (radius, radius * 0.86, (end - start).length / 2 + radius * 0.35))
    obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()
    return obj


body("Pelvis", (0, 0, 1.70), (0.31, 0.20, 0.32))
body("Waist", (0, 0, 2.03), (0.245, 0.18, 0.33))
body("Ribcage", (0, 0.015, 2.35), (0.40, 0.235, 0.42))
body("Upper back", (0, 0.005, 2.58), (0.46, 0.215, 0.20))
body("Neck", (0, 0, 2.87), (0.125, 0.12, 0.22))
head = body("Head", (0, -0.015, 3.17), (0.205, 0.185, 0.295))
head.rotation_euler[2] = -0.22
for side in [-1, 1]:
    hip = (side * 0.21, 0, 1.68)
    knee = (side * 0.30, -0.06, 0.98)
    ankle = (side * 0.43, 0.015, 0.21)
    limb("Thigh", hip, knee, 0.205)
    body("Knee", knee, (0.143, 0.14, 0.16))
    limb("Calf", knee, (side * 0.40, 0.03, 0.38), 0.145)
    limb("Ankle", (side * 0.40, 0.03, 0.45), ankle, 0.09)
    body("Foot", (side * 0.43, 0.09, 0.095), (0.125, 0.23, 0.10))
limb("Left upper arm", (-0.40, 0, 2.59), (-0.83, 0.05, 2.42), 0.17)
limb("Left forearm", (-0.83, 0.05, 2.42), (-1.04, 0.37, 2.50), 0.12)
body("Left hand", (-1.05, 0.40, 2.50), (0.12, 0.15, 0.085))
limb("Right upper arm", (0.40, 0, 2.57), (0.51, -0.03, 2.12), 0.16)
limb("Right forearm", (0.51, -0.03, 2.12), (0.34, 0.36, 2.29), 0.12)
body("Right hand", (0.32, 0.40, 2.30), (0.10, 0.14, 0.085))
bpy.ops.object.select_all(action="DESELECT")
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
figure = bpy.context.object
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
remesh = figure.modifiers.new("Fused sculpture", "REMESH")
remesh.mode = "VOXEL"
remesh.voxel_size = 0.036
remesh.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth = figure.modifiers.new("Sculptural polish", "SMOOTH")
smooth.factor = 1.5
smooth.iterations = 6
bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate = figure.modifiers.new("Web topology", "DECIMATE")
decimate.ratio = 0.32
bpy.ops.object.modifier_apply(modifier=decimate.name)
# Joining retained the pelvis object's origin at z=1.7.
figure.location += Vector((1.14, 2.4, 0))
figure.scale *= 1.28
figure.location.z *= 1.28
finish(figure, "The dreamer / chrome sculpture", chrome, True)

sphere("Orb / large", (-2.7, 2.0, 0.59), 0.59, chrome, 56, 32)
sphere("Orb / small", (-1.82, 1.96, 0.27), 0.27, chrome)

# Low sculptural lounge chair in the foreground on the right.
seat = box("Lounge / seat", (4.24, -0.57, 0.52), (3.10, 1.70, 0.32), chair_mat, 0.15)
back = box("Lounge / back", (4.24, 0.07, 1.60), (3.10, 0.35, 1.85), chair_mat, 0.16)
back.rotation_euler[0] = math.radians(-9)
for x in [2.82, 5.66]:
    box("Lounge / sled foot", (x, -0.5, 0.14), (0.09, 1.62, 0.11), edge_mat, 0.045)
    box("Lounge / rear support", (x, 0.08, 0.41), (0.10, 0.10, 0.66), edge_mat, 0.035)

area("Moonlight / soft key", (-3, 4, 7), (0.65, 0.40, 0.72), 1100, 5, (0, 0, 1))
area("Cobalt / long reflection", (-5, -1, 4), (0.48, 0.22, 0.64), 1450, 3.5, (0, 2, 2), 7)
area("Pearl / vertical softbox", (3.15, 1.8, 4), (0.79, 0.60, 0.71), 1300, 0.7, (0, 2, 2), 5)
area("Rose / horizon rim", (-3, 10, 5), (1.0, 0.19, 0.36), 1600, 9, (0, 9, 0.4), 2)
area("Dunes / distant blue", (-6, 16, 10), (0.36, 0.15, 0.30), 4500, 15, (0, 16, 0), 10)
area("Curtain / blue edge", (6.2, -2.0, 6), (0.50, 0.28, 0.63), 1200, 2.5, (4.5, 3, 3), 6)
area("Front / ambient fill", (0, -8, 7), (0.30, 0.36, 0.68), 450, 8, (0, 2, 2))
area("Amber / sunset on dunes", (-8, -3, 7), (0.62, 0.21, 0.17), 2600, 8, (-5, 10, 0), 2)
area("Cubes / overhead silver", (0, -9, 7), (0.53, 0.36, 0.49), 1600, 12, (0, -5, 0), 8)
scene.world.color = (0.07, 0.07, 0.07)
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.055, 0.018, 0.055, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.35

bpy.ops.object.camera_add(location=(10, -23, 9))
camera = bpy.context.object
camera.name = "Hero Camera"
camera.data.lens = 44
aim(camera, (0.5, 3.0, 2.6))
scene.camera = camera
camera.data.clip_end = 200
portrait_camera = camera.copy()
portrait_camera.data = camera.data.copy()
portrait_camera.name = "Hero Camera / portrait"
scene.collection.objects.link(portrait_camera)
portrait_camera.location = (4.5, -28, 8.5)
aim(portrait_camera, (-1.5, 3.0, 3.2))
portrait_camera.data.sensor_fit = "VERTICAL"
portrait_camera.data.lens = portrait_camera.data.sensor_height / (2 * math.tan(math.radians(20)))

close_camera = camera.copy()
close_camera.data = camera.data.copy()
close_camera.name = "Hero Camera / close-up"
scene.collection.objects.link(close_camera)
close_camera.location = (2.8, -7.8, 3.9)
aim(close_camera, (0.5, 3.2, 2.8))
# Scrub frames 1–120 to preview the same camera move driven by web scroll.
camera.keyframe_insert(data_path="location", frame=1)
camera.keyframe_insert(data_path="rotation_euler", frame=1)
camera.location = close_camera.location
camera.rotation_euler = close_camera.rotation_euler
camera.keyframe_insert(data_path="location", frame=120)
camera.keyframe_insert(data_path="rotation_euler", frame=120)
for obj in list(bpy.data.objects):
    if obj.name == "Moon" or obj.name.startswith("Lunar marking"):
        obj.keyframe_insert(data_path="location", frame=1)
        obj.location += Vector((4.6, 0, -3.1))
        obj.keyframe_insert(data_path="location", frame=120)
scene.frame_end = 120
scene.frame_set(1)

# Off-camera reflection cards mirror the browser environment; exclude them from GLB.
reflection_cards = []
for i, (pos, size, radiance) in enumerate([
    ((-2, 4, -12), (14, 2.2), (1.9, 0.27, 0.20)),
    ((-9, 5, -2), (2.3, 10), (0.7, 0.23, 1.3)),
    ((8, 3, -5), (2, 8), (0.6, 0.32, 0.95)),
    ((2, 8, 8), (8, 4), (0.8, 0.55, 0.75)),
    ((10, 4, 5), (5, 5), (1.3, 0.16, 0.30)),
    ((-2, 12, 0), (4, 4), (1.1, 0.85, 1.0)),
]):
    mat = bpy.data.materials.new(f"Reflection card {i + 1}")
    mat.use_nodes = True
    emission = mat.node_tree.nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*radiance, 1)
    mat.node_tree.links.new(emission.outputs[0], mat.node_tree.nodes.get("Material Output").inputs["Surface"])
    bpy.ops.mesh.primitive_plane_add(size=1, location=(pos[0] * 10, -pos[2] * 10, pos[1] * 10))
    card = bpy.context.object
    card.scale = (size[0] * 10, size[1] * 10, 1)
    aim(card, (0, 0, 0))
    card.visible_camera = False
    card.visible_shadow = False
    finish(card, f"Reflection source {i + 1}", mat)
    reflection_cards.append(card)

# Static counterparts for the posters and editable .blend. The website builds
# the grid as instances and animates its hover waves and snowfall on the GPU.
cube_mat = material("Particle ground / blue silver", (0.24, 0.13, 0.22), 0.72, 0.38)
vertices, faces = [], []
spacing = 0.28
corners = [(-1,-1,-1), (1,-1,-1), (1,1,-1), (-1,1,-1), (-1,-1,1), (1,-1,1), (1,1,1), (-1,1,1)]
cube_faces = [(0,3,2,1), (4,5,6,7), (0,1,5,4), (1,2,6,5), (2,3,7,6), (3,0,4,7)]
for row in range(math.ceil(28 / spacing)):
    web_z = -6 + row * spacing
    foreground = min(1, max(0, (web_z + 3) / 3.5))
    for col in range(math.ceil(42 / spacing)):
        x = -21 + col * spacing
        height = (max(0, math.sin(x * 0.38 + web_z * 0.29)) ** 3 * 0.48 + random.random() * 0.10) * foreground
        base = len(vertices)
        r = spacing * 0.395
        vertices.extend((x + cx * r, -web_z + cy * r, -spacing * 0.43 + height + cz * r) for cx,cy,cz in corners)
        faces.extend(tuple(base + i for i in f) for f in cube_faces)
cube_preview = mesh("Cube ground / web animation preview", vertices, faces, cube_mat)
for face in cube_preview.data.polygons:
    face.use_smooth = False
bpy.data.objects["Reflective room floor"].hide_render = True

vertices, faces = [], []
for i in range(700):
    x, y, z = random.uniform(-21, 21), random.uniform(-19, 16), random.uniform(0, 17)
    base = len(vertices)
    r = random.uniform(0.005, 0.012)
    vertices.extend([(x-r,y-r,z-r), (x+r,y-r,z+r), (x-r,y+r,z+r), (x+r,y+r,z-r)])
    faces.extend(tuple(base+j for j in f) for f in [(0,1,2), (0,3,1), (0,2,3), (1,3,2)])
snow_preview = mesh("Falling particles / still preview", vertices, faces, star_mat)

scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.resolution_x = 1920
scene.render.resolution_y = 1200
scene.render.resolution_percentage = int(os.environ.get("DREAM_RENDER_SCALE", "100"))
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(SOURCE / "dream-poster.png")
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"

# A gentle bloom around the moon, also mirrored in the web renderer.
scene.use_nodes = True
tree = bpy.data.node_groups.new("Dream compositor", "CompositorNodeTree")
scene.compositing_node_group = tree
tree.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
layers = tree.nodes.new("CompositorNodeRLayers")
glare = tree.nodes.new("CompositorNodeGlare")
glare.inputs["Type"].default_value = "Fog Glow"
glare.inputs["Quality"].default_value = "High"
glare.inputs["Threshold"].default_value = 1.6
output = tree.nodes.new("NodeGroupOutput")
tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
tree.links.new(glare.outputs["Image"], output.inputs["Image"])

# The exported geometry/materials/camera are the actual Blender scene.
bpy.ops.object.select_all(action="SELECT")
cube_preview.select_set(False)
snow_preview.select_set(False)
for card in reflection_cards:
    card.select_set(False)
bpy.ops.export_scene.gltf(
    filepath=str(WEB / "dream-scene.glb"), export_format="GLB",
    export_cameras=True, export_lights=False, export_yup=True,
    export_apply=True, export_extras=True, use_selection=True, export_animations=False,
)
scene["reference"] = "The dream _ abstract scene by haykel-shaba (Sketchfab)"
scene["notes"] = "Procedural recreation for Darwin. Rebuild with scripts/create-dream-scene.py."
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "darwin-dream.blend"))
if os.environ.get("DREAM_SKIP_RENDER") != "1":
    bpy.ops.render.render(write_still=True)
    scene.camera = portrait_camera
    scene.render.resolution_x = 832
    scene.render.resolution_y = 1664
    scene.render.filepath = str(SOURCE / "dream-poster-mobile.png")
    bpy.ops.render.render(write_still=True)
print("DREAM_EXPORT_COMPLETE", WEB / "dream-scene.glb")
