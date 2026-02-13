---
id: nacos
title: Nacos Plugin
slug: existing-plugin/nacos
---

# Nacos Plugin

The Nacos plugin provides **service registration**, **service discovery**, and **configuration management** for the Lynx framework, so you can use Nacos as both a naming service and a configuration center.

## Features

- **Service registration**: Register service instances with Nacos.
- **Service discovery**: Discover instances and integrate with Lynx service calls.
- **Configuration management**: Load and watch configuration from Nacos with real-time updates.
- **Multi-config**: Support multiple data IDs and groups.
- **Authentication**: Username/password or access key/secret key.
- **Namespace**: Multi-tenant namespace isolation.

## Configuration

Add the following under `lynx.nacos` in your config file:

```yaml
lynx:
  nacos:
    server_addresses: "127.0.0.1:8848"
    namespace: "public"
    username: "nacos"
    password: "nacos"
    enable_register: true
    enable_discovery: true
    enable_config: true
    service_config:
      service_name: "my-service"
      group: "DEFAULT_GROUP"
      cluster: "DEFAULT"
```

## Usage

Import the plugin and start the application; the plugin will load from configuration:

```go
package main

import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/boot"
    _ "github.com/go-lynx/lynx/plugins/nacos"
)

func main() {
    boot.LynxApplication(wireApp).Run()
}
```

When `enable_config` is true, Lynx can load the main configuration from Nacos so that service registration, discovery, and config are all driven by Nacos.

## Installation

```bash
go get github.com/go-lynx/lynx/plugins/nacos
```

For cluster mode, set `server_addresses` to a comma-separated list of Nacos server addresses.
