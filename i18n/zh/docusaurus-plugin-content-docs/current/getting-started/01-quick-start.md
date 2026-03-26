---
id: quick-start
title: 快速启动
---

# 快速入门

本指南将帮助您快速上手当前版本的 Lynx。Lynx 提供了 CLI 脚手架、插件注册、配置装配与统一运行时，用于快速搭建治理型 Go 微服务项目。

## 安装

### 前置要求
- **Go 1.21+**（推荐 Go 1.24.3）
- **Docker 20.10+**（用于容器化部署）
- **最少 2GB 内存**（生产环境推荐 4GB+）

### 安装 Lynx CLI 工具

```shell
# 安装最新的 Lynx CLI
go install github.com/go-lynx/lynx/cmd/lynx@latest

# 验证安装
lynx --version
```

### 创建您的第一个微服务

```shell
# 创建单个服务
lynx new my-service

# 一次创建多个服务
lynx new user-service order-service payment-service

# 使用自定义模块路径创建
lynx new demo --module github.com/acme/demo --post-tidy
```

CLI 支持同时创建多个具有生产就绪模板的微服务模块。

### 开发命令

```shell
# 使用热重载开发服务器运行
lynx run --watch

# 诊断并自动修复常见问题
lynx doctor --fix

# 生成插件脚手架
lynx plugin create my-plugin
```

按照这些步骤，您可以快速获得生产就绪的 Lynx 项目脚手架。项目模板来自于 [Go-Lynx-Layout](https://github.com/go-lynx/lynx-layout)。

## 了解 Lynx Framework

Lynx 是一个基于插件的 Go 微服务框架，构建在成熟的工程组件之上，并将脚手架、配置、插件接入和运行时启动整合到一条开发路径中。它提供的核心能力包括：

- **服务发现与注册** - 自动服务网格集成
- **配置管理** - 集中式配置与热重载
- **熔断与限流** - 企业级容错能力
- **分布式链路追踪** - OpenTelemetry 兼容的可观测性
- **负载均衡与路由** - 智能流量管理

### 当前插件生态

Lynx 的插件家族覆盖数据库、缓存、消息队列、配置中心、服务发现、可观测性与分布式能力。实际可用插件与模块路径应以对应插件仓库或插件 README 为准。

### 基于插件的架构

类似于 Spring Boot 的方式，Lynx 使用 YAML 配置文件来自动加载和编排插件。框架会：

1. **解析配置** 并加载所需插件
2. **获取远程配置** 从配置中心（如果配置）
3. **自动装配插件** 完成依赖注入
4. **初始化服务** 配置监控和健康检查

这使得 Lynx 成为构建企业级微服务的高度灵活且功能强大的框架。

## 项目结构

我们沿用了基于 go-kratos 的优秀项目结构，并增强了 Lynx 基于插件的架构。您无需编写样板初始化代码 - Lynx 插件管理器处理自动装配和依赖注入。

```
.
├── api // 下面维护了微服务使用的proto文件以及根据它们所生成的go文件
│   └── helloworld
│       └── v1
│           ├── error_reason.pb.go
│           ├── error_reason.proto
│           ├── error_reason.swagger.json
│           ├── greeter.pb.go
│           ├── greeter.proto
│           ├── greeter.swagger.json
│           ├── greeter_grpc.pb.go
│           └── greeter_http.pb.go
├── cmd  // 整个项目启动的入口文件
│   └── server
│       ├── main.go
│       ├── wire.go  // 使用wire来维护依赖注入
│       └── wire_gen.go
├── configs  // 这里通常配置微服务本地引导配置文件
│   └── config.yaml
├── generate.go
├── go.mod
├── go.sum
├── internal  // 该服务所有不对外暴露的代码，通常的业务逻辑都在这下面，使用internal避免错误引用
│   ├── biz   // 业务逻辑的组装层，类似 DDD 的 domain 层，data 类似 DDD 的 repo，而 repo 接口在这里定义，使用依赖倒置的原则。
│   │   ├── README.md
│   │   ├── biz.go
│   │   └── greeter.go
│   ├── conf  // 内部使用的config的结构定义，使用proto格式生成
│   │   ├── conf.pb.go
│   │   └── conf.proto
│   ├── data  // 业务数据访问，包含 cache、db 等封装，实现了 biz 的 repo 接口。我们可能会把 data 与 dao 混淆在一起，data 偏重业务的含义，它所要做的是将领域对象重新拿出来，我们去掉了 DDD 的 infra层。
│   │   ├── README.md
│   │   ├── data.go
│   │   └── greeter.go
│   ├── server  // http和grpc实例的模块注册以及创建和配置
│   │   ├── grpc.go
│   │   ├── http.go
│   │   └── server.go
│   └── service  // 实现了 api 定义的服务层，类似 DDD 的 application 层，处理 DTO 到 biz 领域实体的转换(DTO -> DO)，同时协同各类 biz 交互，但是不应处理复杂逻辑
│       ├── README.md
│       ├── greeter.go
│       └── service.go
└── third_party  // api 依赖的第三方proto
    ├── README.md
    ├── google
    │   └── api
    │       ├── annotations.proto
    │       ├── http.proto
    │       └── httpbody.proto
    └── validate
        ├── README.md
        └── validate.proto
```


## 应用程序入口

### 当前推荐的应用启动方式

```go
package main

import (
    "github.com/go-lynx/lynx/boot"
    // 导入所需插件以完成注册
    _ "github.com/go-lynx/plugins/mq/kafka"
    _ "github.com/go-lynx/plugins/nosql/redis"
    _ "github.com/go-lynx/plugins/service/http"
)

func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

### 接入要点

- 使用 CLI 初始化项目与目录骨架
- 通过 YAML 配置声明插件能力
- 在代码中匿名导入需要注册的插件包
- 使用 `boot.NewApplication(wireApp).Run()` 启动应用

### 启动流程

Lynx 启动时会执行完善的引导序列：

1. **配置解析** - 加载本地引导配置并初始化插件
2. **远程配置** - 从配置中心获取完整配置（如果启用）
3. **插件编排** - 加载并装配所有插件及依赖注入
4. **服务注册** - 自动向发现机制注册服务
5. **健康检查** - 初始化监控端点和健康探针
6. **流量管理** - 同步 HTTP/gRPC 路由和限流策略

### 内置监控

Lynx 自动暴露：
- **52+个 Prometheus 指标** 标准化命名
- **健康检查端点**（`/health`、`/ready`）
- **所有插件性能监控**
- **分布式链路追踪** 集成

### 生产就绪

默认接入完成后，应用通常会具备以下工程能力：
- **错误恢复** 熔断器模式
- **资源管理** 类型安全访问
- **事件系统** 支持每秒100万+事件
- **插件热插拔** 零停机时间

## 下一步

- **[引导配置](/docs/getting-started/bootstrap-config)** — 配置 `-conf`、本地与远程配置、Polaris/Nacos。
- **[插件管理](/docs/getting-started/plugin-manager)** — 插件加载、依赖与自定义插件。
- **[插件生态](/docs/existing-plugin/plugin-ecosystem)** — 插件完整列表及各插件文档链接。
- **[框架架构](/docs/intro/arch)** — 分层运行时、启动流程与性能特性。
