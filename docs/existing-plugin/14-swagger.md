---
id: swagger
title: Swagger 插件
slug: existing-plugin/swagger
---

# Swagger 插件

Swagger 插件为 Lynx HTTP 服务提供 **Swagger/OpenAPI** 文档与 **Swagger UI**，仅用于**开发与测试环境**，在生产环境会自动关闭。

## 功能

- **自动生成 API 文档**：基于 Go 注解。
- **Swagger UI**：浏览与调试接口。
- **文件监听**：文档随代码变更更新。
- **安全**：生产环境禁用；防路径穿越与 XSS；安全头与 CORS 控制。

## 配置

在 `lynx.swagger` 下配置示例：

```yaml
lynx:
  swagger:
    enabled: true
    path: "/swagger"
    base_path: "/"
    doc_path: "./api"
    allowed_envs:
      - development
      - testing
```

## 使用

1. 导入插件：`import _ "github.com/go-lynx/lynx/plugins/swagger"`。
2. 为 HTTP 接口添加注解（如注释或 OpenAPI 描述）。
3. 在开发环境启动后访问 `http://localhost:<端口>/swagger` 使用 Swagger UI。

**注意**：请勿在生产环境启用。插件会根据环境变量（如 `ENV`、`GO_ENV`、`APP_ENV`）判断，在生产模式下不会提供 UI。

## 安装

```bash
go get github.com/go-lynx/lynx/plugins/swagger
```

注解格式与更多选项请参阅该插件在 GitHub 上的 README。
