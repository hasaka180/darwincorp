# Darwin dream hero

Editable scene: `darwin-dream.blend` (Blender 5.2). Includes the architectural
panels, circular cutouts, chrome sculpture, spheres, dunes, folded curtain,
lounge chair, cubic ground, falling particle preview, materials, lighting, and
desktop/portrait/close-up cameras. Frames 1–120 preview the wide-to-close camera
move and the moon's framing adjustment.

Visual reference: [The dream _ abstract scene by haykel-shaba](https://sketchfab.com/3d-models/the-dream---abstract-scene-32b9dcb5c9a34744b4bc110996e5f6e0),
plus the user's wide and close scene screenshots. The cube ground and snowfall
take their interaction direction from [Oxigen](https://www.oxigen.sa/).
This is a procedural reconstruction. No original model or textures were downloaded
or included in the site.

From the repository root, rebuild the Blender file, GLB and both renders:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/create-dream-scene.py
node scripts/prepare-dream-assets.mjs
```

On other platforms, replace the Blender executable path with `blender`.
`DREAM_SKIP_RENDER=1` exports only the editable scene and GLB.
`DREAM_RENDER_SCALE=60` makes smaller preview renders.

The website serves `public/assets/dream/dream-scene.glb` and the two compressed
WebP posters. `HeroDreamScene.tsx` loads the actual exported geometry and materials,
adds browser lighting, moon glow and slow camera movement, and
stops rendering when the hero is offscreen or the tab is hidden. The browser's
lighting approximates the Cycles render; it is not a baked lightmap.

The live hero pins for 160 viewport-percent of scroll, dollies from the wide
camera toward the figure, and keeps the HTML copy and CTA visible throughout.
A dark plum gradient deepens with the zoom to preserve text contrast. Scrolling
back reverses the move. Reduced motion and WebGL fallback keep a single-height
hero. `lib/dreamLighting.ts` defines a dusty rose and purple sky, copper/violet reflection sources,
and subdued warm dune radiance for the requested surreal Mars direction. The deployed
posters are captures of this web render so the fallback keeps the same grade;
the Blender script also produces editable Cycles previews.
Use `node scripts/prepare-dream-assets.mjs --web` to recompress the saved
`dream-web-poster*.png` captures; omit `--web` to use the Cycles previews instead.

`lib/dreamParticles.ts` creates the cubic ground in one instanced draw and the
snow as a separate point cloud. The pointer is projected onto the ground in 3D;
nearby cubes rise, with six traveling waves following pointer movement. Waves
decay after the pointer leaves. Both effects animate on the GPU and pause with
the rest of the scene. Phones use a smaller cube and snow count. The dense static
particle preview meshes stay in Blender and the posters, outside the GLB.

The poster appears immediately while 3D loads. Reduced motion, data saver,
unavailable WebGL 2, context loss and loading failures use the rendered poster.
The scene remains decorative; the headline, statistics and links are HTML.
