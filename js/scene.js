// Hero 3D scene: a glazed 9ONE cup with latte art, rising steam,
// orbiting coffee beans and gold dust. Pure Three.js, no model files.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector(".hero__canvas");
const hero = document.querySelector(".hero");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 900px)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch {
  document.documentElement.classList.add("no-webgl");
}

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 2.4, 9);
  const lookAt = new THREE.Vector3(0, 0.55, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffe0b0, 2.2);
  key.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0x9fd6ae, 1.6);
  rim.position.set(-5, 3, -4);
  scene.add(key, rim, new THREE.AmbientLight(0x2a3a30, 0.6));

  /* ---------------------------------------------------------- rig */
  const world = new THREE.Group(); // layout + scroll
  const rig = new THREE.Group();   // pointer tilt
  const cupGroup = new THREE.Group();
  world.add(rig);
  rig.add(cupGroup);
  scene.add(world);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9ad62, metalness: 1, roughness: 0.22, clearcoat: 0.6 });
  const glaze = new THREE.MeshPhysicalMaterial({
    color: 0xf2ebdf, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: 0xffffff,
  });
  const glazeGreen = new THREE.MeshPhysicalMaterial({
    color: 0x1f3a2b, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide,
  });

  // Cup body (lathe profile: outer wall up, over the rim, inner wall down)
  const pts = [];
  pts.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.52, 0), new THREE.Vector2(0.58, 0.02), new THREE.Vector2(0.62, 0.07));
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector2(0.62 + 0.38 * Math.sin((t * Math.PI) / 2), 0.07 + t * 1.18));
  }
  pts.push(new THREE.Vector2(1.012, 1.27), new THREE.Vector2(0.995, 1.295), new THREE.Vector2(0.965, 1.285));
  const inner = [];
  for (let i = 24; i >= 0; i--) {
    const t = i / 24;
    inner.push(new THREE.Vector2(0.95 * (0.58 + 0.42 * Math.sin((t * Math.PI) / 2)), 0.15 + t * 1.12));
  }
  const outerGeo = new THREE.LatheGeometry(pts, 128);
  const innerGeo = new THREE.LatheGeometry([...inner, new THREE.Vector2(0, 0.15)].reverse(), 128);
  const cup = new THREE.Mesh(outerGeo, glaze);
  const cupInner = new THREE.Mesh(innerGeo, glazeGreen);
  cupGroup.add(cup, cupInner);

  // Gold rim + foot band
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.018, 16, 160), gold);
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = 1.288;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.605, 0.012, 12, 128), gold);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.06;
  cupGroup.add(rimRing, band);

  // Green glaze band around the belly (brand colour)
  const beltPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = 0.32 + (i / 12) * 0.16;
    beltPts.push(new THREE.Vector2(0.625 + 0.38 * Math.sin((t * Math.PI) / 2) + 0.004, 0.07 + t * 1.18));
  }
  const belt = new THREE.Mesh(new THREE.LatheGeometry(beltPts, 128), glazeGreen);
  cupGroup.add(belt);

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 24, 64, Math.PI * 1.25), glaze);
  handle.rotation.z = -Math.PI * 0.625;
  handle.position.set(1.04, 0.72, 0);
  cupGroup.add(handle);

  // Coffee surface with latte art
  const art = new THREE.CanvasTexture(drawLatteArt());
  art.colorSpace = THREE.SRGBColorSpace;
  art.anisotropy = 8;
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.945, 96),
    new THREE.MeshStandardMaterial({ map: art, roughness: 0.55, envMapIntensity: 0.35 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = Math.PI / 2;
  coffee.position.y = 1.2;
  cupGroup.add(coffee);

  // Saucer
  const sp = [
    [0, 0], [0.95, 0], [1.4, 0.07], [1.62, 0.17], [1.63, 0.2], [1.6, 0.21], [1.42, 0.14], [0.98, 0.07], [0.7, 0.075], [0, 0.075],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sp, 128), glaze);
  saucer.position.y = -0.075;
  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.615, 0.016, 12, 180), gold);
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = 0.13;
  rig.add(saucer, saucerRim);

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({ map: radialTexture("rgba(0,0,0,0.55)"), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.09;
  rig.add(shadow);

  /* -------------------------------------------------------- steam */
  const steamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.32 } },
    vertexShader: `
      uniform float uTime; varying vec2 vUv; attribute float aPhase; varying float vPhase;
      void main(){
        vUv = uv; vPhase = aPhase;
        vec3 p = position;
        float h = uv.y;
        p.x += sin(h * 5.0 - uTime * 1.3 + aPhase) * 0.22 * h + sin(h * 11.0 + uTime + aPhase) * 0.05 * h;
        p.z += cos(h * 4.0 - uTime + aPhase) * 0.12 * h;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uOpacity; varying vec2 vUv; varying float vPhase;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      void main(){
        float edge = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
        float fade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
        float n = noise(vec2(vUv.x * 3.0 + vPhase, vUv.y * 4.0 - uTime * 0.6));
        float a = edge * fade * smoothstep(0.35, 0.85, n) * uOpacity;
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a);
      }`,
  });
  const steam = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const g = new THREE.PlaneGeometry(0.7, 2.2, 1, 48);
    g.translate(0, 1.1, 0);
    const phase = new Float32Array(g.attributes.position.count).fill(i * 2.1);
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const m = new THREE.Mesh(g, steamMat);
    m.position.set((i - 1) * 0.28, 1.15, (i - 1) * 0.1);
    m.rotation.y = (i - 1) * 0.5;
    steam.add(m);
  }
  rig.add(steam);

  /* -------------------------------------------------------- beans */
  const beanGeo = new THREE.SphereGeometry(0.16, 32, 20);
  beanGeo.scale(1, 0.74, 0.56);
  const pos = beanGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (z > 0) {
      z *= 0.7;
      const cx = 0.018 * Math.sin(y * 22);
      z -= 0.045 * Math.exp(-((x - cx) ** 2) / 0.0009) * (z / 0.063);
    }
    pos.setXYZ(i, x, y, z);
  }
  beanGeo.computeVertexNormals();
  const beanMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2214, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const BEANS = small ? 14 : 22;
  const beans = new THREE.InstancedMesh(beanGeo, beanMat, BEANS);
  const beanData = [];
  for (let i = 0; i < BEANS; i++) {
    beanData.push({
      r: 2 + Math.random() * 1.3,
      a: Math.random() * Math.PI * 2,
      y: -0.5 + Math.random() * 2.5,
      s: 0.08 + Math.random() * 0.14,
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.4),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      scale: 0.7 + Math.random() * 0.8,
      bob: Math.random() * 6,
    });
  }
  world.add(beans);
  const dummy = new THREE.Object3D();

  /* ----------------------------------------------------- gold dust */
  const DUST = small ? 160 : 320;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dp[i * 3] = (Math.random() - 0.5) * 14;
    dp[i * 3 + 1] = (Math.random() - 0.3) * 8;
    dp[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.035, map: radialTexture("rgba(255,214,140,1)"), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xffd99a, opacity: 0.8, sizeAttenuation: true,
  }));
  scene.add(dust);

  /* ------------------------------------------------------- layout */
  const base = { x: 0, y: 0, s: 1 };
  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = camera.position.distanceTo(lookAt);
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    const visW = visH * camera.aspect;
    if (w > 900) {
      base.x = visW * 0.21;
      base.y = 0.3;
      base.s = Math.min(1.25, visW / 9.5);
    } else {
      // Phones: the cup floats in the reserved band above the headline (see .hero padding-top).
      const ppu = h / visH;
      const band = Math.min(330, h * 0.4);
      base.x = 0;
      base.s = Math.min(1, Math.min(w * 0.78, 340) / ppu / 3.4);
      base.y = (h / 2 - band * 0.62) / ppu + lookAt.y - 0.6 * base.s;
    }
    camera.lookAt(lookAt);
  }
  layout();
  addEventListener("resize", layout);

  /* ---------------------------------------------------- interaction */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  // Intro: rise and settle once the loader is gone.
  const intro = { v: reduced ? 1 : 0 };
  addEventListener("9one:ready", () => {
    if (window.gsap && !reduced) window.gsap.to(intro, { v: 1, duration: 2.4, ease: "expo.out" });
    else intro.v = 1;
  }, { once: true });

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 }).observe(hero);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const speed = reduced ? 0 : 1;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    const p = Math.min(1, scrollY / Math.max(1, hero.clientHeight)); // hero scroll progress
    const iv = intro.v;

    world.position.set(base.x, base.y - (1 - iv) * 2.2 - p * 1.6, 0);
    world.scale.setScalar(base.s * (0.75 + 0.25 * iv) * (1 - p * 0.15));
    rig.rotation.x = 0.28 + pointer.y * 0.12 + p * 0.5;
    rig.rotation.z = -pointer.x * 0.06;
    rig.rotation.y = pointer.x * 0.35 + (1 - iv) * -1.2;
    cupGroup.rotation.y = -0.6 + Math.sin(t * 0.35 * speed) * 0.25;
    rig.position.y = Math.sin(t * 0.8 * speed) * 0.06;

    steamMat.uniforms.uTime.value = t * speed;
    steamMat.uniforms.uOpacity.value = 0.32 * iv * (1 - p);

    for (let i = 0; i < BEANS; i++) {
      const b = beanData[i];
      const a = b.a + t * b.s * speed;
      dummy.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.7 * speed + b.bob) * 0.18, Math.sin(a) * b.r * 0.7);
      dummy.rotation.set(b.rot.x + t * b.spin.x * speed, b.rot.y + t * b.spin.y * speed, b.rot.z + t * b.spin.z * speed);
      dummy.scale.setScalar(b.scale * iv);
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    }
    beans.instanceMatrix.needsUpdate = true;

    dust.rotation.y = t * 0.02 * speed;
    dust.position.y = Math.sin(t * 0.2) * 0.2 - p * 1.5;

    camera.position.x = pointer.x * 0.35;
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
  }
  frame();

  /* -------------------------------------------------------- textures */
  function radialTexture(color) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function drawLatteArt() {
    const S = 1024, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const cx = S / 2, cy = S / 2;
    // Crema
    let grd = g.createRadialGradient(cx, cy, 0, cx, cy, S / 2);
    grd.addColorStop(0, "#9a5a27");
    grd.addColorStop(0.55, "#7a4019");
    grd.addColorStop(0.85, "#4f260c");
    grd.addColorStop(1, "#2a1205");
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    // Fine crema speckle
    for (let i = 0; i < 2600; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * S * 0.48;
      g.fillStyle = `rgba(${60 + Math.random() * 60},${30 + Math.random() * 30},10,${Math.random() * 0.18})`;
      g.beginPath();
      g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.random() * 3 + 0.5, 0, 7);
      g.fill();
    }
    // Rosetta / tulip in foam
    const foam = "rgba(252,246,234,1)";
    const crema = "#8a4c20";
    g.save();
    g.translate(cx, cy + 30);
    g.filter = "blur(4px)";
    // Tulip: stacked foam crescents, each pushed open by the next pour.
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const y = 190 - i * 105;
      const w = 300 - i * 42;
      const h = 150 - i * 20;
      g.fillStyle = foam;
      g.beginPath();
      g.ellipse(0, y, w, h, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = crema;
      g.beginPath();
      g.ellipse(0, y + 48, w * 0.74, h * 0.62, 0, 0, Math.PI * 2);
      g.fill();
    }
    // Top heart
    g.fillStyle = foam;
    g.beginPath();
    g.ellipse(0, -235, 125, 105, 0, 0, Math.PI * 2);
    g.fill();
    // Pull-through stem
    g.strokeStyle = foam;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(0, -250);
    g.bezierCurveTo(6, -60, -6, 120, 0, 300);
    g.stroke();
    g.restore();
    // Edge darkening ring
    grd = g.createRadialGradient(cx, cy, S * 0.4, cx, cy, S * 0.5);
    grd.addColorStop(0, "rgba(40,18,5,0)");
    grd.addColorStop(1, "rgba(40,18,5,0.7)");
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    return c;
  }
}
