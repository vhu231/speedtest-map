# 测速地图 · Speedtest Map

在线使用：**https://speed.niantic.club**

把 Speedtest 导出的 CSV 拖进网页，每一次测速都会落在一颗可以拖动的地球上。可以只在本机查看，也可以一键生成分享链接发给别人。

- **本机查看**：CSV 只在浏览器里解析，不会上传。
- **分享**：上传前先去掉 `External Ip` / `Internal Ip` 两列（Worker 端会再删一遍），存进 Cloudflare R2，生成 `/s/<id>` 链接。上传者在同一个浏览器里可以随时「停止分享」，云端的数据会一起删掉。
- 地图标记参考苹果「照片」的地图：带白边的圆角方块显示该处的中位数，角标是测试次数，缩放时会弹性地合并、拆开；点一个合并块，会列出里面的每一次测试（按月份分组的方块网格）。
- 「时间线」参考 Google 地图时间线：按年、按月翻看，把测试整理成「停留」（某城市某几天）和「移动」（车程或飞行距离），地图上按时间连出轨迹，远程移动画成虚线大圆弧；还能一键回放这一年的行程。
- 可按下载、上传或延迟上色，按网络类型和年份筛选，左侧有按网络类型和按城市的中位数。
- 界面支持简体中文、繁體中文（香港用語）和 English（Simplified Chinese, Traditional Chinese for Hong Kong, English）：默认跟随浏览器语言，可在页脚或面板底部的「简 · 繁 · EN」切换，选择会记在本机。城市名和底图地名也会跟着切换。文案在 `web/public/i18n.js`，城市名在 `web/public/cities.js`。

## 怎么导出 CSV

1. 打开 https://www.speedtest.net/en/results 并登录。
2. 在「结果历史记录」右上角点 **Export Results**，下载 CSV。
3. 把 CSV 拖进网页。

## 结构

```
web/                     Cloudflare Pages
  public/                静态前端（index.html / styles.css / app.js / i18n.js / cities.js）
  functions/api/[[path]].js   把 /api/* 通过 Service Binding 转给 Worker
  wrangler.toml
worker/                  Cloudflare Worker：speedtest-map-api
  src/index.js           POST /api/share · GET/DELETE /api/share/:id，存储在 R2
  wrangler.toml          R2 binding: BUCKET → speedtest-map
.github/workflows/deploy.yml   push 到 main 自动部署
```

浏览器只和 Pages 同源通信，不需要配置 CORS，也不用把 Worker 的域名写进前端。

## 本地开发

```bash
npm install
```

```bash
npm run dev:api
```

另开一个终端：

```bash
npm run dev:web
```

打开 http://localhost:8788 。本地的 R2 由 wrangler 模拟，数据存在 `.wrangler/` 里。

## 部署

### 自动（GitHub Actions）

在仓库 **Settings → Secrets and variables → Actions** 里添加：

| Secret | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 有 Workers Scripts、Workers R2 Storage、Cloudflare Pages 编辑权限的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |

之后每次 push 到 `main` 都会：创建 R2 桶（已存在则跳过）→ 部署 Worker → 创建 Pages 项目（已存在则跳过）→ 部署 Pages。没有配置 Secret 时工作流会直接跳过。

### 手动

```bash
npx wrangler login
```

```bash
npx wrangler r2 bucket create speedtest-map
```

```bash
npm run deploy
```

部署日志会打印站点地址。`speedtest-map.pages.dev` 已被占用时，Cloudflare 会自动加一段随机后缀。

### 自定义域名

1. Cloudflare 后台 → **Workers 和 Pages** → `speedtest-map` → **自定义域** → **设置自定义域**，填入域名（例如 `speed.example.com`）。域名托管在同一个 Cloudflare 账户时，DNS 会自动配好。
2. 把 `web/public/index.html` 开头那段脚本最后的 `('')` 改成你的域名，例如 `('speed.example.com')`，push 后生效。之后从 `*.pages.dev` 打开的访客会被转到自定义域名，分享链接也就都用这个域名。

## 限制

- 分享的 CSV 上限 5 MB；本机查看上限 50 MB。
- 城市名按坐标就近归类，深港交界一带用了一条粗略的分界线，可能不准。
- 延迟为 0 的记录（早期导出常见）不计入延迟统计。
- 底图来自 CARTO / OpenStreetMap，需要联网。

## 许可

[MIT](LICENSE) © 2026 vhu231

底图 © [OpenStreetMap](https://www.openstreetmap.org/copyright) 贡献者 · © [CARTO](https://carto.com/attributions)；低缩放级别的地球影像来自 NASA [Blue Marble](https://earthdata.nasa.gov/gibs)（公有领域）；地图渲染使用 [MapLibre GL JS](https://maplibre.org/)（BSD-3-Clause）。
