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
