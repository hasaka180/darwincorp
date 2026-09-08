import * as THREE from "three";
import { createDreamSky } from "@/lib/dreamLighting";

/** An architectural continuation of the hero, in the same world as the plates. */
export function createProcessCity() {
  const group = new THREE.Group();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const sky = createDreamSky();
  sky.material.uniforms.uCityHorizon = { value: 0.75 };
  sky.material.fragmentShader = "uniform float uCityHorizon;\n" + sky.material.fragmentShader
    .replace("vec3(0.40, 0.20, 0.29)", "vec3(0.42, 0.255, 0.325)")
    .replace("smoothstep(0.42, 1.02, vUv.y)", "smoothstep(uCityHorizon, 1.04, vUv.y)");
  group.add(sky);
  geometries.add(sky.geometry);
  materials.add(sky.material);
  const standard = (options: THREE.MeshStandardMaterialParameters) => {
    const mat = new THREE.MeshStandardMaterial(options);
    materials.add(mat);
    return mat;
  };
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    geometries.add(geometry);
    materials.add(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const groundMaterial = standard({ color: 0x302136, roughness: 0.57, metalness: 0.38, envMapIntensity: 0.45 });
  // Fine paving joints belong to the ground plane, so their perspective follows the camera.
  groundMaterial.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vPlazaPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvPlazaPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = "varying vec3 vPlazaPosition;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
      #include <color_fragment>
      vec2 tile = vPlazaPosition.xz * 0.72;
      vec2 edge = abs(fract(tile - 0.5) - 0.5) / max(fwidth(tile), vec2(0.0001));
      float joint = 1.0 - min(min(edge.x, edge.y), 1.0);
      diffuseColor.rgb *= 1.0 - joint * 0.48;
      float variation = fract(sin(dot(floor(tile), vec2(127.1, 311.7))) * 43758.5453);
      diffuseColor.rgb *= 0.87 + variation * 0.18;
    `);
  };
  groundMaterial.customProgramCacheKey = () => "process-plaza-paving-v1";
  const ground = add(new THREE.PlaneGeometry(2000, 2000), groundMaterial, 0, -1.32, -30);
  ground.rotation.x = -Math.PI / 2;

  // The plate assembly's underside is y = -0.88: its plinth meets it exactly.
  const stone = standard({ color: 0x372c42, roughness: 0.3, metalness: 0.55 });
  const edge = standard({ color: 0x84607f, roughness: 0.24, metalness: 0.8 });
  const glow = standard({ color: 0xd6a0bb, emissive: 0xe395b1, emissiveIntensity: 0.6, roughness: 0.36, metalness: 0.25 });
  add(new THREE.CylinderGeometry(2.35, 2.4, 0.12, 96), stone, 0, -1.26, 0).castShadow = true;
  add(new THREE.CylinderGeometry(2.15, 2.24, 0.298, 96), stone, 0, -1.051, 0).castShadow = true;
  add(new THREE.CylinderGeometry(2.155, 2.155, 0.022, 96), edge, 0, -0.891, 0);
  const halo = add(new THREE.TorusGeometry(2.29, 0.012, 8, 128), glow, 0, -1.19, 0);
  halo.rotation.x = Math.PI / 2;

  // All city positions use the camera's horizontal / depth axes.
  const place = (horizontal: number, depth: number) => [horizontal * 0.864 - depth * 0.504, -horizontal * 0.504 - depth * 0.864] as const;
  const facade = standard({ color: 0x392d46, roughness: 0.25, metalness: 0.78, envMapIntensity: 1.25 });
  facade.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vBuildingPosition; varying vec3 vBuildingNormal;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vec4 cityPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        cityPosition = instanceMatrix * cityPosition;
      #endif
      vBuildingPosition = (modelMatrix * cityPosition).xyz;
      vBuildingNormal = normal;
    `);
    shader.fragmentShader = "varying vec3 vBuildingPosition; varying vec3 vBuildingNormal;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      vec2 face = abs(vBuildingNormal.z) > 0.5 ? vBuildingPosition.xy : vBuildingPosition.zy;
      vec2 cell = face * vec2(3.8, 3.0);
      vec2 windowUv = fract(cell);
      float seed = fract(sin(dot(floor(cell), vec2(12.9898, 78.233))) * 43758.5453);
      vec2 aa = fwidth(cell);
      vec2 pane = smoothstep(vec2(0.22), vec2(0.22) + aa, windowUv)
        * (1.0 - smoothstep(vec2(0.66) - aa, vec2(0.66), windowUv));
      float lit = step(0.76, seed) * pane.x * pane.y * (1.0 - step(0.5, abs(vBuildingNormal.y)));
      totalEmissiveRadiance += mix(vec3(0.20, 0.09, 0.22), vec3(0.75, 0.30, 0.19), seed) * lit * 0.35;
    `);
  };
  facade.customProgramCacheKey = () => "process-city-windows-v1";
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(buildingGeometry);
  const buildings = new THREE.InstancedMesh(buildingGeometry, facade, 66);
  const transform = new THREE.Object3D();
  let count = 0;
  let seed = 417;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 22; column++) {
      const horizontal = (column - 10.5) * (3.1 + row * 0.8) + random() * 0.7;
      const depth = 24 + row * 13 + random() * 4;
      const [x, z] = place(horizontal, depth);
      const height = 1.3 + Math.pow(random(), 1.6) * (row === 0 ? 5.8 : 10);
      transform.position.set(x, height / 2 - 1.32, z);
      transform.scale.set(0.7 + random() * 1.2, height, 0.8 + random() * 1.4);
      transform.rotation.y = 0;
      transform.updateMatrix();
      buildings.setMatrixAt(count++, transform.matrix);
    }
  }
  buildings.receiveShadow = true;
  group.add(buildings);

  // A slender stepped landmark and an elevated bridge break up the skyline.
  const landmark = standard({ color: 0x5a415a, roughness: 0.24, metalness: 0.75 });
  const [towerX, towerZ] = place(5.7, 28);
  for (let level = 0; level < 5; level++) {
    const width = 1.5 - level * 0.22;
    add(new THREE.BoxGeometry(width, 1.9, width * 0.8), landmark, towerX + level * 0.1, -0.37 + level * 1.9, towerZ);
  }
  add(new THREE.CylinderGeometry(0.015, 0.07, 2.4, 8), edge, towerX + 0.4, 9.2, towerZ);
  const [bridgeX, bridgeZ] = place(-4, 27);
  const bridge = add(new THREE.BoxGeometry(5.8, 0.24, 0.8), landmark, bridgeX, 3.0, bridgeZ);
  bridge.rotation.y = 0.53;

  // Low promenade lights lead toward the skyline without crossing the plinth.
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const [x, z] = place(side * 4.8, i * 3 - 2);
    const post = add(new THREE.CylinderGeometry(0.045, 0.07, 0.46, 8), stone, x, -1.09, z);
    post.castShadow = true;
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), glow, x, -0.83, z);
  }

  // A moon above the urban horizon echoes the hero's moonlit architecture.
  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xe4cfed, fog: false });
  const [moonX, moonZ] = place(-5, 50);
  add(new THREE.SphereGeometry(1.7, 32, 24), moonMaterial, moonX, 7.8, moonZ);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const context = glowCanvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(214,175,226,0.4)");
    gradient.addColorStop(0.35, "rgba(180,120,207,0.12)");
    gradient.addColorStop(1, "rgba(130,70,160,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(glowCanvas);
    textures.add(texture);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    materials.add(mat);
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(moonX, 7.8, moonZ);
    sprite.scale.set(11, 11, 1);
    group.add(sprite);
  }
  const starPositions = new Float32Array(150 * 3);
  for (let i = 0; i < 150; i++) {
    const [x, z] = place((random() - 0.5) * 160, 75 + random() * 20);
    starPositions.set([x, 7 + random() * 35, z], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  geometries.add(starGeometry);
  const starMaterial = new THREE.PointsMaterial({ color: 0xd4bdda, size: 0.075, transparent: true, opacity: 0.65, fog: false, depthWrite: false });
  materials.add(starMaterial);
  group.add(new THREE.Points(starGeometry, starMaterial));

  return {
    group,
    setHorizon: (value: number) => { sky.material.uniforms.uCityHorizon.value = value; },
    dispose: () => {
      buildings.dispose();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
    },
  };
}
