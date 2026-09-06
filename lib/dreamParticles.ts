import * as THREE from "three";

/** Instanced cube terrain and GPU-animated snowfall for the Blender hero. */
export function createDreamParticles(compact: boolean) {
  const group = new THREE.Group();
  group.name = "Dream particles";
  const time = { value: 0 };
  const hover = { value: new THREE.Vector3(0, 0, 0) };
  const ripples = { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0)) };
  let seed = 3917;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const spacing = compact ? 0.34 : 0.28;
  const columns = Math.ceil(42 / spacing);
  const rows = Math.ceil(28 / spacing);
  const geometry = new THREE.BoxGeometry(spacing * 0.79, spacing * 0.79, spacing * 0.79);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 0.72, roughness: 0.38, envMapIntensity: 0.25,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDreamTime = time;
    shader.uniforms.uDreamHover = hover;
    shader.uniforms.uDreamRipples = ripples;
    shader.vertexShader = `
      uniform float uDreamTime;
      uniform vec3 uDreamHover;
      uniform vec4 uDreamRipples[6];
      varying float vDreamLift;
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vec2 ground = instanceMatrix[3].xz;
      float distanceToPointer = distance(ground, uDreamHover.xy);
      float lift = uDreamHover.z * exp(-distanceToPointer * distanceToPointer * 0.3)
        * (0.58 + sin(distanceToPointer * 4.8 - uDreamTime * 4.0) * 0.18);
      for (int i = 0; i < 6; i++) {
        float age = uDreamTime - uDreamRipples[i].z;
        float distanceToWave = distance(ground, uDreamRipples[i].xy);
        float ring = distanceToWave - age * 3.5;
        lift += sin(ring * 3.4) * exp(-ring * ring * 0.75)
          * exp(-age * 0.72) * uDreamRipples[i].w * 0.52;
      }
      // Keep the architecture planted; the foreground carries the interaction.
      float foreground = smoothstep(-3.0, -0.5, ground.y);
      lift *= foreground;
      lift += sin(ground.x * 0.7 + uDreamTime * 0.4) * cos(ground.y * 0.5) * 0.025 * foreground;
      transformed.y += lift;
      vDreamLift = max(lift, 0.0);
    `);
    shader.fragmentShader = "varying float vDreamLift;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      totalEmissiveRadiance += vec3(0.32, 0.09, 0.24) * vDreamLift * 0.65;
    `);
  };
  material.customProgramCacheKey = () => "darwin-cube-wave-v1";
  const cubes = new THREE.InstancedMesh(geometry, material, columns * rows);
  cubes.name = "Interactive cube ground";
  cubes.frustumCulled = false; // The vertex shader moves cubes beyond their CPU bounds.
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let index = 0;
  for (let row = 0; row < rows; row++) {
    const z = -6 + row * spacing;
    for (let column = 0; column < columns; column++) {
      const x = -21 + column * spacing;
      const foreground = THREE.MathUtils.smoothstep(z, -3, 0.5);
      const swell = Math.pow(Math.max(0, Math.sin(x * 0.38 + z * 0.29)), 3) * 0.48;
      const height = (swell + random() * 0.10) * foreground;
      matrix.makeTranslation(x, -spacing * 0.43 + height, z);
      cubes.setMatrixAt(index, matrix);
      // Cool silver blocks with occasional lilac faces catch the warm rim lights.
      color.setHSL(0.84 + random() * 0.12, 0.25 + random() * 0.16, 0.20 + random() * 0.17);
      cubes.setColorAt(index++, color);
    }
  }
  cubes.instanceMatrix.needsUpdate = true;
  if (cubes.instanceColor) cubes.instanceColor.needsUpdate = true;
  group.add(cubes);

  const count = compact ? 420 : 900;
  const positions = new Float32Array(count * 3);
  const variations = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * 42, random() * 17, -16 + random() * 35], i * 3);
    variations.set([0.42 + random() * 0.65, random() * Math.PI * 2, 0.7 + random() * 1.0], i * 3);
  }
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  snowGeometry.setAttribute("aVariation", new THREE.BufferAttribute(variations, 3));
  const snowMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: time },
    transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime;
      attribute vec3 aVariation;
      varying float vOpacity;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * aVariation.x + 1700.0, 17.0) - 0.4;
        p.x += sin(uTime * 0.27 + aVariation.y) * 0.5;
        p.z += cos(uTime * 0.19 + aVariation.y) * 0.24;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(aVariation.z * 32.0 / max(-view.z, 1.0), 1.0, 3.8);
        vOpacity = (0.3 + aVariation.z * 0.18) * smoothstep(0.0, 0.6, p.y)
          * (1.0 - smoothstep(28.0, 55.0, -view.z));
      }
    `,
    fragmentShader: `
      varying float vOpacity;
      void main() {
        float radius = length(gl_PointCoord - 0.5);
        float alpha = (1.0 - smoothstep(0.16, 0.5, radius)) * vOpacity;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(0.94, 0.82, 0.91, alpha);
      }
    `,
  });
  const snow = new THREE.Points(snowGeometry, snowMaterial);
  snow.name = "Falling snow particles";
  snow.frustumCulled = false;
  group.add(snow);

  let rippleIndex = 0;
  let lastRipple = -10;
  const previousHit = new THREE.Vector2(100, 100);
  return {
    group,
    update(elapsed: number, delta: number, hit: THREE.Vector3 | null) {
      time.value = elapsed;
      const valid = hit && Math.abs(hit.x) < 21 && hit.z > -3 && hit.z < 22;
      hover.value.z = THREE.MathUtils.damp(hover.value.z, valid ? 1 : 0, 5, delta);
      if (!valid) return;
      hover.value.x = hit.x;
      hover.value.y = hit.z;
      if (elapsed - lastRipple > 0.18 && Math.hypot(hit.x - previousHit.x, hit.z - previousHit.y) > 0.25) {
        ripples.value[rippleIndex].set(hit.x, hit.z, elapsed, 1);
        rippleIndex = (rippleIndex + 1) % ripples.value.length;
        previousHit.set(hit.x, hit.z);
        lastRipple = elapsed;
      }
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      cubes.dispose();
      snowGeometry.dispose();
      snowMaterial.dispose();
    },
  };
}
