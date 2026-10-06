// Liquid Glass: controls refract what is behind them the way Apple's Liquid Glass does — clear glass whose curved rim bends and slightly splits the colours of the
// backdrop. Each glass element gets its own SVG displacement map sized to it, applied as a
// backdrop-filter. Only Chromium renders SVG backdrop filters; other browsers keep the frosted glass
// from styles.css plus the shared specular rim and pointer highlight.
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some((b) => /Chromium/.test(b.brand)));
const defs = document.getElementById('lgDefs');
let uid = 0;

/* ── displacement maps ─────────────────────────────────────────
   R/G encode the sampling offset (128 = none). `rim` px from the edge, the glass bends outward
   like the rounded edge of a thick lens; `zoom` > 1 also magnifies toward the centre. */
function mapFor(w, h, { radius, rim, zoom = 1, circle = false }) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h), d = img.data;
  const r = Math.min(radius, w / 2, h / 2);
  const sdf = (x, y) => {                    // distance inside the rounded rect (negative outside)
    if (circle) return Math.min(w, h) / 2 - Math.hypot(x - w / 2, y - h / 2);
    const qx = Math.abs(x - w / 2) - (w / 2 - r), qy = Math.abs(y - h / 2) - (h / 2 - r);
    return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
  };
  const maxOff = Math.max(rim * .9, (Math.min(w, h) / 2) * (1 - 1 / zoom)) || 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dist = sdf(x + .5, y + .5);
      let ox = 0, oy = 0;
      if (dist > 0) {
        if (dist < rim) {
          // outward normal from the distance field gradient
          const gx = sdf(x + 1.5, y + .5) - sdf(x - .5, y + .5), gy = sdf(x + .5, y + 1.5) - sdf(x + .5, y - .5);
          const len = Math.hypot(gx, gy) || 1;
          const t = 1 - dist / rim, k = t * t * rim * .9;
          ox -= (gx / len) * k; oy -= (gy / len) * k;
        }
        if (zoom !== 1) { const f = 1 - 1 / zoom; ox -= (x - w / 2) * f; oy -= (y - h / 2) * f; }
      }
      d[i] = 128 + Math.max(-127, Math.min(127, (ox / maxOff) * 127));
      d[i + 1] = 128 + Math.max(-127, Math.min(127, (oy / maxOff) * 127));
      d[i + 2] = 128; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: cv.toDataURL(), scale: maxOff * 2 * (255 / 254) };
}

/* One filter per element: three displacement passes at slightly different strengths, one per colour
   channel, recombined — that split is the chromatic fringe on the rim. */
function buildFilter(id, w, h, m, aberration) {
  const f = document.createElementNS(NS, 'filter');
  f.setAttribute('id', id);
  f.setAttribute('x', '0'); f.setAttribute('y', '0');
  f.setAttribute('width', w); f.setAttribute('height', h);
  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  const passes = aberration ? [[1, 'R'], [1 + aberration, 'G'], [1 + aberration * 2, 'B']] : [[1, '']];
  f.innerHTML = `<feImage href="${m.url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>`
    + passes.map(([k, ch], i) => {
      const disp = `<feDisplacementMap in="SourceGraphic" in2="map" scale="${(m.scale * k).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d${i}"/>`;
      if (!ch) return disp;
      const row = { R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0', G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0', B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0' }[ch];
      return disp + `<feColorMatrix in="d${i}" type="matrix" values="${row}  0 0 0 1 0" result="c${i}"/>`;
    }).join('')
    + (aberration ? '<feBlend in="c0" in2="c1" mode="screen" result="rg"/><feBlend in="rg" in2="c2" mode="screen"/>' : '');
  return f;
}

/* ── apply to elements ─────────────────────────────────────── */
const tracked = new Map();   // element -> options
const ro = chromium ? new ResizeObserver((entries) => { for (const e of entries) refract(e.target); }) : null;

function refract(el) {
  const o = tracked.get(el); if (!o) return;
  const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
  if (w < 4 || h < 4 || (el._lgSize === `${w}x${h}`)) return;
  el._lgSize = `${w}x${h}`;
  const radius = o.radius ?? (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
  const m = mapFor(w, h, { radius, rim: o.rim ?? Math.min(22, Math.min(w, h) * .42), zoom: o.zoom, circle: o.circle });
  const id = el._lgId || (el._lgId = `lg${++uid}`);
  document.getElementById(id)?.remove();
  defs.appendChild(buildFilter(id, w, h, m, o.aberration ?? .05));
  el.style.backdropFilter = `url(#${id}) blur(${o.blur ?? 1.5}px) saturate(1.7) brightness(${o.bright ?? 1.04})`;
  el.style.webkitBackdropFilter = '';
  el.classList.add('lg-on');
}
function glass(el, opts = {}) {
  if (!el || tracked.has(el)) return;
  el.classList.add('lg');
  tracked.set(el, opts);
  if (!ro) return;
  ro.observe(el);
  refract(el);
}

/* ── specular highlight that follows the pointer (all browsers) ── */
let pending = null;
addEventListener('pointermove', (e) => {
  if (pending) { pending.e = e; return; }
  pending = { e };
  requestAnimationFrame(() => {
    const ev = pending.e; pending = null;
    const el = ev.target && ev.target.closest && ev.target.closest('.glass, .lg');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
    el.style.setProperty('--my', `${ev.clientY - r.top}px`);
  });
}, { passive: true });

function init() {
  document.documentElement.classList.toggle('lg-refract', chromium);
  // clear glass on controls; content-heavy cards stay frosted for legibility (as Apple does)
  glass(document.querySelector('.drop-inner'), { rim: 30, blur: 4, aberration: .06 });
  glass(document.querySelector('.site-foot'), { rim: 16, blur: 2 });
  glass(document.querySelector('.title'), { rim: 18 });
  glass(document.querySelector('.seg'), { rim: 18 });
  glass(document.querySelector('.zoom'), { rim: 14 });
  glass(document.querySelector('.playchip'), { rim: 16 });
  glass(document.querySelector('.legend'), { rim: 16, blur: 6 });
  const actions = document.getElementById('actions');
  const scan = () => actions.querySelectorAll('.btn.glass').forEach((b) => glass(b, { rim: 16 }));
  new MutationObserver(scan).observe(actions, { childList: true });
  scan();
}

window.Glass = { init, glass };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
