---
id: nacos
title: Nacos 插件
---

# Nacos 插件

Nacos 插件为 Lynx 提供**服务注册**、**服务发现**和**配置管理**能力，可将 Nacos 同时用作命名服务与配置中心。

## 功能

- **服务注册**：将服务实例注册到 Nacos。
- **服务发现**：从 Nacos 发现实例，并与 Lynx 服务调用集成。
- **配置管理**：从 Nacos 拉取并监听配置，支持实时更新。
- **多配置**：支持多个 dataId、group。
- **鉴权**：用户名/密码或 AccessKey/SecretKey。
- **命名空间**：多租户命名空间隔离。

## 配置

在配置文件中增加 `lynx.nacos` 段：

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

## 使用

在 main 中导入插件并启动应用，插件会根据配置自动加载：

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

当 `enable_config` 为 true 时，Lynx 可从 Nacos 加载主配置，从而由 Nacos 驱动注册、发现与配置。

## 安装

```bash
go get github.com/go-lynx/lynx/plugins/nacos
```

集群模式可将 `server_addresses` 配置为多个 Nacos 地址（逗号分隔）。
