"""Beachside villa for the real estate hero, built procedurally and rendered in Cycles.

The villa follows the concept drawings (front/rear/side elevations, ground and
first floor plans) at 1 unit = 1 m: cantilevered concrete slabs at +3.4 and
+7.2, full-height glazing, a dark stone cladding wall, timber slats, a glass
balustrade, an infinity pool and terraced dry-stone retaining walls, on a
coastal plot with the sea to the west and mountains inland.

One .blend renders every look. Season and weather are scene custom properties
read by the materials (snow, wet, autumn, spring, lights); sky, sun, moon,
interior lamps and haze are set per state before each render.

From the repository root:

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python scripts/create-villa-scene.py

Environment:
    VILLA_STATES   comma list of states to render (default: all, see STATES)
    VILLA_CAMERAS  wide,tall (default: wide)
    VILLA_SCALE    resolution percentage (default 100)
    VILLA_SAMPLES  Cycles samples (default 160)
    VILLA_SKIP_RENDER=1  only save the .blend
"""

import bpy
import bmesh
import math
import os
import random
from pathlib import Path
from mathutils import Matrix, Vector, noise

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artwork" / "villa"
RENDERS = OUT / "renders"
RENDERS.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
random.seed(7)

SEA = -5.4


def smooth(a, b, v):
    t = min(1.0, max(0.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------------------
# Collections and mesh helpers

def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c


C_SITE = collection("Site")
C_HOUSE = collection("House")
C_LIFE = collection("Planting")
C_LAND = collection("Landscape")
C_ASSETS = collection("Assets (instanced)")


def mesh_object(name, verts, faces, mat, col, smooth_shade=False, recalc=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    if recalc:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    me.update()
    if mat:
        me.materials.append(mat)
    if smooth_shade:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    return ob


def box(name, x0, x1, y0, y1, z0, z1, mat, col, bevel=0.0):
    """Box in Blender coordinates with its origin at the centre of its base."""
    hx, hy, h = (x1 - x0) / 2, (y1 - y0) / 2, z1 - z0
    v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, -hy, h), (hx, -hy, h), (hx, hy, h), (-hx, hy, h)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    ob = mesh_object(name, v, f, mat, col)
    ob.location = ((x0 + x1) / 2, (y0 + y1) / 2, z0)
    if bevel:
        m = ob.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
    return ob


def tbox(name, x0, x1, h0, h1, d0, d1, mat, col=C_HOUSE, bevel=0.0):
    """Box using the site-plan convention of the web scene: x across, h up, d towards the sea-facing front.

    Front (+d, the pool side) maps to Blender -Y so the default camera side is the facade.
    """
    return box(name, x0, x1, -d1, -d0, h0, h1, mat, col, bevel)


# ---------------------------------------------------------------------------
# Materials

def scene_attr(nodes, name):
    a = nodes.new("ShaderNodeAttribute")
    a.attribute_type = "VIEW_LAYER"
    a.attribute_name = name
    return a


def new_material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    return m, nt.nodes, nt.links, bsdf


def pbr(name, color, rough=0.5, metal=0.0, spec=0.5):
    m, n, l, b = new_material(name)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Specular IOR Level"].default_value = spec
    return m


def position(n):
    return n.new("ShaderNodeNewGeometry").outputs["Position"]


def wet_coat(m, amount=0.9):
    """Rain leaves a glossy film: coat weight follows the scene 'wet' property."""
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n.get("Principled BSDF")
    wet = scene_attr(n, "wet")
    mul = n.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = amount
    l.new(wet.outputs["Fac"], mul.inputs[0])
    l.new(mul.outputs[0], b.inputs["Coat Weight"])
    b.inputs["Coat Roughness"].default_value = 0.04


def glass_material():
    m, n, l, b = new_material("Glass / low-iron glazing")
    b.inputs["Base Color"].default_value = (0.9, 0.96, 0.95, 1)
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.5
    try:
        b.inputs["Thin Wall"].default_value = True
    except Exception:
        pass
    return m


def water_material():
    m, n, l, b = new_material("Water / pool")
    b.inputs["Base Color"].default_value = (0.55, 0.9, 0.95, 1)
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.01
    b.inputs["IOR"].default_value = 1.333
    p = position(n)
    tex = n.new("ShaderNodeTexNoise")
    tex.noise_dimensions = "4D"  # ripples move with the scene clock
    tex.inputs["Scale"].default_value = 1.4
    tex.inputs["Detail"].default_value = 3
    l.new(p, tex.inputs["Vector"])
    l.new(scene_attr(n, "clock").outputs["Fac"], tex.inputs["W"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15
    l.new(tex.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def freeze(m):
    """Winter: the pool water turns to frosted ice, driven by the scene 'frozen' property."""
    n, l = m.node_tree.nodes, m.node_tree.links
    out = n.get("Material Output")
    src = out.inputs["Surface"].links[0].from_socket
    ice = n.new("ShaderNodeBsdfPrincipled")
    frost = n.new("ShaderNodeTexNoise")
    frost.inputs["Scale"].default_value = 3.0
    frost.inputs["Detail"].default_value = 10
    l.new(position(n), frost.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.52, 0.66, 0.72, 1)
    ramp.color_ramp.elements[1].color = (0.88, 0.92, 0.95, 1)
    l.new(frost.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], ice.inputs["Base Color"])
    ice.inputs["Roughness"].default_value = 0.22
    ice.inputs["Coat Weight"].default_value = 0.6
    ice.inputs["Coat Roughness"].default_value = 0.05
    mix = n.new("ShaderNodeMixShader")
    l.new(scene_attr(n, "frozen").outputs["Fac"], mix.inputs["Fac"])
    l.new(src, mix.inputs[1])
    l.new(ice.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])


def snow_layer_material():
    """Settled snow with soft subsurface; fades in with the scene 'snowcap' property."""
    m, n, l, b = new_material("Snow / settled layer")
    b.inputs["Base Color"].default_value = (0.86, 0.88, 0.92, 1)
    b.inputs["Roughness"].default_value = 0.6
    b.inputs["Subsurface Weight"].default_value = 0.2
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 4
    l.new(position(n), tex.inputs["Vector"])
    l.new(tex.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], b.inputs["Normal"])
    out = n.get("Material Output")
    clear = n.new("ShaderNodeBsdfTransparent")
    mix = n.new("ShaderNodeMixShader")
    l.new(scene_attr(n, "snowcap").outputs["Fac"], mix.inputs["Fac"])
    l.new(clear.outputs["BSDF"], mix.inputs[1])
    l.new(b.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def pool_tile_material():
    m, n, l, b = new_material("Pool / glass mosaic")
    p = position(n)
    brick = n.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.inputs["Scale"].default_value = 20
    brick.inputs["Brick Width"].default_value = 1.0
    brick.inputs["Row Height"].default_value = 1.0
    brick.inputs["Mortar Size"].default_value = 0.08
    brick.inputs["Color1"].default_value = (0.1, 0.55, 0.6, 1)
    brick.inputs["Color2"].default_value = (0.2, 0.68, 0.72, 1)
    brick.inputs["Mortar"].default_value = (0.7, 0.8, 0.8, 1)
    l.new(p, brick.inputs["Vector"])
    l.new(brick.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.2
    return m


def emissive(name, color, strength):
    """Warm architectural lighting, scaled by the scene 'lights' property."""
    m, n, l, b = new_material(name)
    b.inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    b.inputs["Emission Color"].default_value = (*color, 1)
    lights = scene_attr(n, "lights")
    mul = n.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = strength
    l.new(lights.outputs["Fac"], mul.inputs[0])
    l.new(mul.outputs[0], b.inputs["Emission Strength"])
    return m


def fabric(name, color):
    m = pbr(name, color, 0.85)
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Sheen Weight"].default_value = 0.5
    return m


def foliage_material(name, spring, summer, autumn, winter, translucent=0.35, evergreen=False):
    """Leaves whose colour follows the season properties; each instance varies slightly."""
    m, n, l, b = new_material(name)
    info = n.new("ShaderNodeObjectInfo")
    base = n.new("ShaderNodeMix")
    base.data_type = "RGBA"
    base.inputs["A"].default_value = (*summer, 1)
    base.inputs["B"].default_value = (*spring, 1)
    l.new(scene_attr(n, "spring").outputs["Fac"], base.inputs["Factor"])
    aut = n.new("ShaderNodeMix")
    aut.data_type = "RGBA"
    l.new(base.outputs["Result"], aut.inputs["A"])
    # Autumn varies from gold to rust across instances.
    aut_ramp = n.new("ShaderNodeValToRGB")
    aut_ramp.color_ramp.elements[0].color = (*autumn, 1)
    aut_ramp.color_ramp.elements[1].color = (*autumn, 1) if evergreen else (0.42, 0.08, 0.02, 1)
    l.new(info.outputs["Random"], aut_ramp.inputs["Fac"])
    l.new(aut_ramp.outputs["Color"], aut.inputs["B"])
    l.new(scene_attr(n, "autumn").outputs["Fac"], aut.inputs["Factor"])
    win = n.new("ShaderNodeMix")
    win.data_type = "RGBA"
    win.inputs["B"].default_value = (*winter, 1)
    l.new(aut.outputs["Result"], win.inputs["A"])
    l.new(scene_attr(n, "winter").outputs["Fac"], win.inputs["Factor"])
    vary = n.new("ShaderNodeHueSaturation")
    rnd = n.new("ShaderNodeMapRange")
    rnd.inputs["To Min"].default_value = 0.7
    rnd.inputs["To Max"].default_value = 1.15
    l.new(info.outputs["Random"], rnd.inputs["Value"])
    l.new(rnd.outputs["Result"], vary.inputs["Value"])
    l.new(win.outputs["Result"], vary.inputs["Color"])
    l.new(vary.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Subsurface Weight"].default_value = 0.0
    # Light passing through the leaf.
    out = n.get("Material Output")
    trans = n.new("ShaderNodeBsdfTranslucent")
    l.new(vary.outputs["Color"], trans.inputs["Color"])
    mix = n.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = translucent
    l.new(b.outputs["BSDF"], mix.inputs[1])
    l.new(trans.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def ground_material():
    """Scanned grass soil, dry sand and wet sand, blended by a painted mask; grass follows the season."""
    m, n, l, b = new_material("Ground / grass, sand, rock")
    mask = n.new("ShaderNodeVertexColor")
    mask.layer_name = "mask"
    sep = n.new("ShaderNodeSeparateColor")
    l.new(mask.outputs["Color"], sep.inputs["Color"])
    grass = image_texture(n, l, "grass_ground", "diff", 3.0, flat=True)
    green = n.new("ShaderNodeMix")  # the scan is dry and sandy; pull it towards a watered lawn
    green.data_type = "RGBA"
    green.blend_type = "MULTIPLY"
    green.inputs["Factor"].default_value = 1.0
    green.inputs["B"].default_value = (0.55, 0.85, 0.36, 1)
    l.new(grass.outputs["Color"], green.inputs["A"])
    spring = n.new("ShaderNodeMix")
    spring.data_type = "RGBA"
    spring.blend_type = "MULTIPLY"
    spring.inputs["B"].default_value = (0.85, 1.08, 0.72, 1)
    l.new(green.outputs["Result"], spring.inputs["A"])
    l.new(scene_attr(n, "spring").outputs["Fac"], spring.inputs["Factor"])
    autumn = n.new("ShaderNodeMix")
    autumn.data_type = "RGBA"
    autumn.blend_type = "MULTIPLY"
    autumn.inputs["B"].default_value = (1.25, 0.95, 0.6, 1)
    l.new(spring.outputs["Result"], autumn.inputs["A"])
    l.new(scene_attr(n, "autumn").outputs["Fac"], autumn.inputs["Factor"])
    rock = n.new("ShaderNodeMix")
    rock.data_type = "RGBA"
    rock.inputs["B"].default_value = (0.3, 0.27, 0.23, 1)
    l.new(autumn.outputs["Result"], rock.inputs["A"])
    l.new(sep.outputs["Green"], rock.inputs["Factor"])
    dry = image_texture(n, l, "coast_sand_01", "diff", 2.5, flat=True)
    damp = image_texture(n, l, "damp_beach_sand", "diff", 2.5, flat=True)
    sand = n.new("ShaderNodeMix")
    sand.data_type = "RGBA"
    l.new(dry.outputs["Color"], sand.inputs["A"])
    l.new(damp.outputs["Color"], sand.inputs["B"])
    l.new(sep.outputs["Blue"], sand.inputs["Factor"])
    base = n.new("ShaderNodeMix")
    base.data_type = "RGBA"
    l.new(rock.outputs["Result"], base.inputs["A"])
    l.new(sand.outputs["Result"], base.inputs["B"])
    l.new(sep.outputs["Red"], base.inputs["Factor"])
    l.new(base.outputs["Result"], b.inputs["Base Color"])
    wet_rough = n.new("ShaderNodeMapRange")
    wet_rough.inputs["To Min"].default_value = 0.95
    wet_rough.inputs["To Max"].default_value = 0.35
    l.new(sep.outputs["Blue"], wet_rough.inputs["Value"])
    l.new(wet_rough.outputs["Result"], b.inputs["Roughness"])
    height = image_texture(n, l, "coast_sand_01", "disp", 2.5, flat=True, noncolor=True)
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.02
    l.new(height.outputs["Color"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def mountain_material():
    m, n, l, b = new_material("Landscape / mountains")
    geo = n.new("ShaderNodeNewGeometry")
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(geo.outputs["Normal"], sep.inputs["Vector"])
    slope = n.new("ShaderNodeMapRange")
    slope.inputs["From Min"].default_value = 0.6
    slope.inputs["From Max"].default_value = 0.9
    l.new(sep.outputs["Z"], slope.inputs["Value"])
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 0.02
    tex.inputs["Detail"].default_value = 12
    l.new(geo.outputs["Position"], tex.inputs["Vector"])
    rock = n.new("ShaderNodeMix")
    rock.data_type = "RGBA"
    rock.inputs["A"].default_value = (0.2, 0.17, 0.14, 1)
    rock.inputs["B"].default_value = (0.36, 0.31, 0.25, 1)
    l.new(tex.outputs["Fac"], rock.inputs["Factor"])
    scrub = n.new("ShaderNodeMix")
    scrub.data_type = "RGBA"
    scrub.inputs["B"].default_value = (0.12, 0.13, 0.06, 1)
    l.new(rock.outputs["Result"], scrub.inputs["A"])
    l.new(slope.outputs["Result"], scrub.inputs["Factor"])
    l.new(scrub.outputs["Result"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95
    # Snow line: high, flat-ish ground, amount from 'peaks' (some snow all year).
    sepz = n.new("ShaderNodeSeparateXYZ")
    l.new(geo.outputs["Position"], sepz.inputs["Vector"])
    line = n.new("ShaderNodeMapRange")
    line.inputs["From Min"].default_value = 55
    line.inputs["From Max"].default_value = 95
    l.new(sepz.outputs["Z"], line.inputs["Value"])
    peaks = scene_attr(n, "peaks")
    snowfac = n.new("ShaderNodeMath")
    snowfac.operation = "MULTIPLY"
    l.new(line.outputs["Result"], snowfac.inputs[0])
    l.new(peaks.outputs["Fac"], snowfac.inputs[1])
    flat = n.new("ShaderNodeMath")
    flat.operation = "MULTIPLY"
    l.new(snowfac.outputs[0], flat.inputs[0])
    l.new(sep.outputs["Z"], flat.inputs[1])
    snow = n.new("ShaderNodeBsdfPrincipled")
    snow.inputs["Base Color"].default_value = (0.85, 0.87, 0.9, 1)
    snow.inputs["Roughness"].default_value = 0.6
    mix = n.new("ShaderNodeMixShader")
    step = n.new("ShaderNodeMapRange")
    step.inputs["From Min"].default_value = 0.25
    step.inputs["From Max"].default_value = 0.45
    l.new(flat.outputs[0], step.inputs["Value"])
    l.new(step.outputs["Result"], mix.inputs["Fac"])
    l.new(b.outputs["BSDF"], mix.inputs[1])
    l.new(snow.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], n.get("Material Output").inputs["Surface"])
    return m


def ocean_material():
    """Deep water with whitecaps (Ocean modifier foam) and a band of surf along the beach."""
    m = pbr("Water / sea", (0.006, 0.035, 0.05), 0.05, 0, 0.6)
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n.get("Principled BSDF")
    b.inputs["IOR"].default_value = 1.333
    out = n.get("Material Output")
    foam_attr = n.new("ShaderNodeAttribute")
    foam_attr.attribute_name = "foam"
    whitecaps = n.new("ShaderNodeMapRange")
    whitecaps.inputs["From Min"].default_value = 0.55
    whitecaps.inputs["From Max"].default_value = 1.0
    l.new(foam_attr.outputs["Fac"], whitecaps.inputs["Value"])
    rough = n.new("ShaderNodeMath")
    rough.operation = "MULTIPLY"
    l.new(whitecaps.outputs["Result"], rough.inputs[0])
    l.new(scene_attr(n, "whitecaps").outputs["Fac"], rough.inputs[1])
    # Surf: coast distance from world position, broken up by noise.
    p = position(n)
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(p, sep.inputs["Vector"])
    coast_ = n.new("ShaderNodeMath")
    coast_.operation = "MULTIPLY_ADD"
    coast_.inputs[1].default_value = -0.35
    l.new(sep.outputs["Y"], coast_.inputs[0])
    l.new(sep.outputs["X"], coast_.inputs[2])
    band = n.new("ShaderNodeMapRange")
    band.inputs["From Min"].default_value = -34
    band.inputs["From Max"].default_value = -25.5
    l.new(coast_.outputs[0], band.inputs["Value"])
    surf_noise = n.new("ShaderNodeTexNoise")
    surf_noise.noise_dimensions = "4D"  # the surf line churns over time
    l.new(scene_attr(n, "clock").outputs["Fac"], surf_noise.inputs["W"])
    surf_noise.inputs["Scale"].default_value = 0.35
    surf_noise.inputs["Detail"].default_value = 6
    l.new(p, surf_noise.inputs["Vector"])
    surf = n.new("ShaderNodeMath")
    surf.operation = "MULTIPLY"
    l.new(band.outputs["Result"], surf.inputs[0])
    l.new(surf_noise.outputs["Fac"], surf.inputs[1])
    surf_cut = n.new("ShaderNodeMapRange")
    surf_cut.inputs["From Min"].default_value = 0.32
    surf_cut.inputs["From Max"].default_value = 0.55
    l.new(surf.outputs[0], surf_cut.inputs["Value"])
    foam = n.new("ShaderNodeMath")
    foam.operation = "MAXIMUM"
    l.new(rough.outputs[0], foam.inputs[0])
    l.new(surf_cut.outputs["Result"], foam.inputs[1])
    white = n.new("ShaderNodeBsdfPrincipled")
    white.inputs["Base Color"].default_value = (0.82, 0.85, 0.86, 1)
    white.inputs["Roughness"].default_value = 0.6
    mix = n.new("ShaderNodeMixShader")
    l.new(foam.outputs[0], mix.inputs["Fac"])
    l.new(b.outputs["BSDF"], mix.inputs[1])
    l.new(white.outputs["BSDF"], mix.inputs[2])
    # Big storm waves can rise above the low garden; drop the sea surface over land.
    land = n.new("ShaderNodeMapRange")
    land.inputs["From Min"].default_value = -25.2
    land.inputs["From Max"].default_value = -24.6
    l.new(coast_.outputs[0], land.inputs["Value"])
    clear = n.new("ShaderNodeBsdfTransparent")
    shore = n.new("ShaderNodeMixShader")
    l.new(land.outputs["Result"], shore.inputs["Fac"])
    l.new(mix.outputs["Shader"], shore.inputs[1])
    l.new(clear.outputs["BSDF"], shore.inputs[2])
    l.new(shore.outputs["Shader"], out.inputs["Surface"])
    return m


def add_snow(m, cover=1.0):
    """Wrap a material so upward-facing surfaces take snow, driven by the scene 'snow' property."""
    n, l = m.node_tree.nodes, m.node_tree.links
    out = n.get("Material Output")
    src = out.inputs["Surface"].links[0].from_socket
    geo = n.new("ShaderNodeNewGeometry")
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(geo.outputs["Normal"], sep.inputs["Vector"])
    up = n.new("ShaderNodeMapRange")
    up.inputs["From Min"].default_value = 0.45
    up.inputs["From Max"].default_value = 0.85
    l.new(sep.outputs["Z"], up.inputs["Value"])
    brk = n.new("ShaderNodeTexNoise")
    brk.inputs["Scale"].default_value = 2.5
    brk.inputs["Detail"].default_value = 6
    l.new(geo.outputs["Position"], brk.inputs["Vector"])
    snow = scene_attr(n, "snow")
    # Threshold noise against the snow amount so cover grows in patches:
    # patch = (snow + noise - 1) mapped over a soft 0.25 band.
    patch = n.new("ShaderNodeMapRange")
    patch.inputs["From Min"].default_value = 0.0
    patch.inputs["From Max"].default_value = 0.25
    sub = n.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = 0.45
    l.new(brk.outputs["Fac"], sub.inputs[0])
    add = n.new("ShaderNodeMath")
    add.operation = "ADD"
    l.new(snow.outputs["Fac"], add.inputs[0])
    l.new(sub.outputs[0], add.inputs[1])
    add2 = n.new("ShaderNodeMath")
    add2.operation = "SUBTRACT"
    add2.inputs[1].default_value = 0.5
    l.new(add.outputs[0], add2.inputs[0])
    l.new(add2.outputs[0], patch.inputs["Value"])
    fac = n.new("ShaderNodeMath")
    fac.operation = "MULTIPLY"
    l.new(up.outputs["Result"], fac.inputs[0])
    l.new(patch.outputs["Result"], fac.inputs[1])
    fac2 = n.new("ShaderNodeMath")
    fac2.operation = "MULTIPLY"
    fac2.inputs[1].default_value = cover
    l.new(fac.outputs[0], fac2.inputs[0])
    white = n.new("ShaderNodeBsdfPrincipled")
    white.inputs["Base Color"].default_value = (0.86, 0.88, 0.92, 1)
    white.inputs["Roughness"].default_value = 0.55
    white.inputs["Subsurface Weight"].default_value = 0.15
    mix = n.new("ShaderNodeMixShader")
    l.new(fac2.outputs[0], mix.inputs["Fac"])
    l.new(src, mix.inputs[1])
    l.new(white.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])


TEXTURES = OUT / "assets" / "textures"


def image_texture(n, l, tex, kind, size_m, flat=False, noncolor=False):
    """A scanned texture mapped in world space at its real size (box-projected on walls, flat on the ground)."""
    node = n.new("ShaderNodeTexImage")
    node.image = bpy.data.images.load(str(TEXTURES / tex / f"{kind}.jpg"), check_existing=True)
    if noncolor:
        node.image.colorspace_settings.name = "Non-Color"
    if not flat:
        node.projection = "BOX"
        node.projection_blend = 0.3
    mapping = n.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1 / size_m,) * 3
    l.new(position(n), mapping.inputs["Vector"])
    l.new(mapping.outputs["Vector"], node.inputs["Vector"])
    return node


def scanned(name, tex, size_m, tint=(1, 1, 1), rough=1.0, bump=0.4, flat=False):
    """PBR material from a Poly Haven scan: colour (tinted), roughness and displacement as bump."""
    m, n, l, b = new_material(name)
    col = image_texture(n, l, tex, "diff", size_m, flat)
    tinted = n.new("ShaderNodeMix")
    tinted.data_type = "RGBA"
    tinted.blend_type = "MULTIPLY"
    tinted.inputs["Factor"].default_value = 1.0
    tinted.inputs["B"].default_value = (*tint, 1)
    l.new(col.outputs["Color"], tinted.inputs["A"])
    l.new(tinted.outputs["Result"], b.inputs["Base Color"])
    rgh = image_texture(n, l, tex, "rough", size_m, flat, noncolor=True)
    scale = n.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.use_clamp = True
    scale.inputs[1].default_value = rough
    l.new(rgh.outputs["Color"], scale.inputs[0])
    l.new(scale.outputs[0], b.inputs["Roughness"])
    disp = image_texture(n, l, tex, "disp", size_m, flat, noncolor=True)
    bmp = n.new("ShaderNodeBump")
    bmp.inputs["Strength"].default_value = bump
    bmp.inputs["Distance"].default_value = 0.03
    l.new(disp.outputs["Color"], bmp.inputs["Height"])
    l.new(bmp.outputs["Normal"], b.inputs["Normal"])
    return m


def surface(name, tex, size_m, tint=(1, 1, 1), rough=1.0, bump=0.4, wet=0.8):
    m = scanned(name, tex, size_m, tint, rough, bump)
    wet_coat(m, wet)
    return m


M = {
    "concrete": surface("Concrete / off-white architectural", "concrete_wall_008", 2.5, (1.08, 1.07, 1.05), 0.9, 0.25),
    "stone": surface("Stone / dry-stack retaining wall", "stone_wall_04", 2.2, (0.95, 0.94, 0.92), 1.0, 1.2, 0.6),
    "cladding": surface("Stone / dark grey cladding", "large_grey_tiles", 1.8, (0.32, 0.32, 0.34), 0.55, 0.5, 0.5),
    "deck": surface("Stone / travertine terrace", "marble_01", 2.4, (1.12, 1.08, 1.02), 0.8, 0.3, 1.0),
    "timber": surface("Timber / oak slats and soffits", "wood_floor", 2.0, (0.95, 0.85, 0.75), 0.9, 0.15, 0.6),
    "glass": glass_material(),
    "water": water_material(),
    "pooltile": pool_tile_material(),
    "frame": pbr("Metal / dark bronze aluminium", (0.05, 0.04, 0.032), 0.35, 1.0),
    "plaster": scanned("Interior / warm plaster", "white_plaster_02", 2.5, (1.0, 0.95, 0.88), 1.0, 0.1),
    "oak": scanned("Interior / oak floor", "wood_floor", 2.0, (1.05, 0.95, 0.85), 0.7, 0.1),
    "sofa": fabric("Fabric / oatmeal boucle", (0.62, 0.58, 0.52)),
    "cushion": fabric("Fabric / white canvas", (0.82, 0.8, 0.76)),
    "dark": pbr("Furniture / dark walnut", (0.08, 0.05, 0.035), 0.5),
    "linen": fabric("Fabric / bed linen", (0.86, 0.85, 0.82)),
    "pot": pbr("Ceramic / planter", (0.8, 0.78, 0.74), 0.4),
    "led": emissive("Light / LED strip 2700K", (1.0, 0.72, 0.42), 30.0),
    "lamp": emissive("Light / pendant 2700K", (1.0, 0.7, 0.4), 18.0),
    "fire": emissive("Light / fire", (1.0, 0.42, 0.1), 40.0),
    "bark": pbr("Bark / olive", (0.12, 0.1, 0.08), 0.9),
    "palmtrunk": pbr("Bark / palm trunk", (0.28, 0.22, 0.16), 0.9),
    "leaf": foliage_material("Leaves / olive & shade trees", (0.24, 0.42, 0.1), (0.1, 0.2, 0.05), (0.72, 0.36, 0.05), (0.2, 0.2, 0.17)),
    "palmleaf": foliage_material("Leaves / palm fronds", (0.17, 0.32, 0.07), (0.13, 0.26, 0.06), (0.15, 0.25, 0.06), (0.14, 0.22, 0.1), 0.25, True),
    "shrub": foliage_material("Leaves / garden shrubs", (0.12, 0.26, 0.06), (0.08, 0.18, 0.05), (0.14, 0.17, 0.05), (0.1, 0.15, 0.08), 0.35, True),
    "agave": pbr("Leaves / agave", (0.25, 0.36, 0.33), 0.35),
    "grass": foliage_material("Grass / planted beds", (0.16, 0.32, 0.06), (0.2, 0.28, 0.07), (0.3, 0.27, 0.12), (0.26, 0.26, 0.2), 0.2, True),
    "soil": pbr("Soil / planting bed", (0.06, 0.045, 0.03), 0.95),
    "ground": ground_material(),
    "mountain": mountain_material(),
    "sea": ocean_material(),
    "snowlayer": snow_layer_material(),
    "coconut": pbr("Fruit / coconut", (0.16, 0.1, 0.05), 0.7),
    "hull": pbr("Boat / white gelcoat hull", (0.8, 0.8, 0.78), 0.25),
    "sail": pbr("Boat / sailcloth", (0.85, 0.84, 0.8), 0.7),
    "gull": pbr("Bird / gull plumage", (0.82, 0.82, 0.8), 0.8),
    "gulltip": pbr("Bird / gull wingtip", (0.05, 0.05, 0.05), 0.8),
}
freeze(M["water"])
for key in ("concrete", "stone", "cladding", "deck", "timber", "frame", "sofa", "cushion", "pot", "bark", "palmtrunk",
            "leaf", "palmleaf", "shrub", "agave", "grass", "soil", "ground"):
    add_snow(M[key], {"palmleaf": 0.35, "leaf": 0.8, "shrub": 0.8, "grass": 0.7}.get(key, 1.0))

# ---------------------------------------------------------------------------
# The villa (dimensions from the elevations and plans)

def glass_pane(name, x0, x1, h0, h1, d0, d1):
    return tbox(name, x0, x1, h0, h1, d0, d1, M["glass"])


# Terraced retaining walls and planting beds.
tbox("Terrace wall / lower", -16, 16, -4.8, -3.2, -14, 16, M["stone"], C_SITE, 0.04)
tbox("Terrace wall / upper", -13.5, 13.5, -3.2, -1.6, -12, 13.5, M["stone"], C_SITE, 0.04)
BEDS = [
    (-16, 16, -3.2, 13.5, 16), (-16, 16, -3.2, -14, -12), (-16, -13.5, -3.2, -12, 13.5), (13.5, 16, -3.2, -12, 13.5),
    (-13.5, 13.5, -1.6, 11.5, 13.5), (-13.5, 13.5, -1.6, -12, -9), (-13.5, -12, -1.6, -9, 11.5), (12, 13.5, -1.6, -9, 7),
]
bed_objects = [tbox(f"Planting bed {i}", x0, x1, y, y + 0.06, d0, d1, M["soil"], C_SITE) for i, (x0, x1, y, d0, d1) in enumerate(BEDS)]

# Plinth, terrace and pool deck.
tbox("Plinth", -12, 12, -1.6, -0.2, -9, 7, M["concrete"], C_SITE)
tbox("Plinth / pool terrace west", -12, -9.5, -1.6, -0.2, 7, 11.5, M["concrete"], C_SITE)
tbox("Plinth / pool terrace east", 9.5, 12, -1.6, -0.2, 7, 11.5, M["concrete"], C_SITE)
tbox("Deck", -12, 12, -0.2, 0, -9, 7, M["deck"], C_SITE, 0.01)
tbox("Deck / pool terrace west", -12, -9.5, -0.2, 0, 7, 11.5, M["deck"], C_SITE, 0.01)
tbox("Deck / pool terrace east", 9.5, 12, -0.2, 0, 7, 11.5, M["deck"], C_SITE, 0.01)
for i in range(6):
    top = -0.23 * (i + 1)
    d0 = 7 + i * 0.62
    tbox(f"Garden step {i}", 12, 13.5, -1.6, top, d0, d0 + 0.62, M["deck"], C_SITE, 0.01)
    tbox(f"Garden step light {i}", 12.05, 13.45, top - 0.05, top - 0.02, d0 + 0.6, d0 + 0.63, M["led"], C_SITE)

# Infinity pool: dark stone shell, mosaic floor, water to the brim.
for i, (x0, x1, d0, d1) in enumerate([(-9.5, 9.5, 7, 7.3), (-9.5, 9.5, 11.2, 11.5), (-9.5, -9.2, 7.3, 11.2), (9.2, 9.5, 7.3, 11.2)]):
    tbox(f"Pool wall {i}", x0, x1, -1.6, 0.02, d0, d1, M["cladding"], C_SITE, 0.01)
tbox("Pool floor", -9.2, 9.2, -1.6, -1.35, 7.3, 11.2, M["pooltile"], C_SITE)
tbox("Pool water", -9.2, 9.2, -1.35, -0.01, 7.3, 11.5, M["water"], C_SITE)
tbox("Pool overflow sheet", -9.5, 9.5, -1.3, -0.01, 11.5, 11.53, M["water"], C_SITE)

# Ground floor pavilion.
tbox("GF / floor", -7.95, 6.45, 0, 0.02, -5.95, 2.45, M["oak"])
tbox("GF / back wall", -8, 6.5, 0, 3.4, -6.2, -5.95, M["plaster"])
tbox("GF / ceiling", -8, 6.5, 3.35, 3.4, -6.2, 2.5, M["plaster"])
tbox("Cladding wall", 6.5, 8.4, 0, 7.2, -6.2, 2.9, M["cladding"], C_HOUSE, 0.01)
tbox("Column west", -10.95, -10.65, 0, 3.4, 6.15, 6.45, M["frame"])
tbox("Column east", 10.4, 10.7, 0, 3.4, 6.15, 6.45, M["frame"])
tbox("GF / sofa seat", -6.6, -3.6, 0, 0.45, -1.3, -0.4, M["sofa"], C_HOUSE, 0.06)
tbox("GF / sofa back", -6.6, -3.6, 0, 0.82, -1.55, -1.3, M["sofa"], C_HOUSE, 0.06)
tbox("GF / sofa arm", -6.95, -6.6, 0, 0.82, -1.55, 0.7, M["sofa"], C_HOUSE, 0.06)
tbox("GF / dining table", -1.9, 1.3, 0.72, 0.78, -2.3, -1.2, M["timber"], C_HOUSE, 0.01)
tbox("GF / dining base", -0.5, -0.1, 0, 0.72, -1.95, -1.55, M["dark"])
tbox("GF / kitchen island", 2.4, 5.4, 0, 0.95, -3.3, -2.4, M["dark"], C_HOUSE, 0.01)
tbox("GF / island top", 2.35, 5.45, 0.95, 1.0, -3.35, -2.35, M["linen"], C_HOUSE, 0.005)
tbox("GF / kitchen wall", 1.5, 6.3, 0, 2.6, -5.9, -5.3, M["timber"], C_HOUSE, 0.01)
for x in [-1.5, -0.3, 0.9]:
    tbox("GF / chair", x - 0.22, x + 0.22, 0, 0.9, -0.95, -0.55, M["dark"], C_HOUSE, 0.02)
    tbox("GF / chair", x - 0.22, x + 0.22, 0, 0.9, -2.95, -2.55, M["dark"], C_HOUSE, 0.02)
glass_pane("GF / glazing front", -8, 6.5, 0, 3.4, 2.48, 2.52)
glass_pane("GF / glazing west", -8.02, -7.98, 0, 3.4, -6, 2.5)
for x in [-8, -5.6, -3.2, -0.8, 1.6, 4, 6.45]:
    tbox("GF / mullion", x - 0.04, x + 0.04, 0, 3.4, 2.45, 2.56, M["frame"])
for d in [-6, -3.2, -0.4]:
    tbox("GF / mullion west", -8.06, -7.95, 0, 3.4, d - 0.04, d + 0.04, M["frame"])
for i in range(13):
    x = 0.3 + i * 0.13
    tbox("GF / timber slat", x, x + 0.055, 0, 3.4, 2.6, 2.7, M["timber"])

# Second floor slab with soffit light strips.
tbox("Slab / second floor", -11.5, 11, 3.4, 3.8, -7, 7, M["concrete"], C_HOUSE, 0.015)
tbox("Soffit LED / second floor front", -11.3, 10.8, 3.36, 3.4, 6.55, 6.7, M["led"])
tbox("Soffit LED / second floor west", -11.35, -11.2, 3.36, 3.4, -6.8, 6.6, M["led"])

# Second floor bedrooms.
tbox("FF / floor", -6.45, 6.45, 3.8, 3.82, -5.95, 1.95, M["oak"])
tbox("FF / back wall", -6.5, 6.5, 3.8, 7.2, -6.2, -5.95, M["plaster"])
tbox("FF / ceiling", -6.5, 6.5, 7.15, 7.2, -6.2, 2.0, M["plaster"])
tbox("FF / partition", -0.8, -0.6, 3.8, 7.2, -5.95, -1.0, M["plaster"])
for x0 in (-4.6, 1.6):
    tbox("FF / bed", x0, x0 + 2.2, 3.8, 4.35, -3.7, -1.5, M["linen"], C_HOUSE, 0.06)
    tbox("FF / headboard", x0 - 0.1, x0 + 2.3, 3.8, 5.0, -3.9, -3.7, M["timber"], C_HOUSE, 0.02)
    tbox("FF / lamp", x0 - 0.5, x0 - 0.3, 4.35, 4.6, -3.8, -3.6, M["lamp"])
tbox("FF / lounge chair", -1.2, 0.4, 3.8, 4.25, 0.2, 1.1, M["sofa"], C_HOUSE, 0.06)
glass_pane("FF / glazing front", -6.5, 6.5, 3.8, 7.2, 1.98, 2.02)
glass_pane("FF / glazing west", -6.52, -6.48, 3.8, 7.2, -6, 2)
for x in [-6.5, -4, -1.5, 1, 3.5, 6.45]:
    tbox("FF / mullion", x - 0.04, x + 0.04, 3.8, 7.2, 1.95, 2.06, M["frame"])
for i in range(12):
    x = -3.7 + i * 0.13
    tbox("FF / timber slat", x, x + 0.055, 3.8, 7.2, 2.1, 2.2, M["timber"])
tbox("Balustrade / shoe", -11.4, 10.9, 3.8, 3.86, 6.83, 6.93, M["frame"])
glass_pane("Balustrade / front", -11.4, 10.9, 3.86, 4.95, 6.86, 6.9)
glass_pane("Balustrade / west", -11.44, -11.4, 3.86, 4.95, -6.9, 6.9)
glass_pane("Balustrade / east", 10.86, 10.9, 3.86, 4.95, 2.9, 6.9)

# Roof slab.
tbox("Slab / roof", -12, 11.5, 7.2, 7.65, -7.5, 7.2, M["concrete"], C_HOUSE, 0.015)
tbox("Soffit LED / roof front", -11.8, 11.3, 7.16, 7.2, 6.95, 7.1, M["led"])
tbox("Soffit LED / roof west", -11.85, -11.7, 7.16, 7.2, -7.3, 7.0, M["led"])

# Warm timber soffits under both cantilevers, with recessed downlights.
tbox("Soffit / terrace", -11.3, 10.8, 3.37, 3.4, 2.55, 6.5, M["timber"])
tbox("Soffit / terrace west", -11.3, -8.05, 3.37, 3.4, -6.8, 2.55, M["timber"])
tbox("Soffit / balcony", -11.8, 11.3, 7.165, 7.2, 2.05, 6.9, M["timber"])
for x in [(-10.2 + i * 2.4) for i in range(9)]:
    tbox("Downlight / terrace", x - 0.07, x + 0.07, 3.36, 3.37, 4.4, 4.54, M["lamp"])
    tbox("Downlight / balcony", x - 0.07, x + 0.07, 7.155, 7.165, 4.4, 4.54, M["lamp"])


def curtain_material():
    m, n, l, b = new_material("Fabric / sheer curtain")
    b.inputs["Base Color"].default_value = (0.93, 0.91, 0.87, 1)
    b.inputs["Roughness"].default_value = 0.8
    b.inputs["Alpha"].default_value = 0.75
    out = n.get("Material Output")
    trans = n.new("ShaderNodeBsdfTranslucent")
    trans.inputs["Color"].default_value = (1.0, 0.92, 0.8, 1)
    mix = n.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.45
    l.new(b.outputs["BSDF"], mix.inputs[1])
    l.new(trans.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


CURTAIN = curtain_material()


def curtain(name, x0, x1, h0, h1, d):
    """Sheer drape gathered in soft folds just inside the glazing."""
    cols, verts, faces = 48, [], []
    for i in range(cols + 1):
        x = x0 + (x1 - x0) * i / cols
        fold = math.sin(i / cols * math.tau * 7) * 0.06
        verts += [(x, -(d - 0.12) + fold, h0 + 0.02), (x, -(d - 0.12) + fold, h1 - 0.03)]
    for i in range(cols):
        a = i * 2
        faces.append((a, a + 2, a + 3, a + 1))
    ob = mesh_object(name, verts, faces, CURTAIN, C_HOUSE, smooth_shade=True, recalc=False)
    ob.location = (0, 0, 0)
    return ob


curtain("Curtain / GF west", -7.9, -6.3, 0.0, 3.35, 2.45)
curtain("Curtain / GF east", 4.8, 6.4, 0.0, 3.35, 2.45)
curtain("Curtain / FF west", -6.4, -5.0, 3.82, 7.15, 1.95)
curtain("Curtain / FF east", 5.0, 6.4, 3.82, 7.15, 1.95)

# Pale stone coping around the pool (the sea-side edge stays an infinity edge).
tbox("Pool coping", -9.55, 9.55, 0.02, 0.07, 6.95, 7.35, M["deck"], C_SITE, 0.01)
tbox("Pool coping", -9.55, -9.15, 0.02, 0.07, 7.35, 11.2, M["deck"], C_SITE, 0.01)
tbox("Pool coping", 9.15, 9.55, 0.02, 0.07, 7.35, 11.2, M["deck"], C_SITE, 0.01)

# Low bronze bollards with warm light heads along the terrace beds.
for x in [(-12 + i * 4) for i in range(7)]:
    tbox("Bollard", x - 0.06, x + 0.06, -1.54, -1.0, 12.9, 13.02, M["frame"], C_SITE)
    tbox("Bollard", x - 0.055, x + 0.055, -1.06, -1.0, 12.905, 13.015, M["lamp"], C_SITE)

# Winter snow that settles in a soft, thick layer (invisible until 'snowcap' rises).
for name, dims in [
    ("roof", (-12.04, 11.54, 7.65, 7.93, -7.54, 7.24)),
    ("balcony", (-11.38, 10.84, 3.8, 3.97, 2.08, 6.82)),
    ("balcony west", (-11.38, -6.56, 3.8, 3.97, -6.88, 2.08)),
    ("pool terrace west", (-12, -9.52, 0, 0.14, 7.02, 11.5)),
    ("pool terrace east", (9.52, 12, 0, 0.14, 7.02, 11.5)),
    ("upper terrace wall", (-13.5, 13.5, -1.6, -1.47, 11.52, 13.5)),
    ("lower terrace wall", (-16, 16, -3.2, -3.07, 13.52, 16)),
]:
    cap = tbox(f"Snow cap / {name}", *dims, M["snowlayer"], C_SITE, 0.1)
    cap.modifiers["Bevel"].segments = 4

# Outdoor living: loungers, lounge around a fire pit, dining.
def lounger(x, d, rot):
    parts = [
        tbox("Lounger / frame", -0.35, 0.35, 0, 0.26, -0.95, 0.95, M["timber"], C_SITE, 0.02),
        tbox("Lounger / cushion", -0.32, 0.32, 0.26, 0.38, -0.35, 0.92, M["cushion"], C_SITE, 0.04),
        tbox("Lounger / back", -0.32, 0.32, 0.26, 0.38, -0.95, -0.35, M["cushion"], C_SITE, 0.04),
    ]
    parts[2].rotation_euler = (-0.9, 0, 0)
    parts[2].location = (0, 0.4, 0.3)
    root = bpy.data.objects.new("Lounger", None)
    C_SITE.objects.link(root)
    for p in parts:
        p.parent = root
    root.location = (x, -d, 0)
    root.rotation_euler = (0, 0, rot)


for d in (7.9, 9.2, 10.5):
    lounger(-10.9, d, math.pi / 2)
lounger(-10.9, 4.3, 0)
lounger(-9.6, 4.3, 0)
tbox("Lounge / sofa north", 5.2, 9.2, 0, 0.42, 3.3, 4.1, M["sofa"], C_SITE, 0.06)
tbox("Lounge / sofa north back", 5.2, 9.2, 0, 0.78, 3.05, 3.3, M["sofa"], C_SITE, 0.06)
tbox("Lounge / sofa south", 5.2, 9.2, 0, 0.42, 5.7, 6.5, M["sofa"], C_SITE, 0.06)
tbox("Lounge / sofa east", 9.3, 10.1, 0, 0.42, 3.3, 6.5, M["sofa"], C_SITE, 0.06)
tbox("Lounge / sofa east back", 10.05, 10.3, 0, 0.78, 3.05, 6.7, M["sofa"], C_SITE, 0.06)
tbox("Fire pit", 6.3, 8.1, 0, 0.36, 4.45, 5.35, M["cladding"], C_SITE, 0.02)
tbox("Fire pit / flame bed", 6.5, 7.9, 0.36, 0.42, 4.7, 5.1, M["fire"], C_SITE)
tbox("Dining / table", -3.2, 0.2, 0.72, 0.78, 3.9, 5.1, M["timber"], C_SITE, 0.01)
tbox("Dining / base", -1.7, -1.3, 0, 0.72, 4.3, 4.7, M["dark"], C_SITE)
for x in (-2.7, -1.5, -0.3):
    tbox("Dining / chair", x - 0.23, x + 0.23, 0, 0.85, 3.25, 3.7, M["dark"], C_SITE, 0.02)
    tbox("Dining / chair", x - 0.23, x + 0.23, 0, 0.85, 5.3, 5.75, M["dark"], C_SITE, 0.02)

# ---------------------------------------------------------------------------
# Planting assets (instanced)

ASSET_Z = -500  # parked below the world; only instances are seen


def leaf_mesh(name, length, width, mat):
    v = [(0, 0, 0), (width / 2, length * 0.45, 0.01), (0, length, 0), (-width / 2, length * 0.45, 0.01)]
    ob = mesh_object(name, v, [(0, 1, 2, 3)], mat, C_ASSETS, recalc=False)
    ob.location.z = ASSET_Z
    return ob


def palm_crown(name):
    """Fronds of paired, folded leaflets along a drooping rachis."""
    verts, faces = [], []
    fronds = 24
    for f in range(fronds):
        yaw = f / fronds * math.tau + random.uniform(-0.12, 0.12)
        pitch = random.uniform(-0.35, 0.45)
        length = random.uniform(3.0, 4.0)
        cy, sy = math.cos(yaw), math.sin(yaw)
        steps = 30
        for s in range(1, steps):
            t = s / steps
            along = t * length
            up = math.sin(t * math.pi * 0.7) * 1.0 * (1 + pitch) - t * t * 2.1
            cx, cyy, cz = along * cy, along * sy, up
            leaflet = math.sin(math.pi * min(1, t * 1.08)) * 1.05 * (1 - t * 0.3)
            w = 0.09 * (1 - t * 0.5)
            for side in (-1, 1):
                px, py = -sy * side, cy * side
                # Leaflets sweep forward and hang, V-folded along their midrib.
                tipx = cx + px * leaflet * 0.85 + cy * leaflet * 0.35
                tipy = cyy + py * leaflet * 0.85 + sy * leaflet * 0.35
                tipz = cz - leaflet * 0.55
                midx, midy, midz = (cx + tipx) / 2, (cyy + tipy) / 2, (cz + tipz) / 2 + 0.04
                k = len(verts)
                verts += [
                    (cx, cyy, cz),
                    (midx + cy * w, midy + sy * w, midz - 0.03),
                    (tipx, tipy, tipz),
                    (midx - cy * w, midy - sy * w, midz - 0.03),
                ]
                faces += [(k, k + 1, k + 2), (k, k + 2, k + 3)]
    ob = mesh_object(name, verts, faces, M["palmleaf"], C_ASSETS, recalc=False)
    ob.location.z = ASSET_Z
    return ob


def palm_trunk_mesh(name, height, lean):
    verts, faces = [], []
    rings, seg = 34, 12
    for r in range(rings + 1):
        t = r / rings
        z = t * height
        off = lean * t * t
        rad = 0.26 - 0.08 * t + 0.02 * math.sin(r * 2.3)
        for s in range(seg):
            a = s / seg * math.tau
            verts.append((off + math.cos(a) * rad, math.sin(a) * rad, z))
    for r in range(rings):
        for s in range(seg):
            a, b = r * seg + s, r * seg + (s + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    return verts, faces


def agave_mesh(name):
    verts, faces = [], []
    for i in range(18):
        yaw = i / 18 * math.tau + random.uniform(-0.1, 0.1)
        tilt = random.uniform(0.35, 1.2)
        length = random.uniform(0.6, 1.0)
        cy, sy = math.cos(yaw), math.sin(yaw)
        k = len(verts)
        w = 0.07
        verts += [
            (-sy * w, cy * w, 0.05), (sy * w, -cy * w, 0.05),
            (cy * length * math.sin(tilt), sy * length * math.sin(tilt), length * math.cos(tilt) + 0.05),
        ]
        faces.append((k, k + 1, k + 2))
    ob = mesh_object(name, verts, faces, M["agave"], C_ASSETS, recalc=False)
    ob.location.z = ASSET_Z
    ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
    return ob


MODELS = OUT / "assets" / "models"
LEAFY = ("leaves", "leaf", "grass", "rooibos", "iceplant", "succulent")


def seasonalize(mat):
    """Imported foliage follows the season: fresher in spring, gold in autumn, dulled in winter."""
    n, l = mat.node_tree.nodes, mat.node_tree.links
    b = next((x for x in n if x.type == "BSDF_PRINCIPLED"), None)
    if not b or not b.inputs["Base Color"].links:
        return
    src = b.inputs["Base Color"].links[0].from_socket
    chain = src
    for attr, blend, colour, amount in (("spring", "MULTIPLY", (0.9, 1.1, 0.8), 1.0), ("autumn", "MULTIPLY", (1.9, 1.0, 0.35), 0.9),
                                        ("winter", "MIX", (0.3, 0.29, 0.25), 0.4)):
        mix = n.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = blend
        mix.inputs["B"].default_value = (*colour, 1)
        fac = n.new("ShaderNodeMath")
        fac.operation = "MULTIPLY"
        fac.inputs[1].default_value = amount
        l.new(scene_attr(n, attr).outputs["Fac"], fac.inputs[0])
        l.new(fac.outputs[0], mix.inputs["Factor"])
        l.new(chain, mix.inputs["A"])
        chain = mix.outputs["Result"]
    l.new(chain, b.inputs["Base Color"])


def import_model(name, outdoor=True):
    """Import a glTF from artwork/villa/assets, bake its rotation/scale, and park it in the asset collection."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / name / f"{name}.gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = []
    for o in new:
        world = o.matrix_world.copy()
        o.parent = None
        for c in list(o.users_collection):
            c.objects.unlink(o)
        if o.type != "MESH":
            bpy.data.objects.remove(o)
            continue
        loc = world.translation.copy()
        o.data.transform(Matrix.Translation(-loc) @ world)  # keep geometry around the object's own origin
        o.matrix_world = Matrix.Translation(loc)
        meshes.append(o)
    for mat in {s.material for o in meshes for s in o.material_slots if s.material}:
        if not outdoor:
            continue
        if any(k in mat.name.lower() for k in LEAFY):
            seasonalize(mat)
        add_snow(mat, 0.7)
    return meshes


def single_asset(name, outdoor=True):
    """A one-piece asset (joined if it has parts), origin at the base, hidden source for linked copies."""
    parts = import_model(name, outdoor)
    ob = parts[0]
    if len(parts) > 1:
        for extra in parts[1:]:
            extra.data.transform(Matrix.Translation(extra.location - ob.location))
        bm = bmesh.new()
        for part in parts:
            bm.from_mesh(part.data)
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for part in parts:
            for slot in part.material_slots:
                if slot.material and slot.material.name not in me.materials:
                    me.materials.append(slot.material)
        # Rebuild material indices by matching each part's slot names.
        me.polygons.foreach_set("material_index", [0] * len(me.polygons))
        offset = 0
        for part in parts:
            names = [s.material.name for s in part.material_slots]
            idx = [me.materials.find(names[p.material_index]) if names else 0 for p in part.data.polygons]
            for i, v in enumerate(idx):
                me.polygons[offset + i].material_index = v
            offset += len(part.data.polygons)
        ob = bpy.data.objects.new(name, me)
    ob.location = (0, 0, ASSET_Z)
    C_ASSETS.objects.link(ob)
    ob.hide_render = True
    return ob


def variant_collection(name, outdoor=True):
    """Variants of one plant (grass clumps, succulents…) as a collection for random scattering."""
    coll = bpy.data.collections.new("Asset / " + name)
    scene.collection.children.link(coll)
    for o in import_model(name, outdoor):
        coll.objects.link(o)
    bpy.context.view_layer.layer_collection.children[coll.name].exclude = True
    return coll


def copy_of(asset, name, loc, rot_z=0.0, scale=1.0, col=None):
    ob = bpy.data.objects.new(name, asset.data)
    (col or C_LIFE).objects.link(ob)
    ob.location = loc
    ob.rotation_euler.z = rot_z
    ob.scale = (scale,) * 3
    return ob


GRASS_CLUMPS = variant_collection("grass_medium_01")
SUCCULENTS = variant_collection("cheiridopsis_succulent")
ICEPLANT = variant_collection("crystalline_iceplant")
BUSHES = variant_collection("wild_rooibos_bush")
TREE_ASSETS = [single_asset(n) for n in ("island_tree_01", "island_tree_02", "tree_small_02", "island_tree_03")]
POT_SUCCULENT = single_asset("potted_plant_04")
POT_PLANT = single_asset("potted_plant_02", outdoor=False)
LOUNGE_CHAIR = single_asset("mid_century_lounge_chair", outdoor=False)
COFFEE_TABLE = single_asset("modern_coffee_table_01", outdoor=False)
PENDANT = single_asset("modern_ceiling_lamp_01", outdoor=False)
ROCK_FIELD = single_asset("coast_rocks_02")
ROCKS = single_asset("coast_land_rocks_03")
# The pendant globes glow with the house lights.
for mat in PENDANT.data.materials:
    if "globe" in mat.name.lower():
        nn, ll = mat.node_tree.nodes, mat.node_tree.links
        bb = next(x for x in nn if x.type == "BSDF_PRINCIPLED")
        bb.inputs["Emission Color"].default_value = (1.0, 0.75, 0.45, 1)
        glow = nn.new("ShaderNodeMath")
        glow.operation = "MULTIPLY"
        glow.inputs[1].default_value = 12.0
        ll.new(scene_attr(nn, "lights").outputs["Fac"], glow.inputs[0])
        ll.new(glow.outputs[0], bb.inputs["Emission Strength"])

LEAF = leaf_mesh("Asset / leaf", 0.3, 0.12, M["leaf"])
SHRUB_LEAF = leaf_mesh("Asset / shrub leaf", 0.14, 0.07, M["shrub"])
CROWN = palm_crown("Asset / palm crown")
AGAVE = agave_mesh("Asset / agave")

# ---------------------------------------------------------------------------
# Geometry-nodes scatter: instances an object across a surface.

def sock(sockets, name):
    """First enabled socket with this name (typed nodes keep hidden duplicates)."""
    return next(x for x in sockets if x.name == name and x.enabled)


def scatter_group(name):
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    iface = ng.interface
    iface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Instance", in_out="INPUT", socket_type="NodeSocketObject")
    dens = iface.new_socket("Density", in_out="INPUT", socket_type="NodeSocketFloat")
    dens.default_value = 10
    smin = iface.new_socket("Scale Min", in_out="INPUT", socket_type="NodeSocketFloat")
    smin.default_value = 0.8
    smax = iface.new_socket("Scale Max", in_out="INPUT", socket_type="NodeSocketFloat")
    smax.default_value = 1.2
    seed = iface.new_socket("Seed", in_out="INPUT", socket_type="NodeSocketInt")
    seed.default_value = 0
    keep = iface.new_socket("Keep Surface", in_out="INPUT", socket_type="NodeSocketBool")
    keep.default_value = False
    upright = iface.new_socket("Upright", in_out="INPUT", socket_type="NodeSocketBool")
    upright.default_value = True
    thin = iface.new_socket("Thin", in_out="INPUT", socket_type="NodeSocketFloat")
    thin.default_value = 1.0
    iface.new_socket("Collection", in_out="INPUT", socket_type="NodeSocketCollection")
    use_coll = iface.new_socket("Use Collection", in_out="INPUT", socket_type="NodeSocketBool")
    use_coll.default_value = False
    sway = iface.new_socket("Sway", in_out="INPUT", socket_type="NodeSocketFloat")
    sway.default_value = 0.0
    clock = iface.new_socket("Clock", in_out="INPUT", socket_type="NodeSocketFloat")
    clock.default_value = 0.0
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n, l = ng.nodes, ng.links
    gin = n.new("NodeGroupInput")
    gout = n.new("NodeGroupOutput")
    dist = n.new("GeometryNodeDistributePointsOnFaces")
    l.new(gin.outputs["Geometry"], dist.inputs["Mesh"])
    l.new(gin.outputs["Density"], dist.inputs["Density"])
    l.new(gin.outputs["Seed"], dist.inputs["Seed"])
    info = n.new("GeometryNodeObjectInfo")
    info.transform_space = "ORIGINAL"  # ignore where the source asset is parked
    info.inputs["As Instance"].default_value = True
    l.new(gin.outputs["Instance"], info.inputs["Object"])
    rot_up = n.new("FunctionNodeRandomValue")
    rot_up.data_type = "FLOAT_VECTOR"
    rot_up.inputs["Min"].default_value = (0, 0, 0)
    rot_up.inputs["Max"].default_value = (0.25, 0.25, math.tau)
    l.new(gin.outputs["Seed"], rot_up.inputs["Seed"])
    rot_any = n.new("FunctionNodeRandomValue")
    rot_any.data_type = "FLOAT_VECTOR"
    rot_any.inputs["Min"].default_value = (0, 0, 0)
    rot_any.inputs["Max"].default_value = (math.tau, math.tau, math.tau)
    l.new(gin.outputs["Seed"], rot_any.inputs["Seed"])
    pick = n.new("GeometryNodeSwitch")
    pick.input_type = "VECTOR"
    l.new(gin.outputs["Upright"], pick.inputs["Switch"])
    l.new(rot_any.outputs["Value"], pick.inputs["False"])
    l.new(rot_up.outputs["Value"], pick.inputs["True"])
    scale = n.new("FunctionNodeRandomValue")
    scale.data_type = "FLOAT"
    l.new(gin.outputs["Scale Min"], sock(scale.inputs, "Min"))
    l.new(gin.outputs["Scale Max"], sock(scale.inputs, "Max"))
    l.new(gin.outputs["Seed"], sock(scale.inputs, "Seed"))
    # Seasonal thinning drops a stable random subset of points (no flicker as it animates).
    keep_rv = n.new("FunctionNodeRandomValue")
    keep_rv.data_type = "FLOAT"
    l.new(gin.outputs["Seed"], sock(keep_rv.inputs, "Seed"))
    cmp = n.new("FunctionNodeCompare")
    cmp.data_type = "FLOAT"
    cmp.operation = "GREATER_THAN"
    l.new(sock(keep_rv.outputs, "Value"), sock(cmp.inputs, "A"))
    l.new(gin.outputs["Thin"], sock(cmp.inputs, "B"))
    cull = n.new("GeometryNodeDeleteGeometry")
    cull.domain = "POINT"
    l.new(dist.outputs["Points"], cull.inputs["Geometry"])
    l.new(cmp.outputs["Result"], cull.inputs["Selection"])
    inst = n.new("GeometryNodeInstanceOnPoints")
    l.new(cull.outputs["Geometry"], inst.inputs["Points"])
    # Either one object, or a random pick from a collection of variants.
    variants = n.new("GeometryNodeCollectionInfo")
    variants.transform_space = "ORIGINAL"
    variants.inputs["Separate Children"].default_value = True
    variants.inputs["Reset Children"].default_value = True
    l.new(gin.outputs["Collection"], variants.inputs["Collection"])
    source = n.new("GeometryNodeSwitch")
    source.input_type = "GEOMETRY"
    l.new(gin.outputs["Use Collection"], source.inputs["Switch"])
    l.new(info.outputs["Geometry"], source.inputs["False"])
    l.new(variants.outputs["Instances"], source.inputs["True"])
    l.new(source.outputs["Output"], inst.inputs["Instance"])
    inst.inputs["Pick Instance"].default_value = True
    which = n.new("FunctionNodeRandomValue")
    which.data_type = "INT"
    sock(which.inputs, "Max").default_value = 97
    l.new(gin.outputs["Seed"], sock(which.inputs, "Seed"))
    l.new(sock(which.outputs, "Value"), inst.inputs["Instance Index"])
    # Wind: every instance tilts by a smooth noise field that drifts with the clock,
    # so neighbouring leaves and tufts move together in gusts.
    wind_pos = n.new("GeometryNodeInputPosition")
    wind_noise = n.new("ShaderNodeTexNoise")
    wind_noise.noise_dimensions = "4D"
    wind_noise.inputs["Scale"].default_value = 0.35
    wind_noise.inputs["Detail"].default_value = 2
    l.new(wind_pos.outputs["Position"], wind_noise.inputs["Vector"])
    wind_speed = n.new("ShaderNodeMath")
    wind_speed.operation = "MULTIPLY"
    wind_speed.inputs[1].default_value = 1.6
    l.new(gin.outputs["Clock"], wind_speed.inputs[0])
    l.new(wind_speed.outputs[0], wind_noise.inputs["W"])
    centred = n.new("ShaderNodeVectorMath")
    centred.operation = "SUBTRACT"
    centred.inputs[1].default_value = (0.5, 0.5, 0.5)
    l.new(wind_noise.outputs["Color"], centred.inputs[0])
    gusted = n.new("ShaderNodeVectorMath")
    gusted.operation = "SCALE"
    l.new(centred.outputs["Vector"], gusted.inputs[0])
    l.new(gin.outputs["Sway"], gusted.inputs["Scale"])
    swayed = n.new("ShaderNodeVectorMath")
    swayed.operation = "ADD"
    l.new(pick.outputs["Output"], swayed.inputs[0])
    l.new(gusted.outputs["Vector"], swayed.inputs[1])
    l.new(swayed.outputs["Vector"], inst.inputs["Rotation"])
    l.new(sock(scale.outputs, "Value"), inst.inputs["Scale"])
    surf = n.new("GeometryNodeSwitch")
    surf.input_type = "GEOMETRY"
    l.new(gin.outputs["Keep Surface"], surf.inputs["Switch"])
    l.new(gin.outputs["Geometry"], surf.inputs["True"])
    join = n.new("GeometryNodeJoinGeometry")
    l.new(inst.outputs["Instances"], join.inputs["Geometry"])
    l.new(surf.outputs["Output"], join.inputs["Geometry"])
    l.new(join.outputs["Geometry"], gout.inputs["Geometry"])
    return ng


SCATTER = scatter_group("Scatter instances")


def set_input(mod, name, value):
    for item in SCATTER.interface.items_tree:
        if getattr(item, "in_out", None) == "INPUT" and item.name == name:
            # Blender 5 exposes modifier inputs as typed properties, not ID props.
            getattr(mod.properties.inputs, item.identifier).value = value
            return


def scatter(target, instance, density, smin=0.8, smax=1.2, seed=0, keep=False, upright=True):
    mod = target.modifiers.new("Scatter", "NODES")
    mod.node_group = SCATTER
    if isinstance(instance, bpy.types.Collection):
        set_input(mod, "Collection", instance)
        set_input(mod, "Use Collection", True)
    else:
        set_input(mod, "Instance", instance)
    set_input(mod, "Density", float(density))
    set_input(mod, "Scale Min", float(smin))
    set_input(mod, "Scale Max", float(smax))
    set_input(mod, "Seed", int(seed))
    set_input(mod, "Keep Surface", keep)
    set_input(mod, "Upright", upright)
    return mod


FOLIAGE_MODS = []  # (modifier, base density) for seasonal thinning


def canopy(name, x, y, z, radius, mat_leaf, leaf, density, seed, inner_mat, clumps=5, spread=0.6, tight=False):
    """Leaf instances over a cluster of clumps; loose clumps with gaps read as a real tree, tight ones as topiary."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    for i in range(clumps):
        c = Vector((rnd.uniform(-1, 1) * spread * 1.6, rnd.uniform(-1, 1) * spread * 1.6, rnd.uniform(-0.45, 0.6) * spread)) * radius
        r = radius * (rnd.uniform(0.55, 0.8) if tight else rnd.uniform(0.3, 0.55))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r, matrix=Matrix.Translation(c))
    # Jitter the shells so clumps are not perfect spheres.
    for v in bm.verts:
        v.co += Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1))) * radius * (0.04 if tight else 0.12)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(inner_mat)
    ob = bpy.data.objects.new(name, me)
    C_LIFE.objects.link(ob)
    ob.location = (x, y, z)
    if not tight:
        ob.scale = (0.8, 0.8, 0.8)  # inner mass sits inside the leaves, leaving gaps
    mod = scatter(ob, leaf, density, 0.7, 1.4, seed, keep=True, upright=False)
    FOLIAGE_MODS.append((mod, density))
    return ob


inner_leaf = pbr("Leaves / canopy shadow mass", (0.02, 0.035, 0.012), 0.9)
add_snow(inner_leaf, 0.7)


def tree(x, d, ground, s, seed):
    """A scanned island/shade tree; origin at the base, so wind sway pivots at the trunk."""
    copy_of(TREE_ASSETS[seed % len(TREE_ASSETS)], "Tree canopy", (x, -d, ground), random.uniform(0, math.tau), s * 0.85)


def palm(x, d, ground, height, seed):
    lean = random.uniform(-1.2, 1.2)
    v, f = palm_trunk_mesh("Palm trunk", height, lean)
    trunk = mesh_object("Palm trunk", v, f, M["palmtrunk"], C_LIFE, smooth_shade=True)
    trunk.location = (x, -d, ground)
    trunk.rotation_euler.z = random.uniform(0, math.tau)
    crown = bpy.data.objects.new("Palm crown", CROWN.data)
    C_LIFE.objects.link(crown)
    crown.parent = trunk
    crown.location = (lean, 0, height)
    crown.rotation_euler.z = random.uniform(0, math.tau)
    crown.scale = (1, 1, 1)
    trunk.rotation_mode = "ZYX"  # spin first, then lean with the wind in world space
    nuts = []
    for k in range(5):
        a = k / 5 * math.tau + random.uniform(-0.3, 0.3)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.14, location=(0, 0, 0))
        nut = bpy.context.active_object
        nut.name = "Coconut"
        for coll in nut.users_collection:
            coll.objects.unlink(nut)
        C_LIFE.objects.link(nut)
        nut.data.materials.append(M["coconut"])
        nut.parent = crown
        nut.location = (math.cos(a) * 0.28, math.sin(a) * 0.28, -0.35 - random.uniform(0, 0.15))
        nuts.append(nut)
    PALM_PARTS.append((trunk, crown, nuts, ground))


SUCCULENT_OBJECTS = list(SUCCULENTS.objects)


def agave(x, d, ground, s):
    """A scanned succulent cluster (kept under the 'Agave' name the build and wind use)."""
    src = random.choice(SUCCULENT_OBJECTS)
    copy_of(src, "Agave", (x, -d, ground), random.uniform(0, math.tau), s * 2.2)


def shrub(x, d, ground, s, seed):
    canopy("Shrub", x, -d, ground + 0.35 * s, 0.55 * s, M["shrub"], SHRUB_LEAF, 260, seed, inner_leaf, clumps=3, spread=0.35, tight=True)


PALM_PARTS = []  # (trunk, crown, coconuts, ground level) for wind and falling coconuts
TREES = [(-14.8, -3.14, -7, 1.3), (14.8, -3.14, -9, 1.4), (-14.6, -3.14, 12.4, 1.1), (-9, -4.8, 19.5, 1.5), (10, -4.8, 20.5, 1.4),
         (20, -4.8, -2, 1.6), (-19, -4.8, -12, 1.5), (4, -1.54, -10.5, 1.2), (-6, -1.54, -10.5, 1.25), (24, -4.8, 14, 1.7)]
for i, (x, g, d, s) in enumerate(TREES):
    tree(x, d, g, s, 100 + i)
PALMS = [(-14.6, -3.14, 4, 8.5), (14.7, -3.14, 1, 9.5), (14.7, -3.14, 11.5, 7.5), (-12.8, -1.54, -3, 7),
         (-20, -4.8, 6, 10.5), (21, -4.8, 9, 9), (-18, -4.8, -20, 11), (18, -4.8, -18, 10), (27, -4.8, -6, 11.5), (-23, -4.8, 15, 8.5)]
for i, (x, g, d, h) in enumerate(PALMS):
    palm(x, d, g, h, 200 + i)
for x in [(-15 + i * 2.1) for i in range(15)]:
    agave(x + random.uniform(-0.4, 0.4), 14.3 + random.random() * 1.2, -3.14, random.uniform(0.9, 1.4))
for i, x in enumerate([(-12.8 + i * 2.3) for i in range(12)]):
    if i % 3 == 1:
        shrub(x, 12.4, -1.54, random.uniform(0.9, 1.3), 300 + i)
    else:
        agave(x + random.uniform(-0.3, 0.3), 12.1 + random.random() * 0.9, -1.54, random.uniform(0.8, 1.2))
for i, d in enumerate([(-11 + i * 2.6) for i in range(9)]):
    shrub(-14.8 + random.uniform(-0.3, 0.3), d, -3.14, random.uniform(0.9, 1.4), 400 + i)
    shrub(14.8 + random.uniform(-0.3, 0.3), d, -3.14, random.uniform(0.9, 1.4), 500 + i)
GRASS_MODS = []
for i, bed in enumerate(bed_objects):
    GRASS_MODS.append((scatter(bed, GRASS_CLUMPS, 16, 0.9, 1.6, 600 + i, keep=True), 16))
    GRASS_MODS.append((scatter(bed, ICEPLANT, 0.9, 1.2, 2.2, 650 + i, keep=True), 0.9))
    GRASS_MODS.append((scatter(bed, BUSHES, 0.12, 0.8, 1.3, 680 + i, keep=True), 0.12))

# Planters on the balcony.
for x in (-9.5, -3.5, 3, 8.5):
    copy_of(POT_SUCCULENT, "Planter", (x, -5.9, 3.8), random.uniform(0, math.tau), 3.4, C_HOUSE)

# Living room: lounge chairs, coffee table, globe pendants over the dining table, a plant.
copy_of(COFFEE_TABLE, "GF / coffee table", (-5.0, -0.6, 0.02), 0.0, 1.0, C_HOUSE)
copy_of(LOUNGE_CHAIR, "GF / lounge chair", (-3.7, 1.4, 0.02), 2.5, 1.0, C_HOUSE)
copy_of(LOUNGE_CHAIR, "GF / lounge chair", (-6.3, 1.5, 0.02), -2.6, 1.0, C_HOUSE)
for i, x in enumerate([-1.1, -0.2, 0.7]):
    copy_of(PENDANT, "GF / pendant", (x, 1.75, 3.35 - 1.17), 0.0, 1.0, C_HOUSE)
copy_of(POT_PLANT, "GF / plant", (-7.3, 1.6, 0.02), 0.4, 1.4, C_HOUSE)
copy_of(POT_PLANT, "FF / plant", (5.6, 1.2, 3.82), 1.2, 1.3, C_HOUSE)

# Scanned coastal rocks along the waterline and at the foot of the terraces.
copy_of(ROCK_FIELD, "Rocks", (-44, -32, -5.75), 0.6, 0.45, C_LAND)
copy_of(ROCKS, "Rocks", (-22.5, 6, -5.05), 1.9, 0.8, C_LAND)
copy_of(ROCKS, "Rocks", (-31, -46, -5.3), 0.2, 0.9, C_LAND)
copy_of(ROCKS, "Rocks", (-26, 26, -5.2), 2.8, 0.7, C_LAND)

# ---------------------------------------------------------------------------
# Landscape: heightfield with coast, beach and hills; mountains; the sea.

def coast(x, y):
    return (x + 24 - 0.35 * y) * 0.944  # signed distance inland (site plan: sea to the west)


def height(x, y):
    s = coast(x, y)
    h = -4.8
    if s < 8:
        h -= (8 - s) * 0.075
    nz = noise.noise(Vector((x * 0.02, y * 0.02, 0.3)))
    h += smooth(40, 150, y) * smooth(10, 60, s) * (5 + 6 * nz)
    h += smooth(60, 170, x) * smooth(10, 50, s) * (3.5 + 4 * nz)
    h += 0.25 * noise.noise(Vector((x * 0.15, y * 0.15, 1.7)))
    site = smooth(24, 17, abs(x)) * smooth(24, 17, abs(-y - 1))
    return h + (-4.8 - h) * site


def grid(name, x0, x1, y0, y1, nx, ny, hfn, mat, col, mask_fn=None):
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx
            y = y0 + (y1 - y0) * j / ny
            verts.append((x, y, hfn(x, y)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    ob = mesh_object(name, verts, faces, mat, col, smooth_shade=True, recalc=False)
    if mask_fn:
        attr = ob.data.color_attributes.new("mask", "FLOAT_COLOR", "POINT")
        for idx, v in enumerate(verts):
            attr.data[idx].color = (*mask_fn(v[0], v[1], v[2]), 1)
    return ob


def ground_mask(x, y, z):
    s = coast(x, y)
    sand = 1 - smooth(6.5, 10.5, s)
    rock = smooth(2, 14, z) * 0.6
    wet = 1 - smooth(-1.5, 2.5, s)
    return (sand, rock, wet)


ground = grid("Ground", -260, 720, -220, 380, 490, 300, height, M["ground"], C_LAND, ground_mask)  # east edge beyond the panorama


def lawn_height(x, y):
    # Only inland ground gets grass; the beach patch drops out of sight below it.
    return height(x, y) + 0.01 if coast(x, y) > 9 else -60


lawn = grid("Ground grass (scatter only)", -45, 60, -95, 40, 105, 135, lawn_height, M["ground"], C_LAND)
bm = bmesh.new()
bm.from_mesh(lawn.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if any(v.co.z < -50 for v in f.verts)], context="FACES")
# Keep the house footprint and terraces clear.
bmesh.ops.delete(bm, geom=[f for f in bm.faces if abs(f.calc_center_median().x) < 16.2 and -16.2 < f.calc_center_median().y < 14.2], context="FACES")
# Origin on the garden level, so the lawn can grow up out of the ground in the build.
for v in bm.verts:
    v.co.z += 4.8
bm.to_mesh(lawn.data)
bm.free()
lawn.location.z = -4.8
GRASS_MODS.append((scatter(lawn, GRASS_CLUMPS, 22, 1.0, 2.0, 900), 22))


def far_height(x, y):
    s = coast(x, y)
    if s < 0:
        return SEA - 6
    base = height(x, y) if abs(x) < 260 and -220 < y < 380 else -4.8 + smooth(10, 60, s) * 8
    p = Vector((x * 0.0032, y * 0.0032, 0.5))
    ridge = noise.ridged_multi_fractal(p, 0.95, 2.05, 8, 1.0, 2.0)
    detail = noise.hetero_terrain(p * 6, 0.8, 2.0, 5, 0.4)
    mask = smooth(40, 150, s) * smooth(380, 680, y)
    return base + mask * (ridge * 44 + detail * 4)


mountains = grid("Mountains", -700, 1400, 360, 1500, 420, 228, far_height, M["mountain"], C_LAND)
bpy.ops.object.select_all(action="DESELECT")

sea = mesh_object("Sea", [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)], [(0, 1, 2, 3)], M["sea"], C_LAND)
sea.location = (-280, 250, SEA)
ocean = sea.modifiers.new("Ocean", "OCEAN")
ocean.geometry_mode = "GENERATE"
ocean.size = 1.0
ocean.spatial_size = 120
ocean.resolution = 12
ocean.repeat_x = 7
ocean.repeat_y = 9
ocean.wave_scale = 0.9
ocean.choppiness = 0.9
ocean.wind_velocity = 9
ocean.time = 4.0
ocean.use_foam = True
ocean.foam_layer_name = "foam"
ocean.foam_coverage = 0.2
# Scale the generated patch so it covers the whole bay in front of the camera.
bpy.context.view_layer.update()
ev = sea.evaluated_get(bpy.context.evaluated_depsgraph_get())
xs = [v[0] for v in ev.bound_box]
ys = [v[1] for v in ev.bound_box]
span_x, span_y = max(xs) - min(xs), max(ys) - min(ys)
print("OCEAN PATCH", span_x, span_y, min(xs), min(ys))
sea.scale = (1000 / span_x, 1150 / span_y, 1)
sea.location = (-320 - (min(xs) + span_x / 2) * sea.scale[0], 380 - (min(ys) + span_y / 2) * sea.scale[1], SEA)
far_sea = mesh_object("Sea / horizon", [(-4000, -4000, 0), (4000, -4000, 0), (4000, 4000, 0), (-4000, 4000, 0)], [(0, 1, 2, 3)], M["sea"], C_LAND)
far_sea.location.z = SEA - 0.6

# Sailboats far out in the bay.
def sailboat(name, x, y, scale):
    root = bpy.data.objects.new(name, None)
    C_LAND.objects.link(root)
    hull_v = [(-4.5, 0, 0.6), (4.5, 0, 0.6), (3.2, -1.3, 0.6), (-4.0, -1.1, 0.6), (3.2, 1.3, 0.6), (-4.0, 1.1, 0.6),
              (-3.6, 0, -0.5), (3.6, 0, -0.1)]
    hull_f = [(0, 3, 2, 1), (0, 1, 4, 5), (3, 6, 7, 2), (5, 4, 7, 6), (2, 7, 1), (4, 1, 7), (0, 6, 3), (0, 5, 6)]
    hull = mesh_object(name + " / hull", hull_v, hull_f, M["hull"], C_LAND)
    hull.parent = root
    mast = tbox(name + " / mast", -0.06, 0.06, 0.6, 13.5, -0.06, 0.06, M["frame"], C_LAND)
    mast.parent = root
    main = mesh_object(name + " / mainsail", [(0.1, 0, 1.4), (0.1, 0, 13.2), (4.2, 0.2, 1.5)], [(0, 1, 2)], M["sail"], C_LAND)
    main.parent = root
    jib = mesh_object(name + " / jib", [(-0.1, 0, 12.6), (-4.3, 0.1, 0.9), (-0.1, 0.15, 1.1)], [(0, 1, 2)], M["sail"], C_LAND)
    jib.parent = root
    light = tbox(name + " / mast light", -0.12, 0.12, 13.5, 13.75, -0.12, 0.12, M["lamp"], C_LAND)
    light.parent = root
    root.location = (x, y, SEA)
    root.scale = (scale, scale, scale)
    return root


BOATS = [
    (sailboat("Sailboat A", -60, 300, 1.0), 0.8, 0.0),
    (sailboat("Sailboat B", -10, 600, 1.1), 0.55, 1.3),
    (sailboat("Sailboat C", -140, 560, 0.9), 0.7, 2.1),
    (sailboat("Sailboat D", 60, 700, 1.0), 0.45, 3.4),
]
for boat, _, _ in BOATS:
    boat.rotation_euler.z = math.radians(random.uniform(-25, 25))


# Seagulls: a body and two hinged wings each.
def gull(name):
    body = mesh_object(name, [(-0.22, 0, 0), (0.28, 0, 0.02), (0, 0.07, 0), (0, -0.07, 0), (0, 0, 0.07), (0, 0, -0.06)],
                       [(0, 2, 4), (0, 4, 3), (0, 3, 5), (0, 5, 2), (1, 4, 2), (1, 3, 4), (1, 5, 3), (1, 2, 5)], M["gull"], C_LAND)
    wings = []
    for side in (1, -1):
        w = mesh_object(name + " / wing", [(0.08, 0, 0), (-0.1, 0, 0), (-0.05, 0.6 * side, 0.02), (0.12, 0.45 * side, 0.03)],
                        [(0, 1, 2, 3)], M["gull"], C_LAND, recalc=False)
        tip = mesh_object(name + " / wingtip", [(-0.05, 0.6 * side, 0.02), (0.12, 0.45 * side, 0.03), (0.02, 0.72 * side, 0.02)],
                          [(0, 1, 2)], M["gulltip"], C_LAND, recalc=False)
        tip.parent = w
        w.parent = body
        wings.append((w, side))
    return body, wings


GULLS = [gull(f"Gull {i}") for i in range(18)]
for body, _ in GULLS:
    body.scale = (1.7, 1.7, 1.7)  # read clearly at hero size

# Aerial perspective. Each outdoor material blends toward the colour of the sky
# behind it along the view ray (a Sky Texture evaluated in that direction, mixed
# with the overcast colour), by 1 - exp(-distance * fog). Clear days get a light
# haze on the mountains; rain and snow turn it into mist around the house.
SKY_NODES = []


def add_haze(m):
    n, l = m.node_tree.nodes, m.node_tree.links
    out = n.get("Material Output")
    src = out.inputs["Surface"].links[0].from_socket
    geo = n.new("ShaderNodeNewGeometry")
    view = n.new("ShaderNodeVectorMath")
    view.operation = "SCALE"
    view.inputs["Scale"].default_value = -1
    l.new(geo.outputs["Incoming"], view.inputs[0])
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(view.outputs["Vector"], sep.inputs["Vector"])
    zc = n.new("ShaderNodeMath")
    zc.operation = "MAXIMUM"
    zc.inputs[1].default_value = 0.03  # look just above the horizon, never into the ground
    l.new(sep.outputs["Z"], zc.inputs[0])
    comb = n.new("ShaderNodeCombineXYZ")
    l.new(sep.outputs["X"], comb.inputs["X"])
    l.new(sep.outputs["Y"], comb.inputs["Y"])
    l.new(zc.outputs[0], comb.inputs["Z"])
    norm = n.new("ShaderNodeVectorMath")
    norm.operation = "NORMALIZE"
    l.new(comb.outputs["Vector"], norm.inputs[0])
    skyn = n.new("ShaderNodeTexSky")
    skyn.sky_type = "MULTIPLE_SCATTERING"
    skyn.sun_disc = False
    l.new(norm.outputs["Vector"], skyn.inputs["Vector"])
    SKY_NODES.append(skyn)
    over = n.new("ShaderNodeMix")
    over.data_type = "RGBA"
    l.new(skyn.outputs["Color"], over.inputs["A"])
    l.new(scene_attr(n, "over_color").outputs["Color"], over.inputs["B"])
    l.new(scene_attr(n, "overcast").outputs["Fac"], over.inputs["Factor"])
    emit = n.new("ShaderNodeEmission")
    l.new(over.outputs["Result"], emit.inputs["Color"])
    # Emission strength follows the world strength (overcast colour is used at 1).
    st = n.new("ShaderNodeMix")
    st.data_type = "FLOAT"
    l.new(scene_attr(n, "sky_strength").outputs["Fac"], st.inputs["A"])
    st.inputs["B"].default_value = 1.0
    l.new(scene_attr(n, "overcast").outputs["Fac"], st.inputs["Factor"])
    l.new(st.outputs["Result"], emit.inputs["Strength"])
    cam = n.new("ShaderNodeCameraData")
    dens = n.new("ShaderNodeMath")
    dens.operation = "MULTIPLY"
    l.new(cam.outputs["View Distance"], dens.inputs[0])
    l.new(scene_attr(n, "fog").outputs["Fac"], dens.inputs[1])
    neg = n.new("ShaderNodeMath")
    neg.operation = "MULTIPLY"
    neg.inputs[1].default_value = -1
    l.new(dens.outputs[0], neg.inputs[0])
    ex = n.new("ShaderNodeMath")
    ex.operation = "EXPONENT"
    l.new(neg.outputs[0], ex.inputs[0])
    fac = n.new("ShaderNodeMath")
    fac.operation = "SUBTRACT"
    fac.inputs[0].default_value = 1
    l.new(ex.outputs[0], fac.inputs[1])
    mix = n.new("ShaderNodeMixShader")
    l.new(fac.outputs[0], mix.inputs["Fac"])
    l.new(src, mix.inputs[1])
    l.new(emit.outputs["Emission"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])


for key in ("concrete", "stone", "cladding", "deck", "timber", "frame", "sofa", "cushion", "pot", "bark", "palmtrunk",
            "leaf", "palmleaf", "shrub", "agave", "grass", "soil", "ground", "mountain", "sea", "pooltile"):
    add_haze(M[key])
add_haze(inner_leaf)

# ---------------------------------------------------------------------------
# World, sun, moon and interior light

world = bpy.data.worlds.new("Sky")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
sky = wn.new("ShaderNodeTexSky")
sky.sky_type = "MULTIPLE_SCATTERING"
sky_bg = wn.new("ShaderNodeBackground")
# Fair-weather clouds: a noise layer projected onto a flat cloud deck, drifting
# with the clock, lit by the sky around them.
cloud_coord = wn.new("ShaderNodeTexCoord")
cloud_sep = wn.new("ShaderNodeSeparateXYZ")
wl.new(cloud_coord.outputs["Generated"], cloud_sep.inputs["Vector"])
cloud_z = wn.new("ShaderNodeMath")
cloud_z.operation = "MAXIMUM"
cloud_z.inputs[1].default_value = 0.04
wl.new(cloud_sep.outputs["Z"], cloud_z.inputs[0])
cloud_uv = wn.new("ShaderNodeCombineXYZ")
for axis in ("X", "Y"):
    div = wn.new("ShaderNodeMath")
    div.operation = "DIVIDE"
    wl.new(cloud_sep.outputs[axis], div.inputs[0])
    wl.new(cloud_z.outputs[0], div.inputs[1])
    wl.new(div.outputs[0], cloud_uv.inputs[axis])
cloud_map = wn.new("ShaderNodeMapping")
cloud_map.inputs["Scale"].default_value = (0.35, 0.35, 0.35)
wl.new(cloud_uv.outputs["Vector"], cloud_map.inputs["Vector"])
fair = wn.new("ShaderNodeTexNoise")
fair.inputs["Scale"].default_value = 1.6
fair.inputs["Detail"].default_value = 7
fair.inputs["Roughness"].default_value = 0.55
wl.new(cloud_map.outputs["Vector"], fair.inputs["Vector"])
fair_mask = wn.new("ShaderNodeMapRange")
fair_mask.inputs["From Min"].default_value = 0.52
fair_mask.inputs["From Max"].default_value = 0.72
wl.new(fair.outputs["Fac"], fair_mask.inputs["Value"])
fair_fade = wn.new("ShaderNodeMapRange")  # thin out towards the horizon
fair_fade.inputs["From Min"].default_value = 0.03
fair_fade.inputs["From Max"].default_value = 0.2
wl.new(cloud_sep.outputs["Z"], fair_fade.inputs["Value"])
cloud_cover = wn.new("ShaderNodeValue")
cloud_cover.label = "Cloud cover"
fair_a = wn.new("ShaderNodeMath")
fair_a.operation = "MULTIPLY"
wl.new(fair_mask.outputs["Result"], fair_a.inputs[0])
wl.new(fair_fade.outputs["Result"], fair_a.inputs[1])
fair_b = wn.new("ShaderNodeMath")
fair_b.operation = "MULTIPLY"
wl.new(fair_a.outputs[0], fair_b.inputs[0])
wl.new(cloud_cover.outputs["Value"], fair_b.inputs[1])
sky_grey = wn.new("ShaderNodeRGBToBW")
wl.new(sky.outputs["Color"], sky_grey.inputs["Color"])
cloud_lit = wn.new("ShaderNodeMix")
cloud_lit.data_type = "RGBA"
cloud_lit.inputs["Factor"].default_value = 0.65
wl.new(sky.outputs["Color"], cloud_lit.inputs["A"])
cloud_white = wn.new("ShaderNodeCombineColor")
cloud_gain = wn.new("ShaderNodeMath")
cloud_gain.operation = "MULTIPLY"
cloud_gain.inputs[1].default_value = 2.6
wl.new(sky_grey.outputs["Val"], cloud_gain.inputs[0])
for ch in ("Red", "Green", "Blue"):
    wl.new(cloud_gain.outputs[0], cloud_white.inputs[ch])
wl.new(cloud_white.outputs["Color"], cloud_lit.inputs["B"])
sky_with_clouds = wn.new("ShaderNodeMix")
sky_with_clouds.data_type = "RGBA"
wl.new(fair_b.outputs[0], sky_with_clouds.inputs["Factor"])
wl.new(sky.outputs["Color"], sky_with_clouds.inputs["A"])
wl.new(cloud_lit.outputs["Result"], sky_with_clouds.inputs["B"])
wl.new(sky_with_clouds.outputs["Result"], sky_bg.inputs["Color"])
coord = wn.new("ShaderNodeTexCoord")
sep = wn.new("ShaderNodeSeparateXYZ")
wl.new(coord.outputs["Generated"], sep.inputs["Vector"])
over_top_rgb = wn.new("ShaderNodeRGB")
over_hor_rgb = wn.new("ShaderNodeRGB")
over_grad = wn.new("ShaderNodeMix")
over_grad.data_type = "RGBA"
wl.new(sep.outputs["Z"], over_grad.inputs["Factor"])
wl.new(over_hor_rgb.outputs["Color"], over_grad.inputs["A"])
wl.new(over_top_rgb.outputs["Color"], over_grad.inputs["B"])
# Cloud structure under overcast skies.
cloud_tex = wn.new("ShaderNodeTexNoise")
cloud_tex.inputs["Scale"].default_value = 2.2
cloud_tex.inputs["Detail"].default_value = 9
cloud_tex.inputs["Roughness"].default_value = 0.6
wl.new(coord.outputs["Generated"], cloud_tex.inputs["Vector"])
cloud_rng = wn.new("ShaderNodeMapRange")
cloud_rng.inputs["To Min"].default_value = 0.72
cloud_rng.inputs["To Max"].default_value = 1.2
wl.new(cloud_tex.outputs["Fac"], cloud_rng.inputs["Value"])
cloud_mul = wn.new("ShaderNodeMix")
cloud_mul.data_type = "RGBA"
cloud_mul.blend_type = "MULTIPLY"
cloud_mul.inputs["Factor"].default_value = 1.0
wl.new(over_grad.outputs["Result"], cloud_mul.inputs["A"])
cloud_val = wn.new("ShaderNodeCombineColor")
for ch in ("Red", "Green", "Blue"):
    wl.new(cloud_rng.outputs["Result"], cloud_val.inputs[ch])
wl.new(cloud_val.outputs["Color"], cloud_mul.inputs["B"])
over_bg = wn.new("ShaderNodeBackground")
wl.new(cloud_mul.outputs["Result"], over_bg.inputs["Color"])
over_mix = wn.new("ShaderNodeMixShader")
wl.new(sky_bg.outputs["Background"], over_mix.inputs[1])
wl.new(over_bg.outputs["Background"], over_mix.inputs[2])
# Stars: sparse Voronoi points on the sky dome.
star_vor = wn.new("ShaderNodeTexVoronoi")
star_vor.inputs["Scale"].default_value = 380
wl.new(coord.outputs["Generated"], star_vor.inputs["Vector"])
star_rng = wn.new("ShaderNodeMapRange")
star_rng.inputs["From Min"].default_value = 0.06
star_rng.inputs["From Max"].default_value = 0.0
wl.new(star_vor.outputs["Distance"], star_rng.inputs["Value"])
star_pow = wn.new("ShaderNodeMath")
star_pow.operation = "POWER"
star_pow.inputs[1].default_value = 6
wl.new(star_rng.outputs["Result"], star_pow.inputs[0])
star_z = wn.new("ShaderNodeMath")
star_z.operation = "MULTIPLY"
wl.new(star_pow.outputs[0], star_z.inputs[0])
wl.new(sep.outputs["Z"], star_z.inputs[1])
star_amount = wn.new("ShaderNodeMath")
star_amount.operation = "MULTIPLY"
wl.new(star_z.outputs[0], star_amount.inputs[0])
star_bg = wn.new("ShaderNodeBackground")
star_bg.inputs["Color"].default_value = (0.9, 0.93, 1, 1)
wl.new(star_amount.outputs[0], star_bg.inputs["Strength"])
star_add = wn.new("ShaderNodeAddShader")
wl.new(over_mix.outputs["Shader"], star_add.inputs[0])
wl.new(star_bg.outputs["Background"], star_add.inputs[1])
wout = wn.new("ShaderNodeOutputWorld")
wl.new(star_add.outputs["Shader"], wout.inputs["Surface"])


moon_data = bpy.data.lights.new("Moonlight", "SUN")
moon_data.angle = math.radians(0.6)
moon_data.color = (0.62, 0.72, 1.0)
moon = bpy.data.objects.new("Moonlight", moon_data)
scene.collection.objects.link(moon)
moon.rotation_euler = (math.radians(50), 0, math.radians(200))

lightning_data = bpy.data.lights.new("Lightning", "SUN")
lightning_data.angle = math.radians(25)
lightning_data.color = (0.8, 0.86, 1.0)
lightning_data.energy = 0
lightning = bpy.data.objects.new("Lightning", lightning_data)
scene.collection.objects.link(lightning)
lightning.rotation_euler = (math.radians(35), 0, math.radians(160))

interior_lamps = []
for name, loc, size in [
    ("GF living", (-4.5, 1.0, 3.2), (4.5, 3.5)), ("GF dining", (0, 1.8, 3.2), (4, 3)), ("GF kitchen", (4, 3.8, 3.2), (3.5, 3)),
    ("FF bed west", (-3.5, 2.5, 7.0), (4.5, 5)), ("FF bed east", (2.8, 2.5, 7.0), (4.5, 5)),
    ("Terrace", (-1, -4.5, 3.3), (18, 3)), ("Pool", (0, -9.3, -0.9), (17, 3)),
]:
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = size
    ld.color = (1.0, 0.72, 0.45) if name != "Pool" else (0.4, 0.85, 1.0)
    ob = bpy.data.objects.new("Lamp / " + name, ld)
    scene.collection.objects.link(ob)
    ob.location = loc
    interior_lamps.append((ob, 180 if name.startswith(("GF", "FF")) else 90))

# ---------------------------------------------------------------------------
# Cameras (framing matches the web layout: villa right, sea left, copy bottom-left)

def camera(name, loc, target, lens, shift_y=0.0, sensor_height=None):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.shift_y = shift_y
    if sensor_height:
        # Fit the vertical field of view, so a wider frame just shows more to either side.
        cd.sensor_fit = "VERTICAL"
        cd.sensor_height = sensor_height
    cd.clip_end = 5000
    ob = bpy.data.objects.new(name, cd)
    scene.collection.objects.link(ob)
    ob.location = loc
    direction = Vector(target) - Vector(loc)
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return ob


CAMERAS = {
    "wide": (camera("Camera / wide", (-27, -64, 10.5), (-13, 3, 1.6), 35), 1920, 1080),
    # The web panorama: the wide view in its centre, more sea and hills to either side.
    "pano": (camera("Camera / panorama", (-27, -64, 10.5), (-13, 3, 1.6), 35, sensor_height=36 * 1080 / 1920), 3200, 1200),
}

# ---------------------------------------------------------------------------
# Looks: season + time of day + weather

def look(sun_elev, sun_rot, strength=0.13, overcast=0.0, over_top=(0.5, 0.52, 0.56), over_horizon=(0.62, 0.64, 0.66),
         air=1.0, aerosol=1.0, moon_power=0.0, stars=0.0, lights=0.0, snow=0.0, wet=0.0, spring=0.0, autumn=0.0,
         winter=0.0, peaks=0.2, exposure=0.0, leaves=1.0, fog=0.00045, grass=1.0,
         wind=0.25, waves=1.0, frozen=0.0, snowcap=0.0, clouds=0.35):
    whitecaps = min(1.0, max(0.0, (waves - 1.2) / 1.4))  # only rough seas break white
    return locals()


STORM_TOP, STORM_HORIZON = (0.1, 0.11, 0.13), (0.2, 0.21, 0.23)
STATES = {
    "spring-morning": look(16, -120, spring=1, wet=0.25, peaks=0.35, lights=0.35),
    "spring-rain": look(40, -150, overcast=0.93, over_top=(0.22, 0.24, 0.27), over_horizon=(0.34, 0.36, 0.38), spring=1, wet=1,
                        lights=0.55, peaks=0.35, exposure=0.2, fog=0.0011, wind=0.55, waves=1.5),
    "spring-sunset": look(1.5, -6, spring=1, lights=0.8, peaks=0.35),
    "spring-night": look(-6.5, -20, 0.55, moon_power=0.6, stars=1, lights=1, spring=1, peaks=0.35, exposure=0.4, fog=0.0003),
    "summer-morning": look(20, -115),
    "summer-noon": look(62, -160, 0.11, aerosol=0.5, exposure=-0.15, clouds=0.3),
    "summer-sunset": look(1.2, -3, lights=0.85, peaks=0.0, clouds=0.5),
    "summer-night": look(-6.5, -20, 0.55, moon_power=0.6, stars=1, lights=1, peaks=0.0, exposure=0.4, fog=0.0003),
    "autumn-morning": look(12, -125, overcast=0.35, autumn=1, wet=0.3, aerosol=3, peaks=0.4, leaves=0.8, fog=0.0014, wind=0.4),
    "autumn-storm": look(22, 150, 0.12, overcast=1.0, over_top=STORM_TOP, over_horizon=STORM_HORIZON, autumn=1, wet=1, lights=0.75,
                         peaks=0.4, exposure=0.35, leaves=0.6, fog=0.0018, wind=1.0, waves=2.8),
    "autumn-sunset": look(2.5, -8, aerosol=3, lights=0.85, autumn=1, peaks=0.4, leaves=0.55, wind=0.45, waves=1.4),
    "autumn-night": look(-6.5, -20, 0.55, moon_power=0.5, stars=0.8, lights=1, autumn=1, peaks=0.4, leaves=0.55, exposure=0.4, fog=0.0004),
    "winter-morning": look(9, -130, overcast=0.3, snow=0.85, winter=1, peaks=1, leaves=0.3, grass=0.4, fog=0.0012, frozen=0.8, snowcap=0.6),
    "winter-snowfall": look(18, -150, overcast=0.9, over_top=(0.42, 0.44, 0.48), over_horizon=(0.56, 0.58, 0.61), snow=1, winter=1,
                            lights=0.6, peaks=1, exposure=0.1, leaves=0.3, grass=0.3, fog=0.0013, wind=0.4, waves=1.3, frozen=1, snowcap=1),
    "winter-dusk": look(-3, -10, 0.4, snow=1, winter=1, lights=1, peaks=1, leaves=0.3, grass=0.3, fog=0.0008, frozen=1, snowcap=1),
    "winter-night": look(-6.5, -20, 0.55, moon_power=0.7, stars=1, lights=1, snow=1, winter=1, peaks=1, leaves=0.3, grass=0.3,
                         exposure=0.35, fog=0.0004, frozen=1, snowcap=1),
}

# The one-minute time-lapse (seconds into the cycle -> look). Between keys the
# light eases from one look to the next; repeated keys hold a look. It ends back
# on spring morning so the film loops. HOLDS is where each still is taken, and
# the web player uses the same times for its labels and weather.
SCHEDULE = [
    (0.0, "spring-morning"), (2.6, "spring-morning"), (4.4, "spring-rain"), (7.6, "spring-rain"), (9.4, "spring-sunset"), (11.0, "spring-sunset"),
    (12.6, "spring-night"), (14.0, "spring-night"),
    (15.6, "summer-morning"), (17.4, "summer-noon"), (21.2, "summer-noon"), (23.8, "summer-sunset"), (25.8, "summer-sunset"),
    (27.4, "summer-night"), (29.0, "summer-night"),
    (30.6, "autumn-morning"), (32.4, "autumn-morning"), (34.0, "autumn-storm"), (38.6, "autumn-storm"), (40.2, "autumn-sunset"),
    (41.6, "autumn-sunset"), (43.0, "autumn-night"), (44.2, "autumn-night"),
    (45.8, "winter-morning"), (47.4, "winter-snowfall"), (51.0, "winter-snowfall"), (53.0, "winter-dusk"), (54.6, "winter-night"),
    (58.2, "winter-night"), (60.0, "spring-morning"),
]
HOLDS = {
    "spring-morning": 1.3, "spring-rain": 6.0, "spring-sunset": 10.2, "spring-night": 13.3, "summer-morning": 15.6, "summer-noon": 19.3,
    "summer-sunset": 24.8, "summer-night": 28.2, "autumn-morning": 31.5, "autumn-storm": 36.3, "autumn-sunset": 40.9, "autumn-night": 43.6,
    "winter-morning": 45.8, "winter-snowfall": 49.2, "winter-dusk": 53.0, "winter-night": 56.4,
}
CYCLE_SECONDS = 60


def look_at(t):
    """Interpolated look at cycle time t (smoothstep between schedule keys)."""
    t = max(0.0, min(CYCLE_SECONDS, t))
    for (t0, a), (t1, b) in zip(SCHEDULE, SCHEDULE[1:]):
        if t0 <= t <= t1:
            k = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            k = k * k * (3 - 2 * k)
            A, B = STATES[a], STATES[b]
            out = {}
            for key, va in A.items():
                vb = B[key]
                out[key] = tuple(x + (y - x) * k for x, y in zip(va, vb)) if isinstance(va, tuple) else va + (vb - va) * k
            return out
    return dict(STATES[SCHEDULE[-1][1]])


def mod_input(mod, name):
    item = next(i for i in SCATTER.interface.items_tree if getattr(i, "in_out", None) == "INPUT" and i.name == name)
    return getattr(mod.properties.inputs, item.identifier)


SCENE_PROPS = ("snow", "wet", "spring", "autumn", "winter", "lights", "peaks", "fog", "frozen", "snowcap", "whitecaps")


def apply_look(s, frame=None):
    """Set every look-driven channel; with a frame, also keyframe it there."""
    def key(owner, path, index=-1):
        if frame is not None:
            owner.keyframe_insert(path, frame=frame, index=index)

    for k in SCENE_PROPS:
        scene[k] = float(s[k])
        key(scene, f'["{k}"]')
    scene["sky_strength"] = float(s["strength"])
    key(scene, '["sky_strength"]')
    scene["overcast"] = float(s["overcast"])
    key(scene, '["overcast"]')
    scene["over_color"] = tuple(s["over_horizon"])
    key(scene, '["over_color"]')
    for node in [sky] + SKY_NODES:
        node.sun_elevation = math.radians(s["sun_elev"])
        node.sun_rotation = math.radians(s["sun_rot"])
        node.air_density = s["air"]
        node.aerosol_density = s["aerosol"]
        for prop in ("sun_elevation", "sun_rotation", "air_density", "aerosol_density"):
            key(node, prop)
    sky.sun_disc = True
    sky_bg.inputs["Strength"].default_value = s["strength"]
    key(sky_bg.inputs["Strength"], "default_value")
    over_mix.inputs["Fac"].default_value = s["overcast"]
    key(over_mix.inputs["Fac"], "default_value")
    over_hor_rgb.outputs[0].default_value = (*s["over_horizon"], 1)
    key(over_hor_rgb.outputs[0], "default_value")
    over_top_rgb.outputs[0].default_value = (*s["over_top"], 1)
    key(over_top_rgb.outputs[0], "default_value")
    star_amount.inputs[1].default_value = s["stars"] * 4
    key(star_amount.inputs[1], "default_value")
    moon_data.energy = s["moon_power"]
    key(moon_data, "energy")
    cloud_cover.outputs[0].default_value = s["clouds"]
    key(cloud_cover.outputs[0], "default_value")
    for ob, power in interior_lamps:
        ob.data.energy = power * s["lights"]
        key(ob.data, "energy")
    scene.view_settings.exposure = s["exposure"]
    key(scene.view_settings, "exposure")
    for mods, amount, sway in ((FOLIAGE_MODS, s["leaves"], 0.1 + 0.35 * s["wind"]), (GRASS_MODS, s["grass"], 0.18 + 0.45 * s["wind"])):
        for mod, _ in mods:
            for name, value in (("Thin", amount), ("Sway", sway)):
                inp = mod_input(mod, name)
                inp.value = float(value)
                key(inp, "value")
    ocean.wave_scale = 0.9 * s["waves"]
    ocean.choppiness = min(1.9, 0.8 + 0.35 * s["waves"])
    ocean.foam_coverage = min(0.6, 0.1 + 0.2 * (s["waves"] - 1))
    for prop in ("wave_scale", "choppiness", "foam_coverage"):
        key(ocean, prop)


# ---------------------------------------------------------------------------
# Construction sequence (frames 1..BUILD_FRAMES at 24 fps). A glowing blueprint
# traces every volume, then the site and house assemble in order and the lights
# come on. The last frame matches the "spring-morning" still exactly.

FPS = 24
BUILD_FRAMES = 168
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, BUILD_FRAMES


def blueprint_material():
    m, n, l, b = new_material("Light / blueprint")
    out = n.get("Material Output")
    emit = n.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (0.45, 0.8, 1.0, 1)
    emit.inputs["Strength"].default_value = 6
    clear = n.new("ShaderNodeBsdfTransparent")
    mix = n.new("ShaderNodeMixShader")
    l.new(scene_attr(n, "blueprint").outputs["Fac"], mix.inputs["Fac"])
    l.new(clear.outputs["BSDF"], mix.inputs[1])
    l.new(emit.outputs["Emission"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


C_BLUEPRINT = collection("Blueprint")
BP = blueprint_material()
BLUEPRINT_BOXES = [
    (-16, 16, -4.8, -3.2, -14, 16), (-13.5, 13.5, -3.2, -1.6, -12, 13.5), (-12, 12, -1.6, 0, -9, 7), (-9.5, 9.5, -1.6, 0.02, 7, 11.5),
    (-8, 6.5, 0, 3.4, -6, 2.5), (6.5, 8.4, 0, 7.2, -6.2, 2.9), (-11.5, 11, 3.4, 3.8, -7, 7), (-6.5, 6.5, 3.8, 7.2, -6, 2), (-12, 11.5, 7.2, 7.65, -7.5, 7.2),
]
bp_objects = []
for i, dims in enumerate(BLUEPRINT_BOXES):
    ob = tbox(f"Blueprint {i}", *dims, BP, C_BLUEPRINT)
    wf = ob.modifiers.new("Wire", "WIREFRAME")
    wf.thickness = 0.06
    wf.use_replace = True
    bp_objects.append(ob)


def _keys(ob, attr, frames_values, interpolation="BEZIER"):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = interpolation
    for frame, value in frames_values:
        setattr(ob, attr, value)
        ob.keyframe_insert(attr, frame=frame)


def build(ob, start, dur, kind):
    f0 = 1 + round(start * FPS)
    f1 = max(f0 + 1, 1 + round((start + dur) * FPS))
    final_scale, final_loc = ob.scale.copy(), ob.location.copy()
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "CONSTANT"
    ob.hide_render = True
    ob.keyframe_insert("hide_render", frame=1)
    ob.hide_render = False
    ob.keyframe_insert("hide_render", frame=f0)
    if kind == "grow":
        _keys(ob, "scale", [(f0, Vector((final_scale.x, final_scale.y, final_scale.z * 0.001))), (f1, final_scale)])
    elif kind == "pop":
        _keys(ob, "scale", [(f0, final_scale * 0.001), (f1, final_scale)], "BACK")
    elif kind == "drop":
        _keys(ob, "location", [(f0, final_loc + Vector((0, 0, 6))), (f1, final_loc)], "BACK")
    ob.scale, ob.location = final_scale, final_loc


def objects(prefix):
    return [o for o in scene.objects if o.name.startswith(prefix) and o.parent is None]


PLAN = [  # name prefix, start (s), duration (s), kind, stagger (s)
    ("Terrace wall / lower", 0.35, 0.7, "grow", 0), ("Terrace wall / upper", 0.65, 0.7, "grow", 0),
    ("Planting bed", 1.0, 0.35, "grow", 0.04), ("Plinth", 0.95, 0.55, "grow", 0.06), ("Deck", 1.35, 0.3, "grow", 0.04),
    ("Garden step", 1.45, 0.25, "grow", 0.05), ("Pool wall", 1.45, 0.45, "grow", 0.05), ("Pool floor", 1.45, 0.3, "grow", 0),
    ("Pool water", 1.95, 0.9, "grow", 0), ("Pool overflow", 2.75, 0.3, "grow", 0),
    ("GF / floor", 1.8, 0.2, "grow", 0), ("GF / back wall", 1.85, 0.5, "grow", 0), ("Cladding wall", 1.9, 1.4, "grow", 0),
    ("Column", 1.95, 0.5, "grow", 0.05), ("GF / ceiling", 2.3, 0.2, "grow", 0), ("GF / glazing", 2.1, 0.6, "grow", 0.05),
    ("GF / mullion", 2.2, 0.4, "grow", 0.03), ("GF / timber slat", 2.5, 0.5, "grow", 0.012),
    ("GF / sofa", 2.35, 0.3, "pop", 0.03), ("GF / coffee", 2.4, 0.3, "pop", 0), ("GF / dining", 2.4, 0.3, "pop", 0.03),
    ("GF / kitchen", 2.45, 0.3, "pop", 0.03), ("GF / island", 2.5, 0.3, "pop", 0), ("GF / chair", 2.5, 0.25, "pop", 0.02),
    ("GF / pendant", 2.6, 0.25, "pop", 0.03),
    ("Slab / second floor", 2.65, 0.5, "drop", 0), ("Soffit LED / second", 2.65, 0.5, "drop", 0),
    ("Soffit / terrace", 2.65, 0.5, "drop", 0), ("Downlight / terrace", 2.65, 0.5, "drop", 0),
    ("GF / lounge", 2.45, 0.3, "pop", 0.05), ("GF / plant", 2.55, 0.3, "pop", 0), ("Curtain / GF", 2.6, 0.5, "grow", 0.05),
    ("Pool coping", 1.9, 0.3, "grow", 0.04),
    ("FF / floor", 3.0, 0.2, "grow", 0), ("FF / back wall", 3.0, 0.5, "grow", 0), ("FF / partition", 3.05, 0.45, "grow", 0),
    ("FF / glazing", 3.1, 0.6, "grow", 0.05), ("FF / mullion", 3.2, 0.4, "grow", 0.03), ("FF / timber slat", 3.35, 0.5, "grow", 0.012),
    ("FF / bed", 3.3, 0.3, "pop", 0.05), ("FF / headboard", 3.35, 0.3, "pop", 0.05), ("FF / lamp", 3.4, 0.25, "pop", 0.05),
    ("FF / lounge", 3.4, 0.3, "pop", 0), ("FF / ceiling", 3.6, 0.2, "grow", 0), ("Balustrade", 3.5, 0.45, "grow", 0.05),
    ("Slab / roof", 3.8, 0.55, "drop", 0), ("Soffit LED / roof", 3.8, 0.55, "drop", 0),
    ("Soffit / balcony", 3.8, 0.55, "drop", 0), ("Downlight / balcony", 3.8, 0.55, "drop", 0),
    ("FF / plant", 3.45, 0.3, "pop", 0), ("Curtain / FF", 3.5, 0.5, "grow", 0.05), ("Bollard", 4.3, 0.3, "pop", 0.02),
    ("Lounger", 4.1, 0.35, "pop", 0.05), ("Lounge /", 4.2, 0.35, "pop", 0.03), ("Fire pit", 4.3, 0.3, "pop", 0.03),
    ("Dining /", 4.3, 0.3, "pop", 0.02), ("Planter", 4.3, 0.3, "pop", 0.05),
    ("Agave", 4.35, 0.4, "pop", 0.012), ("Shrub", 4.35, 0.45, "pop", 0.012), ("Tree trunk", 4.5, 0.5, "pop", 0.02),
    ("Tree canopy", 4.6, 0.6, "pop", 0.07), ("Palm trunk", 4.6, 0.8, "pop", 0.08), ("Ground grass", 4.4, 1.1, "grow", 0),
]
for prefix, start, dur, kind, stagger in PLAN:
    for i, ob in enumerate(objects(prefix)):
        build(ob, start + i * stagger, dur, kind)

# Scene-level channels: blueprint glow and the lights coming on.
def scene_keys(prop, frames_values):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
    for frame, value in frames_values:
        scene[prop] = float(value)
        scene.keyframe_insert(f'["{prop}"]', frame=frame)


scene_keys("blueprint", [(1, 0), (1 + int(0.25 * FPS), 1), (1 + int(4.4 * FPS), 1), (1 + int(5.6 * FPS), 0)])
BUILD_LIGHTS = [(1, 0), (1 + int(5.4 * FPS), 0), (1 + int(6.4 * FPS), 1)]

# ---------------------------------------------------------------------------
# The time-lapse: frames CYCLE_START..CYCLE_END. Look channels are keyed every
# half second from SCHEDULE; wind, waves, boats, gulls, lightning and falling
# coconuts are keyed densely. Clock time runs on from the build film, so the
# film's last frame and the cycle's first frame are the same moment.

CYCLE_START = 1001
CYCLE_END = CYCLE_START + CYCLE_SECONDS * FPS


def cycle_frame(t):
    return CYCLE_START + round(t * FPS)


def clock_at(frame):
    return (frame - 1) / FPS if frame < CYCLE_START else (BUILD_FRAMES - 1) / FPS + (frame - CYCLE_START) / FPS


def look_for_frame(frame):
    return STATES["spring-morning"] if frame < CYCLE_START else look_at((frame - CYCLE_START) / FPS)


def interpolation(kind):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = kind


interpolation("BEZIER")
for i in range(CYCLE_SECONDS * 2 + 1):
    apply_look(look_at(i * 0.5), cycle_frame(i * 0.5))

morning = STATES["spring-morning"]
for f, v in BUILD_LIGHTS:
    scene["lights"] = morning["lights"] * v
    scene.keyframe_insert('["lights"]', frame=f)
    for ob, power in interior_lamps:
        ob.data.energy = power * morning["lights"] * v
        ob.data.keyframe_insert("energy", frame=f)

interpolation("LINEAR")
for f in (1, BUILD_FRAMES, CYCLE_START, CYCLE_END):
    ocean.time = clock_at(f)
    ocean.keyframe_insert("time", frame=f)


def gust(t):
    return 0.6 + 0.4 * math.sin(t * 0.9) * math.sin(t * 0.37 + 1.3)


# Wind: palms lean away from the sea and their crowns thrash; trees shiver.
SWAY_FRAMES = list(range(1, BUILD_FRAMES + 1, 3)) + list(range(CYCLE_START, CYCLE_END + 1, 3))
interpolation("BEZIER")
for idx, (trunk, crown, nuts, ground) in enumerate(PALM_PARTS):
    ph = idx * 1.7
    for f in SWAY_FRAMES:
        t, w = clock_at(f), look_for_frame(f)["wind"]
        trunk.rotation_euler[1] = w * 0.1 * gust(t + ph) + math.sin(t * 3.4 + ph) * (0.01 + 0.03 * w)
        trunk.keyframe_insert("rotation_euler", index=1, frame=f)
        crown.rotation_euler[0] = math.sin(t * 7.1 + ph) * (0.015 + 0.07 * w)
        crown.keyframe_insert("rotation_euler", index=0, frame=f)
BUILD_T = (BUILD_FRAMES - 1) / FPS  # clock time where the build film hands over to the cycle
CLOCK_END = BUILD_T + CYCLE_SECONDS


def frame_at_clock(T):
    return 1 + round(T * FPS) if T < BUILD_T else CYCLE_START + round((T - BUILD_T) * FPS)


def clock_keys(owner, path, scale=1.0, index=-1):
    """Key a value that runs linearly with the clock through both films."""
    interpolation("LINEAR")
    for f in (1, BUILD_FRAMES, CYCLE_START, CYCLE_END):
        value = clock_at(f) * scale
        if index >= 0:
            getattr(owner, path)[index] = value
        else:
            setattr(owner, path, value)
        owner.keyframe_insert(path, frame=f, index=index)


# The scene clock drives wind in the leaves and grass, pool ripples, surf and clouds.
scene["clock"] = 0.0
interpolation("LINEAR")
for f in (1, BUILD_FRAMES, CYCLE_START, CYCLE_END):
    scene["clock"] = clock_at(f)
    scene.keyframe_insert('["clock"]', frame=f)
for mod, _ in FOLIAGE_MODS + GRASS_MODS:
    clock_keys(mod_input(mod, "Clock"), "value")
clock_keys(cloud_map.inputs["Location"], "default_value", 0.03, 0)
clock_keys(cloud_map.inputs["Location"], "default_value", 0.012, 1)

# Trees, shrubs and agaves sway a little all the time, more in wind.
interpolation("BEZIER")
for group, base, windy, step in (("Tree canopy", 0.012, 0.04, 2), ("Shrub", 0.01, 0.025, 2), ("Agave", 0.008, 0.02, 2)):
    for idx, ob in enumerate(objects(group)):
        ph = idx * 2.3 + len(group)
        for f in SWAY_FRAMES[::step]:
            t, w = clock_at(f), look_for_frame(f)["wind"]
            amp = base + windy * w
            ob.rotation_euler[0] = math.sin(t * 2.6 + ph) * amp
            ob.rotation_euler[1] = math.cos(t * 2.1 + ph * 1.3) * amp + 0.03 * w * gust(t + ph)
            ob.keyframe_insert("rotation_euler", index=0, frame=f)
            ob.keyframe_insert("rotation_euler", index=1, frame=f)

# ---- Boats: each sails legs of random length, tacking and changing speed ----
def view_angle(x, y):
    return math.atan2(x + 27, y + 64) - 0.206  # relative to the camera's heading


def in_bay(x, y):
    offshore = (x + 24 - 0.35 * y) * 0.944 < -45
    return offshore and 170 < y < 900 and abs(view_angle(x, y)) < 0.58


def sail(obj, seed, speed_range, turn_rate, heel_scale, legs=(4, 11), wake=None):
    rng = random.Random(seed)
    x, y = obj.location.x, obj.location.y
    h = obj.rotation_euler.z
    v = rng.uniform(*speed_range)
    target_h, target_v, next_change = h, v, rng.uniform(1.5, 6)
    dt = 0.25
    T = 0.0
    interpolation("LINEAR")
    while T <= CLOCK_END + 1e-6:
        if T >= next_change:
            target_h = h + rng.choice((-1, 1)) * rng.uniform(0.5, 1.9)
            target_v = rng.uniform(*speed_range) if rng.random() > 0.2 else speed_range[0] * 0.3  # sometimes slow almost to a stop
            next_change = T + rng.uniform(*legs)
        if not in_bay(x + math.cos(h) * v * 12, y + math.sin(h) * v * 12):
            target_h = math.atan2(460 - y, -70 - x)  # head back into the bay
        diff = (target_h - h + math.pi) % math.tau - math.pi
        turn = max(-turn_rate * dt, min(turn_rate * dt, diff))
        h += turn
        v += (target_v - v) * min(1.0, dt * 0.4)
        x += math.cos(h) * v * dt
        y += math.sin(h) * v * dt
        L = look_at(max(0.0, T - BUILD_T))
        f = frame_at_clock(T)
        obj.location = (x, y, SEA + math.sin(T * 1.1 + seed) * 0.12 * L["waves"])
        obj.rotation_euler = (L["wind"] * heel_scale + turn / dt * 0.4 + math.sin(T * 0.9 + seed) * 0.03 * L["waves"],
                              math.sin(T * 0.7 + seed) * 0.025 * L["waves"], h)
        obj.keyframe_insert("location", frame=f)
        obj.keyframe_insert("rotation_euler", frame=f)
        if wake is not None:
            wake.scale = (max(0.001, v / speed_range[1]), max(0.001, v / speed_range[1]), 1)
            wake.keyframe_insert("scale", frame=f)
        T += dt


for bi, (boat, _, _) in enumerate(BOATS):
    sail(boat, 40 + bi, (0.8, 3.2), 0.3, 0.2)

# A motor yacht runs between the sailboats, trailing a wake.
def foam_wake_material():
    m, n, l, b = new_material("Water / wake foam")
    b.inputs["Base Color"].default_value = (0.85, 0.88, 0.9, 1)
    b.inputs["Roughness"].default_value = 0.5
    coords = n.new("ShaderNodeTexCoord")
    sep_ = n.new("ShaderNodeSeparateXYZ")
    l.new(coords.outputs["Object"], sep_.inputs["Vector"])
    fade = n.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value = -70
    fade.inputs["From Max"].default_value = 0
    l.new(sep_.outputs["X"], fade.inputs["Value"])
    grain = n.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 0.4
    grain.inputs["Detail"].default_value = 8
    l.new(coords.outputs["Object"], grain.inputs["Vector"])
    cut = n.new("ShaderNodeMapRange")
    cut.inputs["From Min"].default_value = 0.45
    cut.inputs["From Max"].default_value = 0.65
    l.new(grain.outputs["Fac"], cut.inputs["Value"])
    alpha = n.new("ShaderNodeMath")
    alpha.operation = "MULTIPLY"
    l.new(fade.outputs["Result"], alpha.inputs[0])
    l.new(cut.outputs["Result"], alpha.inputs[1])
    clear = n.new("ShaderNodeBsdfTransparent")
    mix = n.new("ShaderNodeMixShader")
    l.new(alpha.outputs[0], mix.inputs["Fac"])
    l.new(clear.outputs["BSDF"], mix.inputs[1])
    l.new(b.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], n.get("Material Output").inputs["Surface"])
    return m


yacht = bpy.data.objects.new("Motor yacht", None)
C_LAND.objects.link(yacht)
yv = [(-7, 0, 0.9), (8, 0, 1.1), (5, -1.9, 0.9), (-7, -1.8, 0.9), (5, 1.9, 0.9), (-7, 1.8, 0.9), (-6.5, 0, -0.4), (6.5, 0, -0.2)]
yf = [(0, 3, 2, 1), (0, 1, 4, 5), (3, 6, 7, 2), (5, 4, 7, 6), (2, 7, 1), (4, 1, 7), (0, 6, 3), (0, 5, 6)]
mesh_object("Motor yacht / hull", yv, yf, M["hull"], C_LAND).parent = yacht
cabin = tbox("Motor yacht / cabin", -4.5, 2.5, 0.9, 2.3, -1.3, 1.3, M["hull"], C_LAND, 0.2)
cabin.parent = yacht
cabin.location = (-1, 0, 0.9)
windows = tbox("Motor yacht / glazing", -4.3, 2.3, 1.5, 2.0, -1.33, 1.33, M["dark"], C_LAND)
windows.parent = yacht
windows.location = (-1, 0, 1.5)
tbox("Motor yacht / lights", -0.3, 0.3, 2.3, 2.6, -0.3, 0.3, M["lamp"], C_LAND).parent = yacht
wake = mesh_object("Motor yacht / wake", [(-6.5, 0, 0.15), (-70, -14, 0.15), (-70, 0, 0.15), (-70, 14, 0.15)],
                   [(0, 1, 2), (0, 2, 3)], foam_wake_material(), C_LAND, recalc=False)
wake.parent = yacht
yacht.location = (-150, 260, SEA)
yacht.rotation_euler.z = 0.9
yacht.scale = (0.9, 0.9, 0.9)
sail(yacht, 77, (3.0, 8.5), 0.45, 0.02, legs=(5, 14), wake=wake)

# ---- Gulls: randomly timed flights by day, singles to small flocks ----
BLOCKED = [(11.8, 15.6), (26.4, 30.4), (34.4, 38.4), (42.0, 45.8), (48.0, 50.6), (53.6, 60.5)]  # night, the storm, heavy snow


def flight_allowed(T0, T1):
    """A flight may run on into dusk, but must start and pass its midpoint outside the blocked times."""
    def blocked(t):
        return any(lo <= t - BUILD_T < hi for lo, hi in BLOCKED)
    return not blocked(T0) and not blocked((T0 + T1) / 2)


rng = random.Random(21)
free_at = [0.0] * len(GULLS)
for body, _ in GULLS:
    interpolation("CONSTANT")
    body.scale = (0.001, 0.001, 0.001)
    body.keyframe_insert("scale", frame=1)
T = 0.4
while T < CLOCK_END - 4:
    depth = rng.uniform(-48, 8)                     # Blender Y of the flight line (15-70 m from camera)
    dist = depth + 64
    centre_x = -27 + 0.209 * dist
    half = 0.7 * dist + 8
    direction = rng.choice((-1, 1))
    speed = rng.uniform(8.5, 12.5)
    duration = 2 * half / speed
    flock = rng.choice((1, 1, 1, 2, 2, 3, 4))
    if not flight_allowed(T, T + duration + 1):
        T += rng.uniform(0.4, 1.2)
        continue
    print(f"GULL FLIGHT cycle {T - BUILD_T:6.1f}s  {flock} bird(s)  {duration:4.1f}s")
    alt = (10.5 - 0.13 * dist) + rng.uniform(0.15, 0.85) * 0.29 * dist  # inside the frame at this distance
    p0 = Vector((centre_x - direction * half, depth + rng.uniform(-8, 8), alt))
    p2 = Vector((centre_x + direction * half, depth + rng.uniform(-8, 8), alt + rng.uniform(-3, 3)))
    p1 = (p0 + p2) / 2 + Vector((0, rng.uniform(-22, 22), rng.uniform(-4, 5)))
    members = [i for i in range(len(GULLS)) if free_at[i] < T - 0.3][:flock]
    for k, gi in enumerate(members):
        body, wings = GULLS[gi]
        off = Vector((rng.uniform(-3, 3) * k, rng.uniform(-2, 2) * k, rng.uniform(-1.2, 1.2) * k))
        lag = rng.uniform(0, 0.4) * k
        ph = rng.uniform(0, math.tau)
        t0, t1 = T + lag, T + lag + duration
        free_at[gi] = t1 + 0.5
        f0, f1 = frame_at_clock(t0), frame_at_clock(t1)
        interpolation("CONSTANT")
        body.scale = (1.7, 1.7, 1.7)
        body.keyframe_insert("scale", frame=f0)
        body.scale = (0.001, 0.001, 0.001)
        body.keyframe_insert("scale", frame=f1)
        interpolation("LINEAR")
        prev = None
        steps = max(2, round((t1 - t0) * FPS))
        for i in range(steps + 1):
            u = i / steps
            tt = t0 + (t1 - t0) * u
            pos = (1 - u) ** 2 * p0 + 2 * (1 - u) * u * p1 + u ** 2 * p2 + off
            pos.z += math.sin(tt * 1.4 + ph) * 0.6
            heading = math.atan2(pos.y - prev.y, pos.x - prev.x) if prev else math.atan2(p1.y - p0.y, p1.x - p0.x)
            prev = pos.copy()
            f = frame_at_clock(tt)
            body.location = pos
            body.rotation_euler = (math.sin(tt * 1.3 + ph) * 0.18, 0, heading)
            body.keyframe_insert("location", frame=f)
            body.keyframe_insert("rotation_euler", frame=f)
            gliding = math.sin(tt * 0.9 + ph) < -0.25
            flap = 0.14 if gliding else 0.6 * math.sin((tt + ph) * math.tau * 2.8)
            for wg, side in wings:
                wg.rotation_euler[0] = flap * side
                wg.keyframe_insert("rotation_euler", index=0, frame=f)
    T += rng.uniform(0.8, 3.0)
interpolation("BEZIER")

# Lightning in the storm: a few double flashes lighting the scene and the clouds.
interpolation("LINEAR")
for t in (35.0, 36.7, 38.0):
    f = cycle_frame(t)
    for df, e, sky_s in ((-1, 0, 1), (0, 30, 2.6), (1, 6, 1.4), (2, 22, 2.2), (4, 0, 1)):
        lightning_data.energy = e
        lightning_data.keyframe_insert("energy", frame=f + df)
        over_bg.inputs["Strength"].default_value = sky_s
        over_bg.inputs["Strength"].keyframe_insert("default_value", frame=f + df)

# Coconuts: one drops on a summer afternoon, three in the storm.
DROPS = [(22.3, 4, 2), (35.1, 0, 0), (36.4, 9, 3), (37.4, 2, 1)]
for t_drop, pi, ni in DROPS:
    trunk, crown, nuts, ground = PALM_PARTS[pi]
    nut = nuts[ni]
    f0 = cycle_frame(t_drop)
    scene.frame_set(f0)
    start = nut.matrix_world.translation.copy()
    interpolation("CONSTANT")
    nut.hide_render = False
    nut.keyframe_insert("hide_render", frame=CYCLE_START)
    nut.hide_render = True
    nut.keyframe_insert("hide_render", frame=f0)
    nut.hide_render = False
    free = bpy.data.objects.new("Coconut (falling)", nut.data)
    C_LIFE.objects.link(free)
    free.hide_render = True
    free.keyframe_insert("hide_render", frame=1)
    free.hide_render = False
    free.keyframe_insert("hide_render", frame=f0)
    interpolation("LINEAR")
    floor = ground + 0.14
    drift = 0.6 + 1.6 * look_at(t_drop)["wind"]
    fall = math.sqrt(2 * max(0.5, start.z - floor) / 9.81)
    path = []
    for i in range(int(fall * FPS) + 1):
        tt = i / FPS
        path.append((start.x + drift * tt, start.y, max(floor, start.z - 4.905 * tt * tt)))
    land = path[-1]
    for i in range(1, 13):  # two small bounces, rolling away from the wind
        tt = i / FPS
        hop = 0.35 * math.sin(math.pi * min(1, i / 8)) if i <= 8 else 0.1 * math.sin(math.pi * (i - 8) / 4)
        path.append((land[0] + 0.5 * i / 12 * drift, land[1] - 0.2 * i / 12, floor + hop))
    for i, loc in enumerate(path):
        free.location = loc
        free.rotation_euler = (i * 0.35, i * 0.2, 0)
        free.keyframe_insert("location", frame=f0 + i)
        free.keyframe_insert("rotation_euler", frame=f0 + i)
interpolation("BEZIER")

# ---------------------------------------------------------------------------
# Render settings

scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
except Exception as exc:  # CPU fallback on machines without Metal
    print("GPU unavailable, rendering on CPU:", exc)
scene.cycles.samples = int(os.environ.get("VILLA_SAMPLES", "160"))
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.render.use_persistent_data = True  # keep the scene loaded between film frames
try:
    scene.cycles.denoising_use_gpu = True
except AttributeError:
    pass
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 4
scene.cycles.transmission_bounces = 8
scene.cycles.transparent_max_bounces = 16
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.sample_clamp_indirect = 8
scene.render.film_transparent = False
scene.render.resolution_percentage = int(os.environ.get("VILLA_SCALE", "100"))
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "AgX"
for look_name in ("AgX - Medium High Contrast", "Medium High Contrast"):
    try:
        scene.view_settings.look = look_name
        break
    except TypeError:
        continue

scene.frame_set(cycle_frame(HOLDS["spring-morning"]))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "villa.blend"))

# Modes: stills (default) renders each look at its hold frame in the cycle;
# build renders the construction film; cycle renders the one-minute time-lapse.
MODE = os.environ.get("VILLA_MODE", "stills")
if not os.environ.get("VILLA_SKIP_RENDER"):
    for cam_name in [c for c in os.environ.get("VILLA_CAMERAS", "wide").split(",") if c]:
        cam, w, h = CAMERAS[cam_name]
        scene.camera = cam
        scene.render.resolution_x, scene.render.resolution_y = w, h
        if os.environ.get("VILLA_RES"):
            scene.render.resolution_x, scene.render.resolution_y = map(int, os.environ["VILLA_RES"].split("x"))
            scene.render.resolution_percentage = 100
        if MODE in ("build", "cycle"):
            first, last = (1, BUILD_FRAMES) if MODE == "build" else (CYCLE_START, CYCLE_END - 1)
            frames = RENDERS / f"{MODE}-{cam_name}"
            frames.mkdir(exist_ok=True)
            scene.render.filepath = str(frames / "f_")
            scene.frame_start = int(os.environ.get("VILLA_FRAME_START", first))
            scene.frame_end = int(os.environ.get("VILLA_FRAME_END", last))
            scene.frame_step = int(os.environ.get("VILLA_FRAME_STEP", "1"))
            bpy.ops.render.render(animation=True)
            print("RENDERED", MODE, frames)
        else:
            wanted = [x for x in os.environ.get("VILLA_STATES", ",".join(STATES)).split(",") if x]
            for state in wanted:
                scene.frame_set(cycle_frame(HOLDS[state]))
                scene.render.filepath = str(RENDERS / f"{cam_name}-{state}.png")
                bpy.ops.render.render(write_still=True)
                print("RENDERED", scene.render.filepath)
