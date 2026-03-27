---
id: layout
title: Lynx 项目模板（Layout）
---

# Lynx 项目模板（Layout）

`lynx-layout` 是与当前 Lynx runtime 和插件模型对齐的官方服务模板仓库。

## 它真正展示的是什么

`lynx-layout` 本身不是 runtime 插件，而是一套示例应用骨架，用来展示当前 Lynx 服务应该如何装配。

## 代码级事实

从仓库实现可以直接看到：

- 启动入口使用 `boot.NewApplication(wireApp).Run()`
- HTTP server 装配使用 `github.com/go-lynx/lynx-http` 和 `GetHttpServer()`
- gRPC server 装配使用 `github.com/go-lynx/lynx-grpc` 和 `GetGrpcServer(nil)`
- data 层已经直接依赖 MySQL、Redis 等具体插件，而不是抽象的占位包
- service registry 装配使用 `lynx.GetServiceRegistry()`

## 与真实代码一致的模板配置

当前模板实际暴露了两类很有代表性的配置视图。

`configs/bootstrap.local.yaml` 是更偏本地开发的可运行形态：

```yaml
lynx:
  http:
    addr: 127.0.0.1:8000
  grpc:
    service:
      addr: 127.0.0.1:9000
  mysql:
    driver: mysql
    source: "..."
  redis:
    addrs:
      - 127.0.0.1:6379
```

`configs/bootstrap.yaml` 则是更偏治理场景的窄配置形态：

```yaml
lynx:
  application:
    name: user-service
  polaris:
    config_path: "configs/polaris.yaml"
```

这里有个很多插件文档没有讲透的点：模板不会一上来把所有插件全打开，而是先从一个可运行的小组合启动，再把治理相关配置单独叠上去。

## 模板里的真实代码路径

模板同时也展示了业务代码真正会依赖的公开接入入口：

- `internal/server/http.go` 调用 `lynx-http.GetHttpServer()`
- `internal/server/grpc.go` 调用 `lynx-grpc.GetGrpcServer(nil)`
- `internal/data/data.go` 调用 `lynx-redis.GetRedis()`
- `internal/data/data.go` 调用 `lynx-mysql.GetProvider()`
- `cmd/user/wire_gen.go` 调用 `lynx.GetServiceRegistry()`

这也是为什么 `lynx-layout` 是理解当前插件家族真实使用方式的最好参考。

## 结构

```text
api      协议定义与生成代码
biz      业务流程与领域逻辑
bo       共享业务对象
conf     配置结构与映射
data     repository 与外部依赖接入
service  服务层逻辑
server   HTTP 与 gRPC 注册
cmd      应用入口和 Wire 装配
```

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

`lynx-layout` 已经自带本地 bootstrap 路径和依赖 compose 文件：

```bash
docker compose -f deployments/docker-compose.local.yml up -d
go run ./cmd/user -conf ./configs/bootstrap.local.yaml
```

本地配置路径适合你先从 DB、Redis、HTTP、gRPC 启动，而不必一开始就把完整治理依赖全引进来。

## 相关页面

- [快速开始](/docs/getting-started/quick-start)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
