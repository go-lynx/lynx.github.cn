---
id: swagger
title: Swagger 插件
---

# Swagger 插件

`lynx-swagger` 是 Lynx HTTP 服务的文档与 Swagger UI 插件。当前实现不只是简单挂一个 `/swagger` 页面，而是支持扫描 Go 注解、合并外部 spec 文件、从 `lynx.http` 推导 API server 地址、落盘合并后的文档产物，并独立启动 UI 服务。

## 运行时事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-swagger` |
| 配置前缀 | `lynx.swagger` |
| runtime 插件名 | `swagger` |
| 主要 Getter | `GetSwagger()` |

## 实现里实际提供了什么

- 从 `lynx.swagger` 读取插件配置
- 支持 `generator` 配置段，用于注解扫描、外部 spec 合并、watch 与输出文件持久化
- 支持 `ui` 配置段，用于在指定端口和路径暴露 Swagger UI
- 支持 `api_server` 配置段，让 Swagger UI 的 “Try it out” 请求打到真实 HTTP 服务
- 当 `api_server.host` 为空时，会尝试从 `lynx.http.addr` 推导服务地址

## 配置示例

```yaml
lynx:
  swagger:
    enabled: true
    generator:
      enabled: true
      scan_dirs:
        - "./"
      output_path: "./docs/openapi.yaml"
      watch_enabled: true
    ui:
      enabled: true
      port: 8080
      path: "/swagger"
      title: "API Documentation"
    api_server:
      host: "localhost:8080"
      base_path: "/api/v1"
    info:
      title: "User Service API"
      version: "1.0.0"
      description: "HTTP API documentation"
```

## 使用方式

```go
import swagger "github.com/go-lynx/lynx-swagger"
```

插件会通过 `GetSwagger()` 暴露生成后的 Swagger 对象：

```go
plugin := swagger.GetSwagger()
spec := plugin.GetSwagger()
_ = spec
```

启动后访问类似 `http://localhost:8080/swagger` 的 UI 路径即可。

## 实践建议

- 适合默认开启在开发、测试或受控的内部环境
- 如果你同时依赖外部 OpenAPI 文件，`generator.output_path` 最好和生成链路保持一致，避免文档产物漂移
- 不要把 Swagger UI 当成安全边界，它只是文档入口

## 相关页面

- 仓库: [go-lynx/lynx-swagger](https://github.com/go-lynx/lynx-swagger)
- [HTTP](/docs/existing-plugin/http)
