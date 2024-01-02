---
id: quick-start
title: 快速启动
---

# Quick Start

This guide will help you get started with the go-lynx CLI project scaffolding tool.

## Installation

First, install the go-lynx CLI using the following command:

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

Once the installation is complete, you can create your microservice modules using the following command:

```shell
lynx new demo1 demo2 demo3
```

The module names (`demo1`, `demo2`, `demo3` in this case) can be customized according to the modules in your business.

By following these steps, you can quickly obtain the go-lynx project scaffold.

## About go-lynx

By default, go-lynx uses a combination of Kratos and Polaris, providing a range of microservice capabilities such as registration, discovery, rate limiting, degradation, routing, and more.

go-lynx works by parsing yaml configuration files to load specified plugins. You can view the plugin modules in the go-lynx source code to learn more.

Similar to the mindset of Spring Boot, you only need to focus on whether the configuration file is edited correctly. go-lynx will automatically fetch configurations from the remote configuration center upon startup. If you're not using a configuration center, it will only load the local bootstrap configuration file to start the application.

This makes go-lynx a highly flexible and powerful tool for managing and deploying microservices.

## Application Entry Point

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

In the main entry point, you only need to write this line of code. After go-lynx starts, it will automatically perform program bootstrapping. The execution process is as follows:

1. Parse the local bootstrap configuration file and load the corresponding plugins.
2. If the plugin includes a configuration center, it will fetch the latest and complete configuration remotely.
3. It will then repeat the first step.

During this time, all plugin features will be initialized, and the application's discovery and registration, as well as http, grpc's rate limiting, and routing policy synchronization will be automatically performed.

## Conclusion

With go-lynx, you can quickly and easily set up your project, define your microservices, and get your application up and running. With its robust set of features and easy-to-use interface, go-lynx is a valuable tool for any developer working with microservices.