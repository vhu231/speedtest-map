# 测速地图 · Speedtest Map

把 Speedtest App 导出的 CSV 拖进网页，每一次测速都会落在一颗可以拖动的地球上。可以只在本机查看，也可以一键生成分享链接发给别人。

- **本机查看**：CSV 只在浏览器里解析，不会上传。
- **分享**：上传前先去掉 `External Ip` / `Internal Ip` 两列（Worker 端会再删一遍），存进 Cloudflare R2，生成 `/s/<id>` 链接。上传者在同一个浏览器里可以随时「停止分享」，云端的数据会一起删掉。
- 地图按下载、上传或延迟上色，圆越大测得越多；可按网络类型和年份筛选，点圆看那里每一次测试，左侧有按网络类型和按城市的中位数。

## 结构

```
web/                     Cloudflare Pages
  public/                静态前端（index.html / styles.css / app.js / cities.js）
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

站点地址是 `https://speedtest-map.pages.dev`（或你在 Pages 里绑定的自定义域名）。

## 限制

- 分享的 CSV 上限 5 MB；本机查看上限 50 MB。
- 城市名按坐标就近归类，深港交界一带用了一条粗略的分界线，可能不准。
- 延迟为 0 的记录（早期导出常见）不计入延迟统计。
- 底图来自 CARTO / OpenStreetMap，需要联网。
