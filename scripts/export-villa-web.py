"""Exports the villa scene as compressed glTF for the live three.js hero.

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python scripts/export-villa-web.py

Builds the scene with scripts/create-villa-scene.py (no rendering), then writes
public/assets/villa/3d/:

    villa.glb      house, terraces, pool, furniture, beds, blueprint, snow caps
    landscape.glb  ground (with its grass/sand/rock mask), lawn surface, mountains
    planting.glb   trees, palms, coconuts, succulents, planters, shrubs, rocks
    templates.glb  grass-clump, iceplant and bush variants the browser scatters
    props.glb      sailboats, motor yacht, gull
    manifest.json  palm/boat/gull/tree names the runtime animates

Our own materials go out as named placeholders (the runtime rebuilds them with
triplanar scanned textures, snow, wetness and wind); Poly Haven assets keep
their own textures, re-wired into plain glTF materials and saved as WebP.
Heavy scans are decimated so the whole scene stays web-sized.
"""

import json
import os
import runpy
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "public" / "assets" / "villa" / "3d"
WEB.mkdir(parents=True, exist_ok=True)

os.environ["VILLA_SKIP_RENDER"] = "1"
G = runpy.run_path(str(ROOT / "scripts" / "create-villa-scene.py"), run_name="villa_scene")
scene = bpy.context.scene
scene.frame_set(G["cycle_frame"](G["HOLDS"]["spring-morning"]))  # finished, calm, spring morning
# Bake that pose and drop the keyframes: the exporter otherwise samples the start
# of the build (everything scaled to nothing). The browser animates everything itself.
for ob in scene.objects:
    if ob.animation_data:
        basis, hidden = ob.matrix_basis.copy(), ob.hide_render
        ob.animation_data_clear()
        ob.matrix_basis = basis
        ob.hide_render = hidden

# ---------------------------------------------------------------------------
# Poly Haven materials: rebuild as plain glTF-friendly materials (our seasonal,
# snow and haze wrappers are node chains the exporter can't follow).

def upstream_image(socket):
    """Walk back through a socket's links to the first image texture."""
    seen = set()
    stack = [socket]
    while stack:
        s = stack.pop()
        for link in s.links:
            node = link.from_node
            if node.name in seen:
                continue
            seen.add(node.name)
            if node.type == "TEX_IMAGE" and node.image:
                return node
            stack.extend(i for i in node.inputs if i.is_linked)
    return None


def clean_copy(mat):
    b = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    new = bpy.data.materials.new(mat.name + " (web)")
    new.use_nodes = True
    nt = new.node_tree
    nb = nt.nodes.get("Principled BSDF")
    if b is None:
        return new
    # Roughness/metallic maps are left out: packing them into glTF's combined
    # metal-rough image fails for some scans, and they barely read at this size.
    nb.inputs["Roughness"].default_value = 0.75
    nb.inputs["Metallic"].default_value = 0.0
    for key in ("Base Color", "Alpha"):
        src = upstream_image(b.inputs[key]) if b.inputs[key].is_linked else None
        if src:
            img = nt.nodes.new("ShaderNodeTexImage")
            img.image = src.image
            out = "Alpha" if key == "Alpha" and src.image.alpha_mode != "NONE" and "Alpha" in src.outputs else "Color"
            nt.links.new(img.outputs[out], nb.inputs[key])
        else:
            try:
                nb.inputs[key].default_value = b.inputs[key].default_value
            except Exception:
                pass
    nsrc = upstream_image(b.inputs["Normal"]) if b.inputs["Normal"].is_linked else None
    if nsrc:
        img = nt.nodes.new("ShaderNodeTexImage")
        img.image = nsrc.image
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(img.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], nb.inputs["Normal"])
    return new


POLY = set()
for asset in G["TREE_ASSETS"] + [G[k] for k in ("POT_SUCCULENT", "POT_PLANT", "LOUNGE_CHAIR", "COFFEE_TABLE", "PENDANT", "ROCK_FIELD", "ROCKS")]:
    POLY.update(m for m in asset.data.materials if m)
for coll in (G["GRASS_CLUMPS"], G["SUCCULENTS"], G["ICEPLANT"], G["BUSHES"]):
    for ob in coll.objects:
        POLY.update(m for m in ob.data.materials if m)
WEB_MAT = {m: clean_copy(m) for m in POLY}


def placeholder(mat):
    """A named, empty material: the runtime rebuilds it from the name."""
    proxy = bpy.data.materials.get("web/" + mat.name) or bpy.data.materials.new("web/" + mat.name)
    proxy.diffuse_color = (0.8, 0.8, 0.8, 1)
    return proxy


def web_materials(obj):
    for slot in obj.material_slots:
        if slot.material:
            slot.link = "OBJECT"  # don't touch the shared mesh's own slots
    for i, slot in enumerate(obj.material_slots):
        m = obj.data.materials[i] if i < len(obj.data.materials) else None
        if m is None:
            continue
        slot.material = WEB_MAT[m] if m in WEB_MAT else placeholder(m)


# ---------------------------------------------------------------------------
# Geometry preparation

def decimate(src, ratio):
    """Replace a mesh (shared by every copy) with a decimated version."""
    mod = src.modifiers.new("Web decimate", "DECIMATE")
    mod.ratio = ratio
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(src.evaluated_get(dg))
    src.modifiers.remove(mod)
    old = src.data
    for ob in list(bpy.data.objects):
        if ob.data == old:
            ob.data = mesh
    return mesh


for src, ratio in zip(G["TREE_ASSETS"], (0.035, 0.05, 0.03, 0.025)):
    decimate(src, ratio)
decimate(G["ROCK_FIELD"], 0.02)
decimate(G["ROCKS"], 0.025)
decimate(G["POT_PLANT"], 0.3)
for ob in G["SUCCULENTS"].objects:
    decimate(ob, 0.35)

# The browser scatters grass and ground cover itself: drop those scatter modifiers.
for ob in scene.objects:
    for m in list(ob.modifiers):
        if m.type == "NODES" and m.name.startswith("Scatter") and not ob.name.startswith("Shrub"):
            ob.modifiers.remove(m)

# Topiary shrubs: realise their leaf instances into real geometry.
for ob in [o for o in scene.objects if o.name.startswith("Shrub")]:
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target="MESH")


def export(name, objects, materials="EXPORT", colors="NONE"):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    sel = [o for o in objects if o.name in bpy.context.view_layer.objects]
    for o in sel:
        o.select_set(True)
        web_materials(o)
    bpy.ops.export_scene.gltf(
        filepath=str(WEB / f"{name}.glb"), export_format="GLB", use_selection=True, export_apply=True,
        export_yup=True, export_animations=False, export_lights=False, export_cameras=False,
        export_materials=materials, export_image_format="WEBP", export_image_quality=80,
        export_vertex_color=colors, export_extras=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    )
    print("EXPORTED", name, len(sel), "objects", round((WEB / f"{name}.glb").stat().st_size / 1e6, 2), "MB")


def in_collection(coll):
    return [o for o in coll.all_objects if o.type in ("MESH", "EMPTY") and not o.hide_render]


skip = ("Gull", "Coconut (falling)", "Sea", "Motor yacht", "Sailboat", "Rocks", "Ground grass")
villa = in_collection(G["C_HOUSE"]) + in_collection(G["C_SITE"]) + in_collection(G["C_BLUEPRINT"])
export("villa", villa)

land = [o for o in in_collection(G["C_LAND"]) if not o.name.startswith(skip)]
lawn = bpy.data.objects["Ground grass (scatter only)"]
export("landscape", land + [lawn], colors="ACTIVE")

planting = [o for o in in_collection(G["C_LIFE"]) if not o.name.startswith("Coconut (falling)")]
planting += [o for o in in_collection(G["C_LAND"]) if o.name.startswith("Rocks")]
export("planting", planting)

props = [o for o in bpy.data.objects if o.name.startswith(("Sailboat", "Motor yacht"))]
props += [G["GULLS"][0][0]] + [w for w, _ in G["GULLS"][0][1]] + [c for w, _ in G["GULLS"][0][1] for c in w.children]
G["GULLS"][0][0].scale = (1.7, 1.7, 1.7)
export("props", props)

# Grass, iceplant and bush variants: bring them into the view layer at the origin.
templates = []
for coll in (G["GRASS_CLUMPS"], G["ICEPLANT"], G["BUSHES"]):
    bpy.context.view_layer.layer_collection.children[coll.name].exclude = False
    for ob in coll.objects:
        ob.location = (0, 0, 0)
        ob.name = coll.name.replace("Asset / ", "") + "/" + ob.name
        templates.append(ob)
export("templates", templates)

manifest = {
    "palms": [{"trunk": t.name, "crown": c.name} for t, c, _, _ in G["PALM_PARTS"]],
    "boats": [b.name for b, _, _ in G["BOATS"]] + ["Motor yacht"],
    "gull": G["GULLS"][0][0].name,
    "lawn": lawn.name,
    "beds": [b.name for b in G["bed_objects"]],
    "templates": {coll.name.replace("Asset / ", ""): [o.name for o in coll.objects] for coll in (G["GRASS_CLUMPS"], G["ICEPLANT"], G["BUSHES"])},
    "plan": G["PLAN"],
}
(WEB / "manifest.json").write_text(json.dumps(manifest, indent=1))
print("EXPORTED manifest")
