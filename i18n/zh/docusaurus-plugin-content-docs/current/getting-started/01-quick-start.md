---
id: quick-start
title: 快速开始
---

# 快速开始

本页的目标不是罗列所有功能，而是帮助你按照当前工作流，先跑起一个**可运行、可扩展**的 Lynx 服务。

## 前置要求

- Go 1.24+
- Git
- 能访问 Go 模块和模板仓库的网络环境

如果你想立即试数据库、消息队列或配置中心插件，就按需提前准备这些服务。CLI 和项目脚手架并不要求你第一天就把整套基础设施全部接好。

## 1. 安装 Lynx CLI

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
lynx --version
```

当前 Lynx CLI 主要负责：

- 通过 `lynx new` 生成项目脚手架
- 通过 `lynx run --watch` 支持本地开发
- 提供 `lynx doctor` 之类的诊断和辅助流程

## 2. 创建项目

```bash
# 创建一个服务
lynx new my-service

# 一次创建多个服务
lynx new user-service order-service payment-service
```

如果你希望创建时有更多控制，可以使用模块路径、模板引用、插件选择等参数：

```bash
lynx new demo \
  --module github.com/acme/demo \
  --post-tidy \
  --plugins http,grpc,redis
```

官方模板来自 [lynx-layout](https://github.com/go-lynx/lynx-layout)，它会跟当前 Lynx 运行时模型保持同步。

## 3. 启动服务

在官方模板中，入口通常长这样：

```go
package main

import "github.com/go-lynx/lynx/boot"

func main() {
	err := boot.NewApplication(wireApp).Run()
	if err != nil {
		panic(err)
	}
}
```

本地开发时，常见路径是：

```bash
lynx run --watch
```

在开始叠加更多能力之前，这样就足够验证脚手架和引导路径是否正常。

如果你想直接运行生成出来的二进制，常见启动方式仍然是：

```bash
./bin/server -conf ./configs
```

这一步的目标很直接：先确认 `boot.NewApplication(wireApp).Run()` 能正确读取引导配置，并把基础 runtime 拉起来，再去继续接插件。

## 4. 理解生成出来的项目

官方模板采用了适配 Lynx 的 Kratos 风格分层结构。最值得先理解的部分是：

- `cmd/`：应用入口
- `configs/`：本地引导配置
- `internal/server/`：HTTP / gRPC 服务暴露与注册
- `internal/service/`：接口层
- `internal/biz/`：业务编排
- `internal/data/`：存储与外部集成

真正重要的不是文件夹名字本身，而是：**Lynx 负责运行时装配，你的业务代码则接入约定好的层次。**

## 5. 插件接入是怎么工作的

当前 Lynx 模块家族已经覆盖服务、配置、存储、消息、治理、可观测性和分布式能力。常见接入路径是：

1. 添加插件模块依赖
2. 配置该插件实际使用的前缀
3. 如果插件通过 `init()` 自注册，就匿名导入模块
4. 让 `boot.NewApplication(wireApp).Run()` 完成统一运行时装配
5. 启动后通过 Getter 或插件管理器获取能力

例如，一个更真实的起步接法是：

```bash
go get github.com/go-lynx/lynx-http
go get github.com/go-lynx/lynx-redis
```

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
  redis:
    addrs:
      - 127.0.0.1:6379
```

```go
import (
    _ "github.com/go-lynx/lynx-http"
    _ "github.com/go-lynx/lynx-redis"
)
```

这才是当前真实的 runtime 路径。只有配置不够，只有导入也不够。

## 5.1 官方模板到底配置了什么

这里最值得纠正的一点是：插件页通常一次只讲一个能力，但 `lynx-layout` 展示的是一个真实服务实际如何把这些能力组合起来启动。

当前 `lynx-layout/configs/bootstrap.local.yaml` 里实际接了这些配置：

```yaml
lynx:
  http:
    network: tcp
    addr: 127.0.0.1:8000
    timeout: 5s

  grpc:
    service:
      network: tcp
      addr: 127.0.0.1:9000
      timeout: 5s

  mysql:
    driver: mysql
    source: "lynx:lynx123456@tcp(127.0.0.1:3306)/lynx_test?charset=utf8mb4&parseTime=True&loc=Local"

  redis:
    addrs:
      - 127.0.0.1:6379
```

这意味着模板实际在告诉你这些更具体的事实：

- HTTP 用的是 `lynx.http`
- gRPC 服务端用的是 `lynx.grpc.service`，不是扁平的 `lynx.grpc`
- MySQL 用的是 `lynx.mysql`
- Redis 用的是 `lynx.redis`
- 本地模板启动路径不会一开始就把所有治理插件全部打开

与之配套的 `configs/bootstrap.yaml` 更窄一些，主要展示的是应用元数据和 `lynx.polaris` 这类治理启动配置。

如果某个插件页看起来比模板更抽象，优先以模板里的具体配置形状为准，再回到插件页理解这个能力的完整边界。

你也可以把模板当前启动模型简单记成这样：

- 本地 bootstrap 默认项：HTTP、gRPC 服务端、MySQL、Redis
- 治理 bootstrap 默认项：应用元数据和 Polaris
- 后续按需叠加：大多数 MQ、配置中心、文档、保护、锁、TLS 插件
- 一个特例：tracer 已被导入，但默认本地配置里没有显式展开

这个简单划分，通常已经足够解释为什么某个插件页本身是准确的，但模板里暂时还没有把它展开出来。

## 5.2 模板代码里实际怎么拿能力

`lynx-layout` 还明确展示了业务代码真正会消费的公开 API 形态：

- HTTP server：`lynx-http.GetHttpServer()`
- gRPC server：`lynx-grpc.GetGrpcServer(nil)`
- Redis client：`lynx-redis.GetRedis()`
- MySQL provider：`lynx-mysql.GetProvider()`
- service registry：`lynx.GetServiceRegistry()`

这正是“插件配置”和“业务代码最终怎么拿到 runtime 对象”之间缺失的那一段。

当前官方模块包括：

- 服务与治理：HTTP、gRPC、Polaris、Nacos、Etcd、Apollo、Sentinel、Swagger、Tracer
- 数据与存储：Redis、MongoDB、Elasticsearch、MySQL、PostgreSQL、SQL Server、SQL SDK
- 消息与异步：Kafka、RabbitMQ、RocketMQ、Pulsar
- 分布式能力：Seata、DTM、Redis Lock、Etcd Lock、Eon ID

每个插件页面都会解释自己的配置、Getter、使用方式和注意事项。

如果你是第一次选模块，最稳妥的顺序通常是：

1. 先接 HTTP 或 gRPC
2. 再接一个数据层模块，比如 Redis 或 MongoDB
3. 最后再加一个可观测或治理模块，比如 Tracer 或 Polaris

这样启动问题更容易定位。

## 6. 推荐下一步

当你的第一个服务已经能跑起来后，建议按这个顺序继续读：

- [引导配置](/docs/getting-started/bootstrap-config)：理解本地和远程配置入口
- [插件管理](/docs/getting-started/plugin-manager)：理解排序、依赖和装配
- [插件使用指南](/docs/getting-started/plugin-usage-guide)：掌握适用于大多数插件的一致接入流程
- [插件生态](/docs/existing-plugin/plugin-ecosystem)：按能力域浏览模块
- [框架架构](/docs/intro/arch)：理解运行时模型和启动链路

## 常见误区

- **项目还没跑起来，就想先把所有插件全接完**

  更合理的路径是：先让脚手架跑通，再逐步增加能力。

- **把 Lynx 只当成一个 HTTP 框架**

  更准确的理解是：它是一层微服务基础设施编排层，HTTP 和 gRPC 只是其中两个插件。

- **把插件当成互不相关的 SDK**

  Lynx 的价值恰恰在于：这些插件共享同一套运行时模型，而不是变成彼此孤立的集成。
