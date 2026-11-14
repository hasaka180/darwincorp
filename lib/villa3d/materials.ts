import * as THREE from "three";

/**
 * Shared shader layer for the live villa. Standard three.js materials are
 * patched (onBeforeCompile) with:
 *  - triplanar mapping of scanned textures in world space (colour, roughness,
 *    whiteout-blended normals), so boxes need no UVs and keep true scale;
 *  - snow that settles on upward faces, wetness that darkens and glosses;
 *  - seasonal tint for foliage and a drifting wind field that sways grass,
 *    leaves and fronds.
 * All patched materials read the same uniform objects, so one update per frame
 * drives the whole scene.
 */
export const U = {
  uTime: { value: 0 },
  uWind: { value: 0.25 },
  uSnow: { value: 0 },
  uWet: { value: 0 },
  uSpring: { value: 0 },
  uAutumn: { value: 0 },
  uWinter: { value: 0 },
};

type Tri = { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture; size: number; tint: THREE.Color; normalScale: number };
export type Patch = {
  tri?: Tri;
  snow?: number;     // how much snow this surface takes (0 none)
  wet?: number;      // how much it glosses in rain
  season?: boolean;  // foliage tint
  wind?: number;     // sway amount per metre of height above the object's origin
  flutter?: number;  // small per-vertex leaf flutter
  ground?: GroundMaps;
};
export type GroundMaps = { grass: THREE.Texture; sand: THREE.Texture; damp: THREE.Texture; size: number };

const NOISE = /* glsl */ `
  float vh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(vh(i), vh(i + vec2(1, 0)), u.x), mix(vh(i + vec2(0, 1)), vh(i + vec2(1, 1)), u.x), u.y);
  }
`;

export function patch(mat: THREE.MeshStandardMaterial, p: Patch) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    const uni: string[] = ["uniform float uTime, uWind, uSnow, uWet, uSpring, uAutumn, uWinter;"];
    if (p.tri) {
      Object.assign(shader.uniforms, {
        uTriMap: { value: p.tri.map }, uTriNor: { value: p.tri.normal }, uTriRough: { value: p.tri.rough },
        uTriSize: { value: p.tri.size }, uTriTint: { value: p.tri.tint }, uTriNS: { value: p.tri.normalScale },
      });
      uni.push("uniform sampler2D uTriMap, uTriNor, uTriRough; uniform float uTriSize, uTriNS; uniform vec3 uTriTint;");
    }
    if (p.ground) {
      Object.assign(shader.uniforms, {
        uGrass: { value: p.ground.grass }, uSand: { value: p.ground.sand }, uDamp: { value: p.ground.damp }, uGSize: { value: p.ground.size },
      });
      uni.push("uniform sampler2D uGrass, uSand, uDamp; uniform float uGSize;");
    }

    // ---- vertex: world position/normal, wind ----
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${uni[0]}\nvarying vec3 vWPos;\nvarying vec3 vWNormal;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec4 root = vec4(0.0, 0.0, 0.0, 1.0);
          #ifdef USE_INSTANCING
            root = instanceMatrix * root;
          #endif
          root = modelMatrix * root;
          float h = max(0.0, position.y);
          float phase = root.x * 0.21 + root.z * 0.17;
          float gust = 0.55 + 0.45 * sin(uTime * 0.7 + phase * 0.5);
          ${p.wind ? `transformed.x += (sin(uTime * 1.9 + phase) * 0.6 + 0.4) * uWind * gust * h * ${p.wind.toFixed(4)};
          transformed.z += cos(uTime * 1.5 + phase * 1.3) * 0.5 * uWind * gust * h * ${p.wind.toFixed(4)};` : ""}
          ${p.flutter ? `float fl = sin(uTime * 7.0 + position.x * 9.0 + position.z * 7.0 + phase);
          transformed += normal * fl * ${p.flutter.toFixed(4)} * (0.3 + uWind);` : ""}
        }`
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        {
          vec4 wp = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          vWPos = (modelMatrix * wp).xyz;
          mat3 nm = mat3(modelMatrix);
          #ifdef USE_INSTANCING
            nm = nm * mat3(instanceMatrix);
          #endif
          vWNormal = normalize(nm * objectNormal);
        }`
      );

    // ---- fragment ----
    let f = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>\n${uni.join("\n")}\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\n${NOISE}
      vec3 triBlend(vec3 n) { vec3 b = pow(abs(n), vec3(4.0)); return b / (b.x + b.y + b.z); }
      float snowAt(vec3 n) {
        float up = smoothstep(0.45, 0.85, n.y);
        float patchy = vnoise(vWPos.xz * 1.3) * 0.6 + vnoise(vWPos.xz * 5.0) * 0.4;
        return up * clamp((uSnow + patchy - 1.0) / 0.25 + uSnow * 0.3, 0.0, 1.0);
      }`
    );
    if (p.tri) {
      f = f.replace(
        "#include <map_fragment>",
        `vec3 triN = normalize(vWNormal);
        vec3 triW = triBlend(triN);
        vec2 tuX = vWPos.zy / uTriSize, tuY = vWPos.xz / uTriSize, tuZ = vWPos.xy / uTriSize;
        vec3 triCol = texture2D(uTriMap, tuX).rgb * triW.x + texture2D(uTriMap, tuY).rgb * triW.y + texture2D(uTriMap, tuZ).rgb * triW.z;
        diffuseColor.rgb *= triCol * uTriTint;`
      ).replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness * (texture2D(uTriRough, tuX).g * triW.x + texture2D(uTriRough, tuY).g * triW.y + texture2D(uTriRough, tuZ).g * triW.z);`
      ).replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          vec3 nX = texture2D(uTriNor, tuX).xyz * 2.0 - 1.0;
          vec3 nY = texture2D(uTriNor, tuY).xyz * 2.0 - 1.0;
          vec3 nZ = texture2D(uTriNor, tuZ).xyz * 2.0 - 1.0;
          nX.xy *= uTriNS; nY.xy *= uTriNS; nZ.xy *= uTriNS;
          nX = vec3(nX.xy + triN.zy, abs(nX.z) * triN.x);
          nY = vec3(nY.xy + triN.xz, abs(nY.z) * triN.y);
          nZ = vec3(nZ.xy + triN.xy, abs(nZ.z) * triN.z);
          vec3 wn = normalize(nX.zyx * triW.x + nY.xzy * triW.y + nZ.xyz * triW.z);
          normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
        }`
      );
    }
    if (p.ground) {
      f = f.replace(
        "#include <map_fragment>",
        `vec2 gUV = vWPos.xz / uGSize;
        vec3 grass = texture2D(uGrass, gUV / 1.2).rgb * vec3(0.55, 0.85, 0.36);
        grass *= mix(vec3(1.0), vec3(0.85, 1.08, 0.72), uSpring);
        grass *= mix(vec3(1.0), vec3(1.25, 0.95, 0.6), uAutumn);
        vec3 sand = mix(texture2D(uSand, gUV).rgb, texture2D(uDamp, gUV).rgb, vColor.b);
        vec3 ground = mix(grass, vec3(0.3, 0.27, 0.23), vColor.g);
        diffuseColor.rgb = mix(ground, sand, vColor.r);`
      ).replace("#include <color_fragment>", "");
    }
    if (p.season) {
      f = f.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb *= mix(vec3(1.0), vec3(0.9, 1.1, 0.8), uSpring);
        diffuseColor.rgb *= mix(vec3(1.0), vec3(1.9, 1.0, 0.35), uAutumn * 0.9);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.29, 0.25), uWinter * 0.4);`
      );
    }
    // Snow and wetness act last on colour and roughness.
    if (p.snow || p.wet) {
      f = f.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float snowF = ${p.snow ? `snowAt(normalize(vWNormal)) * ${p.snow.toFixed(3)}` : "0.0"};
        float wetF = uWet * ${(p.wet ?? 0).toFixed(3)} * (1.0 - snowF);
        diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - 0.28 * wetF), vec3(0.86, 0.88, 0.92), snowF);`
      ).replace(
        "#include <lights_physical_fragment>",
        `roughnessFactor = mix(roughnessFactor * (1.0 - 0.7 * wetF), 0.6, snowF);
        #include <lights_physical_fragment>`
      );
    }
    shader.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => JSON.stringify({ t: !!p.tri, g: !!p.ground, s: p.snow, w: p.wet, se: p.season, wi: p.wind, fl: p.flutter });
  return mat;
}

/** A tileable water normal map, generated once (no external asset needed). */
export function waterNormals(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const h = new Float32Array(size * size);
  const waves = Array.from({ length: 14 }, (_, i) => ({ kx: Math.round(Math.cos(i * 2.4) * (2 + i % 5)), ky: Math.round(Math.sin(i * 2.4) * (2 + i % 4)), a: 1 / (1 + i * 0.35), p: i * 1.7 }));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const w of waves) v += w.a * Math.sin(((x * w.kx + y * w.ky) / size) * Math.PI * 2 + w.p);
      h[y * size + x] = v;
    }
  }
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const dx = h[y * size + ((x + 1) % size)] - h[y * size + ((x - 1 + size) % size)];
      const dy = h[((y + 1) % size) * size + x] - h[((y - 1 + size) % size) * size + x];
      const n = new THREE.Vector3(-dx * 0.35, -dy * 0.35, 1).normalize();
      img.data[i * 4] = (n.x * 0.5 + 0.5) * 255;
      img.data[i * 4 + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[i * 4 + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
