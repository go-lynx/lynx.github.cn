---
id: quick-start
title: 快速启动
---

# 快速入门

本指南将帮助您快速入门使用 Go-Lynx，我们为 Go-Lynx 设计了 CLI 项目脚手架工具，以便于快速创建一个微服务项目。

## 安装

首先，使用以下命令安装 Go-Lynx CLI 工具：

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

安装完成后，您可以使用以下命令创建您的微服务模块：

```shell
lynx new demo1 demo2 demo3
```

在这个例子中，模块名称（`demo1`、`demo2`、`demo3`）可以根据您的业务自定义，支持单次创建多微服务模块。

按照这些步骤，您可以快速获得 go-lynx 项目的脚手架，项目模板来自于 [Go-Lynx-Layout](https://github.com/go-lynx/lynx-layout)。

## 了解 Go-Lynx

Go-Lynx 默认使用 Kratos 和 Polaris 的组合，提供一系列微服务治理能力，如注册、发现、配置、限流、降级、路由等。

Go-Lynx 通过解析 YAML 配置文件来加载指定的插件。您可以查看 [Go-Lynx](https://github.com/go-lynx/lynx) 源代码中的插件模块以了解更多信息。

与 Spring Boot 的思维方式类似，您只需要关注配置文件是否正确编辑即可。Go-Lynx 在应用启动时将自动从远程配置中心获取配置。如果您没有使用配置中心，它将仅加载本地引导配置文件来启动应用程序。

Go-Lynx 会根据配置文件中的内容信息，加载自身插件，并自动装配它们。

这使得 Go-Lynx 成为一个高度灵活且功能强大的管理和部署微服务的工具。

## 项目结构

我们沿用了基于 go-kratos 优秀项目结构，但在内部不需要去编写部分组件的初始化代码，以及配置代码，通过 go-lynx 插件管理器已经实现了自动装配功能。

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

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

在程序入口中，您只需要写下这一行代码。Go-Lynx 启动后，将自动执行程序引导过程。执行过程如下：

1. 解析本地引导配置文件并加载相应的插件。
2. 如果插件包含配置中心插件，它将调用插件从远程配置中心获取最新和完整的配置。
3. 然后重复第一步，继续解析并加载对应插件，直至全部插件加载完成。

在此期间，将初始化所有插件功能，并自动执行应用程序的服务发现和注册，以及 HTTP、gRPC 的限流和路由策略同步。