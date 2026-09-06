import * as THREE from "three";

/** Broad reflection sources: copper dunes beneath a dusty violet sky. */
export function createDreamEnvironment() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.055, 0.018, 0.055);
  const cards: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  const card = (position: number[], size: number[], radiance: number[]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...radiance as [number, number, number]), side: THREE.DoubleSide }));
    mesh.position.set(...position as [number, number, number]);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    cards.push(mesh);
  };
  card([-2, 4, -12], [14, 2.2], [1.9, 0.27, 0.20]);
  card([-9, 5, -2], [2.3, 10], [0.7, 0.23, 1.3]);
  card([8, 3, -5], [2, 8], [0.6, 0.32, 0.95]);
  card([2, 8, 8], [8, 4], [0.8, 0.55, 0.75]);
  card([10, 4, 5], [5, 5], [1.3, 0.16, 0.30]);
  card([-2, 12, 0], [4, 4], [1.1, 0.85, 1.0]);
  return { scene, dispose: () => cards.forEach((card) => { card.geometry.dispose(); card.material.dispose(); }) };
}

/** Screen-space sky keeps the sampled reference gradient stable during the dolly. */
export function createDreamSky() {
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec3 horizon = vec3(0.40, 0.20, 0.29);
        vec3 zenith = vec3(0.085, 0.028, 0.14);
        float gradient = smoothstep(0.42, 1.02, vUv.y);
        vec3 color = mix(horizon, zenith, gradient);
        float haze = exp(-dot((vUv - vec2(0.31, 0.73)) * vec2(5.0, 5.5), (vUv - vec2(0.31, 0.73)) * vec2(5.0, 5.5)));
        color += vec3(0.065, 0.028, 0.095) * haze;
        float dust = exp(-pow((vUv.y - 0.38) * 4.0, 2.0));
        color += vec3(0.10, 0.016, 0.005) * dust * smoothstep(0.2, 0.9, vUv.x);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }));
  sky.name = "Martian twilight sky";
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  return sky;
}

export function addDuneRadiance(material: THREE.MeshStandardMaterial) {
  material.vertexColors = false;
  material.color.setRGB(0.38, 0.22, 0.28);
  material.metalness = 0.78;
  material.emissive.setRGB(0, 0, 0);
  material.emissiveIntensity = 0;
  material.roughness = 0.32;
  material.envMapIntensity = 0.85;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = "varying vec3 vDunePosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vDunePosition = (modelMatrix * vec4(position, 1.0)).xyz;
    `);
    shader.fragmentShader = "varying vec3 vDunePosition;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      vec2 pool = (vDunePosition.xz - vec2(-1.0, -9.0)) / vec2(5.0, 5.0);
      float warmth = exp(-dot(pool, pool));
      totalEmissiveRadiance += vec3(0.38, 0.065, 0.075) * warmth;
    `);
  };
  material.customProgramCacheKey = () => "mars-dune-radiance-v2";
}
