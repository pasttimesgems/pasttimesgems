// Physically lit pearls, cut stones and gold settings built with three.js.
// Used live for the hero and, offline (tools/render.html), to make the
// product artwork in assets/art/.

import * as THREE from 'three';

// ---------- studio lighting ----------
// Three views of one photo studio: sharp reflections for gold, a softened
// version for the satin glow of pearls, and a cube the stones refract.
const LIGHTS = {};

function room(base, boxes) {
  const r = new THREE.Scene();
  r.background = new THREE.Color(base);
  for (const [w, h, x, y, z, k, color = 0xffffff] of boxes) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    r.add(m);
  }
  return r;
}

const WARM = 0xffe0b5;
const SOFTBOXES = [
  [7, 3, 0, 8, 1, 2.6],             // overhead
  [3.5, 7, -7, 2, 3, 2, WARM],      // key, warm, from the left
  [2.5, 6, 7, 1, 2, 1.5],           // rim from the right
  [9, 1.2, 0, -2, 7, .8],           // low front fill
  [10, 4, 0, 3, -9, .3],            // back wall
];

export function setupStudio(renderer) {
  if (LIGHTS.renderer === renderer) return LIGHTS;
  const pmrem = new THREE.PMREMGenerator(renderer);
  LIGHTS.sharp = pmrem.fromScene(room(0x060606, [...SOFTBOXES,
    [1.1, 1.1, 3, 5, 6, 7], [1.1, 1.1, -3, 4, -6, 5, WARM], [.8, .8, 5, 2, 5, 6]]), .01).texture;
  LIGHTS.soft = pmrem.fromScene(room(0x141210, SOFTBOXES), .035).texture;
  pmrem.dispose();
  // Stones see a busier room full of small lights: that is what makes them sparkle.
  const spots = [];
  for (let i = 0; i < 90; i++) {
    const a = i * 2.39996, y = ((i * 37) % 23) / 23 * 16 - 8;
    spots.push([1 + (i % 3) * .9, 1 + (i % 4) * .7, Math.cos(a) * 7, y, Math.sin(a) * 7, 2 + (i % 5) * 2.2, i % 4 ? 0xffffff : WARM]);
  }
  const rt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  new THREE.CubeCamera(.1, 60, rt).update(renderer, room(0x18181b, [...SOFTBOXES, ...spots]));
  LIGHTS.cube = rt.texture;
  LIGHTS.renderer = renderer;
  return LIGHTS;
}

// ---------- materials ----------
// orient: the tint pearls take towards their edges, where nacre layers
// split the light. glow: the warm light that seems to come from inside.
export const PEARL_TONES = {
  white: { color: 0xe9e1d6, sheen: 0xffd2e2, thick: [260, 620], orient: [.95, .72, .86], glow: [1, .96, .92] },
  rose: { color: 0xead2c8, sheen: 0xffbfd2, thick: [300, 700], orient: [.95, .64, .76], glow: [1, .9, .88] },
  golden: { color: 0xd8b068, sheen: 0xffeab8, thick: [380, 760], orient: [.92, .66, .38], glow: [1, .88, .6] },
  tahitian: { color: 0x464c50, sheen: 0x9ad6c6, thick: [420, 900], orient: [.72, .78, .8], glow: [.8, .72, .95] },
};

export function pearlMaterial(tone = 'white') {
  const t = PEARL_TONES[tone] || PEARL_TONES.white;
  const m = new THREE.MeshPhysicalMaterial({
    color: t.color, roughness: .34, metalness: 0,
    clearcoat: 1, clearcoatRoughness: .05,
    iridescence: 1, iridescenceIOR: 1.45, iridescenceThicknessRange: t.thick,
    sheen: 1, sheenRoughness: .5, sheenColor: new THREE.Color(t.sheen),
    envMap: LIGHTS.sharp, envMapIntensity: 1.1,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.orient = { value: new THREE.Vector3(...t.orient) };
    sh.uniforms.glow = { value: new THREE.Vector3(...t.glow) };
    sh.fragmentShader = 'uniform vec3 orient;\nuniform vec3 glow;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
      float nv = clamp(dot(normalize(geometryNormal), normalize(vViewPosition)), 0.0, 1.0);
      outgoingLight *= mix(orient * .6, vec3(1.0), pow(nv, .8));
      outgoingLight += glow * pow(nv, 6.0) * .12;
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `pearl-${tone}`;
  return m;
}

// absorb: how quickly light of each colour (r, g, b) is soaked up inside the stone.
export const GEM_TONES = {
  emerald: { absorb: [4.2, .35, 2.4], ior: 1.58, fire: .01 },
  sapphire: { absorb: [4.4, 2.6, .15], ior: 1.77, fire: .015 },
  ruby: { absorb: [.1, 5.2, 2.6], ior: 1.77, fire: .015 },
  amethyst: { absorb: [1, 3.8, .35], ior: 1.55, fire: .01 },
  citrine: { absorb: [.05, .9, 4.2], ior: 1.55, fire: .01 },
  aquamarine: { absorb: [1.6, .28, .16], ior: 1.58, fire: .01 },
  diamond: { absorb: [.01, .01, .012], ior: 2.42, fire: .045, gain: 1 },
};

export const gold = (tone = 'yellow') => new THREE.MeshPhysicalMaterial({
  color: { yellow: 0xf3c877, rose: 0xf0b09a, white: 0xe8e8e6 }[tone] || 0xf3c877,
  metalness: 1, roughness: .14, clearcoat: .5, clearcoatRoughness: .1,
  envMap: LIGHTS.sharp, envMapIntensity: 1.6,
});

// ---------- cut stones ----------
// Faceted solids from stacked rings. Alternate rings are rotated half a
// step so neighbouring facets meet as kites, like a real brilliant cut.
function facetSolid(rings, n, shape = (a) => [Math.cos(a), Math.sin(a)]) {
  const pos = [];
  const pt = (ring, i) => {
    const [r, y, twist] = ring;
    if (r === 0) return [0, y, 0];
    const a = (i + (twist ? .5 : 0)) / n * Math.PI * 2;
    const [x, z] = shape(a);
    return [x * r, y, z * r];
  };
  for (let k = 0; k < rings.length - 1; k++) {
    const A = rings[k], B = rings[k + 1];
    for (let i = 0; i < n; i++) {
      const a0 = pt(A, i), a1 = pt(A, i + 1), b0 = pt(B, i), b1 = pt(B, i + 1);
      if (A[0] === 0) { pos.push(...a0, ...b1, ...b0); continue; }
      if (B[0] === 0) { pos.push(...a0, ...a1, ...b0); continue; }
      if (A[2] === B[2]) { pos.push(...a0, ...a1, ...b0, ...b0, ...a1, ...b1); continue; }
      // Rings offset by half a step: zig-zag between them.
      if (B[2]) pos.push(...a0, ...a1, ...b0, ...b0, ...a1, ...b1);
      else pos.push(...a0, ...a1, ...b1, ...b0, ...a0, ...b1);
    }
  }
  const top = rings[rings.length - 1];
  if (top[0] > 0) for (let i = 0; i < n; i++) pos.push(0, top[1], 0, ...pt(top, i + 1), ...pt(top, i));
  // Face every triangle outwards from the stone's centre.
  const ys = rings.map((r) => r[1]), cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (let i = 0; i < pos.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy2, cz] = pos.slice(i, i + 9);
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy2 - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (ax + bx + cx) / 3, my = (ay + by + cy2) / 3 - cy, mz = (az + bz + cz) / 3;
    if (nx * mx + ny * my + nz * mz < 0) for (let k = 0; k < 3; k++) [pos[i + 3 + k], pos[i + 6 + k]] = [pos[i + 6 + k], pos[i + 3 + k]];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Ring order is bottom to top: [radius, height, rotated half step].
export function brilliant() {
  return facetSolid([
    [0, -.86, 0], [.52, -.42, 1], [1, -.02, 0], [1, .02, 0], [.8, .18, 1], [.56, .34, 0],
  ], 16);
}

const octagon = (a) => {
  // A rectangle with clipped corners: the outline of an emerald cut.
  const c = Math.cos(a), s = Math.sin(a), k = .78;
  const m = Math.max(Math.abs(c), Math.abs(s), (Math.abs(c) + Math.abs(s)) * k);
  return [c / m, s / m];
};
export function stepCut() {
  return facetSolid([
    [0, -.62, 0], [.5, -.42, 0], [.78, -.22, 0], [1, -.02, 0], [1, .02, 0], [.86, .14, 0], [.68, .26, 0],
  ], 32, octagon);
}

// Stones are ray traced inside their own facets: light enters, bounces off
// the pavilion by total internal reflection, splits into colour (fire) on
// the way out and is tinted by how far it travelled through the stone.
const MAX_PLANES = 160;
const GEM_VERT = /* glsl */`
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vCam;
  varying mat3 vWorld;
  void main() {
    vPos = position;
    vWorld = mat3(modelMatrix);
    vNormal = normal;
    vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const GEM_FRAG = /* glsl */`
  uniform vec4 planes[${MAX_PLANES}];
  uniform int count;
  uniform samplerCube env;
  uniform float ior;
  uniform float fire;
  uniform vec3 absorb;
  uniform float gain;
  uniform float blur;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vCam;
  varying mat3 vWorld;
  vec3 look(vec3 d) { return textureCube(env, normalize(vWorld * d), blur).rgb; }
  float fresnel(float c, float f0) { return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
  void main() {
    vec3 V = normalize(vPos - vCam);
    vec3 N = normalize(vNormal);
    if (dot(N, V) > 0.0) N = -N;
    float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    float fr = fresnel(dot(-V, N), f0);
    vec3 col = fr * look(reflect(V, N)) * 1.2;
    vec3 dir = refract(V, N, 1.0 / ior);
    vec3 p = vPos;
    vec3 trans = vec3(1.0 - fr);
    for (int b = 0; b < 6; b++) {
      float tmin = 1e6; vec3 nh = vec3(0.0, 1.0, 0.0);
      for (int i = 0; i < ${MAX_PLANES}; i++) {
        if (i >= count) break;
        vec4 pl = planes[i];
        float dn = dot(pl.xyz, dir);
        if (dn > 1e-5) {
          float t = (pl.w - dot(pl.xyz, p)) / dn;
          if (t > 1e-4 && t < tmin) { tmin = t; nh = pl.xyz; }
        }
      }
      if (tmin > 1e5) break;
      p += dir * tmin;
      trans *= exp(-absorb * tmin);
      vec3 outG = refract(dir, -nh, ior);
      if (dot(outG, outG) > 0.0) {
        float fi = fresnel(dot(outG, nh), f0);
        vec3 c = vec3(look(refract(dir, -nh, ior * (1.0 - fire))).r, look(outG).g, look(refract(dir, -nh, ior * (1.0 + fire))).b);
        col += trans * (1.0 - fi) * c;
        trans *= fi;
      }
      dir = reflect(dir, -nh);
    }
    col += trans * look(dir) * .5;
    gl_FragColor = vec4(col * gain, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function facetPlanes(geo) {
  const pos = geo.attributes.position, out = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    n.subVectors(b, a).cross(c.clone().sub(a));
    if (n.lengthSq() < 1e-12) continue;
    n.normalize();
    const d = n.dot(a);
    if (!out.some((q) => q.x * n.x + q.y * n.y + q.z * n.z > .99995 && Math.abs(q.w - d) < 1e-4)) out.push(new THREE.Vector4(n.x, n.y, n.z, d));
  }
  while (out.length < MAX_PLANES) out.push(new THREE.Vector4(0, 1, 0, 1e3));
  return out.slice(0, MAX_PLANES);
}

const GEOS = {}, GEM_MATS = {};
function gemGeometry(cut) {
  const key = cut === 'step' ? 'step' : 'round';
  if (!GEOS[key]) {
    const geo = key === 'step' ? stepCut() : brilliant();
    GEOS[key] = { geo, planes: facetPlanes(geo) };
  }
  return GEOS[key];
}

export function gemMaterial(tone, cut = 'round') {
  const key = `${tone}:${cut === 'step' ? 'step' : 'round'}`;
  if (GEM_MATS[key]) return GEM_MATS[key];
  const t = GEM_TONES[tone] || GEM_TONES.diamond;
  const { planes } = gemGeometry(cut);
  return (GEM_MATS[key] = new THREE.ShaderMaterial({
    vertexShader: GEM_VERT, fragmentShader: GEM_FRAG,
    uniforms: {
      planes: { value: planes }, count: { value: planes.filter((p) => p.w < 1e2).length },
      env: { value: LIGHTS.cube }, ior: { value: t.ior }, fire: { value: t.fire },
      absorb: { value: new THREE.Vector3(...t.absorb) }, gain: { value: t.gain ?? 1.15 }, blur: { value: 0 },
    },
  }));
}

export function stone(tone, cut = 'round', size = 1) {
  const m = new THREE.Mesh(gemGeometry(cut).geo, gemMaterial(tone, cut));
  m.scale.set(size * (cut === 'oval' ? 1.28 : cut === 'step' ? 1.32 : 1), size, size);
  m.castShadow = true;
  return m;
}

// ---------- pearls ----------
export function pearl(tone = 'white', r = 1, baroque = 0, seed = 1) {
  const geo = new THREE.SphereGeometry(r, 96, 72);
  if (baroque) {
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.3 - seed) + .6 * Math.sin(v.z * 4.7 + seed * 2) + .5 * v.y * v.y;
      v.multiplyScalar(r * (1 + baroque * n));
      p.setXYZ(i, v.x, v.y * 1.18, v.z);
    }
    geo.computeVertexNormals();
  }
  const m = new THREE.Mesh(geo, pearlMaterial(tone));
  m.castShadow = true;
  return m;
}

// A strand hanging in a soft U, seen from slightly above.
export function strand(tone = 'white', count = 31, r = .16) {
  const g = new THREE.Group();
  const mat = pearlMaterial(tone);
  const geo = new THREE.SphereGeometry(r, 48, 36);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, .9, -1.2), new THREE.Vector3(-1.9, -.2, -.2), new THREE.Vector3(-1, -.95, .5),
    new THREE.Vector3(0, -1.15, .75), new THREE.Vector3(1, -.95, .5), new THREE.Vector3(1.9, -.2, -.2), new THREE.Vector3(2.3, .9, -1.2),
  ]);
  const len = curve.getLength(), step = (r * 2.05) / len;
  const n = Math.min(count, Math.floor(1 / step));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(curve.getPointAt(.5 + (i - (n - 1) / 2) * step));
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

// ---------- settings ----------
export function ring({ tone = 'sapphire', cut = 'round', metal = 'yellow', size = .5, signet = false, pearlTop = null } = {}) {
  const g = new THREE.Group();
  const metalMat = gold(metal);
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, .075, 32, 160), metalMat);
  band.scale.set(1, 1, 1.9);
  band.castShadow = true;
  g.add(band);
  if (signet) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.42, .34, .2, 64), metalMat);
    plate.scale.set(1.25, 1, 1);
    plate.position.y = 1.02;
    g.add(plate);
    const s = stone(tone, 'oval', .3);
    s.scale.y = .16; s.position.y = 1.12;
    g.add(s);
    return g;
  }
  if (pearlTop) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.16, .1, .12, 32), metalMat);
    cup.position.y = 1.08;
    g.add(cup);
    const p = pearl(pearlTop, .36);
    p.position.y = 1.44;
    g.add(p);
    return g;
  }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.18, .1, .3, 32), metalMat);
  head.position.y = 1.1;
  g.add(head);
  const s = stone(tone, cut, size);
  s.position.y = 1.25 + size * .86;
  g.add(s);
  // Four claws holding the stone.
  for (let i = 0; i < 4; i++) {
    const a = (i + .5) / 4 * Math.PI * 2;
    const claw = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, size * 1.15, 12), metalMat);
    const rx = Math.cos(a) * size * (cut === 'oval' ? 1.2 : .95), rz = Math.sin(a) * size * .95;
    claw.position.set(rx * .92, 1.25 + size * .62, rz * .92);
    claw.lookAt(rx * .55, 1.1, rz * .55);
    claw.rotateX(Math.PI / 2);
    g.add(claw);
  }
  // A halo of small diamonds for the cocktail ring.
  if (size > .6) {
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2;
      const d = stone('diamond', 'round', .09);
      d.position.set(Math.cos(a) * size * 1.25, 1.25 + size * .8, Math.sin(a) * size * 1.05);
      g.add(d);
    }
  }
  return g;
}

export function pendant(tone = 'rose') {
  const g = new THREE.Group();
  const metal = gold('rose');
  const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.6, 2.6, -1), new THREE.Vector3(-.5, 1.2, 0), new THREE.Vector3(0, .95, .1),
    new THREE.Vector3(.5, 1.2, 0), new THREE.Vector3(1.6, 2.6, -1),
  ]), 120, .018, 8), metal);
  g.add(chain);
  const bail = new THREE.Mesh(new THREE.TorusGeometry(.09, .025, 16, 40), metal);
  bail.position.y = .86;
  g.add(bail);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), metal);
  cap.position.y = .7; cap.scale.y = .6;
  g.add(cap);
  const p = pearl(tone, .48, .09, 2.2);
  p.position.y = .2;
  g.add(p);
  return g;
}

export function studs(tone = 'tahitian') {
  const g = new THREE.Group();
  const a = pearl(tone, .62), b = pearl(tone, .62);
  a.position.set(-.62, 0, .35); b.position.set(.75, .05, -.45);
  const post = (x, z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .6, 12), gold('white'));
    m.rotation.x = Math.PI / 2; m.position.set(x, 0, z - .75);
    return m;
  };
  g.add(a, b, post(-.62, .35), post(.75, -.45));
  return g;
}

// ---------- scenes ----------
// Every catalogue artwork: [category, index] → builder. Indexes match the
// "art:<category>:<index>" references used by demo products.
export const ART = {
  pearls: [
    () => strand('white'),
    () => pendant('rose'),
    () => pearl('golden', 1),
    () => studs('tahitian'),
  ],
  gems: [
    () => stone('emerald', 'step', 1.05),
    () => stone('sapphire', 'oval', 1),
    () => stone('ruby', 'oval', 1),
    () => stone('amethyst', 'round', 1.05),
    () => stone('citrine', 'round', 1.05),
    () => stone('aquamarine', 'step', 1.05),
  ],
  jewellery: [
    () => ring({ tone: 'sapphire', size: .42 }),
    () => ring({ tone: 'amethyst', cut: 'oval', metal: 'white', size: .66 }),
    () => ring({ tone: 'citrine', signet: true }),
    () => ring({ pearlTop: 'white', metal: 'rose' }),
  ],
};

// The hero: a pearl necklace with a brilliant-cut diamond pendant that turns
// slowly, so its facets keep catching the light.
export function heroPiece() {
  const g = new THREE.Group();
  const neck = new THREE.Group();
  const mat = pearlMaterial('white'), n = 46;
  const at = (a) => {
    const front = (1 + Math.cos(a)) / 2;
    return new THREE.Vector3(Math.sin(a) * 1.55, .5 - 1.45 * front * front, Math.cos(a) * 1.05);
  };
  for (let i = 0; i < n; i++) {
    const a = (i + .5) / n * Math.PI * 2;
    const front = (1 + Math.cos(a)) / 2;
    // Graduated strand: larger pearls at the front, smaller towards the clasp.
    const m = new THREE.Mesh(new THREE.SphereGeometry(.105 + .05 * front, 48, 36), mat);
    m.position.copy(at(a));
    neck.add(m);
  }
  const low = at(0);
  const metal = gold('yellow');
  const bail = new THREE.Mesh(new THREE.TorusGeometry(.07, .022, 16, 40), metal);
  bail.position.set(0, low.y - .2, low.z + .02);
  const drop = new THREE.Group();
  drop.position.set(0, low.y - .27, low.z + .02);
  const gem = stone('diamond', 'round', .32);
  gem.rotation.x = Math.PI / 2;
  gem.position.y = -.33;
  const cap = new THREE.Mesh(new THREE.TorusGeometry(.33, .022, 12, 64), metal);
  cap.position.y = -.33;
  drop.add(gem, cap);
  neck.add(bail, drop);
  g.add(neck);
  g.userData.update = (t, px = 0, py = 0) => {
    neck.rotation.y = Math.sin(t * .35) * .32;
    drop.rotation.y = Math.sin(t * .9) * .55;
    drop.rotation.z = Math.sin(t * 1.3) * .05;
    g.rotation.x += ((py * .22) - g.rotation.x) * .06;
    g.rotation.y += ((px * .5) - g.rotation.y) * .06;
  };
  return g;
}

// Fits an object into view with a soft contact shadow underneath.
export function stage(renderer, object, { tilt = .45, distance = 5.2, shadow = true } = {}) {
  const scene = new THREE.Scene();
  scene.environment = setupStudio(renderer).sharp;
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const k = 2.3 / Math.max(size.x, size.y * 1.1, size.z * .9);
  object.scale.multiplyScalar(k);
  object.position.sub(center.multiplyScalar(k));
  const holder = new THREE.Group();
  holder.add(object);
  scene.add(holder);
  const light = new THREE.DirectionalLight(0xfff4e6, 1.4);
  light.position.set(-1.5, 6, 2.5);
  scene.add(light);
  if (shadow) {
    const floorY = -size.y * k / 2;
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.radius = 10;
    Object.assign(light.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 15 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: .55 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY - .01;
    floor.receiveShadow = true;
    scene.add(floor);
  }
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, Math.sin(tilt) * distance, Math.cos(tilt) * distance);
  camera.lookAt(0, -.05, 0);
  return { scene, camera, holder };
}

export function makeRenderer(canvas, { alpha = true, dpr = 1, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  return renderer;
}

export { THREE };
