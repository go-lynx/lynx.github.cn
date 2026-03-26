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

在 `main` 中完成应用启动，Nacos 插件会根据配置参与启动流程：

```go
package main

import (
    "github.com/go-lynx/lynx/boot"
)

func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

如果项目通过独立插件仓库接入 Nacos，请在代码中匿名导入对应插件包，以完成注册。实际模块路径以该插件仓库 README 为准。

当 `enable_config` 为 `true` 时，Lynx 可从 Nacos 拉取主配置，从而由 Nacos 驱动注册、发现与配置。

## 安装

```bash
go get <nacos-plugin-module>@latest
```

集群模式可将 `server_addresses` 配置为多个 Nacos 地址（逗号分隔）。
