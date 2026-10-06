(() => {
'use strict';

/* ════════════════════════════════════════════════════════════
   Motion — real spring curves, shared by CSS (linear()) and JS
   ════════════════════════════════════════════════════════════ */
function simulateSpring(stiffness, damping, seconds = 0.9, samples = 90) {
  const dt = 1 / 1200, out = [0];
  let x = 0, v = 0, t = 0, next = seconds / samples;
  while (out.length <= samples) {
    v += (-stiffness * (x - 1) - damping * v) * dt;
    x += v * dt; t += dt;
    if (t >= next) { out.push(x); next += seconds / samples; }
  }
  out[out.length - 1] = 1;
  return out;
}
const BOUNCY = simulateSpring(190, 17);
const SOFT = simulateSpring(120, 21);
const root = document.documentElement;
if (CSS.supports('transition-timing-function', 'linear(0, 1)')) {
  const toLinear = (a) => `linear(${a.map((v) => +v.toFixed(4)).join(', ')})`;
  root.style.setProperty('--spring', toLinear(BOUNCY));
  root.style.setProperty('--spring-soft', toLinear(SOFT));
}
const sampleCurve = (curve) => (t) => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  const f = t * (curve.length - 1), i = Math.floor(f);
  return curve[i] + (curve[i + 1] - curve[i]) * (f - i);
};
const springEase = sampleCurve(BOUNCY);
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutQuint = (t) => (t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const $ = (s) => document.querySelector(s);
const body = document.body;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const median = (a) => {
  if (!a.length) return null;
  const s = Float64Array.from(a).sort(), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (v) => (v == null ? '–' : v >= 10 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1));
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (ts) => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
const fmtWhen = (ts) => { const d = new Date(ts); return `${fmtDate(ts)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtMonth = (ts) => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}`; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isCompact = () => innerWidth <= 860;

/* i18n (see i18n.js): translated text, error objects that re-translate, and display names for stable keys */
const tr = (k, p) => I18N.t(k, p);
const fail = (key, params) => Object.assign(new Error(tr(key, params)), { key, params });
const msgOf = (e) => (e && e.key ? tr(e.key, e.params) : String((e && e.message) || e));
const cityName = (c) => I18N.city(c);
const typeName = (ty) => (ty === 'Ethernet' ? tr('ethernet') : ty === '' ? tr('unknown') : ty);
const monthHead = (y, mo) => tr('monthHead', { y, m: mo + 1, M: I18N.month(mo) });

const ICON = {
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V3.5m0 0L8 7.5m4-4 4 4"/><path d="M8.5 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2Z"/><path d="M9 4.5v13M15 6.5v13"/></svg>',
  laptop: '<svg viewBox="0 0 24 24"><rect x="4.5" y="5" width="15" height="10.5" rx="1.8"/><path d="M2.5 19h19"/></svg>',
  close: '<svg viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8"/></svg>',
  plane: '<svg viewBox="0 0 24 24"><path d="M21 15.5v-1.8l-8-5V3.5a1.5 1.5 0 0 0-3 0v5.2l-8 5v1.8l8-2.5v5.2l-2 1.5v1.3l3.5-1 3.5 1v-1.3l-2-1.5V13l8 2.5Z" fill="currentColor" stroke="none"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M5 12l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12"/><rect x="3.5" y="12" width="17" height="5" rx="1.6"/><path d="M6.5 17v1.8M17.5 17v1.8"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></svg>',
};

/* ════════════════════════════════════════════════════════════
   Data: CSV → tests
   ════════════════════════════════════════════════════════════ */
const TYPE_COLOR = { '5G': '#bf5af2', 'Wi-Fi': '#0a84ff', 'LTE': '#ff9f0a', 'Ethernet': '#30d158', '3G': '#ff375f' };
const typeColor = (t) => TYPE_COLOR[t] || '#8e8e93';
function normType(s) {
  const k = (s || '').toLowerCase().replace(/[\s_-]/g, '');
  if (k === 'fiveg' || k === '5g' || k === 'nr' || k === '5gsa' || k === '5gnsa') return '5G';
  if (k === 'wifi' || k === 'wlan') return 'Wi-Fi';
  if (k === 'lte' || k === '4g' || k === 'fourg') return 'LTE';
  if (k === 'ethernet' || k === 'lan' || k === 'wired') return 'Ethernet';
  if (k === '3g' || k === 'threeg' || k === 'umts' || k === 'hspa') return '3G';
  return (s || '').trim();
}

function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
const csvCell = (c) => (/[",\n\r]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);

function parseWhen(d = '', t = '') {
  let y, mo, da, m;
  if ((m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) { mo = +m[1]; da = +m[2]; y = +m[3]; }
  else if ((m = d.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) { y = +m[1]; mo = +m[2]; da = +m[3]; }
  else { const x = Date.parse(`${d} ${t}`); return isNaN(x) ? null : x; }
  let hh = 0, mm = 0;
  const tm = t.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/) || d.match(/[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/);
  if (tm) {
    hh = +tm[1]; mm = +tm[2];
    if (tm[3]) { const pm = /p/i.test(tm[3]); if (hh === 12) hh = pm ? 12 : 0; else if (pm) hh += 12; }
  }
  return new Date(y, mo - 1, da, hh, mm).getTime();
}

function cityOf(lat, lon) {
  // Returns a stable key (the zh-CN name in cities.js); I18N.city() translates it for display.
  // The Shenzhen–Hong Kong border is too tight for nearest-centre; use a rough boundary line.
  if (lat > 22.13 && lat < 22.6 && lon > 113.82 && lon < 114.5) {
    const b = lon <= 113.98 ? 22.47 : lon <= 114.22 ? 22.5 + ((lon - 113.98) / 0.24) * 0.045 : 22.5;
    return lat < b ? '香港' : '深圳';
  }
  let best = null, bd = Infinity;
  const cl = Math.cos((lat * Math.PI) / 180);
  for (const [name, la, lo] of window.CITIES) {
    let dx = Math.abs(lo - lon); if (dx > 180) dx = 360 - dx;
    const d = Math.hypot((la - lat) * 111, dx * 111 * cl);
    if (d < bd) { bd = d; best = name; }
  }
  if (bd <= window.NEAR_KM) return best;
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
}

function readDataset(text, name) {
  const rows = parseCSV(text.replace(/^﻿/, ''));
  if (rows.length < 2) throw fail('err.noRows');
  const h = rows[0].map((s) => s.trim().toLowerCase());
  const col = (...names) => { for (const n of names) { const i = h.findIndex((x) => x.startsWith(n)); if (i >= 0) return i; } return -1; };
  const ix = {
    date: col('date'), time: col('time'), type: col('connection type', 'connection'),
    lat: col('latitude'), lon: col('longitude'),
    dl: col('download speed', 'download (mbps)', 'download'), ul: col('upload speed', 'upload (mbps)', 'upload'),
    ping: col('latency', 'ping'), server: col('server name', 'server'),
  };
  if (ix.lat < 0 || ix.lon < 0 || ix.dl < 0) throw fail('err.noCols');

  const tests = []; const cityCache = new Map(); let noPing = 0, noGeo = 0;
  for (let r = 1; r < rows.length; r++) {
    const c = rows[r];
    const lat = parseFloat(c[ix.lat]), lon = parseFloat(c[ix.lon]), dl = parseFloat(c[ix.dl]);
    if (!isFinite(dl)) continue;
    if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) { noGeo++; continue; }
    const ul = parseFloat(c[ix.ul]);
    let ping = parseFloat(c[ix.ping]);
    if (!(ping > 0)) { ping = null; noPing++; }
    const ts = parseWhen(c[ix.date] || '', ix.time >= 0 ? c[ix.time] || '' : '');
    const key = `${lat},${lon}`;
    let city = cityCache.get(key);
    if (!city) { city = cityOf(lat, lon); cityCache.set(key, city); }
    tests.push({
      ts: ts ?? 0, year: ts ? new Date(ts).getFullYear() : 0,
      type: normType(c[ix.type]), lat, lon, key, city,
      dl, ul: isFinite(ul) ? ul : null, ping, server: (c[ix.server] || '').trim(),
    });
  }
  if (!tests.length) throw fail('err.noGeo');
  tests.sort((a, b) => b.ts - a.ts);

  // Public copy for sharing: the same CSV minus anything that identifies the uploader's network.
  const keep = h.map((x, i) => (/(^|\s)ip$/.test(x) || x.includes(' ip') ? -1 : i)).filter((i) => i >= 0);
  const publicCSV = rows.map((r) => keep.map((i) => csvCell(r[i] ?? '')).join(',')).join('\n') + '\n';

  return { name: name.replace(/\.csv$/i, ''), tests, noPing, noGeo, publicCSV, bytes: text.length };
}

function summarize(ds) {
  const spots = new Set(ds.tests.map((t) => t.key)).size;
  const ts = ds.tests.map((t) => t.ts).filter(Boolean);
  const from = ts.length ? Math.min(...ts) : 0, to = ts.length ? Math.max(...ts) : 0;
  return { n: ds.tests.length, spots, from, to };
}

/* Synthetic demo so first-time visitors can see the experience without a file. */
function demoDataset() {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const places = [
    ['Hong Kong', 22.30, 114.17, 90, .06], ['Shenzhen', 22.54, 114.05, 70, .07], ['Guangzhou', 23.12, 113.30, 50, .08],
    ['Shanghai', 31.22, 121.46, 40, .08], ['Beijing', 39.91, 116.41, 30, .09], ['Tokyo', 35.68, 139.75, 45, .07],
    ['Taipei', 25.04, 121.54, 25, .05], ['Singapore', 1.30, 103.84, 20, .05], ['San Francisco', 37.77, -122.42, 12, .05],
    ['London', 51.51, -0.12, 10, .05], ['Sydney', -33.87, 151.2, 8, .05], ['Chengdu', 30.66, 104.07, 18, .07],
  ];
  const servers = { '5G': ['China Mobile 5G', 'CMHK', 'SoftBank 5G'], 'Wi-Fi': ['HKBN', 'IIJ', 'Singtel'], 'LTE': ['China Unicom', 'Docomo', 'Vodafone'] };
  const lines = ['Date,Time,Connection Type,Latitude,Longitude,Download Speed (Megabits per second),Upload Speed (Megabits per second),Latency (Milliseconds),Server Name'];
  const now = new Date(2026, 8, 30).getTime(), span = 4.5 * 365 * 864e5;
  for (const [, la, lo, n, spread] of places) {
    const hubs = Array.from({ length: Math.max(3, n / 9 | 0) }, () => [la + gauss() * spread, lo + gauss() * spread]);
    for (let i = 0; i < n; i++) {
      const [hla, hlo] = hubs[(rnd() * hubs.length) | 0];
      const r = rnd(), type = r < .55 ? '5G' : r < .85 ? 'Wi-Fi' : 'LTE';
      const base = type === '5G' ? 520 : type === 'Wi-Fi' ? 300 : 55;
      const dl = Math.max(3, base * Math.exp(gauss() * .7));
      const ul = Math.max(1, dl * (type === 'Wi-Fi' ? .35 : .12) * Math.exp(gauss() * .4));
      const ping = Math.max(4, (type === 'LTE' ? 38 : 22) * Math.exp(gauss() * .5));
      const d = new Date(now - rnd() * span);
      const srv = servers[type][(rnd() * 3) | 0];
      lines.push(`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()},${pad(d.getHours())}:${pad(d.getMinutes())},${type === 'Wi-Fi' ? 'Wifi' : type === '5G' ? 'FiveG' : 'LTE'},${hla.toFixed(3)},${hlo.toFixed(3)},${dl.toFixed(2)},${ul.toFixed(2)},${Math.round(ping)},${srv}`);
    }
  }
  return Object.assign(readDataset(lines.join('\n'), ''), { nameKey: 'demoName' });
}

/* ════════════════════════════════════════════════════════════
   Metrics & colour
   ════════════════════════════════════════════════════════════ */
const METRICS = {
  dl: { get name() { return tr('m.dl'); }, unit: 'Mbps', stops: [25, 100, 250, 500, 900], pill: ['#0a84ff', '#5e5ce6'] },
  ul: { get name() { return tr('m.ul'); }, unit: 'Mbps', stops: [5, 20, 40, 80, 150], pill: ['#bf5af2', '#ff375f'] },
  ping: { get name() { return tr('m.ping'); }, unit: 'ms', stops: [15, 25, 40, 70, 120], invert: true, pill: ['#30d158', '#32ade6'] },
};
const darkQ = matchMedia('(prefers-color-scheme: dark)');
const ramp = () => (darkQ.matches ? ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff'] : ['#ff3b30', '#ff9500', '#ffb800', '#34c759', '#007aff']);
function colorStops(m) {
  const r = ramp(), M = METRICS[m];
  return M.stops.map((s, i) => [s, M.invert ? r[r.length - 1 - i] : r[i]]);
}
function colorFor(m, v) {
  if (v == null) return '#8e8e93';
  const st = colorStops(m);
  if (v <= st[0][0]) return st[0][1];
  for (let i = 1; i < st.length; i++) {
    if (v <= st[i][0]) {
      const f = (v - st[i - 1][0]) / (st[i][0] - st[i - 1][0]);
      return mix(st[i - 1][1], st[i][1], f);
    }
  }
  return st[st.length - 1][1];
}
function mix(a, b, f) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * f).toString(16).padStart(2, '0')).join('');
}
const metricOf = (t, m) => (m === 'dl' ? t.dl : m === 'ul' ? t.ul : t.ping);
function stats(list) {
  const pings = []; const dls = []; const uls = [];
  for (const t of list) { dls.push(t.dl); if (t.ul != null) uls.push(t.ul); if (t.ping != null) pings.push(t.ping); }
  return { n: list.length, dl: median(dls), ul: median(uls), ping: median(pings), pn: pings.length };
}

/* ════════════════════════════════════════════════════════════
   State
   ════════════════════════════════════════════════════════════ */
const S = {
  view: 'landing',
  ds: null,               // current dataset
  mode: 'local',          // local | shared | demo
  shareId: null,
  owner: false,
  sharedAt: null,
  metric: 'dl',
  types: new Set(),
  years: new Set(),
  tests: [],
  spots: [],
  sel: null,
  citiesAll: false,
  pending: null,          // parsed but not yet opened
  spotByKey: new Map(),
  tab: 'overview',        // overview | timeline
  tl: { year: null, month: null },
  route: [], routeUpto: 0, routeData: null,
  popAt: 0,
  selMarker: null,        // id of the marker whose detail card is open               // markers created before this moment wait to pop in
};

/* ════════════════════════════════════════════════════════════
   Map
   ════════════════════════════════════════════════════════════ */
const STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
let map = null, dotScale = 0;

// The map canvas is taller than the viewport (see #map in styles.css); EXTRA is the hidden part below the fold.
// Keeping one canvas lets every view change be a single animated camera move instead of a resize.
const EXTRA = () => Math.round(innerHeight * 0.6);
// Landing: a large globe whose centre sits below the fold, so only its upper arc rises into view.
const landingRadius = () => Math.max(innerHeight * 0.69, Math.min(innerWidth * 0.46, innerHeight * 0.95));
const landingZoom = () => Math.log2(landingRadius() / 81.5);
function landingPadding() {
  const centre = innerHeight * 0.56 + landingRadius();         // globe top lands at 56% of the viewport
  return { top: Math.max(0, Math.round(2 * centre - innerHeight * 1.6)), bottom: 0, left: 0, right: 0 };
}

function initMap() {
  if (!window.maplibregl) { body.classList.add('map-ready'); return; }
  try {
    map = new maplibregl.Map({
      container: 'map',
      style: STYLES[darkQ.matches ? 'dark' : 'light'],
      center: [100, 22], zoom: landingZoom(),
      attributionControl: { compact: true },
      renderWorldCopies: false, maxPitch: 70, fadeDuration: 250,
      dragRotate: true, pitchWithRotate: true,
    });
  } catch (e) { console.warn(e); body.classList.add('map-ready'); return; }
  map.setPadding(landingPadding());
  // glass.js (three.js Liquid Glass) draws into this map's WebGL context; it listens for these.
  window.STM = { map };
  dispatchEvent(new CustomEvent('stm:map', { detail: map }));
  setInteractive(false);
  map.on('style.load', onStyle);
  map.once('load', () => setTimeout(() => body.classList.add('map-ready'), 80));
  map.on('error', (e) => { console.warn('map', e && e.error); body.classList.add('map-ready'); });
  map.on('render', scheduleMarkers);
  map.on('sourcedata', (e) => { if (e.sourceId === 'spots') scheduleMarkers(); });
  map.on('click', (e) => {
    if (S.view === 'dash' && !e.originalEvent.target.closest?.('.pm')) closeDetail();
  });
  darkQ.addEventListener('change', () => { map.setStyle(STYLES[darkQ.matches ? 'dark' : 'light'], { diff: false }); renderLegend(); });

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(64, now - last); last = now;
    if (S.view === 'landing' && !map.isMoving() && !reduceMotion) {
      const c = map.getCenter(); c.lng += dt * 0.0045; map.setCenter(c);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* The landing globe is scenery: it spins on its own and ignores the pointer until the map view opens. */
const HANDLERS = ['dragPan', 'dragRotate', 'scrollZoom', 'boxZoom', 'doubleClickZoom', 'keyboard', 'touchZoomRotate', 'touchPitch'];
function setInteractive(on) {
  if (!map) return;
  for (const h of HANDLERS) { try { on ? map[h].enable() : map[h].disable(); } catch {} }
}

function onStyle() {
  try { map.setProjection({ type: 'globe' }); } catch {}
  try {
    map.setSky({
      'sky-color': darkQ.matches ? '#000000' : '#f5f5f7',
      'horizon-color': darkQ.matches ? '#0b2a4a' : '#dfe9f5',
      'fog-color': darkQ.matches ? '#000000' : '#f5f5f7',
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 8, 0],
    });
  } catch {}
  localizeLabels();
  addEarth();
  addDataLayers();
  dispatchEvent(new CustomEvent('stm:style', { detail: map }));
}

/* Apple-Maps-style globe: NASA Blue Marble relief imagery (public domain) at low zoom, fading into the
   street map as you zoom in, with country borders and the equator/tropics drawn over it. */
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';
function graticule() {
  const line = (lat, kind) => ({
    type: 'Feature', properties: { kind },
    geometry: { type: 'LineString', coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, lat]) },
  });
  return { type: 'FeatureCollection', features: [line(0, 'equator'), line(23.44, 'tropic'), line(-23.44, 'tropic'), line(66.56, 'polar'), line(-66.56, 'polar')] };
}
function addEarth() {
  if (!map || map.getSource('earth')) return;
  const layers = map.getStyle().layers;
  const firstSymbol = (layers.find((l) => l.type === 'symbol') || {}).id;
  const dark = darkQ.matches;
  map.addSource('earth', {
    type: 'raster', tiles: [GIBS], tileSize: 256, maxzoom: 8,
    attribution: 'Imagery <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA Blue Marble</a>',
  });
  map.addLayer({
    id: 'earth', type: 'raster', source: 'earth',
    paint: {
      'raster-opacity': ['interpolate', ['linear'], ['zoom'], 0, 1, 4.5, 1, 6.5, 0],
      'raster-brightness-max': dark ? .9 : 1, 'raster-saturation': .1, 'raster-contrast': .08, 'raster-fade-duration': 300,
    },
  }, firstSymbol);
  // country borders stay visible on top of the imagery
  for (const l of layers) if (l['source-layer'] === 'boundary' && l.type === 'line') { try { map.moveLayer(l.id, firstSymbol); } catch {} }
  map.addSource('graticule', { type: 'geojson', data: graticule() });
  const fade = ['interpolate', ['linear'], ['zoom'], 0, .55, 4, .55, 5.5, 0];
  map.addLayer({
    id: 'graticule', type: 'line', source: 'graticule', filter: ['==', ['get', 'kind'], 'equator'],
    paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': fade },
  }, firstSymbol);
  map.addLayer({
    id: 'graticule-dash', type: 'line', source: 'graticule', filter: ['!=', ['get', 'kind'], 'equator'],
    paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': fade, 'line-dasharray': [2, 3] },
  }, firstSymbol);
}

/* Starfield behind the globe. The stars are painted once into two tiles (steady + twinkling) and then only
   moved with GPU transforms, so spinning the globe never repaints the sky. The sky drifts with the globe and
   is hidden in light mode or once the map is zoomed in far enough to cover it. */
function initStars() {
  const sky = $('#stars'); if (!sky) return;
  const layers = [...sky.children];
  let tileW = 1;
  const paint = () => {
    const dpr = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    tileW = w * 2;
    const tints = ['#ffffff', '#ffffff', '#ffffff', '#cfe0ff', '#ffe9c7'];
    const count = Math.round((w * h) / 2400);
    layers.forEach((layer, li) => {
      const cv = document.createElement('canvas');
      cv.width = tileW * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      // layer 0 holds most stars; layers 1 and 2 hold the twinkling ones, fading out of phase in CSS
      const n = li === 0 ? count : Math.round(count * .18);
      for (let i = 0; i < n; i++) {
        const big = Math.random() < (li ? .25 : .06);
        ctx.globalAlpha = .25 + Math.random() * .7;
        ctx.fillStyle = tints[(Math.random() * tints.length) | 0];
        ctx.beginPath();
        ctx.arc(Math.random() * tileW, Math.random() * h, big ? .9 + Math.random() * .8 : .3 + Math.random() * .55, 0, 6.283);
        ctx.fill();
      }
      cv.toBlob((b) => {
        if (!b) return;
        if (layer._url) URL.revokeObjectURL(layer._url);
        layer._url = URL.createObjectURL(b);
        layer.style.backgroundImage = `url(${layer._url})`;
        layer.style.backgroundSize = `${tileW}px ${h}px`;
        layer.style.width = `${w + tileW}px`;
      });
    });
    follow();
  };
  const follow = () => {
    const lng = map ? map.getCenter().lng : 0;
    const shift = ((((lng % 360) + 360) % 360) / 360) * tileW;
    const tf = `translate3d(${-shift.toFixed(1)}px,0,0)`;
    for (const l of layers) l.style.transform = tf;
    const hide = S.view === 'dash' && map && map.getZoom() > 5.5;
    sky.classList.toggle('off', !!hide);
  };
  paint();
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(paint, 200); });
  if (map) map.on('move', follow);
}

/* Basemap labels follow the UI language (CARTO tiles only carry name:zh, so both Chinese variants use it). */
function localizeLabels() {
  // Some name:zh values carry both scripts, e.g. "欧洲/歐洲" or "亚洲;亞洲": keep the half that matches the UI.
  const n = ['var', 'n'];
  const cut = ['case', ['in', ';', n], ['index-of', ';', n], ['index-of', '/', n]];
  const half = I18N.lang === 'zh-HK' ? ['slice', n, ['+', cut, 1]] : ['slice', n, 0, cut];
  const zh = I18N.lang === 'en'
    ? ['coalesce', ['get', 'name_en'], ['get', 'name']]
    : ['let', 'n', ['coalesce', ['get', 'name:zh'], ['get', 'name_en'], ['get', 'name']],
      ['case', ['any', ['in', '/', n], ['in', ';', n]], half, n]];
  const style = map && map.getStyle();
  if (!style || !style.layers) return;
  for (const l of style.layers) {
    if (l.type !== 'symbol' || !l.layout || !l.layout['text-field'] || l['source-layer'] === 'housenumber') continue;
    if (!JSON.stringify(l.layout['text-field']).includes('name')) continue;
    try { map.setLayoutProperty(l.id, 'text-field', zh); } catch {}
  }
}

function valueExpr(m) {
  if (m === 'ping') {
    return ['case', ['has', 'point_count'],
      ['case', ['>', ['get', 'pn'], 0], ['/', ['get', 'pingw'], ['get', 'pn']], -1],
      ['get', 'ping']];
  }
  return ['case', ['has', 'point_count'], ['/', ['get', m + 'w'], ['get', 'n']], ['get', m]];
}
function colorExpr(m) {
  const v = valueExpr(m);
  return ['case', ['<', v, 0], '#8e8e93', ['interpolate', ['linear'], v, ...colorStops(m).flat()]];
}

const EMPTY = { type: 'FeatureCollection', features: [] };

function addDataLayers() {
  if (!map || map.getSource('spots')) return;
  map.addSource('spots', {
    type: 'geojson', data: spotsGeoJSON(),
    cluster: true, clusterRadius: 58, clusterMaxZoom: 14,
    clusterProperties: {
      n: ['+', ['get', 'n']],
      pn: ['+', ['get', 'pn']],
      dlw: ['+', ['*', ['get', 'dl'], ['get', 'n']]],
      ulw: ['+', ['*', ['get', 'ul'], ['get', 'n']]],
      pingw: ['+', ['*', ['max', ['get', 'ping'], 0], ['get', 'pn']]],
    },
  });
  map.addSource('sel', { type: 'geojson', data: EMPTY });
  map.addSource('route', { type: 'geojson', data: S.routeData || EMPTY });
  const dark = darkQ.matches;
  // Timeline route: local movement as a solid glowing line, long hops as dashed great-circle arcs.
  map.addLayer({
    id: 'route-glow', type: 'line', source: 'route', filter: ['!=', ['get', 'jump'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dark ? '#0a84ff' : '#007aff', 'line-opacity': dark ? .45 : .25, 'line-width': 10, 'line-blur': 7 },
  });
  map.addLayer({
    id: 'route', type: 'line', source: 'route', filter: ['!=', ['get', 'jump'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dark ? '#64d2ff' : '#007aff', 'line-width': 2.6, 'line-opacity': .95 },
  });
  map.addLayer({
    id: 'route-jump', type: 'line', source: 'route', filter: ['==', ['get', 'jump'], true],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': dark ? '#ffffff' : '#1d1d1f', 'line-opacity': .55, 'line-width': 1.8, 'line-dasharray': [0.5, 2.5] },
  });
  map.addLayer({
    id: 'glow', type: 'circle', source: 'spots',
    paint: {
      'circle-radius': glowRadius(dotScale), 'circle-color': colorExpr(S.metric), 'circle-blur': 1,
      'circle-opacity': dark ? .55 : .35, 'circle-color-transition': { duration: 700 }, 'circle-pitch-alignment': 'map',
    },
  });
  map.addLayer({
    id: 'ring', type: 'circle', source: 'sel',
    paint: { 'circle-radius': 20, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2.5, 'circle-stroke-color': dark ? '#fff' : '#1d1d1f', 'circle-stroke-opacity': 0 },
  });
  scheduleMarkers();
}

function glowRadius(k) {
  return ['*', k, ['interpolate', ['linear'], ['sqrt', ['get', 'n']], 1, 24, 4, 32, 16, 46]];
}

function spotsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: S.spots.map((s) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: { k: s.key, n: s.st.n, dl: s.st.dl ?? 0, ul: s.st.ul ?? 0, ping: s.st.ping ?? -1, pn: s.st.pn },
    })),
  };
}
function pushData() {
  const src = map && map.getSource('spots');
  if (src) src.setData(spotsGeoJSON());
  scheduleMarkers();
}

function setDotScale(k) {
  dotScale = k;
  if (map && map.getLayer('glow')) map.setPaintProperty('glow', 'circle-radius', glowRadius(k));
}
function animateDots(to, delay = 0, dur = 1100) {
  const from = dotScale, start = performance.now() + delay;
  if (reduceMotion) return setDotScale(to);
  const step = (now) => {
    const t = (now - start) / dur;
    if (t < 0) return requestAnimationFrame(step);
    setDotScale(from + (to - from) * (to > from ? springEase(t) : easeOutExpo(t)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── Photos-style markers ──────────────────────────────────────
   Every visible cluster or spot is a rounded tile with a white rim, a tail pointing
   at the location and a count badge — the clustered source decides what merges. */
const markers = new Map();
let shownMarkers = new Map(), markerRAF = 0;
// Rebuilding the marker set queries the clustered source, so while the camera moves do it at most
// every 120 ms; MapLibre keeps the existing markers glued to the map in between.
let markerAt = 0, markerTimer = 0;
function scheduleMarkers() {
  if (markerRAF || markerTimer) return;
  const wait = 120 - (performance.now() - markerAt);
  if (wait > 0) { markerTimer = setTimeout(() => { markerTimer = 0; scheduleMarkers(); }, wait); return; }
  markerRAF = requestAnimationFrame(() => { markerRAF = 0; markerAt = performance.now(); updateMarkers(); });
}

function featureValue(p, m) {
  if (!p.cluster) return m === 'ping' ? (p.ping >= 0 ? p.ping : null) : p[m];
  if (m === 'ping') return p.pn > 0 ? p.pingw / p.pn : null;
  return p[m + 'w'] / p.n;
}

function updateMarkers() {
  if (!map || S.view !== 'dash' || !map.getSource('spots')) { clearMarkers(); return; }
  const next = new Map();
  for (const f of map.querySourceFeatures('spots')) {
    const p = f.properties;
    const id = p.cluster ? `c${p.cluster_id}` : `s${p.k}`;
    if (next.has(id)) continue;
    let m = markers.get(id);
    if (!m) { m = makeMarker(id); markers.set(id, m); }
    paintMarker(m, p, f.geometry.coordinates);
    next.set(id, m);
    if (!shownMarkers.has(id)) { clearTimeout(m.rm); m.el.classList.remove('out'); m.mk.addTo(map); }
  }
  for (const [id, m] of shownMarkers) if (!next.has(id)) retireMarker(m);
  shownMarkers = next;
  placeLabels();
}

/* Like Apple Maps, captions never pile up: larger markers claim their caption first, and a caption that
   would overlap another marker or an already placed caption is hidden. */
function placeLabels() {
  const list = [...shownMarkers.values()].map((m) => {
    const pt = map.project(m.coords), s = parseFloat(m.el.style.getPropertyValue('--s')) || 36;
    return { m, x: pt.x, y: pt.y, s, n: m.p.n };
  }).sort((a, b) => (b.m.id === S.selMarker) - (a.m.id === S.selMarker) || b.n - a.n);
  const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const circles = list.map((o) => ({ l: o.x - o.s / 2, r: o.x + o.s / 2, t: o.y - o.s / 2, b: o.y + o.s / 2 }));
  const placed = [];
  list.forEach((o, i) => {
    const w = Math.max(44, Math.min(120, (o.m.el.querySelector('.pm-label b').textContent.length || 3) * 12));
    const box = { l: o.x - w / 2, r: o.x + w / 2, t: o.y + o.s / 2 + 3, b: o.y + o.s / 2 + 31 };
    const ok = !placed.some((p) => hit(box, p)) && !circles.some((c, j) => j !== i && hit(box, c));
    o.m.el.classList.toggle('nolabel', !ok);
    if (ok) placed.push(box);
  });
  // With the WebGL Liquid Glass the panels are drawn inside the map canvas, beneath these HTML
  // markers, so a marker sliding under a panel would show through it — fade it out instead.
  const panes = document.documentElement.classList.contains('gl-live')
    ? [...document.querySelectorAll('.dash .gl-glass')].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 2)
    : [];
  const cr = map.getCanvas().getBoundingClientRect();
  for (const o of list) {
    const x = o.x + cr.left, y = o.y + cr.top;
    o.m.el.classList.toggle('under', panes.some((r) => x > r.left - o.s / 2 && x < r.right + o.s / 2 && y > r.top - o.s / 2 && y < r.bottom + o.s / 2));
  }
}
function retireMarker(m) {
  m.el.classList.add('out');
  clearTimeout(m.rm);
  m.rm = setTimeout(() => m.mk.remove(), 230);
}
function clearMarkers() {
  for (const m of shownMarkers.values()) retireMarker(m);
  shownMarkers = new Map();
}

function makeMarker(id) {
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'pm';
  el.innerHTML = '<span class="pm-in"><span class="pm-card"><b></b><small></small></span></span>'
    + '<span class="pm-dot"></span><span class="pm-label"><b></b><span></span></span>';
  const delay = Math.max(0, S.popAt - performance.now()) + Math.random() * 160;
  el.style.setProperty('--delay', `${delay | 0}ms`);
  const m = { id, el, key: '', mk: new maplibregl.Marker({ element: el, anchor: 'center' }) };
  el.addEventListener('click', (e) => { e.stopPropagation(); onMarkerClick(m); });
  el.addEventListener('mouseenter', () => showMarkerTip(m));
  el.addEventListener('mouseleave', hideTip);
  return m;
}

function paintMarker(m, p, coords) {
  m.p = p; m.coords = coords;
  const v = featureValue(p, S.metric);
  const key = `${S.metric}|${p.n}|${v}|${coords}`;
  if (key === m.key) return;
  m.key = key;
  m.mk.setLngLat(coords);
  const s = Math.round(Math.max(32, Math.min(46, 32 + 3.6 * Math.log2(p.n))));
  m.el.style.setProperty('--s', `${s}px`);
  m.el.style.setProperty('--c', colorFor(S.metric, v));
  m.el.style.zIndex = String(p.n);
  m.el.classList.toggle('on', S.selMarker === m.id);
  const card = m.el.querySelector('.pm-card');
  card.firstChild.textContent = fmt(v);
  card.lastChild.textContent = METRICS[S.metric].unit;
  // Apple-Maps-style caption under the marker: the place, then how many tests
  const label = m.el.querySelector('.pm-label');
  label.lastChild.textContent = tr('nTimes', { n: p.n });
  if (!p.cluster) label.firstChild.textContent = cityName(S.spotByKey.get(p.k)?.city || '');
  else leavesOf(m).then((spots) => { if (m.key === key) label.firstChild.textContent = topPlace(spots); });
  m.el.setAttribute('aria-label', tr('markerAria', { n: p.n, metric: METRICS[S.metric].name, v: fmt(v), unit: METRICS[S.metric].unit }));
}

async function leavesOf(m) {
  if (!m.p.cluster) { const s = S.spotByKey.get(m.p.k); return s ? [s] : []; }
  try {
    const leaves = await map.getSource('spots').getClusterLeaves(m.p.cluster_id, Infinity, 0);
    return leaves.map((l) => S.spotByKey.get(l.properties.k)).filter(Boolean);
  } catch { return []; }
}
const topPlace = (spots) => {
  const c = new Map();
  for (const s of spots) c.set(s.city, (c.get(s.city) || 0) + s.st.n);
  const names = [...c.entries()].sort((a, b) => b[1] - a[1]);
  return names.length ? cityName(names[0][0]) + (names.length > 1 ? tr('andMore') : '') : '';
};
const placeNames = (spots) => {
  const c = new Map();
  for (const s of spots) c.set(s.city, (c.get(s.city) || 0) + s.st.n);
  const names = [...c.entries()].sort((a, b) => b[1] - a[1]).map((x) => cityName(x[0]));
  return names.slice(0, 3).join(' · ') + (names.length > 3 ? tr('andMore') : '');
};

/* hover & click */
const tip = $('#tip');
let tipToken = 0;
async function showMarkerTip(m) {
  if (S.view !== 'dash' || isCompact()) return;
  const p = m.p, token = ++tipToken;
  const render = (title) => {
    if (token !== tipToken) return;
    tip.innerHTML = `<b>${esc(title)}</b>
      <div class="row"><span>${tr('tipTests')}</span><span>${tr('tipN', { n: p.n })}</span></div>
      <div class="row"><span>${METRICS.dl.name}</span><span>${fmt(featureValue(p, 'dl'))} Mbps</span></div>
      <div class="row"><span>${METRICS.ul.name}</span><span>${fmt(featureValue(p, 'ul'))} Mbps</span></div>
      <div class="row"><span>${METRICS.ping.name}</span><span>${fmt(featureValue(p, 'ping'))} ms</span></div>`;
    tip.hidden = false;
    const pt = map.project(m.coords), r = m.el.getBoundingClientRect();
    placeTip({ x: r.right - 6, y: pt.y - r.height + 8 });
  };
  render(p.cluster ? tr('nPlaces', { n: p.point_count }) : cityName(S.spotByKey.get(p.k)?.city || ''));
  if (p.cluster) render(placeNames(await leavesOf(m)));
}
function placeTip(pt) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = pt.x + 8, y = pt.y - h;
  if (x + w > innerWidth - 12) x = pt.x - w - 60;
  if (y < 12) y = 12;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tipToken++; tip.hidden = true; }

/* Like tapping a pile in Photos: open everything inside it, and zoom until it splits apart. */
async function onMarkerClick(m) {
  if (S.view !== 'dash') return;
  hideTip(); stopPlay();
  const spots = await leavesOf(m);
  if (!spots.length) return;
  selectMarker(m.id);
  const tests = spots.flatMap((s) => s.tests).sort((a, b) => b.ts - a.ts);
  const single = spots.length === 1 ? spots[0] : null;
  openDetail({
    ...(single ? { city: single.city } : { spots }),
    tests, center: m.coords,
  });
  if (single) map.easeTo({ center: m.coords, duration: 900, easing: easeOutExpo, padding: camPadding() });
  else fit(spots, { maxZoom: 15, duration: 1300, easing: easeOutExpo });
}

/* selection ring pulse */
let pulseRAF = 0;
function pulse(lngLat) {
  cancelAnimationFrame(pulseRAF);
  const src = map && map.getSource('sel'); if (!src) return;
  if (!lngLat) { src.setData(EMPTY); return; }
  src.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: lngLat }, properties: {} });
  const t0 = performance.now();
  const step = (now) => {
    const p = ((now - t0) % 1800) / 1800, e = easeOutExpo(p);
    map.setPaintProperty('ring', 'circle-radius', 10 + e * 30);
    map.setPaintProperty('ring', 'circle-stroke-opacity', (1 - p) * .8);
    pulseRAF = requestAnimationFrame(step);
  };
  pulseRAF = requestAnimationFrame(step);
}

function uiPadding() {
  if (isCompact()) return { top: 190, bottom: 200, left: 40, right: 40 };
  return { top: 130, bottom: 90, left: 410, right: S.sel ? 460 : 90 };
}
function camPadding() { const p = uiPadding(); return { ...p, bottom: p.bottom + EXTRA() }; }
const mercX = (lon) => (lon + 180) / 360;
const mercY = (lat) => (1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2;
const unMercY = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
function fit(list, opts = {}) {
  if (!map || !list.length) return;
  const p = uiPadding();
  const xs = list.map((s) => mercX(s.lon)), ys = list.map((s) => mercY(s.lat));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const bw = Math.max(80, innerWidth - p.left - p.right), bh = Math.max(80, innerHeight - p.top - p.bottom);
  const maxZoom = opts.maxZoom ?? 12.5;
  let zoom = Math.log2(Math.min(bw / Math.max(1e-9, (x1 - x0) * 512), bh / Math.max(1e-9, (y1 - y0) * 512)));
  zoom = Math.max(0.8, Math.min(maxZoom, zoom));
  const center = [((x0 + x1) / 2) * 360 - 180, unMercY((y0 + y1) / 2)];
  map.flyTo({
    center, zoom, padding: camPadding(), pitch: opts.pitch ?? 0, bearing: 0,
    duration: reduceMotion ? 0 : opts.duration ?? 1800, easing: opts.easing ?? easeInOutQuint, essential: true,
  });
}
/* Densest neighbourhood: the city with most tests, plus anything within ~250 km of it. */
function homeSpots() {
  const by = new Map();
  for (const s of S.spots) by.set(s.city, (by.get(s.city) || 0) + s.st.n);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return S.spots;
  const core = S.spots.filter((s) => s.city === top[0]);
  const n = core.reduce((a, s) => a + s.st.n, 0);
  const lat = core.reduce((a, s) => a + s.lat * s.st.n, 0) / n, lon = core.reduce((a, s) => a + s.lon * s.st.n, 0) / n;
  return S.spots.filter((s) => Math.hypot(s.lat - lat, (s.lon - lon) * Math.cos((lat * Math.PI) / 180)) < 2.3);
}

/* ════════════════════════════════════════════════════════════
   Timeline — stays, moves, route and playback
   ════════════════════════════════════════════════════════════ */
const DAY = 864e5;
function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/* A "stay" is a run of tests in one city with no gap longer than three days. */
function stays(tests) {
  const asc = tests.filter((t) => t.ts).sort((a, b) => a.ts - b.ts);
  const out = []; let cur = null;
  for (const t of asc) {
    if (cur && cur.city === t.city && t.ts - cur.to < 3 * DAY) { cur.tests.push(t); cur.to = t.ts; }
    else { cur = { city: t.city, from: t.ts, to: t.ts, tests: [t] }; out.push(cur); }
  }
  return out;
}
/* Ordered route points (one per change of location), each tagged with the stay it belongs to. */
function routePoints(segs) {
  const pts = []; let prevLon = null;
  segs.forEach((seg, si) => {
    for (const t of seg.tests) {
      const last = pts[pts.length - 1];
      if (last && last.key === t.key) { last.seg = si; continue; }
      let lon = t.lon;
      if (prevLon != null) { while (lon - prevLon > 180) lon -= 360; while (prevLon - lon > 180) lon += 360; }
      prevLon = lon;
      pts.push({ key: t.key, lon, lat: t.lat, seg: si, jump: !!last && km(last, t) > 300 });
    }
  });
  return pts;
}
function arc(a, b, n = 64) {
  const r = Math.PI / 180, toV = (p) => [Math.cos(p.lat * r) * Math.cos(p.lon * r), Math.cos(p.lat * r) * Math.sin(p.lon * r), Math.sin(p.lat * r)];
  const A = toV(a), B = toV(b);
  const d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
  if (d < 1e-6) return [[a.lon, a.lat], [b.lon, b.lat]];
  const out = []; let prev = a.lon;
  for (let i = 0; i <= n; i++) {
    const f = i / n, s1 = Math.sin((1 - f) * d) / Math.sin(d), s2 = Math.sin(f * d) / Math.sin(d);
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2];
    let lon = Math.atan2(y, x) / r;
    while (lon - prev > 180) lon -= 360; while (prev - lon > 180) lon += 360;
    prev = lon;
    out.push([lon, Math.atan2(z, Math.hypot(x, y)) / r]);
  }
  return out;
}
/* Route drawn up to a fractional point index — lets the line grow smoothly. */
function routeGeo(pts, upto) {
  const feats = [];
  if (pts.length < 2 || upto <= 0) return { type: 'FeatureCollection', features: feats };
  let run = [[pts[0].lon, pts[0].lat]];
  const flush = () => { if (run.length > 1) feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: run } }); };
  const end = Math.min(upto, pts.length - 1);
  for (let j = 1; j <= Math.ceil(end); j++) {
    const a = pts[j - 1], b = pts[j], f = Math.min(1, end - (j - 1));
    if (b.jump) {
      flush();
      const full = arc(a, b);
      const part = full.slice(0, Math.max(2, Math.round((full.length - 1) * f) + 1));
      feats.push({ type: 'Feature', properties: { jump: true }, geometry: { type: 'LineString', coordinates: part } });
      run = [part[part.length - 1]];
    } else {
      run.push(f < 1 ? [a.lon + (b.lon - a.lon) * f, a.lat + (b.lat - a.lat) * f] : [b.lon, b.lat]);
    }
  }
  flush();
  return { type: 'FeatureCollection', features: feats };
}
let routeAnim = 0;
function setRoute(upto) {
  S.routeUpto = upto;
  S.routeData = routeGeo(S.route || [], upto);
  const src = map && map.getSource('route');
  if (src) src.setData(S.routeData);
}
function animateRoute(to, dur = 1600) {
  cancelAnimationFrame(routeAnim);
  const from = S.routeUpto || 0;
  if (reduceMotion || dur <= 0) return Promise.resolve(setRoute(to));
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      setRoute(from + (to - from) * easeInOutQuint(t));
      if (t < 1) routeAnim = requestAnimationFrame(step); else res();
    };
    routeAnim = requestAnimationFrame(step);
  });
}
function clearRoute() { cancelAnimationFrame(routeAnim); S.route = []; setRoute(0); }

/* ════════════════════════════════════════════════════════════
   Dashboard rendering
   ════════════════════════════════════════════════════════════ */
function refilter(opts = {}) {
  const ds = S.ds;
  const inPeriod = S.tab === 'timeline'
    ? (t) => t.ts && t.year === S.tl.year && (S.tl.month == null || new Date(t.ts).getMonth() === S.tl.month)
    : (t) => S.years.has(t.year);
  S.tests = ds.tests.filter((t) => S.types.has(t.type) && inPeriod(t));
  const m = new Map();
  for (const t of S.tests) {
    let s = m.get(t.key);
    if (!s) { s = { key: t.key, lat: t.lat, lon: t.lon, city: t.city, tests: [] }; m.set(t.key, s); }
    s.tests.push(t);
  }
  S.spots = [...m.values()];
  S.spotByKey = m;
  for (const s of S.spots) s.st = stats(s.tests);
  pushData();
  if (S.tab === 'timeline') {
    S.route = routePoints(stays(S.tests));
    if (opts.animateRoute) { setRoute(0); animateRoute(S.route.length - 1, 1800); }
    else setRoute(S.route.length - 1);
  }
  renderPanel();
  if (S.sel) {
    const keep = new Set(S.tests);
    const left = S.sel.tests.filter((t) => keep.has(t));
    if (left.length) renderDetail({ ...S.sel, shown: left }); else closeDetail();
  }
}

function countUp(el, to, digits) {
  const from = el._v ?? 0; el._v = to;
  if (to == null) { el.textContent = '–'; el._v = 0; return; }
  const f = digits ?? ((v) => fmt(v));
  if (reduceMotion) { el.textContent = f(to); return; }
  const t0 = performance.now(), dur = 1100;
  cancelAnimationFrame(el._raf);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el.textContent = f(from + (to - from) * easeOutExpo(t));
    if (t < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}

function renderPanel() {
  const M = METRICS[S.metric], st = stats(S.tests);
  $('#heroLabel').textContent = tr(`median.${S.metric}`);
  $('#heroUnit').textContent = M.unit;
  countUp($('#heroVal'), st[S.metric]);

  const others = Object.keys(METRICS).filter((k) => k !== S.metric);
  const kp = $('#kpis');
  if (!kp.children.length) kp.innerHTML = '<div><b><span class="num"></span><small></small></b><span></span></div>'.repeat(4);
  const tiles = [
    ...others.map((k) => ({ v: st[k], unit: METRICS[k].unit, label: tr(`median.${k}`) })),
    { v: st.n, unit: tr('kpi.testsUnit'), label: tr('kpi.tests'), int: true },
    { v: S.spots.length, unit: tr('kpi.placesUnit'), label: tr('kpi.places'), int: true },
  ];
  tiles.forEach((t, i) => {
    const d = kp.children[i], b = d.firstChild;
    countUp(b.firstChild, t.v, t.int ? (v) => Math.round(v).toLocaleString('en-US') : undefined);
    b.lastChild.textContent = t.unit;
    d.lastChild.textContent = t.label;
  });

  // network bars — honour year filter, show every type so it can be compared
  const byYear = S.ds.tests.filter((t) => S.years.has(t.year));
  const types = typeList();
  const rows = types.map((ty) => {
    const l = byYear.filter((t) => t.type === ty); return { ty, st: stats(l), on: S.types.has(ty) };
  }).filter((r) => r.st.n);
  const max = Math.max(1, ...rows.map((r) => r.st[S.metric] || 0));
  $('#netBars').innerHTML = rows.map((r) => {
    const v = r.st[S.metric];
    const p = M.invert ? (v ? Math.max(6, (Math.min(...rows.map((x) => x.st.ping || Infinity)) / v) * 100) : 0) : ((v || 0) / max) * 100;
    return `<div class="bar-row" style="--c:${typeColor(r.ty)};opacity:${r.on ? 1 : .4}">
      <span class="lbl"><i></i>${esc(typeName(r.ty))}<small>${tr('nTimes', { n: r.st.n })}</small></span>
      <span class="val">${fmt(v)}<small>${M.unit}</small></span>
      <span class="track"><i style="--p:0%" data-p="${p.toFixed(1)}%"></i></span>
      <span class="sub">↓ ${fmt(r.st.dl)} · ↑ ${fmt(r.st.ul)} Mbps · ${fmt(r.st.ping)} ms</span>
    </div>`;
  }).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('#netBars .track i').forEach((i) => i.style.setProperty('--p', i.dataset.p));
  }));

  renderCities();
  renderChips();
  renderFoot();
  if (S.tab === 'timeline') renderTimeline();
}

function renderCities() {
  const M = METRICS[S.metric];
  const by = new Map();
  for (const t of S.tests) { let c = by.get(t.city); if (!c) by.set(t.city, (c = [])); c.push(t); }
  const list = [...by.entries()].map(([name, tests]) => ({ name, tests, n: tests.length, v: median(tests.map((t) => metricOf(t, S.metric)).filter((x) => x != null)) }))
    .sort((a, b) => b.n - a.n);
  const shown = S.citiesAll ? list : list.slice(0, 8);
  const vmax = Math.max(1, ...list.map((c) => c.v || 0));
  const vmin = Math.min(...list.map((c) => c.v || Infinity));
  const el = $('#cities');
  el.innerHTML = shown.map((c, i) => {
    const p = M.invert ? (c.v ? (vmin / c.v) * 100 : 0) : ((c.v || 0) / vmax) * 100;
    return `<li><button type="button" class="city" data-city="${esc(c.name)}">
      <span class="rk">${i + 1}</span>
      <span class="nm">${esc(cityName(c.name))}<small>${tr('nTimes', { n: c.n })}</small></span>
      <span class="v">${fmt(c.v)}</span>
      <span class="mini"><i style="--p:${p.toFixed(1)}%;--c:${colorFor(S.metric, c.v)}"></i></span>
    </button></li>`;
  }).join('') + (list.length > 8 ? `<li><button type="button" class="more" id="moreCities">${S.citiesAll ? tr('showLess') : tr('showAllN', { n: list.length })}</button></li>` : '');
  el._list = list;
}

function typeList() {
  const c = new Map();
  for (const t of S.ds.tests) c.set(t.type, (c.get(t.type) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
}
function renderChips() {
  const tc = new Map(), yc = new Map();
  for (const t of S.ds.tests) { tc.set(t.type, (tc.get(t.type) || 0) + 1); yc.set(t.year, (yc.get(t.year) || 0) + 1); }
  $('#types').innerHTML = typeList().map((ty) =>
    `<button type="button" class="chip" data-type="${esc(ty)}" aria-pressed="${S.types.has(ty)}" style="--c:${typeColor(ty)}"><i></i>${esc(typeName(ty))}<small>${tc.get(ty)}</small></button>`).join('');
  $('#years').innerHTML = [...yc.keys()].sort().map((y) =>
    `<button type="button" class="chip" data-year="${y}" aria-pressed="${S.years.has(y)}">${y || tr('unknown')}<small>${yc.get(y)}</small></button>`).join('');
}
function renderFoot() {
  const bits = [tr('foot.city')];
  if (S.ds.noPing) bits.push(tr('foot.noPing', { n: S.ds.noPing }));
  if (S.ds.noGeo) bits.push(tr('foot.noGeo', { n: S.ds.noGeo }));
  if (S.mode === 'shared') bits.push(tr('foot.shared'));
  if (S.mode === 'shared' && S.expires) bits.push(tr('foot.expires', { t: fmtWhen(Date.parse(S.expires)) }));
  $('#foot').textContent = bits.join(tr('sentenceGap'));
}

function renderLegend() {
  const M = METRICS[S.metric], st = colorStops(S.metric);
  const lo = st[0][0], hi = st[st.length - 1][0];
  const grad = st.map(([v, c]) => `${c} ${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`).join(', ');
  $('#legend').innerHTML = `<b>${esc(tr('legend', { m: M.name, unit: M.unit }))}</b>
    <div class="ramp" style="--ramp:linear-gradient(90deg, ${grad})"></div>
    <div class="ticks">${st.map(([v], i) => `<span>${i === 0 ? '≤' : i === st.length - 1 ? '≥' : ''}${v}</span>`).join('')}</div>`;
}

function positionPill() {
  const seg = $('#metric'), btn = seg.querySelector('[aria-selected="true"]'), pill = seg.querySelector('.seg-pill');
  pill.style.setProperty('--x', btn.offsetLeft + 'px');
  pill.style.setProperty('--w', btn.offsetWidth + 'px');
  const [a, b] = METRICS[S.metric].pill;
  seg.style.setProperty('--pill-a', a); seg.style.setProperty('--pill-b', b);
}

function setMetric(m) {
  if (m === S.metric) return;
  S.metric = m;
  document.querySelectorAll('#metric button').forEach((b) => b.setAttribute('aria-selected', b.dataset.m === m));
  positionPill();
  if (map && map.getLayer('glow')) map.setPaintProperty('glow', 'circle-color', colorExpr(m));
  scheduleMarkers();
  renderLegend(); renderPanel();
  if (S.sel) renderDetail(S.sel);
}

function renderActions() {
  const a = $('#actions');
  const btn = (id, cls, icon, label) => `<button type="button" class="btn ${cls}" id="${id}">${icon}<span class="lbl">${label}</span></button>`;
  if (S.mode === 'local') a.innerHTML = btn('actNew', 'glass', ICON.plus, tr('act.new')) + btn('actShare', 'primary', ICON.share, tr('act.share'));
  else if (S.mode === 'demo') a.innerHTML = btn('actNew', 'primary', ICON.plus, tr('act.useMine'));
  else if (S.owner) a.innerHTML = btn('actDelete', 'glass', ICON.trash, tr('act.stop')) + btn('actCopy', 'primary', ICON.link, tr('act.copy'));
  else a.innerHTML = btn('actCopy', 'glass', ICON.link, tr('act.copy')) + btn('actNew', 'primary', ICON.plus, tr('act.makeMine'));
}

/* Detail card — a group names one city key ({ city }) or a set of spots ({ spots }) */
const groupTitle = (g) => (g.spots ? placeNames(g.spots) : cityName(g.city));
function openDetail(group) {
  S.sel = group;
  renderDetail(group);
  $('#detail').classList.add('show');
  pulse(group.center || null);
}
function selectMarker(id) {
  S.selMarker = id;
  for (const mk of shownMarkers.values()) mk.el.classList.toggle('on', mk.id === id);
}
function closeDetail() {
  selectMarker(null);
  if (!S.sel) return;
  S.sel = null;
  $('#detail').classList.remove('show');
  pulse(null);
}
function renderDetail(group) {
  const live = new Set(S.tests);
  const tests = group.shown || group.tests.filter((t) => live.has(t));
  const st = stats(tests);
  const ts = tests.map((t) => t.ts).filter(Boolean);
  const range = ts.length ? (Math.min(...ts) === Math.max(...ts) ? fmtDate(ts[0]) : `${fmtMonth(Math.min(...ts))} – ${fmtMonth(Math.max(...ts))}`) : '';
  const nSpots = new Set(tests.map((t) => t.key)).size;
  const M = METRICS[S.metric];

  // sparkline of the active metric over time
  const W = 360, H = 76, P = 6;
  const pts = tests.filter((t) => t.ts && metricOf(t, S.metric) != null);
  let spark = '';
  if (pts.length) {
    const t0 = Math.min(...pts.map((t) => t.ts)), t1 = Math.max(...pts.map((t) => t.ts));
    const vmax = Math.max(...pts.map((t) => metricOf(t, S.metric))) || 1;
    const x = (t) => (t1 === t0 ? W / 2 : P + ((t - t0) / (t1 - t0)) * (W - 2 * P));
    const y = (v) => H - 14 - (v / vmax) * (H - 14 - P);
    spark = `<div class="spark"><svg viewBox="0 0 ${W} ${H}" style="height:auto" aria-hidden="true">
      <line x1="${P}" x2="${W - P}" y1="${H - 13}" y2="${H - 13}" stroke="currentColor" stroke-opacity=".12"/>
      ${pts.slice(0, 400).map((t, i) => `<circle cx="${x(t.ts).toFixed(1)}" cy="${y(metricOf(t, S.metric)).toFixed(1)}" r="3.2" fill="${typeColor(t.type)}" fill-opacity=".85" style="animation-delay:${Math.min(i, 60) * 12}ms"/>`).join('')}
      <text class="axis" x="${P}" y="${H - 1}">${fmtMonth(t0)}</text>
      <text class="axis" x="${W - P}" y="${H - 1}" text-anchor="end">${fmtMonth(t1)}</text>
      <text class="axis" x="${W - P}" y="10" text-anchor="end">${fmt(vmax)} ${M.unit}</text>
    </svg></div>`;
  }

  // Photos-style grid grouped under month headers; every card carries all three measurements,
  // with the one the map is coloured by drawn largest.
  const cap = 240;
  let lastMonth = '';
  const cell = (k, val, pre, post) =>
    `<span class="m${k === S.metric ? ' on' : ''}">${pre ? `<small>${pre}</small>` : ''}<b class="num">${fmt(val)}</b>${post ? `<small>${post}</small>` : ''}</span>`;
  const grid = tests.slice(0, cap).map((t, i) => {
    const d = t.ts ? new Date(t.ts) : null;
    const mk = d ? monthHead(d.getFullYear(), d.getMonth()) : tr('noTime');
    const head = mk !== lastMonth ? `<h4 class="mh">${mk}</h4>` : '';
    lastMonth = mk;
    const v = metricOf(t, S.metric);
    const srv = (t.server || tr('noServer')) + (nSpots > 1 ? ` · ${cityName(t.city)}` : '');
    return head + `<div class="tile" style="--c:${colorFor(S.metric, v)};--tc:${typeColor(t.type)};--i:${Math.min(i, 30)}">
      <span class="tt"><i></i>${esc(typeName(t.type))}<em>${d ? `${tr('day', { d: d.getDate() })} ${pad(d.getHours())}:${pad(d.getMinutes())}` : ''}</em></span>
      <span class="tv">${cell('dl', t.dl, '↓')}${cell('ul', t.ul, '↑')}${cell('ping', t.ping, '', 'ms')}</span>
      <span class="srv" title="${esc(srv)}">${esc(srv)}</span>
    </div>`;
  }).join('');
  $('#detail').innerHTML = `
    <header>
      <div><h3>${esc(groupTitle(group))}</h3><p>${tr('nTests', { n: tests.length })}${nSpots > 1 ? ` · ${tr('nPlaces', { n: nSpots })}` : ''}${range ? ` · ${range}` : ''}</p></div>
      <button type="button" class="close" id="closeDetail" aria-label="${esc(tr('close'))}">${ICON.close}</button>
    </header>
    <div class="dkpis">
      ${['dl', 'ul', 'ping'].map((k) => `<div><b style="color:${k === S.metric ? colorFor(k, st[k]) : 'inherit'}">${fmt(st[k])}</b><span>${METRICS[k].name} ${METRICS[k].unit}</span></div>`).join('')}
    </div>
    ${spark}
    <div class="tests grid">
      ${grid}
      ${tests.length > cap ? `<p class="foot more-note">${esc(tr('moreNote', { n: tests.length - cap }))}</p>` : ''}
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   Timeline panel
   ════════════════════════════════════════════════════════════ */
const tlYears = () => [...new Set(S.ds.tests.filter((t) => t.ts).map((t) => t.year))].sort((a, b) => a - b);
const fmtMD = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}.${d.getDate()}`; };
const fmtKm = (d) => `${Math.round(d).toLocaleString('en-US')} km`;
const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

function renderTimeline() {
  const years = tlYears(), y = S.tl.year, mo = S.tl.month, M = METRICS[S.metric];
  const months = Array(12).fill(0);
  for (const t of S.ds.tests) if (t.ts && t.year === y && S.types.has(t.type)) months[new Date(t.ts).getMonth()]++;
  const mmax = Math.max(1, ...months);
  const segs = stays(S.tests); S.segs = segs;
  let dist = 0;
  for (let i = 1; i < S.route.length; i++) dist += km(S.route[i - 1], S.route[i]);
  const cities = new Set(S.tests.map((t) => t.city)).size;
  const yi = years.indexOf(y);

  let list = '';
  segs.forEach((g, i) => {
    if (i) {
      const d = km(segs[i - 1].tests[segs[i - 1].tests.length - 1], g.tests[0]);
      if (d >= 20) list += `<li class="move"><span class="mi">${d > 400 ? ICON.plane : ICON.car}</span><span>${fmtKm(d)}</span></li>`;
    }
    const v = median(g.tests.map((t) => metricOf(t, S.metric)).filter((x) => x != null));
    const days = Math.round((dayStart(g.to) - dayStart(g.from)) / DAY) + 1;
    list += `<li><button type="button" class="stay" data-seg="${i}" style="--c:${colorFor(S.metric, v)};--i:${Math.min(i, 24)}">
      <span class="node"></span>
      <span class="st-main"><b>${esc(cityName(g.city))}</b><span>${fmtMD(g.from)}${days > 1 ? ` – ${fmtMD(g.to)} · ${tr('nDays', { n: days })}` : ''} · ${tr('nTimes', { n: g.tests.length })}</span></span>
      <span class="st-v num">${fmt(v)}<small>${M.unit}</small></span>
    </button></li>`;
  });

  $('#tl').innerHTML = `
    <div class="tl-head">
      <button type="button" class="tl-nav" data-dy="-1" ${yi <= 0 ? 'disabled' : ''} aria-label="${esc(tr('prevYear'))}">‹</button>
      <div class="tl-title"><b class="num">${mo != null ? monthHead(y, mo) : tr('yearHead', { y })}</b>
        <span>${tr('nTests', { n: S.tests.length })} · ${tr('nCities', { n: cities })}${dist >= 1 ? ` · ${tr('moved', { d: fmtKm(dist) })}` : ''}</span></div>
      <button type="button" class="tl-nav" data-dy="1" ${yi >= years.length - 1 ? 'disabled' : ''} aria-label="${esc(tr('nextYear'))}">›</button>
    </div>
    <div class="months" role="group" aria-label="${esc(tr('monthsAria'))}">${months.map((c, i) =>
      `<button type="button" data-mo="${i}" aria-pressed="${mo === i}" ${c ? '' : 'disabled'} title="${esc(tr('monthTip', { m: i + 1, M: I18N.month(i), n: c }))}"><i style="--h:${((c / mmax) * 100).toFixed(0)}%"></i><span>${i + 1}</span></button>`).join('')}</div>
    <button type="button" class="btn play-btn" id="playBtn" ${segs.length ? '' : 'disabled'}></button>
    <ol class="stays">${list || `<li class="empty">${esc(tr('tlEmpty'))}</li>`}</ol>`;
  updatePlayBtn();
}
function updatePlayBtn() {
  const b = $('#playBtn'); if (!b) return;
  b.classList.toggle('on', !!S.playing);
  b.innerHTML = S.playing ? `${ICON.stop}${esc(tr('stopPlay'))}` : `${ICON.play}${esc(tr(S.tl.month != null ? 'playMonth' : 'playYear'))}`;
}
function markStay(i) {
  document.querySelectorAll('#tl .stay').forEach((b) => b.classList.toggle('on', +b.dataset.seg === i));
  if (i >= 0) document.querySelector(`#tl .stay[data-seg="${i}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}
function positionTabs() {
  const tabs = $('#tabs'), btn = tabs.querySelector('[aria-selected="true"]'), pill = tabs.querySelector('.tabs-pill');
  pill.style.setProperty('--x', btn.offsetLeft + 'px');
  pill.style.setProperty('--w', btn.offsetWidth + 'px');
}
function setTab(tab) {
  if (tab === S.tab) return;
  if (tab === 'timeline' && !tlYears().length) { toast(tr('noTimeData')); return; }
  stopPlay(); closeDetail();
  S.tab = tab;
  document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
  positionTabs();
  $('#ov').hidden = tab !== 'overview';
  $('#tl').hidden = tab !== 'timeline';
  if (tab === 'timeline') {
    const ys = tlYears();
    if (!ys.includes(S.tl.year)) S.tl.year = ys[ys.length - 1];
    S.tl.month = null;
    refilter({ animateRoute: true });
    fit(S.tests, { duration: 1800 });
  } else {
    clearRoute();
    refilter();
    fit(homeSpots(), { duration: 1800, maxZoom: 11 });
  }
}
function setPeriod(year, month) {
  stopPlay(); closeDetail();
  S.tl.year = year; S.tl.month = month;
  refilter({ animateRoute: true });
  fit(S.tests, { duration: 1600 });
}

/* Playback: walk through the stays in order — the camera flies to each one while the route grows behind it. */
let playToken = 0;
async function startPlay() {
  const segs = S.segs || [];
  if (!segs.length || !map) return;
  const token = ++playToken;
  S.playing = true; updatePlayBtn();
  closeDetail(); hideTip();
  if (isCompact()) $('#panel').classList.remove('expanded');
  const lastIdx = [];
  S.route.forEach((p, i) => { lastIdx[p.seg] = i; });
  cancelAnimationFrame(routeAnim); setRoute(0);
  const dwell = Math.max(900, Math.min(2000, 32000 / segs.length));
  const chip = $('#playChip');
  chip.classList.add('show');
  for (let i = 0; i < segs.length; i++) {
    if (token !== playToken) return;
    const g = segs[i];
    $('#pcDate').textContent = fmtDate(g.from) + (dayStart(g.to) > dayStart(g.from) ? ` – ${fmtMD(g.to)}` : '');
    S.playSeg = i;
    $('#pcCity').textContent = cityName(g.city);
    chip.classList.remove('tick'); void chip.offsetWidth; chip.classList.add('tick');
    markStay(i);
    const prev = i ? segs[i - 1].tests[segs[i - 1].tests.length - 1] : null;
    const travel = prev && km(prev, g.tests[0]) > 300 ? dwell * 1.5 : dwell * .8;
    fit(g.tests, { maxZoom: 12, duration: travel });
    await animateRoute(lastIdx[i] ?? S.routeUpto, travel * .9);
    if (token !== playToken) return;
    await sleep(dwell * .55);
  }
  if (token !== playToken) return;
  stopPlay();
  fit(S.tests, { duration: 2000 });
}
function stopPlay() {
  if (!S.playing) return;
  playToken++; S.playing = false;
  cancelAnimationFrame(routeAnim);
  $('#playChip').classList.remove('show');
  markStay(-1);
  if (S.tab === 'timeline') setRoute(S.route.length - 1);
  updatePlayBtn();
}

/* ════════════════════════════════════════════════════════════
   View transitions
   ════════════════════════════════════════════════════════════ */
function enterDash(ds, opts) {
  S.ds = ds; S.mode = opts.mode; S.shareId = opts.id || null; S.owner = !!opts.owner; S.sharedAt = opts.created || null; S.expires = opts.expires || null;
  S.types = new Set(ds.tests.map((t) => t.type));
  S.years = new Set(ds.tests.map((t) => t.year));
  S.sel = null; S.citiesAll = false; S.metric = 'dl';
  S.tab = 'overview'; S.tl = { year: null, month: null }; S.route = []; S.routeUpto = 0; S.routeData = null;
  S.popAt = performance.now() + (reduceMotion ? 0 : 1500);
  document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === 'overview'));
  $('#ov').hidden = false; $('#tl').hidden = true;
  document.querySelectorAll('#metric button').forEach((b) => b.setAttribute('aria-selected', b.dataset.m === 'dl'));
  $('#detail').classList.remove('show');
  $('#panel').classList.remove('expanded');
  $('#heroVal')._v = 0;

  renderActions(); renderLegend();
  setDotScale(0);
  refilter();
  S.view = 'dash'; body.dataset.view = 'dash';
  renderHead();
  setInteractive(true);
  $('#dash').setAttribute('aria-hidden', 'false');
  positionPill(); positionTabs();
  requestAnimationFrame(() => { positionPill(); positionTabs(); });
  setRoute(0);

  if (map) {
    map.stop();
    const target = homeSpots();
    fit(target, { duration: 3400, maxZoom: 11, pitch: 0 });
    animateDots(1, reduceMotion ? 0 : 1300, 1200);
  }
}

const dsName = (ds) => (ds.nameKey ? tr(ds.nameKey) : ds.name || tr('app'));
/* Title bar, subtitle and document title — derived from state so they can follow the language. */
function renderHead() {
  if (S.view !== 'dash' || !S.ds) { document.title = tr('app'); return; }
  const ds = S.ds, sum = summarize(ds);
  $('#dashTitle').textContent = dsName(ds);
  const when = sum.from ? (fmtMonth(sum.from) === fmtMonth(sum.to) ? fmtMonth(sum.from) : `${fmtMonth(sum.from)} – ${fmtMonth(sum.to)}`) : '';
  $('#dashSub').textContent = [tr(`mode.${S.mode}`), when].filter(Boolean).join(' · ');
  document.title = `${dsName(ds)} · ${tr('app')}`;
}

function exitDash() {
  if (S.view !== 'dash') return;
  S.view = 'landing'; body.dataset.view = 'landing';
  setInteractive(false);
  $('#dash').setAttribute('aria-hidden', 'true');
  stopPlay(); closeDetail(); hideTip(); clearRoute(); clearMarkers();
  renderHead();
  resetLanding();
  if (map) {
    animateDots(0, 0, 500);
    const c = map.getCenter();
    map.flyTo({ center: [c.lng, 20], zoom: landingZoom(), pitch: 0, bearing: 0, padding: landingPadding(), duration: reduceMotion ? 0 : 2600, easing: easeInOutQuint, essential: true });
  }
  setTimeout(() => { if (S.view === 'landing') { S.ds = null; S.spots = []; pushData(); } }, 900);
}

function resetLanding() {
  const l = $('#landing');
  l.classList.remove('is-loading'); $('#loading').hidden = true;
  $('#file').value = '';
}

/* ════════════════════════════════════════════════════════════
   Sheet
   ════════════════════════════════════════════════════════════ */
const sheet = $('#sheet'), scrim = $('#scrim'), sheetBody = $('#sheetBody');
let sheetLocked = false, sheetRender = null;
/* render returns the sheet's HTML; it is kept so an open sheet can be redrawn in another language */
function openSheet(render, { busy = false } = {}) {
  sheetRender = render;
  sheetBody.innerHTML = render();
  sheet.classList.toggle('busy', busy);
  sheetLocked = busy;
  if (sheet.hidden) {
    sheet.hidden = false; scrim.hidden = false;
    body.classList.add('sheet-open');
    requestAnimationFrame(() => requestAnimationFrame(() => { sheet.classList.add('open'); scrim.classList.add('open'); }));
  }
  setTimeout(() => sheetBody.querySelector('[data-autofocus]')?.focus({ preventScroll: true }), 60);
}
function closeSheet() {
  if (sheet.hidden) return;
  sheet.classList.remove('open'); scrim.classList.remove('open');
  body.classList.remove('sheet-open');
  setTimeout(() => { if (!sheet.classList.contains('open')) { sheet.hidden = true; scrim.hidden = true; } }, 600);
}

function showChoice(ds) {
  const s = summarize(ds);
  const when = s.from ? `${new Date(s.from).getFullYear()} – ${new Date(s.to).getFullYear()}` : '–';
  openSheet(() => `
    <div class="file-row">
      <span class="file-ico">CSV</span>
      <div><h3 id="sheetTitle">${esc(ds.name)}</h3><p>${esc(tr('parsedLocally', { kb: (ds.bytes / 1024).toFixed(0) }))}</p></div>
    </div>
    <div class="stat-strip">
      <div><b class="num">${s.n.toLocaleString('en-US')}</b><span>${tr('statTests', { n: s.n })}</span></div>
      <div><b class="num">${s.spots}</b><span>${tr('statPlaces', { n: s.spots })}</span></div>
      <div><b class="num" style="font-size:${when.length > 6 ? 19 : 24}px">${when}</b><span>${tr('statSpan')}</span></div>
    </div>
    <h4>${tr('nextQ')}</h4>
    <div class="choices">
      <button type="button" class="choice local" id="goLocal" data-autofocus>
        <span class="ci">${ICON.laptop}</span><b>${tr('localTitle')}</b><span>${tr('localDesc')}</span>
      </button>
      <button type="button" class="choice share" id="goShare">
        <span class="ci">${ICON.link}</span><b>${tr('shareTitle')}</b><span>${tr('shareDesc')}</span>
      </button>
    </div>
    <button type="button" class="cancel" id="sheetCancel" data-pick>${tr('pickAnother')}</button>`);
}

// Same limit as the Worker: shares are capped at 500 KB.
const MAX_CSV = 500 * 1024;
const byteLength = (s) => new Blob([s]).size;

async function doShare(ds) {
  if (byteLength(ds.publicCSV) > MAX_CSV) { showError(fail('err.shareTooBig')); return; }
  openSheet(() => `
    <div class="center">
      <h3 class="t" id="sheetTitle">${tr('sharingTitle')}</h3>
      <p class="s">${tr('sharingSub')}</p>
      <div class="progress"><i></i></div>
    </div>`, { busy: true });
  try {
    const [res] = await Promise.all([
      fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'X-File-Name': encodeURIComponent(ds.name) },
        body: ds.publicCSV,
      }),
      sleep(reduceMotion ? 0 : 1100),
    ]);
    const data = await res.json().catch(() => ({}));
    // The worker's error text is Chinese only; show our own message per status instead.
    if (!res.ok) throw res.status === 400 ? fail('err.notCsv') : res.status === 413 ? fail('err.tooBig') : fail('err.upload', { s: res.status });
    saveOwner(data.id, data.deleteToken);
    showDone(ds, data.id, data.expires);
  } catch (e) {
    showError(e.message === 'Failed to fetch' ? fail('err.offline') : e, ds);
  }
}

function shareUrl(id) { return `${location.origin}/s/${id}`; }

function showDone(ds, id, expires) {
  const url = shareUrl(id);
  const inDash = S.view === 'dash';
  openSheet(() => `
    <div class="center">
      <svg class="big-ico check" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="34"/><path d="M24 39.5l9.5 9.5L53 28"/></svg>
      <h3 class="t" id="sheetTitle">${tr('doneTitle')}</h3>
      <p class="s">${tr('doneSub')}</p>
    </div>
    <div class="link-field"><input id="shareUrl" value="${esc(url)}" readonly aria-label="${esc(tr('shareLink'))}"><button type="button" class="btn primary" id="copyUrl" data-autofocus>${ICON.copy}${tr('copy')}</button></div>
    <div class="btn-row">
      ${navigator.share ? `<button type="button" class="btn tonal" id="nativeShare">${ICON.share}${tr('nativeShare')}</button>` : ''}
      <button type="button" class="btn tonal" id="openShared">${ICON.map}${tr(inDash ? 'done' : 'openMap')}</button>
    </div>`);
  sheet._done = { ds, id, expires };
}

function showError(err, ds) {
  openSheet(() => `
    <div class="center">
      <h3 class="t" id="sheetTitle">${tr('errTitle')}</h3>
      <p class="s">${esc(msgOf(err))}</p>
    </div>
    <div class="btn-row">
      ${ds && S.view !== 'dash' ? `<button type="button" class="btn tonal" id="goLocal">${tr('localTitle')}</button>` : ''}
      ${ds ? `<button type="button" class="btn primary" id="retryShare" data-autofocus>${tr('retry')}</button>` : `<button type="button" class="btn primary" id="sheetCancel" data-autofocus>${tr('ok')}</button>`}
    </div>`);
}

/* owner tokens let the uploader stop sharing later from the same browser */
function owners() { try { return JSON.parse(localStorage.getItem('stm.owner') || '{}'); } catch { return {}; } }
function saveOwner(id, token) { try { const o = owners(); o[id] = token; localStorage.setItem('stm.owner', JSON.stringify(o)); } catch {} }
function dropOwner(id) { try { const o = owners(); delete o[id]; localStorage.setItem('stm.owner', JSON.stringify(o)); } catch {} }

/* ════════════════════════════════════════════════════════════
   Toast & clipboard
   ════════════════════════════════════════════════════════════ */
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast(tr('copied')); }
  catch {
    const i = document.createElement('input'); i.value = text; document.body.append(i); i.select();
    try { document.execCommand('copy'); toast(tr('copied')); } catch { toast(tr('copyFail')); }
    i.remove();
  }
}

/* ════════════════════════════════════════════════════════════
   File intake
   ════════════════════════════════════════════════════════════ */
async function handleFile(file) {
  if (!file) return;
  if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { toast(tr('pickCsv')); return; }
  if (file.size > MAX_CSV) { showError(fail('err.tooBig')); return; }
  try {
    const text = await file.text();
    const ds = readDataset(text, file.name);
    S.pending = ds;
    showChoice(ds);
  } catch (e) {
    showError(e && (e.key || e.message) ? e : fail('err.unreadable'));
  }
}

/* ════════════════════════════════════════════════════════════
   Routing
   ════════════════════════════════════════════════════════════ */
const shareIdFromPath = () => (location.pathname.match(/^\/s\/([A-Za-z0-9]{6,32})\/?$/) || [])[1];

let loadErr = null;
const renderLoading = () => { $('#loadingText').textContent = loadErr ? msgOf(loadErr) : tr('loadingShared'); };
async function loadShared(id) {
  const l = $('#landing');
  l.classList.add('is-loading'); $('#loading').hidden = false;
  loadErr = null; renderLoading();
  $('#loading').querySelector('.spinner').hidden = false;
  $('#loading').querySelectorAll('.btn').forEach((b) => b.remove());
  try {
    const [res] = await Promise.all([fetch(`/api/share/${id}`), sleep(reduceMotion ? 0 : 900)]);
    if (!res.ok) throw res.status === 404 ? fail('err.notFound') : res.status === 410 ? fail('err.expired') : fail('err.load', { s: res.status });
    const text = await res.text();
    let name = '';
    try { name = decodeURIComponent(res.headers.get('X-Share-Name') || ''); } catch {}
    const ds = readDataset(text, name);
    if (!ds.name) ds.nameKey = 'sharedName';
    enterDash(ds, { mode: 'shared', id, owner: !!owners()[id], created: res.headers.get('X-Share-Created'), expires: res.headers.get('X-Share-Expires') });
  } catch (e) {
    loadErr = e.message === 'Failed to fetch' ? fail('err.offlineShort') : e;
    renderLoading();
    $('#loading').querySelector('.spinner').hidden = true;
    const b = document.createElement('button');
    b.className = 'btn primary'; b.dataset.i18n = 'toHome'; b.textContent = tr('toHome');
    b.onclick = () => { history.pushState({}, '', '/'); resetLanding(); };
    $('#loading').append(b);
  }
}

function route() {
  const id = shareIdFromPath();
  if (id) { if (S.shareId !== id || S.view !== 'dash') loadShared(id); }
  else if (S.view === 'dash') exitDash();
  else resetLanding();
}

/* ════════════════════════════════════════════════════════════
   Events
   ════════════════════════════════════════════════════════════ */
$('#file').addEventListener('change', (e) => handleFile(e.target.files[0]));
function showHelp() {
  openSheet(() => `
    <h3 class="t" id="sheetTitle">${tr('helpBtn')}</h3>
    <ol class="steps">
      <li><span>${tr('help.1', { link: '<a href="https://www.speedtest.net/en/results" target="_blank" rel="noopener">speedtest.net/en/results</a>' })}</span></li>
      <li><span>${tr('help.2', { kbd: '<kbd>Export Results</kbd>' })}</span></li>
      <li><span>${tr('help.3')}</span></li>
    </ol>
    <h4 class="sub">${tr('privacy')}</h4>
    <ul class="privacy">
      <li>${tr('priv.1')}</li>
      <li>${tr('priv.2')}</li>
      <li>${tr('priv.3')}</li>
      <li>${tr('priv.4', { gh: '<a href="https://github.com/vhu231/speedtest-map" target="_blank" rel="noopener">GitHub</a>' })}</li>
    </ul>
    <div class="btn-row"><button type="button" class="btn primary" id="sheetCancel" data-autofocus>${tr('gotIt')}</button></div>`);
}
$('#help').addEventListener('click', showHelp);
$('#privacy').addEventListener('click', showHelp);
document.addEventListener('click', (e) => { if (e.target.closest('[data-help]')) showHelp(); });

$('#demo').addEventListener('click', () => {
  history.pushState({}, '', '/');
  enterDash(demoDataset(), { mode: 'demo' });
});

let dragDepth = 0;
const dropEl = $('#drop');
addEventListener('dragenter', (e) => { if (e.dataTransfer?.types?.includes('Files')) { dragDepth++; dropEl.classList.add('over'); } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dropEl.classList.remove('over'); } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; dropEl.classList.remove('over');
  const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f);
});

sheetBody.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const ds = S.pending;
  switch (b.id) {
    case 'goLocal':
      closeSheet(); history.pushState({}, '', '/');
      setTimeout(() => enterDash(ds, { mode: 'local' }), 180);
      break;
    case 'goShare': case 'retryShare': doShare(ds); break;
    case 'sheetCancel':
      closeSheet();
      if (S.view === 'landing') { $('#file').value = ''; if (b.hasAttribute('data-pick')) setTimeout(() => $('#file').click(), 350); }
      break;
    case 'copyUrl': copy($('#shareUrl').value); break;
    case 'nativeShare':
      navigator.share({ title: `${dsName(sheet._done.ds)} · ${tr('app')}`, url: shareUrl(sheet._done.id) }).catch(() => {});
      break;
    case 'openShared': {
      const { ds: d, id, expires } = sheet._done;
      closeSheet(); history.pushState({}, '', `/s/${id}`);
      if (S.view === 'dash' && S.ds === d) {
        S.mode = 'shared'; S.shareId = id; S.owner = true;
        renderHead(); renderActions(); renderFoot();
      } else setTimeout(() => enterDash(d, { mode: 'shared', id, owner: true, expires }), 180);
      break;
    }
  }
});
scrim.addEventListener('click', () => { if (!sheetLocked) closeSheet(); });

$('#metric').addEventListener('click', (e) => { const b = e.target.closest('button[data-m]'); if (b) setMetric(b.dataset.m); });
$('#types').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]'); if (!b) return;
  const t = b.dataset.type;
  if (S.types.has(t)) S.types.delete(t); else S.types.add(t);
  if (!S.types.size) S.types = new Set(typeList());
  refilter();
});
$('#years').addEventListener('click', (e) => {
  const b = e.target.closest('[data-year]'); if (!b) return;
  const y = +b.dataset.year;
  if (S.years.has(y)) S.years.delete(y); else S.years.add(y);
  if (!S.years.size) S.years = new Set(S.ds.tests.map((t) => t.year));
  refilter();
});
$('#cities').addEventListener('click', (e) => {
  if (e.target.closest('#moreCities')) { S.citiesAll = !S.citiesAll; renderCities(); return; }
  const b = e.target.closest('[data-city]'); if (!b) return;
  const c = $('#cities')._list.find((x) => x.name === b.dataset.city); if (!c) return;
  const spots = S.spots.filter((s) => s.city === c.name);
  const center = spots.length === 1 ? [spots[0].lon, spots[0].lat] : null;
  S.sel = { city: c.name, tests: c.tests, center };
  openDetail(S.sel);
  if (isCompact()) $('#panel').classList.remove('expanded');
  fit(spots, { maxZoom: 13, duration: 1600 });
});
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
$('#tl').addEventListener('click', (e) => {
  const nav = e.target.closest('[data-dy]');
  if (nav) { const ys = tlYears(), i = ys.indexOf(S.tl.year) + +nav.dataset.dy; if (ys[i] != null) setPeriod(ys[i], null); return; }
  const mo = e.target.closest('[data-mo]');
  if (mo) { const m = +mo.dataset.mo; setPeriod(S.tl.year, S.tl.month === m ? null : m); return; }
  if (e.target.closest('#playBtn')) { if (S.playing) stopPlay(); else startPlay(); return; }
  const st = e.target.closest('[data-seg]');
  if (st) {
    stopPlay();
    const g = S.segs[+st.dataset.seg]; if (!g) return;
    const keys = new Set(g.tests.map((t) => t.key));
    const one = keys.size === 1 ? g.tests[0] : null;
    openDetail({ city: g.city, tests: [...g.tests].reverse(), center: one ? [one.lon, one.lat] : null });
    markStay(+st.dataset.seg);
    if (isCompact()) $('#panel').classList.remove('expanded');
    fit(g.tests, { maxZoom: 13, duration: 1400 });
  }
});
$('#detail').addEventListener('click', (e) => { if (e.target.closest('#closeDetail')) closeDetail(); });
$('#handle').addEventListener('click', () => $('#panel').classList.toggle('expanded'));
$('#home').addEventListener('click', () => { history.pushState({}, '', '/'); exitDash(); });
$('#zin').addEventListener('click', () => map && map.zoomIn({ duration: 500, easing: easeOutExpo }));
$('#zout').addEventListener('click', () => map && map.zoomOut({ duration: 500, easing: easeOutExpo }));
$('#zall').addEventListener('click', () => fit(S.spots, { duration: 2200 }));

$('#actions').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'actShare') { S.pending = S.ds; doShare(S.ds); }
  if (b.id === 'actNew') { history.pushState({}, '', '/'); exitDash(); setTimeout(() => $('#file').click(), 700); }
  if (b.id === 'actCopy') copy(shareUrl(S.shareId));
  if (b.id === 'actDelete') {
    if (!confirm(tr('confirmStop'))) return;
    try {
      const res = await fetch(`/api/share/${S.shareId}`, { method: 'DELETE', headers: { 'X-Delete-Token': owners()[S.shareId] || '' } });
      if (!res.ok && res.status !== 404) throw fail('err.delete', { s: res.status });
      dropOwner(S.shareId);
      S.mode = 'local'; S.owner = false; S.shareId = null;
      history.replaceState({}, '', '/');
      renderHead(); renderActions(); renderFoot();
      toast(tr('stopped'));
    } catch (err) { toast(msgOf(err)); }
  }
});

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!sheet.hidden && !sheetLocked) closeSheet();
  else if (S.sel) closeDetail();
});
addEventListener('resize', () => {
  if (!map) return;
  if (S.view === 'dash') { positionPill(); positionTabs(); map.setPadding(camPadding()); }
  else { map.setPadding(landingPadding()); map.setZoom(landingZoom()); }
});
addEventListener('popstate', route);

/* Language switch (i18n.js has already redrawn static markup): redraw what was rendered from the dictionaries. */
addEventListener('langchange', () => {
  try { if (map) localizeLabels(); } catch {}
  renderHead(); hideTip();
  if (!sheet.hidden && sheetRender) sheetBody.innerHTML = sheetRender();
  if (!$('#loading').hidden) renderLoading();
  if (S.view !== 'dash' || !S.ds) return;
  renderActions(); renderLegend(); renderPanel();
  if (S.sel) renderDetail(S.sel);
  if (S.playing) {
    markStay(S.playSeg);
    const g = S.segs && S.segs[S.playSeg];
    if (g) $('#pcCity').textContent = cityName(g.city);
  }
  for (const m of markers.values()) m.key = '';
  scheduleMarkers();
  positionPill(); positionTabs();
  requestAnimationFrame(() => { positionPill(); positionTabs(); });
});

/* ════════════════════════════════════════════════════════════
   Boot
   ════════════════════════════════════════════════════════════ */
['.title', '.seg', '.actions', '.panel', '.legend', '.zoom'].forEach((sel, i) => {
  const el = document.querySelector(sel); if (el) { el.classList.add('enter'); el.style.setProperty('--d', i); }
});
initMap();
initStars();
route();
})();
