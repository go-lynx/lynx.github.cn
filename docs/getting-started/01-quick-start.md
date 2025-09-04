---
id: quick-start
title: Quick Start
---

# Quick Start Guide

This guide will help you get started with **Lynx Framework v1.2.3** quickly - our first production-ready release! We have designed a powerful CLI scaffolding tool for Lynx to facilitate the rapid creation of enterprise-grade microservice projects.

## Installation

### Prerequisites
- **Go 1.21+** (Go 1.24.3 recommended)
- **Docker 20.10+** (for containerized deployment)
- **2GB RAM minimum** (4GB+ recommended for production)

### Install Lynx CLI Tool

```shell
# Install the latest Lynx CLI (v1.2.3+)
go install github.com/go-lynx/lynx/cmd/lynx@latest

# Verify installation
lynx --version
```

### Create Your First Microservice

```shell
# Create a single service
lynx new my-service

# Create multiple services at once
lynx new user-service order-service payment-service

# Create with custom configuration
lynx new demo --module github.com/acme/demo --post-tidy --ref v1.2.3
```

The CLI supports creating multiple microservice modules simultaneously with production-ready templates.

### Development Commands

```shell
# Run with hot-reload development server
lynx run --watch

# Diagnose and auto-fix common issues
lynx doctor --fix

# Generate plugin scaffolding
lynx plugin create my-plugin
```

By following these steps, you can quickly obtain a production-ready scaffolding for your Lynx project. The project template is derived from [Go-Lynx-Layout](https://github.com/go-lynx/lynx-layout).

## Understanding Lynx Framework

**Lynx Framework v1.2.3** is a production-ready, plugin-based Go microservice framework built on proven technologies like Kratos and Polaris. It provides comprehensive microservice governance capabilities including:

- **Service Discovery & Registration** - Automatic service mesh integration
- **Configuration Management** - Centralized configuration with hot-reload
- **Circuit Breaking & Rate Limiting** - Enterprise-grade fault tolerance
- **Distributed Tracing** - OpenTelemetry-compatible observability
- **Load Balancing & Routing** - Intelligent traffic management

### 🔌 Complete Plugin Ecosystem (18 Production-Ready Plugins)

**Database Plugins**: MySQL, PostgreSQL, SQL Server  
**NoSQL Plugins**: Redis (162K+ ops/sec), MongoDB, Elasticsearch  
**Message Queue Plugins**: Kafka (30K+ msg/sec), RabbitMQ (175K+ msg/sec), RocketMQ, Pulsar  
**Service Mesh**: Polaris, HTTP Service, gRPC Service  
**Distributed Transaction**: Seata, DTM  
**Observability**: Tracer (OpenTelemetry), Swagger

### Plugin-Based Architecture

Similar to Spring Boot's approach, Lynx uses YAML configuration files to load and orchestrate plugins automatically. The framework:

1. **Parses configuration** and loads required plugins
2. **Retrieves remote configuration** from configuration centers (if configured)
3. **Auto-assembles plugins** with complete dependency injection
4. **Initializes services** with monitoring and health checks

This makes Lynx a highly flexible and powerful framework for building enterprise-grade microservices.

## Project Structure

We follow the excellent project structure based on go-kratos, enhanced with Lynx's plugin-based architecture. You don't need to write boilerplate initialization code - the Lynx plugin manager handles automatic assembly and dependency injection.

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

### Modern Application Bootstrap (v1.2.3+)

```go
package main

import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/boot"
    // Import required plugins
    _ "github.com/go-lynx/lynx/plugins/nosql/redis"
    _ "github.com/go-lynx/lynx/plugins/mq/kafka"
    _ "github.com/go-lynx/lynx/plugins/service/http"
)

func main() {
    // Initialize Lynx application
    lynxApp := app.NewLynx()
    
    // Bootstrap with configuration
    boot.Bootstrap(lynxApp, "config.yaml")
    
    // Start the application
    lynxApp.Run()
}
```

### Legacy Bootstrap (Compatible)

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

### Bootstrap Process

When Lynx starts, it executes a sophisticated bootstrap sequence:

1. **Configuration Parsing** - Load local bootstrap configuration and initialize plugins
2. **Remote Configuration** - Retrieve complete configuration from configuration centers (if enabled)
3. **Plugin Orchestration** - Load and assemble all plugins with dependency injection
4. **Service Registration** - Auto-register services with discovery mechanisms
5. **Health Checks** - Initialize monitoring endpoints and health probes
6. **Traffic Management** - Sync HTTP/gRPC routing and rate limiting strategies

### 📊 Built-in Monitoring

Lynx automatically exposes:
- **52+ Prometheus metrics** with standardized naming
- **Health check endpoints** (`/health`, `/ready`)
- **Performance monitoring** for all plugins
- **Distributed tracing** integration

### 🚀 Ready for Production

With v1.2.3, your applications are production-ready out of the box with enterprise-grade:
- **Error recovery** with circuit breaker patterns
- **Resource management** with type-safe access
- **Event system** supporting 1M+ events/second
- **Plugin hot-swapping** with zero downtime