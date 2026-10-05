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

const ICON = {
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V3.5m0 0L8 7.5m4-4 4 4"/><path d="M8.5 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2Z"/><path d="M9 4.5v13M15 6.5v13"/></svg>',
  laptop: '<svg viewBox="0 0 24 24"><rect x="4.5" y="5" width="15" height="10.5" rx="1.8"/><path d="M2.5 19h19"/></svg>',
  close: '<svg viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8"/></svg>',
};

/* ════════════════════════════════════════════════════════════
   Data: CSV → tests
   ════════════════════════════════════════════════════════════ */
const TYPE_COLOR = { '5G': '#bf5af2', 'Wi-Fi': '#0a84ff', 'LTE': '#ff9f0a', '以太网': '#30d158', '3G': '#ff375f' };
const typeColor = (t) => TYPE_COLOR[t] || '#8e8e93';
function normType(s) {
  const k = (s || '').toLowerCase().replace(/[\s_-]/g, '');
  if (k === 'fiveg' || k === '5g' || k === 'nr' || k === '5gsa' || k === '5gnsa') return '5G';
  if (k === 'wifi' || k === 'wlan') return 'Wi-Fi';
  if (k === 'lte' || k === '4g' || k === 'fourg') return 'LTE';
  if (k === 'ethernet' || k === 'lan' || k === 'wired') return '以太网';
  if (k === '3g' || k === 'threeg' || k === 'umts' || k === 'hspa') return '3G';
  return (s || '').trim() || '未知';
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
  if (rows.length < 2) throw new Error('文件里没有测速记录');
  const h = rows[0].map((s) => s.trim().toLowerCase());
  const col = (...names) => { for (const n of names) { const i = h.findIndex((x) => x.startsWith(n)); if (i >= 0) return i; } return -1; };
  const ix = {
    date: col('date'), time: col('time'), type: col('connection type', 'connection'),
    lat: col('latitude'), lon: col('longitude'),
    dl: col('download speed', 'download (mbps)', 'download'), ul: col('upload speed', 'upload (mbps)', 'upload'),
    ping: col('latency', 'ping'), server: col('server name', 'server'),
  };
  if (ix.lat < 0 || ix.lon < 0 || ix.dl < 0) throw new Error('没找到经纬度或下载速度这几列，这好像不是 Speedtest 导出的 CSV');

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
  if (!tests.length) throw new Error('没有带坐标的测速记录，地图上没法显示');
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
    ['香港', 22.30, 114.17, 90, .06], ['深圳', 22.54, 114.05, 70, .07], ['广州', 23.12, 113.30, 50, .08],
    ['上海', 31.22, 121.46, 40, .08], ['北京', 39.91, 116.41, 30, .09], ['东京', 35.68, 139.75, 45, .07],
    ['台北', 25.04, 121.54, 25, .05], ['新加坡', 1.30, 103.84, 20, .05], ['旧金山', 37.77, -122.42, 12, .05],
    ['伦敦', 51.51, -0.12, 10, .05], ['悉尼', -33.87, 151.2, 8, .05], ['成都', 30.66, 104.07, 18, .07],
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
  return readDataset(lines.join('\n'), '示例数据');
}

/* ════════════════════════════════════════════════════════════
   Metrics & colour
   ════════════════════════════════════════════════════════════ */
const METRICS = {
  dl: { name: '下载', unit: 'Mbps', stops: [25, 100, 250, 500, 900], pill: ['#0a84ff', '#5e5ce6'] },
  ul: { name: '上传', unit: 'Mbps', stops: [5, 20, 40, 80, 150], pill: ['#bf5af2', '#ff375f'] },
  ping: { name: '延迟', unit: 'ms', stops: [15, 25, 40, 70, 120], invert: true, pill: ['#30d158', '#32ade6'] },
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
};

/* ════════════════════════════════════════════════════════════
   Map
   ════════════════════════════════════════════════════════════ */
const STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
const FONT = ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular', 'HanWang Hei Light Regular', 'NanumBarunGothic Regular'];
let map = null, dotScale = 0, spin = { on: true, paused: 0 };

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
  map.on('style.load', onStyle);
  map.once('load', () => setTimeout(() => body.classList.add('map-ready'), 80));
  map.on('error', (e) => { console.warn('map', e && e.error); body.classList.add('map-ready'); });
  ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart'].forEach((ev) => map.on(ev, (e) => { if (e.originalEvent) spin.paused = performance.now() + 2500; }));
  map.on('mousedown', () => (spin.paused = performance.now() + 2500));
  map.on('touchstart', () => (spin.paused = performance.now() + 2500));
  darkQ.addEventListener('change', () => { map.setStyle(STYLES[darkQ.matches ? 'dark' : 'light'], { diff: false }); renderLegend(); });

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(64, now - last); last = now;
    if (S.view === 'landing' && spin.on && now > spin.paused && !map.isMoving() && !reduceMotion) {
      const c = map.getCenter(); c.lng += dt * 0.0045; map.setCenter(c);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
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
  addDataLayers();
}

/* Prefer Chinese place names where OpenStreetMap has them. */
function localizeLabels() {
  const zh = ['coalesce', ['get', 'name:zh'], ['get', 'name_en'], ['get', 'name']];
  for (const l of map.getStyle().layers) {
    if (l.type !== 'symbol' || !l.layout || !l.layout['text-field'] || l['source-layer'] === 'housenumber') continue;
    if (!JSON.stringify(l.layout['text-field']).includes('name')) continue;
    try { map.setLayoutProperty(l.id, 'text-field', zh); } catch {}
  }
}

function radiusExpr(k, mul = 1) {
  return ['*', k * mul, ['interpolate', ['linear'], ['sqrt', ['get', 'n']], 1, 6.5, 3, 10, 8, 17, 16, 25, 30, 34]];
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

function addDataLayers() {
  if (!map || map.getSource('spots')) return;
  map.addSource('spots', {
    type: 'geojson', data: spotsGeoJSON(),
    cluster: true, clusterRadius: 42, clusterMaxZoom: 13,
    clusterProperties: {
      n: ['+', ['get', 'n']],
      pn: ['+', ['get', 'pn']],
      dlw: ['+', ['*', ['get', 'dl'], ['get', 'n']]],
      ulw: ['+', ['*', ['get', 'ul'], ['get', 'n']]],
      pingw: ['+', ['*', ['max', ['get', 'ping'], 0], ['get', 'pn']]],
    },
  });
  map.addSource('sel', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const dark = darkQ.matches;
  map.addLayer({
    id: 'glow', type: 'circle', source: 'spots',
    paint: {
      'circle-radius': radiusExpr(dotScale, 2.3), 'circle-color': colorExpr(S.metric), 'circle-blur': 1,
      'circle-opacity': dark ? .5 : .32, 'circle-color-transition': { duration: 700 }, 'circle-pitch-alignment': 'map',
    },
  });
  map.addLayer({
    id: 'ring', type: 'circle', source: 'sel',
    paint: { 'circle-radius': 20, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2.5, 'circle-stroke-color': dark ? '#fff' : '#1d1d1f', 'circle-stroke-opacity': 0 },
  });
  map.addLayer({
    id: 'dots', type: 'circle', source: 'spots',
    paint: {
      'circle-radius': radiusExpr(dotScale), 'circle-color': colorExpr(S.metric),
      'circle-stroke-width': 1.5, 'circle-stroke-color': dark ? 'rgba(255,255,255,.9)' : '#ffffff',
      'circle-opacity': .95, 'circle-color-transition': { duration: 700 }, 'circle-pitch-alignment': 'map',
    },
  });
  map.addLayer({
    id: 'counts', type: 'symbol', source: 'spots', filter: ['>=', ['get', 'n'], 4],
    layout: { 'text-field': ['to-string', ['get', 'n']], 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['get', 'n'], 4, 10.5, 60, 14], 'text-allow-overlap': true },
    paint: { 'text-color': 'rgba(0,0,0,.78)', 'text-opacity': dotScale > .6 ? 1 : 0, 'text-opacity-transition': { duration: 400 } },
  });

  map.on('mousemove', 'dots', onHover);
  map.on('mouseleave', 'dots', () => { map.getCanvas().style.cursor = ''; hideTip(); });
  map.on('click', 'dots', onDotClick);
  map.on('click', (e) => {
    if (S.view !== 'dash') return;
    const hit = map.queryRenderedFeatures(e.point, { layers: ['dots'] });
    if (!hit.length) closeDetail();
  });
}

function spotsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: S.spots.map((s, i) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: { i, n: s.st.n, dl: s.st.dl ?? 0, ul: s.st.ul ?? 0, ping: s.st.ping ?? -1, pn: s.st.pn },
    })),
  };
}
function pushData() { const src = map && map.getSource('spots'); if (src) src.setData(spotsGeoJSON()); }

function setDotScale(k) {
  dotScale = k;
  if (!map || !map.getLayer('dots')) return;
  map.setPaintProperty('dots', 'circle-radius', radiusExpr(k));
  map.setPaintProperty('glow', 'circle-radius', radiusExpr(k, 2.3));
  map.setPaintProperty('counts', 'text-opacity', k > .6 ? 1 : 0);
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

/* selection ring pulse */
let pulseRAF = 0;
function pulse(lngLat) {
  cancelAnimationFrame(pulseRAF);
  const src = map && map.getSource('sel'); if (!src) return;
  if (!lngLat) { src.setData({ type: 'FeatureCollection', features: [] }); return; }
  src.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: lngLat }, properties: {} });
  const t0 = performance.now();
  const step = (now) => {
    const p = ((now - t0) % 1800) / 1800, e = easeOutExpo(p);
    map.setPaintProperty('ring', 'circle-radius', 14 + e * 30);
    map.setPaintProperty('ring', 'circle-stroke-opacity', (1 - p) * .8);
    pulseRAF = requestAnimationFrame(step);
  };
  pulseRAF = requestAnimationFrame(step);
}

function uiPadding() {
  if (isCompact()) return { top: 170, bottom: 200, left: 36, right: 36 };
  return { top: 110, bottom: 90, left: 400, right: S.sel ? 450 : 80 };
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

/* hover & click */
const tip = $('#tip');
let tipToken = 0;
function onHover(e) {
  if (S.view !== 'dash' || isCompact()) return;
  map.getCanvas().style.cursor = 'pointer';
  const f = e.features[0]; const p = f.properties;
  const v = (m) => {
    if (!p.point_count) return m === 'ping' ? (p.ping >= 0 ? p.ping : null) : p[m];
    if (m === 'ping') return p.pn > 0 ? p.pingw / p.pn : null;
    return p[m + 'w'] / p.n;
  };
  const token = ++tipToken;
  const render = (title) => {
    if (token !== tipToken) return;
    tip.innerHTML = `<b>${esc(title)}</b>
      <div class="row"><span>测试</span><span>${p.n} 次</span></div>
      <div class="row"><span>下载</span><span>${fmt(v('dl'))} Mbps</span></div>
      <div class="row"><span>上传</span><span>${fmt(v('ul'))} Mbps</span></div>
      <div class="row"><span>延迟</span><span>${fmt(v('ping'))} ms</span></div>`;
    if (tip.hidden) { tip.hidden = false; }
    placeTip(e.point);
  };
  if (p.point_count) {
    render(`${p.point_count} 个地点`);
    map.getSource('spots').getClusterLeaves(p.cluster_id, 500, 0).then((leaves) => {
      const c = new Map();
      for (const l of leaves) { const s = S.spots[l.properties.i]; if (s) c.set(s.city, (c.get(s.city) || 0) + s.st.n); }
      const names = [...c.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
      render(names.slice(0, 3).join(' · ') + (names.length > 3 ? ' 等' : ''));
    }).catch(() => {});
  } else {
    const s = S.spots[p.i]; render(s ? s.city : '');
  }
  placeTip(e.point);
}
function placeTip(pt) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = pt.x + 16, y = pt.y - h - 12;
  if (x + w > innerWidth - 12) x = pt.x - w - 16;
  if (y < 12) y = pt.y + 16;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tipToken++; tip.hidden = true; }

async function onDotClick(e) {
  if (S.view !== 'dash') return;
  const f = e.features[0], p = f.properties;
  hideTip();
  if (p.point_count) {
    const src = map.getSource('spots');
    let z = map.getZoom() + 2;
    try { z = await src.getClusterExpansionZoom(p.cluster_id); } catch {}
    map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(z + .4, 15), duration: 1100, easing: easeOutExpo, padding: camPadding() });
    return;
  }
  const s = S.spots[p.i]; if (!s) return;
  openDetail({ title: s.city, sub: `${s.lat.toFixed(3)}, ${s.lon.toFixed(3)}`, tests: s.tests, center: [s.lon, s.lat] });
  map.easeTo({ center: [s.lon, s.lat], duration: 900, easing: easeOutExpo, padding: camPadding() });
}

/* ════════════════════════════════════════════════════════════
   Dashboard rendering
   ════════════════════════════════════════════════════════════ */
function refilter() {
  const ds = S.ds;
  S.tests = ds.tests.filter((t) => S.types.has(t.type) && S.years.has(t.year));
  const m = new Map();
  for (const t of S.tests) {
    let s = m.get(t.key);
    if (!s) { s = { key: t.key, lat: t.lat, lon: t.lon, city: t.city, tests: [] }; m.set(t.key, s); }
    s.tests.push(t);
  }
  S.spots = [...m.values()];
  for (const s of S.spots) s.st = stats(s.tests);
  pushData();
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
  $('#heroLabel').textContent = `${M.name}中位数`;
  $('#heroUnit').textContent = M.unit;
  countUp($('#heroVal'), st[S.metric]);

  const others = Object.keys(METRICS).filter((k) => k !== S.metric);
  const kp = $('#kpis');
  if (!kp.children.length) kp.innerHTML = '<div><b><span class="num"></span><small></small></b><span></span></div>'.repeat(4);
  const tiles = [
    ...others.map((k) => ({ v: st[k], unit: METRICS[k].unit, label: `${METRICS[k].name}中位数` })),
    { v: st.n, unit: '次', label: '测试', int: true },
    { v: S.spots.length, unit: '处', label: '地点', int: true },
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
      <span class="lbl"><i></i>${esc(r.ty)}<small>${r.st.n} 次</small></span>
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
      <span class="nm">${esc(c.name)}<small>${c.n} 次</small></span>
      <span class="v">${fmt(c.v)}</span>
      <span class="mini"><i style="--p:${p.toFixed(1)}%;--c:${colorFor(S.metric, c.v)}"></i></span>
    </button></li>`;
  }).join('') + (list.length > 8 ? `<li><button type="button" class="more" id="moreCities">${S.citiesAll ? '收起' : `显示全部 ${list.length} 个`}</button></li>` : '');
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
    `<button type="button" class="chip" data-type="${esc(ty)}" aria-pressed="${S.types.has(ty)}" style="--c:${typeColor(ty)}"><i></i>${esc(ty)}<small>${tc.get(ty)}</small></button>`).join('');
  $('#years').innerHTML = [...yc.keys()].sort().map((y) =>
    `<button type="button" class="chip" data-year="${y}" aria-pressed="${S.years.has(y)}">${y || '未知'}<small>${yc.get(y)}</small></button>`).join('');
}
function renderFoot() {
  const bits = ['城市按坐标就近归类，深港交界一带可能不准。'];
  if (S.ds.noPing) bits.push(`${S.ds.noPing} 条记录没有延迟数据，统计延迟时已跳过。`);
  if (S.ds.noGeo) bits.push(`${S.ds.noGeo} 条记录没有坐标，没画在地图上。`);
  if (S.mode === 'shared') bits.push('分享的数据不含 IP 地址。');
  $('#foot').textContent = bits.join('');
}

function renderLegend() {
  const M = METRICS[S.metric], st = colorStops(S.metric);
  const lo = st[0][0], hi = st[st.length - 1][0];
  const grad = st.map(([v, c]) => `${c} ${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`).join(', ');
  $('#legend').innerHTML = `<b>${M.name}（${M.unit}）· 圆越大测得越多</b>
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
  if (map && map.getLayer('dots')) {
    map.setPaintProperty('dots', 'circle-color', colorExpr(m));
    map.setPaintProperty('glow', 'circle-color', colorExpr(m));
  }
  renderLegend(); renderPanel();
  if (S.sel) renderDetail(S.sel);
}

function renderActions() {
  const a = $('#actions');
  const btn = (id, cls, icon, label) => `<button type="button" class="btn ${cls}" id="${id}">${icon}<span class="lbl">${label}</span></button>`;
  if (S.mode === 'local') a.innerHTML = btn('actNew', 'glass', ICON.plus, '新文件') + btn('actShare', 'primary', ICON.share, '分享');
  else if (S.mode === 'demo') a.innerHTML = btn('actNew', 'primary', ICON.plus, '用我自己的数据');
  else if (S.owner) a.innerHTML = btn('actDelete', 'glass', ICON.trash, '停止分享') + btn('actCopy', 'primary', ICON.link, '拷贝链接');
  else a.innerHTML = btn('actCopy', 'glass', ICON.link, '拷贝链接') + btn('actNew', 'primary', ICON.plus, '做一张我自己的');
}

/* Detail card */
function openDetail(group) {
  S.sel = group;
  renderDetail(group);
  $('#detail').classList.add('show');
  pulse(group.center || null);
}
function closeDetail() {
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

  const cap = 250;
  $('#detail').innerHTML = `
    <header>
      <div><h3>${esc(group.title)}</h3><p>${tests.length} 次测试${nSpots > 1 ? ` · ${nSpots} 个地点` : ''}${range ? ` · ${range}` : ''}</p></div>
      <button type="button" class="close" id="closeDetail" aria-label="关闭">${ICON.close}</button>
    </header>
    <div class="dkpis">
      ${['dl', 'ul', 'ping'].map((k) => `<div><b style="color:${k === S.metric ? colorFor(k, st[k]) : 'inherit'}">${fmt(st[k])}</b><span>${METRICS[k].name} ${METRICS[k].unit}</span></div>`).join('')}
    </div>
    ${spark}
    <div class="tests">
      ${tests.slice(0, cap).map((t, i) => `<div class="test" style="--i:${Math.min(i, 20)}">
        <span class="when"><span class="tag" style="--c:${typeColor(t.type)}">${esc(t.type)}</span>${t.ts ? fmtWhen(t.ts) : '时间未知'}</span>
        <span class="sp">↓ ${fmt(t.dl)} <span>·</span> ↑ ${fmt(t.ul)} <span>· ${t.ping != null ? fmt(t.ping) + ' ms' : '–'}</span></span>
        <span class="srv">${esc(t.server || '未知节点')}${nSpots > 1 ? ` · ${esc(t.city)}` : ''}</span>
      </div>`).join('')}
      ${tests.length > cap ? `<p class="foot" style="text-align:center">还有 ${tests.length - cap} 条，放大地图查看具体地点</p>` : ''}
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   View transitions
   ════════════════════════════════════════════════════════════ */
function enterDash(ds, opts) {
  S.ds = ds; S.mode = opts.mode; S.shareId = opts.id || null; S.owner = !!opts.owner; S.sharedAt = opts.created || null;
  S.types = new Set(ds.tests.map((t) => t.type));
  S.years = new Set(ds.tests.map((t) => t.year));
  S.sel = null; S.citiesAll = false; S.metric = 'dl';
  document.querySelectorAll('#metric button').forEach((b) => b.setAttribute('aria-selected', b.dataset.m === 'dl'));
  $('#detail').classList.remove('show');
  $('#panel').classList.remove('expanded');
  $('#heroVal')._v = 0;

  const sum = summarize(ds);
  $('#dashTitle').textContent = ds.name || '测速地图';
  const when = sum.from ? (fmtMonth(sum.from) === fmtMonth(sum.to) ? fmtMonth(sum.from) : `${fmtMonth(sum.from)} – ${fmtMonth(sum.to)}`) : '';
  $('#dashSub').textContent = [S.mode === 'shared' ? '共享' : S.mode === 'demo' ? '示例' : '仅本机', when].filter(Boolean).join(' · ');
  document.title = `${ds.name || '测速地图'} · 测速地图`;

  renderActions(); renderLegend();
  setDotScale(0);
  refilter();
  S.view = 'dash'; body.dataset.view = 'dash';
  $('#dash').setAttribute('aria-hidden', 'false');
  requestAnimationFrame(positionPill);

  if (map) {
    map.stop();
    const target = homeSpots();
    fit(target, { duration: 3400, maxZoom: 11, pitch: 0 });
    animateDots(1, reduceMotion ? 0 : 1300, 1200);
  }
}

function exitDash() {
  if (S.view !== 'dash') return;
  S.view = 'landing'; body.dataset.view = 'landing';
  $('#dash').setAttribute('aria-hidden', 'true');
  closeDetail(); hideTip();
  document.title = '测速地图';
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
let sheetLocked = false;
function openSheet(html, { busy = false } = {}) {
  sheetBody.innerHTML = html;
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
  openSheet(`
    <div class="file-row">
      <span class="file-ico">CSV</span>
      <div><h3 id="sheetTitle">${esc(ds.name)}</h3><p>${(ds.bytes / 1024).toFixed(0)} KB · 已在本机解析</p></div>
    </div>
    <div class="stat-strip">
      <div><b class="num">${s.n.toLocaleString('en-US')}</b><span>次测试</span></div>
      <div><b class="num">${s.spots}</b><span>个地点</span></div>
      <div><b class="num" style="font-size:${when.length > 6 ? 19 : 24}px">${when}</b><span>时间跨度</span></div>
    </div>
    <h4>接下来想怎么看？</h4>
    <div class="choices">
      <button type="button" class="choice local" id="goLocal" data-autofocus>
        <span class="ci">${ICON.laptop}</span><b>在本机查看</b><span>数据只留在这台设备上，不会上传到任何地方。</span>
      </button>
      <button type="button" class="choice share" id="goShare">
        <span class="ci">${ICON.link}</span><b>生成分享链接</b><span>上传到云端，拿到链接的人都能看。IP 地址会先移除。</span>
      </button>
    </div>
    <button type="button" class="cancel" id="sheetCancel">换一个文件</button>`);
}

async function doShare(ds) {
  if (ds.publicCSV.length > 5 * 1024 * 1024) { showError('文件超过 5 MB，没法分享。可以先在本机查看。', ds); return; }
  openSheet(`
    <div class="center">
      <h3 class="t" id="sheetTitle">正在生成链接…</h3>
      <p class="s">正在把去掉 IP 的 CSV 上传到云端</p>
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
    if (!res.ok) throw new Error(data.error || `上传失败（${res.status}）`);
    saveOwner(data.id, data.deleteToken);
    showDone(ds, data.id);
  } catch (e) {
    showError(e.message === 'Failed to fetch' ? '连不上服务器，检查一下网络再试' : e.message, ds);
  }
}

function shareUrl(id) { return `${location.origin}/s/${id}`; }

function showDone(ds, id) {
  const url = shareUrl(id);
  const inDash = S.view === 'dash';
  openSheet(`
    <div class="center">
      <svg class="big-ico check" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="34"/><path d="M24 39.5l9.5 9.5L53 28"/></svg>
      <h3 class="t" id="sheetTitle">链接已生成</h3>
      <p class="s">任何拿到链接的人都能看到这张地图。你可以随时在地图页停止分享。</p>
    </div>
    <div class="link-field"><input id="shareUrl" value="${esc(url)}" readonly aria-label="分享链接"><button type="button" class="btn primary" id="copyUrl" data-autofocus>${ICON.copy}拷贝</button></div>
    <div class="btn-row">
      ${navigator.share ? `<button type="button" class="btn tonal" id="nativeShare">${ICON.share}共享…</button>` : ''}
      <button type="button" class="btn tonal" id="openShared">${ICON.map}${inDash ? '完成' : '打开地图'}</button>
    </div>`);
  sheet._done = { ds, id };
}

function showError(msg, ds) {
  openSheet(`
    <div class="center">
      <h3 class="t" id="sheetTitle">出了点问题</h3>
      <p class="s">${esc(msg)}</p>
    </div>
    <div class="btn-row">
      ${ds && S.view !== 'dash' ? '<button type="button" class="btn tonal" id="goLocal">在本机查看</button>' : ''}
      ${ds ? '<button type="button" class="btn primary" id="retryShare" data-autofocus>再试一次</button>' : '<button type="button" class="btn primary" id="sheetCancel" data-autofocus>好</button>'}
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
  try { await navigator.clipboard.writeText(text); toast('已拷贝链接'); }
  catch {
    const i = document.createElement('input'); i.value = text; document.body.append(i); i.select();
    try { document.execCommand('copy'); toast('已拷贝链接'); } catch { toast('拷贝失败，请手动选择'); }
    i.remove();
  }
}

/* ════════════════════════════════════════════════════════════
   File intake
   ════════════════════════════════════════════════════════════ */
async function handleFile(file) {
  if (!file) return;
  if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { toast('请选择 .csv 文件'); return; }
  if (file.size > 50 * 1024 * 1024) { toast('文件太大了'); return; }
  try {
    const text = await file.text();
    const ds = readDataset(text, file.name);
    S.pending = ds;
    showChoice(ds);
  } catch (e) {
    showError(e.message || '读不了这个文件');
  }
}

/* ════════════════════════════════════════════════════════════
   Routing
   ════════════════════════════════════════════════════════════ */
const shareIdFromPath = () => (location.pathname.match(/^\/s\/([A-Za-z0-9]{6,32})\/?$/) || [])[1];

async function loadShared(id) {
  const l = $('#landing');
  l.classList.add('is-loading'); $('#loading').hidden = false;
  $('#loadingText').textContent = '正在载入共享的测速地图…';
  $('#loading').querySelector('.spinner').hidden = false;
  $('#loading').querySelectorAll('.btn').forEach((b) => b.remove());
  try {
    const [res] = await Promise.all([fetch(`/api/share/${id}`), sleep(reduceMotion ? 0 : 900)]);
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `载入失败（${res.status}）`); }
    const text = await res.text();
    let name = '共享的测速地图';
    try { name = decodeURIComponent(res.headers.get('X-Share-Name') || '') || name; } catch {}
    const ds = readDataset(text, name);
    enterDash(ds, { mode: 'shared', id, owner: !!owners()[id], created: res.headers.get('X-Share-Created') });
  } catch (e) {
    $('#loadingText').textContent = e.message === 'Failed to fetch' ? '连不上服务器' : e.message;
    $('#loading').querySelector('.spinner').hidden = true;
    const b = document.createElement('button');
    b.className = 'btn primary'; b.textContent = '去首页上传自己的 CSV';
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
      if (S.view === 'landing') { $('#file').value = ''; if (b.textContent.includes('换')) setTimeout(() => $('#file').click(), 350); }
      break;
    case 'copyUrl': copy($('#shareUrl').value); break;
    case 'nativeShare':
      navigator.share({ title: `${sheet._done.ds.name} · 测速地图`, url: shareUrl(sheet._done.id) }).catch(() => {});
      break;
    case 'openShared': {
      const { ds: d, id } = sheet._done;
      closeSheet(); history.pushState({}, '', `/s/${id}`);
      if (S.view === 'dash' && S.ds === d) {
        S.mode = 'shared'; S.shareId = id; S.owner = true;
        $('#dashSub').textContent = $('#dashSub').textContent.replace('仅本机', '共享');
        renderActions(); renderFoot();
      } else setTimeout(() => enterDash(d, { mode: 'shared', id, owner: true }), 180);
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
  S.sel = { title: c.name, tests: c.tests, center };
  openDetail(S.sel);
  if (isCompact()) $('#panel').classList.remove('expanded');
  fit(spots, { maxZoom: 13, duration: 1600 });
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
    if (!confirm('停止分享后，这个链接会立刻失效，数据也会从云端删除。确定吗？')) return;
    try {
      const res = await fetch(`/api/share/${S.shareId}`, { method: 'DELETE', headers: { 'X-Delete-Token': owners()[S.shareId] || '' } });
      if (!res.ok && res.status !== 404) throw new Error(`删除失败（${res.status}）`);
      dropOwner(S.shareId);
      S.mode = 'local'; S.owner = false; S.shareId = null;
      history.replaceState({}, '', '/');
      $('#dashSub').textContent = $('#dashSub').textContent.replace('共享', '仅本机');
      renderActions(); renderFoot();
      toast('已停止分享，云端数据已删除');
    } catch (err) { toast(err.message); }
  }
});

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!sheet.hidden && !sheetLocked) closeSheet();
  else if (S.sel) closeDetail();
});
addEventListener('resize', () => {
  if (!map) return;
  if (S.view === 'dash') { positionPill(); map.setPadding(camPadding()); }
  else { map.setPadding(landingPadding()); map.setZoom(landingZoom()); }
});
addEventListener('popstate', route);

/* ════════════════════════════════════════════════════════════
   Boot
   ════════════════════════════════════════════════════════════ */
['.title', '.seg', '.actions', '.panel', '.legend', '.zoom'].forEach((sel, i) => {
  const el = document.querySelector(sel); if (el) { el.classList.add('enter'); el.style.setProperty('--d', i); }
});
initMap();
route();
})();
