# 自动化文档同步设置

这个文档说明了如何设置自动化同步系统，避免每次手动更新 lynx.github.cn 的内容。

## 🤖 自动化组件

### 1. GitHub Actions 工作流

#### lynx 主项目 (`.github/workflows/trigger-docs-sync.yml`)
- **触发条件**: 当发布新版本时自动触发
- **功能**: 向文档仓库发送同步请求

#### lynx.github.cn (`.github/workflows/sync-from-main-repo.yml`)  
- **触发条件**: 接收到主项目的同步请求
- **功能**: 自动拉取最新内容并更新文档

### 2. 手动同步脚本 (`scripts/manual-sync.sh`)
- **用途**: 立即同步特定版本
- **使用方法**: `./scripts/manual-sync.sh v1.2.3`

## ⚙️ 设置说明

### 前提条件
1. 在 lynx 主项目中添加 `DOCS_SYNC_TOKEN` 秘钥
2. 确保 GitHub Actions 已启用

### 配置步骤

1. **创建 GitHub Personal Access Token**:
   - 访问 GitHub Settings → Developer settings → Personal access tokens
   - 创建具有 `repo` 权限的 token
   - 在 lynx 主项目的 Settings → Secrets 中添加 `DOCS_SYNC_TOKEN`

2. **验证设置**:
   - 在 lynx 主项目中触发手动工作流测试
   - 检查 lynx.github.cn 是否收到同步请求

## 🚀 使用方式

### 自动同步（推荐）
```bash
# 在 lynx 主项目中发布新版本时，自动触发文档同步
# 无需手动操作
```

### 手动同步（紧急情况）
```bash
# 在 lynx.github.cn 目录中运行
./scripts/manual-sync.sh v1.2.3

# 提交更改
git add .
git commit -m "docs: sync for v1.2.3"
git push

# 部署更新
npm run build
npm run deploy
```

### GitHub Actions 手动触发
```bash
# 在 GitHub 网页界面中：
# 1. 进入 lynx 主项目的 Actions 页面
# 2. 选择 "Trigger Documentation Sync" 工作流  
# 3. 点击 "Run workflow" 并输入版本号
```

## 📋 自动化内容

系统会自动同步以下内容：

1. **发布说明**: 从主项目的 `RELEASE_NOTES_*.md` 创建博客文章
2. **文档更新**: 检查是否有需要更新的文档内容
3. **版本标签**: 确保版本信息正确

## ⚠️ 注意事项

1. **版本策略**: 文档中使用 `@latest` 标签，用户总是获取最新版本
2. **手动审查**: 对于包含破坏性更改的版本，建议手动审查
3. **部署时间**: GitHub Pages 部署可能需要几分钟时间

## 🔧 故障排除

### 常见问题

**Q: 自动同步没有触发？**
A: 检查 `DOCS_SYNC_TOKEN` 是否正确配置，确认权限设置正确。

**Q: 同步失败？**  
A: 查看 GitHub Actions 日志，检查网络连接和权限问题。

**Q: 需要立即更新文档？**
A: 使用手动同步脚本或 GitHub Actions 的手动触发功能。

## 📞 支持

如有问题，请在相关仓库中提交 issue 或联系维护团队。