# 部署说明

## 当前配置（修复 404）

- **baseUrl**: `'/'` — 站点在域名根路径访问（如 https://go-lynx.cn/）
- **构建产物**: `npm run build` 后，`build/` 目录下直接是 `index.html`、`assets/`、`404.html` 等
- **部署**: 将 **整个 `build/` 目录的内容** 作为网站根目录部署（不要只传子目录）

这样资源请求为 `/assets/css/...`、`/assets/js/...`，与服务器上的路径一致，不会 404。

## 使用 GitHub Actions 部署（推荐）

已包含 `.github/workflows/deploy.yml`：推送到 `main` 后自动构建并部署到 GitHub Pages。

在仓库 **Settings → Pages** 中：

1. **Source** 选 **GitHub Actions**
2. 若使用自定义域名（如 go-lynx.cn），在 **Custom domain** 填写并保存

部署完成后访问 https://go-lynx.cn/（或你的自定义域名），不应再出现资源 404。

## 若站点必须在子路径（如 /lynx.github.cn/）

1. 构建时指定 baseUrl：
   ```bash
   BASE_URL=/lynx.github.cn/ npm run build
   ```
2. 部署时：把 **整个 `build` 目录** 作为部署根目录上传（保留 `build` 里的 `lynx.github.cn` 子目录），这样线上会有 `/lynx.github.cn/index.html`、`/lynx.github.cn/assets/...`。

## 404 页面

Docusaurus 会生成 `build/404.html`。部署时确保该文件在网站根目录（即 `build/404.html` 对应 URL 路径 `/404` 或 `/404.html`，视服务器配置而定）。
