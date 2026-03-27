---
id: tls-manager
title: 证书管理
---

# 证书管理

Lynx 里的 TLS 能力是核心仓库中的 runtime 级证书加载插件，并不是挂在 `lynx.application.tls` 下面的一组旧配置。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx/tls` |
| 配置前缀 | `lynx.tls` |
| Runtime 插件名 | `tls` |
| 公开方法 | `GetCertificate()`、`GetPrivateKey()`、`GetRootCACertificate()` |

## 实现实际支持什么

当前 TLS loader 支持多种证书来源：

- `local_file`
- `memory`
- `control_plane`
- `auto`

同时还支持：

- 文件监听与热重载
- 基于 certificate manager 的统一加载
- 向后兼容的 control-plane fallback
- auth type、hostname 校验、最小 TLS 版本等通用 TLS 设置

## 配置

```yaml
lynx:
  tls:
    source_type: "local_file"
    local_file:
      cert_file: "/etc/ssl/certs/server.crt"
      key_file: "/etc/ssl/private/server.key"
      root_ca_file: "/etc/ssl/certs/ca.crt"
      watch_files: true
      reload_interval: "5s"
    common:
      auth_type: 4
      verify_hostname: true
      min_tls_version: "1.2"
```

如果仍然依赖控制面下发证书，也支持：

```yaml
lynx:
  tls:
    source_type: "control_plane"
    file_name: "tls-config"
    group: "security"
```

## 官方模板实际怎么用

官方模板默认不会在 `bootstrap.local.yaml` 里启用 TLS。

这也是为什么模板里的 HTTP 和 gRPC 示例一开始看起来都是明文监听。TLS 被当成后续叠加的运维层，接入时要组合这三部分：

- `lynx.tls`
- `lynx.http.tls_enable: true`
- `lynx.grpc.service.tls_enable: true`

所以这页应该被理解成 HTTP 和 gRPC 在开启传输层安全之后依赖的证书提供层，而不是一个独立的业务向服务插件。

## 它如何接到 HTTP 和 gRPC 上

TLS loader 会把 certificate provider 挂到 Lynx app 上，HTTP 和 gRPC 在各自启用 TLS 时再消费这个 provider：

```yaml
lynx:
  tls:
    source_type: "local_file"
    local_file:
      cert_file: "/etc/ssl/certs/server.crt"
      key_file: "/etc/ssl/private/server.key"
  http:
    addr: ":8080"
    tls_enable: true
  grpc:
    service:
      addr: ":9090"
      tls_enable: true
```

这里最关键的修正是：当前文档应该写 `lynx.tls`、`lynx.http.tls_enable` 和 `lynx.grpc.service.tls_enable`，而不是旧的 `tls: true` 写法。

## 相关页面

- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
- [引导配置](/docs/getting-started/bootstrap-config)
