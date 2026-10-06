// Liquid Glass, rendered with three.js inside the map's own WebGL context.
//
// Each frame, after MapLibre has drawn the map/globe, a custom layer copies the framebuffer into a
// texture (GPU to GPU) and draws every UI glass panel as a shader quad at that element's screen rect.
// The shader treats the panel as a slab of glass with a rounded, lens-like bevel: light passing the rim
// is refracted (a slightly different index per colour channel gives the chromatic fringe), text-heavy
// panels are frosted, and a Fresnel rim plus two-corner specular highlights and a pointer glint light
// the edges. The HTML on top keeps its text and controls; only its background becomes this glass.
// Without WebGL2 or three.js the CSS frosted glass in styles.css stays in place.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const dark = matchMedia('(prefers-color-scheme: dark)');

/* Which elements become glass, and how. bevel/thick/frost in CSS px. */
const TARGETS = [
  // content-heavy surfaces: frosted so text stays legible
  ['.panel', { frost: 18, tint: .46, bevel: 24, thick: 20 }],
  ['.detail', { frost: 18, tint: .46, bevel: 24, thick: 20 }],
  ['.tip', { frost: 12, tint: .5, bevel: 14, thick: 12 }],
  // controls: clear glass, the content shows through bent at the rim
  ['.drop-inner', { frost: 2.5, tint: .16, bevel: 30, thick: 34 }],
  ['.title', { frost: 1.5, tint: .16, bevel: 20, thick: 20 }],
  ['#actions', { frost: 1.5, tint: .16, bevel: 20, thick: 20 }],
  ['.zoom', { frost: 1.5, tint: .16, bevel: 18, thick: 18 }],
  ['.playchip', { frost: 2, tint: .2, bevel: 18, thick: 18 }],
  ['.site-foot', { frost: 2, tint: .18, bevel: 16, thick: 16 }],
  ['.landing .pill', { frost: 1.5, tint: .14, bevel: 16, thick: 16 }],
];

const vert = /* glsl */`
  uniform vec4 uRect;   // x, y (top-left), w, h in device px, y measured from the top
  uniform vec2 uRes;    // drawing buffer size
  varying vec2 vPx;     // position inside the rect, device px from its top-left
  void main() {
    vPx = position.xy * uRect.zw;
    vec2 px = uRect.xy + vPx;
    gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
  }`;

const frag = /* glsl */`
  precision highp float;
  uniform sampler2D tBack;
  uniform vec4 uRect;
  uniform vec2 uRes;
  uniform float uRadius, uBevel, uThick, uFrost, uOpacity, uTintA, uDpr;
  uniform vec3 uTint;
  uniform vec2 uMouse;   // pointer in rect px (device); far away when not hovering
  varying vec2 vPx;

  float sdRound(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  vec4 back(vec2 px) {               // backdrop at a device-px position (y from the top)
    vec2 uv = vec2(px.x, uRes.y - px.y) / uRes;
    return texture2D(tBack, clamp(uv, vec2(0.0), vec2(1.0)));
  }
  vec4 frosted(vec2 px, float r) {
    vec4 acc = back(px) * 2.0;
    float w = 2.0;
    if (r >= 0.5) {
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 2.39996;             // golden-angle spiral
        float rr = r * sqrt((float(i) + 0.5) / 12.0);
        acc += back(px + vec2(cos(a), sin(a)) * rr);
        w += 1.0;
      }
    }
    return acc / w;
  }

  void main() {
    vec2 halfSize = uRect.zw * 0.5;
    vec2 p = vPx - halfSize;
    float d = sdRound(p, halfSize, uRadius);
    float inside = -d;
    float aa = clamp(inside + 0.5, 0.0, 1.0);
    if (aa <= 0.0) discard;

    // surface: flat in the middle, curving down across the bevel like the edge of a thick lens
    vec2 e = vec2(1.0, 0.0);
    vec2 g = vec2(sdRound(p + e.xy, halfSize, uRadius) - sdRound(p - e.xy, halfSize, uRadius),
                  sdRound(p + e.yx, halfSize, uRadius) - sdRound(p - e.yx, halfSize, uRadius));
    g = g / max(length(g), 1e-4);                 // outward direction
    float t = clamp(inside / uBevel, 0.0, 1.0);   // 0 at the rim, 1 where the glass is flat
    float slope = (1.0 - t) * (1.0 - t);
    vec2 bend = -g * slope * uThick;              // light through the rim comes from further in

    vec2 base = uRect.xy + vPx;
    float cr = frosted(base + bend * 1.00, uFrost).r;
    float cg = frosted(base + bend * 1.06, uFrost).g;
    vec4 cb = frosted(base + bend * 1.12, uFrost);
    vec4 col = vec4(cr, cg, cb.b, cb.a);          // premultiplied, like the map canvas

    // body tint keeps text legible — mixed in premultiplied space
    col = col * (1.0 - uTintA) + vec4(uTint * uTintA, uTintA);

    // light: Fresnel rim, two-corner specular, pointer glint
    vec2 L = normalize(vec2(-0.55, -0.85));       // from the top-left (y down)
    float rimBand = smoothstep(uBevel * 0.7, 0.0, inside);
    float spec = rimBand * (0.55 * pow(max(dot(g, L), 0.0), 2.0) + 0.28 * pow(max(dot(g, -L), 0.0), 2.0));
    float edge = smoothstep(1.6 * uDpr, 0.0, inside) * 0.38;
    float fres = pow(1.0 - t, 3.0) * 0.10;
    vec2 dm = vPx - uMouse;
    float glint = exp(-dot(dm, dm) / (2.0 * pow(70.0 * uDpr, 2.0))) * 0.13;
    float light = spec + edge + fres + glint;
    col.rgb += vec3(light);
    col.a = min(1.0, col.a + light);

    gl_FragColor = col * aa * uOpacity;
  }`;

/* ── tracked elements ───────────────────────────────────────── */
const items = new Map();   // element -> { mesh, opts, cs, chain }
const scene = new THREE.Scene();
const camera = new THREE.Camera();
let renderer = null, fbTex = null, map = null, live = false;
const mouse = { x: -1e5, y: -1e5 };
const tint = new THREE.Color();

function material(opts) {
  return new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      tBack: { value: null }, uRect: { value: new THREE.Vector4() }, uRes: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0 }, uBevel: { value: 1 }, uThick: { value: 1 }, uFrost: { value: 0 },
      uOpacity: { value: 1 }, uTintA: { value: opts.tint }, uTint: { value: new THREE.Color() },
      uMouse: { value: new THREE.Vector2(-1e5, -1e5) }, uDpr: { value: 1 },
    },
    // the vertex shader flips y into GL space, which reverses the winding — draw both faces
    side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
}
function track(el, opts) {
  if (items.has(el)) return;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(.5, .5, 0), material(opts));
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  // the ancestor chain, so the glass fades and hides together with its element
  const chain = [];
  for (let n = el; n && n !== document.body; n = n.parentElement) chain.push(getComputedStyle(n));
  items.set(el, { mesh, opts, cs: chain[0], chain });
  el.classList.add('gl-glass');
}
function scan() {
  for (const [sel, opts] of TARGETS) document.querySelectorAll(sel).forEach((el) => track(el, opts));
  for (const [el, it] of items) {
    if (el.isConnected) continue;
    scene.remove(it.mesh); it.mesh.material.dispose(); it.mesh.geometry.dispose(); items.delete(el);
  }
}

/* ── the custom layer ───────────────────────────────────────── */
const layer = {
  id: 'liquid-glass', type: 'custom', renderingMode: '2d',
  onAdd(mp, gl) {
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ canvas: mp.getCanvas(), context: gl, antialias: false });
      renderer.autoClear = false;
      renderer.setPixelRatio(1);
    }
  },
  render(gl) {
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    if (!W || !H || !renderer) return;
    renderer.resetState();
    if (!fbTex || fbTex.image.width !== W || fbTex.image.height !== H) {
      if (fbTex) fbTex.dispose();
      fbTex = new THREE.FramebufferTexture(W, H);
      fbTex.minFilter = fbTex.magFilter = THREE.LinearFilter;
    }
    renderer.copyFramebufferToTexture(fbTex);

    const cr = map.getCanvas().getBoundingClientRect();
    const sx = W / cr.width, sy = H / cr.height;
    tint.set(dark.matches ? 0x16161a : 0xf6f6f8);
    let any = false;
    for (const [el, it] of items) {
      let op = 1, hidden = false;
      for (const cs of it.chain) {
        if (cs.display === 'none') { hidden = true; break; }
        op *= parseFloat(cs.opacity);
      }
      if (it.cs.visibility === 'hidden') hidden = true;
      const r = el.getBoundingClientRect();
      if (hidden || op < .01 || r.width < 2 || r.height < 2) { it.mesh.visible = false; continue; }
      it.mesh.visible = true; any = true;
      const u = it.mesh.material.uniforms;
      u.tBack.value = fbTex;
      u.uRes.value.set(W, H);
      u.uRect.value.set((r.left - cr.left) * sx, (r.top - cr.top) * sy, r.width * sx, r.height * sy);
      const rad = Math.min(parseFloat(it.cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2);
      u.uRadius.value = rad * sx;
      u.uBevel.value = Math.max(2, Math.min(it.opts.bevel, rad + 6, r.height / 2) * sx);
      u.uThick.value = it.opts.thick * sx;
      u.uFrost.value = it.opts.frost * sx;
      u.uOpacity.value = op;
      u.uDpr.value = sx;
      u.uTint.value.copy(tint);
      u.uTintA.value = dark.matches ? it.opts.tint : Math.min(.8, it.opts.tint + .15);
      u.uMouse.value.set((mouse.x - r.left) * sx, (mouse.y - r.top) * sy);
    }
    if (any) {
      renderer.setViewport(0, 0, W, H);
      renderer.render(scene, camera);
    }
    renderer.resetState();
    if (!live && any) { live = true; document.documentElement.classList.add('gl-live'); }
  },
};

function attach(mp) {
  if (map !== mp) {
    map = mp;
    map.on('styledata', addLayer);
  }
  addLayer();
}
function addLayer() {
  if (!map || !map.getStyle()) return;
  try {
    if (!map.getLayer(layer.id)) map.addLayer(layer);
    else {
      // stay above everything the app adds later (marker glow, selection ring, route)
      const order = (map.style && map.style._order) || [];
      if (order[order.length - 1] !== layer.id) map.moveLayer(layer.id);
    }
  } catch (e) { console.warn('liquid glass', e); }
}

/* Glass must follow its element even when the map itself is still, so watch the rects and ask
   MapLibre for a frame whenever any of them (or the pointer) changes. */
let lastSig = '';
function watch() {
  requestAnimationFrame(watch);
  if (!map) return;
  let sig = `${mouse.x},${mouse.y}`;
  for (const [el, it] of items) {
    const r = el.getBoundingClientRect();
    sig += `|${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0},${it.cs.opacity}`;
  }
  if (sig !== lastSig) { lastSig = sig; map.triggerRepaint(); }
}

function start() {
  if (!document.createElement('canvas').getContext('webgl2')) return;   // CSS glass stays
  scan();
  let pending = 0;
  new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan(); }); })
    .observe(document.body, { childList: true, subtree: true });
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e5; });
  if (window.STM && window.STM.map) attach(window.STM.map);
  addEventListener('stm:map', (e) => attach(e.detail));
  addEventListener('stm:style', () => { if (map) attach(map); });
  dark.addEventListener('change', () => map && map.triggerRepaint());
  requestAnimationFrame(watch);
}
start();
