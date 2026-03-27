---
slug: welcome
title: 欢迎使用 Go-Lynx
authors: [tanzhuo]
tags: [go-lynx, introduction, docusaurus]
---

# 欢迎使用 Go-Lynx

Go-Lynx 是一个开源的 Go 微服务框架，强调插件化、可装配和开箱可用的开发体验。它构建在 Seata、Polaris 和 Kratos 等成熟基础设施之上，目标不是再包一层表面 API，而是简化微服务项目中反复出现的基础设施接入工作，让开发者把更多精力放在业务逻辑上，而不是陷进微服务底层装配细节里。

<!-- truncate -->

## 核心特性

Go-Lynx 提供了一组比较完整的微服务基础能力，包括：

- **服务注册与发现**：简化服务实例的注册、寻址和发现流程。
- **加密的内部通信**：让微服务之间的通信链路具备更可靠的安全保障。
- **限流能力**：帮助服务在高压场景下保持稳定，避免单点过载。
- **路由能力**：支持按版本或策略做流量调度，便于蓝绿发布与灰度发布。
- **降级能力**：在故障场景下提供更平滑的兜底和容错处理。
- **分布式事务**：降低跨服务事务管理的复杂度，提高一致性保障能力。

## 插件驱动的模块化设计

Go-Lynx 的一个核心方向是插件驱动的模块化设计。微服务能力模块通过插件接入和组合，开发者可以按需选取、替换和扩展。任何第三方工具理论上都可以通过插件模式整合进来，从而让整套微服务基础设施更灵活，也更容易随着业务场景演进。

这个方向的重点，不是让插件越多越好，而是让常见基础能力通过统一运行时模型接入，减少项目里的重复胶水代码。

未来版本中，Go-Lynx 还会继续扩展和集成更多中间件能力，在提升微服务可扩展性的同时，也尽量保持整体使用路径清晰一致。

## 构建基础

Go-Lynx 当前借助多种开源项目作为核心组成部分，包括：

- [Seata](https://github.com/seata/seata)
- [Kratos](https://github.com/go-kratos/kratos)
- [Polaris](https://github.com/polarismesh/polaris)

## 快速安装

如果你想体验 Go-Lynx，只需要先安装 Lynx CLI，然后使用 `new` 命令初始化一个可运行项目。`new` 命令支持一次创建多个项目。

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

```shell
lynx new demo1 demo2 demo3
```

## 快速启动代码

要快速启动一个微服务，可以使用类似下面的入口代码（具体功能会根据你的配置和插件情况有所增减）：

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

欢迎一起使用 Go-Lynx 这个插件化的 Go 微服务框架，把微服务开发路径变得更直接、更统一。

## 钉钉交流

![钉钉交流群](https://github.com/go-lynx/lynx/assets/32378959/cfeacfb8-95d4-4b23-8299-a868502f1076)

---
