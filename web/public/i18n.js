// UI strings for zh-CN (default), zh-HK (Hong Kong Traditional) and en, plus language detection and switching.
// Values may be { one, other } for English plurals (chosen by params.n).
// Markup opts in with data-i18n (text), data-i18n-html (trusted markup) and
// data-i18n-attr="aria-label:key;title:key2". Elements with data-lang-switch get the switcher.
(() => {
'use strict';

const DICT = {
  'zh-CN': {
    'lang.label': '语言',
    app: '测速地图',
    metaDesc: '把 Speedtest 导出的 CSV 放到地图上，本机查看或生成分享链接。',
    mapLabel: '测速地点地图',
    dropTitle: '拖入 CSV，或<u>点按选择文件</u>',
    dropHint: '从 speedtest.net 的测试结果页导出',
    helpBtn: '怎么导出 CSV？',
    demoBtn: '没有文件？先看看示例',
    license: 'MIT 许可',
    privacy: '数据与隐私',
    loadingShared: '正在载入共享的测速地图…',
    toHome: '去首页上传自己的 CSV',
    home: '回到首页',
    metricAria: '地图按什么上色',
    'm.dl': '下载', 'm.ul': '上传', 'm.ping': '延迟',
    'median.dl': '下载中位数', 'median.ul': '上传中位数', 'median.ping': '延迟中位数',
    expandPanel: '展开面板',
    viewsAria: '视图',
    overview: '概览',
    timeline: '时间线',
    network: '网络',
    years: '年份',
    byType: '按网络类型 · 中位数',
    byCity: '按城市 · 中位数',
    zoomIn: '放大', zoomOut: '缩小', showAll: '显示全部地点',
    ethernet: '以太网',
    unknown: '未知',
    demoName: '示例数据',
    sharedName: '共享的测速地图',
    'err.noRows': '文件里没有测速记录',
    'err.noCols': '没找到经纬度或下载速度这几列，这好像不是 Speedtest 导出的 CSV',
    'err.noGeo': '没有带坐标的测速记录，地图上没法显示',
    'err.notCsv': '这不像是 Speedtest 导出的 CSV',
    'err.tooBig': '文件太大，上限 5 MB',
    'err.upload': '上传失败（{s}）',
    'err.notFound': '这个分享不存在，或者已经被删除',
    'err.load': '载入失败（{s}）',
    'err.delete': '删除失败（{s}）',
    'err.offline': '连不上服务器，检查一下网络再试',
    'err.offlineShort': '连不上服务器',
    'err.shareTooBig': '文件超过 5 MB，没法分享。可以先在本机查看。',
    'err.unreadable': '读不了这个文件',
    markerAria: '{n} 次测试，{metric} {v} {unit}',
    andMore: ' 等',
    tipTests: '测试',
    tipN: '{n} 次',
    nPlaces: '{n} 个地点',
    nTimes: '{n} 次',
    nTests: '{n} 次测试',
    nCities: '{n} 座城市',
    nDays: '{n} 天',
    'kpi.tests': '测试', 'kpi.testsUnit': '次',
    'kpi.places': '地点', 'kpi.placesUnit': '处',
    showAllN: '显示全部 {n} 个',
    showLess: '收起',
    sentenceGap: '',
    'foot.city': '城市按坐标就近归类，深港交界一带可能不准。',
    'foot.noPing': '{n} 条记录没有延迟数据，统计延迟时已跳过。',
    'foot.noGeo': '{n} 条记录没有坐标，没画在地图上。',
    'foot.shared': '分享的数据不含 IP 地址。',
    legend: '{m}（{unit}）· 角标是测试次数',
    'act.new': '新文件', 'act.share': '分享', 'act.useMine': '用我自己的数据',
    'act.stop': '停止分享', 'act.copy': '拷贝链接', 'act.makeMine': '做一张我自己的',
    monthHead: '{y} 年 {m} 月',
    yearHead: '{y} 年',
    day: '{d} 日',
    noTime: '时间未知',
    noPing: '无延迟',
    noServer: '未知节点',
    close: '关闭',
    moreNote: '还有 {n} 条，放大地图查看具体地点',
    prevYear: '上一年', nextYear: '下一年',
    moved: '移动约 {d}',
    monthsAria: '按月份筛选',
    monthTip: '{m} 月 · {n} 次',
    stopPlay: '停止回放',
    playYear: '回放这一年',
    playMonth: '回放这个月',
    tlEmpty: '这段时间没有带时间的测速记录',
    noTimeData: '这份数据没有时间信息',
    'mode.shared': '共享', 'mode.demo': '示例', 'mode.local': '仅本机',
    parsedLocally: '{kb} KB · 已在本机解析',
    statTests: '次测试', statPlaces: '个地点', statSpan: '时间跨度',
    nextQ: '接下来想怎么看？',
    localTitle: '在本机查看',
    localDesc: '数据只留在这台设备上，不会上传到任何地方。',
    shareTitle: '生成分享链接',
    shareDesc: '上传到云端，拿到链接的人都能看。IP 地址会先移除。',
    pickAnother: '换一个文件',
    sharingTitle: '正在生成链接…',
    sharingSub: '正在把去掉 IP 的 CSV 上传到云端',
    doneTitle: '链接已生成',
    doneSub: '任何拿到链接的人都能看到这张地图。你可以随时在地图页停止分享。',
    shareLink: '分享链接',
    copy: '拷贝',
    nativeShare: '共享…',
    done: '完成',
    openMap: '打开地图',
    errTitle: '出了点问题',
    retry: '再试一次',
    ok: '好',
    copied: '已拷贝链接',
    copyFail: '拷贝失败，请手动选择',
    pickCsv: '请选择 .csv 文件',
    fileTooBig: '文件太大了',
    'help.1': '打开 {link} 并登录你的 Speedtest 账户。',
    'help.2': '在「结果历史记录」右上角点 {kbd}，浏览器会下载一个 CSV 文件。',
    'help.3': '把这个 CSV 拖进本页，或点上传框选择它。',
    'priv.1': '选「在本机查看」时，CSV 只在你的浏览器里解析，不会上传。',
    'priv.2': '选「生成分享链接」时，会先删除内网和外网 IP 两列，再把剩下的内容存到 Cloudflare R2；拿到链接的人都能看到。',
    'priv.3': '在同一个浏览器里可以随时「停止分享」，链接立即失效，云端数据一并删除。',
    'priv.4': '源代码以 MIT 许可在 {gh} 公开。',
    gotIt: '知道了',
    confirmStop: '停止分享后，这个链接会立刻失效，数据也会从云端删除。确定吗？',
    stopped: '已停止分享，云端数据已删除',
  },

  'zh-HK': {
    'lang.label': '語言',
    app: '測速地圖',
    metaDesc: '把 Speedtest 匯出的 CSV 放到地圖上，在本機查看或生成分享連結。',
    mapLabel: '測速地點地圖',
    dropTitle: '拖入 CSV，或<u>按此選擇檔案</u>',
    dropHint: '從 speedtest.net 的測試結果頁匯出',
    helpBtn: '怎樣匯出 CSV？',
    demoBtn: '沒有檔案？先看看示範',
    license: 'MIT 授權',
    privacy: '數據與私隱',
    loadingShared: '正在載入分享的測速地圖…',
    toHome: '回主頁上載自己的 CSV',
    home: '返回主頁',
    metricAria: '地圖按甚麼上色',
    'm.dl': '下載', 'm.ul': '上載', 'm.ping': '延遲',
    'median.dl': '下載中位數', 'median.ul': '上載中位數', 'median.ping': '延遲中位數',
    expandPanel: '展開面板',
    viewsAria: '檢視',
    overview: '概覽',
    timeline: '時間線',
    network: '網絡',
    years: '年份',
    byType: '按網絡類型 · 中位數',
    byCity: '按城市 · 中位數',
    zoomIn: '放大', zoomOut: '縮小', showAll: '顯示所有地點',
    ethernet: '以太網',
    unknown: '未知',
    demoName: '示範數據',
    sharedName: '分享的測速地圖',
    'err.noRows': '檔案裡沒有測速記錄',
    'err.noCols': '找不到經緯度或下載速度這幾欄，看來不像是 Speedtest 匯出的 CSV',
    'err.noGeo': '沒有帶坐標的測速記錄，無法在地圖上顯示',
    'err.notCsv': '看來不像是 Speedtest 匯出的 CSV',
    'err.tooBig': '檔案太大，上限為 5 MB',
    'err.upload': '上載失敗（{s}）',
    'err.notFound': '這個分享不存在，或已被刪除',
    'err.load': '載入失敗（{s}）',
    'err.delete': '刪除失敗（{s}）',
    'err.offline': '連接不到伺服器，請檢查網絡後再試',
    'err.offlineShort': '連接不到伺服器',
    'err.shareTooBig': '檔案超過 5 MB，無法分享。可以先在本機查看。',
    'err.unreadable': '無法讀取這個檔案',
    markerAria: '{n} 次測試，{metric} {v} {unit}',
    andMore: ' 等',
    tipTests: '測試',
    tipN: '{n} 次',
    nPlaces: '{n} 個地點',
    nTimes: '{n} 次',
    nTests: '{n} 次測試',
    nCities: '{n} 個城市',
    nDays: '{n} 天',
    'kpi.tests': '測試', 'kpi.testsUnit': '次',
    'kpi.places': '地點', 'kpi.placesUnit': '處',
    showAllN: '顯示全部 {n} 個',
    showLess: '收起',
    sentenceGap: '',
    'foot.city': '城市按坐標就近歸類，深港交界一帶可能不準確。',
    'foot.noPing': '{n} 條記錄沒有延遲數據，計算延遲時已略去。',
    'foot.noGeo': '{n} 條記錄沒有坐標，沒有在地圖上顯示。',
    'foot.shared': '分享的數據不包含 IP 地址。',
    legend: '{m}（{unit}）· 角標是測試次數',
    'act.new': '新檔案', 'act.share': '分享', 'act.useMine': '用我自己的數據',
    'act.stop': '停止分享', 'act.copy': '複製連結', 'act.makeMine': '做一張我自己的',
    monthHead: '{y} 年 {m} 月',
    yearHead: '{y} 年',
    day: '{d} 日',
    noTime: '時間不明',
    noPing: '無延遲',
    noServer: '未知伺服器',
    close: '關閉',
    moreNote: '還有 {n} 條，放大地圖查看個別地點',
    prevYear: '上一年', nextYear: '下一年',
    moved: '移動約 {d}',
    monthsAria: '按月份篩選',
    monthTip: '{m} 月 · {n} 次',
    stopPlay: '停止回放',
    playYear: '回放這一年',
    playMonth: '回放這個月',
    tlEmpty: '這段時間沒有帶時間的測速記錄',
    noTimeData: '這份數據沒有時間資料',
    'mode.shared': '已分享', 'mode.demo': '示範', 'mode.local': '只限本機',
    parsedLocally: '{kb} KB · 已在本機解析',
    statTests: '次測試', statPlaces: '個地點', statSpan: '時間跨度',
    nextQ: '接下來想怎樣看？',
    localTitle: '在本機查看',
    localDesc: '數據只留在這部裝置上，不會上載到任何地方。',
    shareTitle: '生成分享連結',
    shareDesc: '上載到雲端，任何拿到連結的人都能看到。IP 地址會先移除。',
    pickAnother: '換一個檔案',
    sharingTitle: '正在生成連結…',
    sharingSub: '正在把移除了 IP 的 CSV 上載到雲端',
    doneTitle: '連結已生成',
    doneSub: '任何拿到連結的人都能看到這張地圖。你可以隨時在地圖頁停止分享。',
    shareLink: '分享連結',
    copy: '複製',
    nativeShare: '分享…',
    done: '完成',
    openMap: '打開地圖',
    errTitle: '出了點問題',
    retry: '再試一次',
    ok: '好',
    copied: '已複製連結',
    copyFail: '複製失敗，請手動選取',
    pickCsv: '請選擇 .csv 檔案',
    fileTooBig: '檔案太大了',
    'help.1': '打開 {link} 並登入你的 Speedtest 帳戶。',
    'help.2': '在「結果歷史記錄」右上角按 {kbd}，瀏覽器會下載一個 CSV 檔案。',
    'help.3': '把這個 CSV 拖進本頁，或按上載框選擇它。',
    'priv.1': '選擇「在本機查看」時，CSV 只會在你的瀏覽器裡解析，不會上載。',
    'priv.2': '選擇「生成分享連結」時，會先刪除內網和外網 IP 兩欄，再把其餘內容存到 Cloudflare R2；任何拿到連結的人都能看到。',
    'priv.3': '在同一個瀏覽器裡可以隨時「停止分享」，連結會即時失效，雲端數據亦會一併刪除。',
    'priv.4': '源代碼以 MIT 授權在 {gh} 公開。',
    gotIt: '知道了',
    confirmStop: '停止分享後，這個連結會即時失效，數據亦會從雲端刪除。確定嗎？',
    stopped: '已停止分享，雲端數據已刪除',
  },

  en: {
    'lang.label': 'Language',
    app: 'Speedtest Map',
    metaDesc: 'Put your Speedtest CSV export on a map — view it on your device or share a link.',
    mapLabel: 'Map of test locations',
    dropTitle: 'Drop a CSV here, or <u>choose a file</u>',
    dropHint: 'Export it from your results page on speedtest.net',
    helpBtn: 'How do I export the CSV?',
    demoBtn: 'No file? Try the demo',
    license: 'MIT License',
    privacy: 'Data & privacy',
    loadingShared: 'Loading shared speed map…',
    toHome: 'Upload your own CSV',
    home: 'Back to home',
    metricAria: 'Color the map by',
    'm.dl': 'Download', 'm.ul': 'Upload', 'm.ping': 'Latency',
    'median.dl': 'Median download', 'median.ul': 'Median upload', 'median.ping': 'Median latency',
    expandPanel: 'Expand panel',
    viewsAria: 'View',
    overview: 'Overview',
    timeline: 'Timeline',
    network: 'Network',
    years: 'Year',
    byType: 'By network type · median',
    byCity: 'By city · median',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', showAll: 'Show all locations',
    ethernet: 'Ethernet',
    unknown: 'Unknown',
    demoName: 'Demo data',
    sharedName: 'Shared speed map',
    'err.noRows': 'This file has no speed test records.',
    'err.noCols': 'Couldn’t find the latitude, longitude or download speed columns — this doesn’t look like a Speedtest CSV export.',
    'err.noGeo': 'None of the tests have coordinates, so there’s nothing to show on the map.',
    'err.notCsv': 'This doesn’t look like a Speedtest CSV export.',
    'err.tooBig': 'The file is too large — the limit is 5 MB.',
    'err.upload': 'Upload failed ({s})',
    'err.notFound': 'This share doesn’t exist, or it has been deleted.',
    'err.load': 'Couldn’t load the map ({s})',
    'err.delete': 'Couldn’t stop sharing ({s})',
    'err.offline': 'Can’t reach the server. Check your connection and try again.',
    'err.offlineShort': 'Can’t reach the server',
    'err.shareTooBig': 'This file is over 5 MB, so it can’t be shared. You can still view it on this device.',
    'err.unreadable': 'Couldn’t read this file',
    markerAria: { one: '1 test, {metric} {v} {unit}', other: '{n} tests, {metric} {v} {unit}' },
    andMore: ' and more',
    tipTests: 'Tests',
    tipN: '{n}',
    nPlaces: { one: '1 place', other: '{n} places' },
    nTimes: { one: '1 test', other: '{n} tests' },
    nTests: { one: '1 test', other: '{n} tests' },
    nCities: { one: '1 city', other: '{n} cities' },
    nDays: { one: '1 day', other: '{n} days' },
    'kpi.tests': 'Tests', 'kpi.testsUnit': '',
    'kpi.places': 'Places', 'kpi.placesUnit': '',
    showAllN: 'Show all {n}',
    showLess: 'Show less',
    sentenceGap: ' ',
    'foot.city': 'Each location is named after the nearest city; spots near the Shenzhen–Hong Kong border may be off.',
    'foot.noPing': { one: '1 record has no latency and is left out of latency stats.', other: '{n} records have no latency and are left out of latency stats.' },
    'foot.noGeo': { one: '1 record has no coordinates and isn’t on the map.', other: '{n} records have no coordinates and aren’t on the map.' },
    'foot.shared': 'Shared data contains no IP addresses.',
    legend: '{m} ({unit}) · badge = tests',
    'act.new': 'New file', 'act.share': 'Share', 'act.useMine': 'Use my own data',
    'act.stop': 'Stop sharing', 'act.copy': 'Copy link', 'act.makeMine': 'Make my own',
    monthHead: '{M} {y}',
    yearHead: '{y}',
    day: '{d}',
    noTime: 'Unknown time',
    noPing: 'no latency',
    noServer: 'unknown server',
    close: 'Close',
    moreNote: '{n} more — zoom in on the map to see each spot',
    prevYear: 'Previous year', nextYear: 'Next year',
    moved: '~{d} traveled',
    monthsAria: 'Filter by month',
    monthTip: { one: '{M} · 1 test', other: '{M} · {n} tests' },
    stopPlay: 'Stop playback',
    playYear: 'Replay this year',
    playMonth: 'Replay this month',
    tlEmpty: 'No timestamped tests in this period',
    noTimeData: 'This data has no timestamps',
    'mode.shared': 'Shared', 'mode.demo': 'Demo', 'mode.local': 'This device only',
    parsedLocally: '{kb} KB · read on this device',
    statTests: { one: 'test', other: 'tests' }, statPlaces: { one: 'place', other: 'places' }, statSpan: 'Time span',
    nextQ: 'How would you like to view it?',
    localTitle: 'View on this device',
    localDesc: 'Your data stays on this device and is never uploaded anywhere.',
    shareTitle: 'Create a share link',
    shareDesc: 'Uploads it so anyone with the link can view it. IP addresses are removed first.',
    pickAnother: 'Choose another file',
    sharingTitle: 'Creating link…',
    sharingSub: 'Uploading the CSV, minus IP addresses',
    doneTitle: 'Link created',
    doneSub: 'Anyone with the link can see this map. You can stop sharing any time from the map page.',
    shareLink: 'Share link',
    copy: 'Copy',
    nativeShare: 'Share…',
    done: 'Done',
    openMap: 'Open map',
    errTitle: 'Something went wrong',
    retry: 'Try again',
    ok: 'OK',
    copied: 'Link copied',
    copyFail: 'Couldn’t copy — please select it manually',
    pickCsv: 'Please choose a .csv file',
    fileTooBig: 'That file is too large',
    'help.1': 'Open {link} and sign in to your Speedtest account.',
    'help.2': 'In the top-right corner of your results history, click {kbd} — your browser downloads a CSV file.',
    'help.3': 'Drag that CSV onto this page, or click the upload box to choose it.',
    'priv.1': 'With “View on this device”, the CSV is read only in your browser and never uploaded.',
    'priv.2': 'With “Create a share link”, the internal and external IP columns are removed first and the rest is stored in Cloudflare R2; anyone with the link can see it.',
    'priv.3': 'From the same browser you can “Stop sharing” at any time: the link stops working right away and the cloud copy is deleted.',
    'priv.4': 'The source code is on {gh} under the MIT License.',
    gotIt: 'Got it',
    confirmStop: 'Once you stop sharing, this link stops working right away and the data is deleted from the cloud. Continue?',
    stopped: 'Sharing stopped; cloud data deleted',
  },
};

const LANGS = [['zh-CN', '简', '简体中文'], ['zh-HK', '繁', '繁體中文'], ['en', 'EN', 'English']];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KEY = 'stm.lang';

function detect() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'zh-TW') return 'zh-HK';           // earlier builds stored the Taiwan code
    if (DICT[s]) return s;
  } catch {}
  const l = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
  if (/^zh[-_](tw|hk|mo|hant)(?![a-z])/.test(l)) return 'zh-HK';
  if (/^zh(?![a-z])/.test(l)) return 'zh-CN';
  return 'en';
}
let lang = detect();
document.documentElement.lang = lang;

function t(key, params) {
  let v = DICT[lang][key];
  if (v == null) v = DICT['zh-CN'][key];
  if (v == null) return key;
  if (typeof v === 'object') v = params && +params.n === 1 ? v.one : v.other;
  return params ? v.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m)) : v;
}

/* City names: cities.js rows are [zh-CN, lat, lon, en, zh-HK]; the zh-CN name is the stable key. */
let cityMap = null;
function city(name) {
  if (!cityMap) cityMap = new Map((window.CITIES || []).map((c) => [c[0], c]));
  const c = cityMap.get(name);
  if (!c) return name;
  return (lang === 'en' ? c[3] : lang === 'zh-HK' ? c[4] : c[0]) || c[0];
}

function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
  root.querySelectorAll('[data-lang-switch]').forEach((el) => {
    if (!el.children.length) {
      el.innerHTML = LANGS.map(([code, short, full]) =>
        `<button type="button" data-lang="${code}" lang="${code}" aria-label="${full}" title="${full}">${short}</button>`).join('');
    }
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', t('lang.label'));
    el.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  });
}

function setLang(next) {
  if (!DICT[next] || next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch {}
  document.documentElement.lang = next;
  apply();
  dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-lang]');
  if (b && b.closest('[data-lang-switch]')) setLang(b.dataset.lang);
});

apply();

window.I18N = {
  t, apply, setLang, city,
  month: (i) => MONTHS[i],
  get lang() { return lang; },
  langs: LANGS.map((l) => l[0]),
};
})();
