---
id: quick-start
title: Quick Start
---

# Quick Start Guide

This guide will help you get started with Go-Lynx quickly. We have designed a CLI scaffolding tool for Go-Lynx to facilitate the rapid creation of a microservice project.

## Installation

First, install the Go-Lynx CLI tool using the following command:

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

After installation, you can create your microservice modules using the following command:

```shell
lynx new demo1 demo2 demo3
```

In this example, the module names (`demo1`, `demo2`, `demo3`) can be customized according to your business needs, and it supports the creation of multiple microservice modules at once.

By following these steps, you can quickly obtain the scaffolding for a go-lynx project. The project template is derived from [Go-Lynx-Layout](https://github.com/go-lynx/lynx-layout).

## Understanding Go-Lynx

Go-Lynx defaults to using a combination of Kratos and Polaris to provide a range of microservice governance capabilities, such as registration, discovery, configuration, rate limiting, routing, etc.

Go-Lynx loads specified plugins by parsing YAML configuration files. You can view the plugin modules in the [Go-Lynx](https://github.com/go-lynx/lynx) source code to learn more.

Similar to the Spring Boot approach, you only need to ensure that the configuration file is correctly edited. Go-Lynx will automatically retrieve configurations from a remote configuration center at application startup. If you do not use a configuration center, it will only load the local bootstrap configuration file to start the application.

Go-Lynx loads its own plugins based on the content information in the configuration file and automatically assembles them.

This makes Go-Lynx a highly flexible and powerful tool for managing and deploying microservices.

## Project Structure

We follow the excellent project structure based on go-kratos, but you do not need to write the initialization code and configuration code for some components internally. The automatic assembly function has been implemented by the go-lynx plugin manager.

```
.
├── api // Maintains the proto files used by the microservice and the generated go files based on them
│   └── helloworld
│       ├── v1
│           ├── error_reason.pb.go
│           ├── error_reason.proto
│           ├── error_reason.swagger.json
│           ├── greeter.pb.go
│           ├── greeter.proto
│           ├── greeter.swagger.json
│           ├── greeter_grpc.pb.go
│           └── greeter_http.pb.go
├── cmd  // The entry file for the entire project to start
│   └── server
│       ├── main.go
│       ├── wire.go  // Uses wire to maintain dependency injection
│       └── wire_gen.go
├── configs  // Typically contains the local bootstrap configuration files for the microservice
│   └── config.yaml
├── generate.go
├── go.mod
├── go.sum
├── internal  // All non-exposed code for the service, usually the business logic is here. Using internal avoids incorrect references
│   ├── biz   // The assembly layer of business logic, similar to the domain layer in DDD, data is similar to the repo in DDD, and the repo interface is defined here, using the principle of dependency inversion.
│   │   ├── README.md
│   │   ├── biz.go
│   │   └── greeter.go
│   ├── conf  // Internal config structure definitions, generated using the proto format
│   │   ├── conf.pb.go
│   │   └── conf.proto
│   ├── data  // Business data access, including cache, db encapsulation, implements the biz repo interface. We may confuse data with dao, data focuses on business meaning, it needs to take the domain object out again, we removed the infra layer of DDD.
│   │   ├── README.md
│   │   ├── data.go
│   │   └── greeter.go
│   ├── server  // Module registration and creation and configuration of http and grpc instances
│   │   ├── grpc.go
│   │   ├── http.go
│   │   └── server.go
│   └── service  // Implements the service layer defined in the api, similar to the application layer in DDD, handles the conversion of DTO to biz domain entities (DTO -> DO), and coordinates various biz interactions, but should not handle complex logic
│       ├── README.md
│       ├── greeter.go
│       └── service.go
└── third_party  // Third-party proto dependencies for the api
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

## Application Entry Point

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

In the program entry point, you only need to write this line of code. After Go-Lynx starts, it will automatically execute the program bootstrap process. The execution process is as follows:

1. Parse the local bootstrap configuration file and load the corresponding plugins.
2. If the plugins include a configuration center plugin, it will call the plugin to retrieve the latest and complete configuration from the remote configuration center.
3. Then repeat the first step, continue to parse and load the corresponding plugins until all plugins are loaded.

During this time, all plugin features will be initialized, and the service discovery and registration of the application will be automatically executed, along with the synchronization of HTTP and gRPC rate limiting and routing strategies.