---
id: layout
title: Lynx 项目模板（Layout）
---

# Lynx 项目模板（Layout）

`lynx-layout` 是官方 Lynx 服务模板仓库。它不是一个可以独立配置的 runtime 插件，所以本页只说明模板仓库边界、它与真实 Lynx runtime 的关系，以及仓库内现有的配置入口，不虚构所谓 `layout` 插件 schema。

## 仓库边界

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-layout` |
| 性质 | 服务模板 / 脚手架仓库 |
| 自身配置前缀 | 无 |
| 自身 Runtime 插件名 | 无 |
| 自身插件 Getter | 无 |
| 它真正提供的内容 | 一个把真实 Lynx 插件装配成服务的可运行骨架 |

## 与 Lynx Runtime 的关系

`lynx-layout` 不替代任何 Lynx runtime 插件，它只是展示真实服务如何把这些插件组合起来。

| 模板文件 / 路径 | 展示的真实运行时依赖 | 为什么重要 |
| --- | --- | --- |
| `cmd/user/wire_gen.go` | `lynx.GetServiceRegistry()` 与应用装配 | 说明服务注册来自真实 Lynx runtime，而不是某个 `layout` 插件。 |
| `internal/server/http.go` | `lynx-http.GetHttpServer()` | 说明 HTTP 能力来自 `lynx-http`。 |
| `internal/server/grpc.go` | `lynx-grpc.GetGrpcServer(nil)` | 说明 gRPC 能力来自 `lynx-grpc`。 |
| `internal/data/data.go` | `lynx-mysql.GetProvider()` | 说明数据库能力来自 MySQL 插件族。 |
| `internal/data/data.go` | `lynx-redis.GetRedis()` | 说明 Redis 能力来自 Redis 插件族。 |
| `deployments/docker-compose.local.yml` 与 `start.sh` | 本地依赖启动路径 | 说明模板如何围绕真实运行时依赖组织本地开发环境。 |

结论很直接：你需要 HTTP、gRPC、MySQL、Redis、Polaris、Kafka 或其他运行时能力时，应直接配置对应的真实插件 / 模块。`lynx-layout` 只是这些部件被装配成服务骨架的地方。

## 仓库内已有配置入口

仓库已经自带若干明确的配置入口。它们属于脚手架，不应被理解成独立 `layout` runtime 插件的配置面。

| 配置入口 | 用途 | 目前已经覆盖的内容 | 不要误解成什么 |
| --- | --- | --- | --- |
| `configs/bootstrap.local.yaml` | 本地可运行启动配置 | `lynx.application`、`lynx.log`、`lynx.http`、`lynx.grpc.service`、`lynx.mysql`、`lynx.redis` | 它不是一个“插件总开关清单”，也不代表模板默认启用了所有插件。 |
| `configs/bootstrap.yaml` | 偏治理场景的启动配置 | `lynx.application` 以及 `lynx.polaris` 的 `config_path`、`namespace`、`token`、`weight`、`ttl`、`timeout` 等 | 它是 Polaris 场景的模板入口，不是独立的 `layout` runtime 命名空间。 |
| `README` 中的可选 auth 示例 | 外部登录鉴权 gRPC 接入入口 | `lynx.layout.auth.grpc.service`、`lynx.layout.auth.grpc.method`、`lynx.layout.auth.grpc.timeout` 及对应环境变量 | 它是应用级可选扩展，不是通用的 `layout` runtime 插件。 |

## 阅读规则

- 把 `lynx-layout` 理解成模板仓库边界，而不是插件边界。
- 把 `configs/bootstrap.local.yaml` 和 `configs/bootstrap.yaml` 理解成组合真实 Lynx 模块的服务启动示例。
- 增删真实插件时，应修改服务 bootstrap 和装配代码，而不是去寻找一个并不存在的 `layout` runtime plugin schema。

## 如何使用

先安装 Lynx CLI：

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

再生成项目：

```bash
lynx new demo
```

## 本地运行路径

模板已经自带本地 bootstrap 路径和依赖 compose 文件：

```bash
docker compose -f deployments/docker-compose.local.yml up -d
go run ./cmd/user -conf ./configs/bootstrap.local.yaml
```

## 相关页面

- [快速开始](/docs/getting-started/quick-start)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
