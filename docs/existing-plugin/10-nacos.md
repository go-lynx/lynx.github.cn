---
id: nacos
title: Nacos Plugin
---

# Nacos Plugin

The Nacos plugin brings service registry/discovery and configuration-center capability into Lynx. It fits systems that already use Nacos for naming or configuration and want both capabilities to enter one framework startup path.

## What it is mainly for

- service registration and discovery
- configuration loading and watch behavior
- configuration integration across namespaces, groups, and data IDs

## Basic configuration

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

Anonymous-import the plugin in `main`, then let the application startup flow assemble it:

```go
import (
    "github.com/go-lynx/lynx/boot"
    _ "github.com/go-lynx/lynx/plugin/nacos"
)

func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

When `enable_config` is `true`, Nacos can also participate in main configuration loading. When `enable_register` and `enable_discovery` are enabled, registry and discovery behavior join the runtime as well.

## Practical guidance

- decide early whether config-center and registry behavior should share the same namespace boundary
- distinguish carefully which dynamic config changes are actually safe to apply at runtime
- if your system already has another mature control plane, keep Nacos responsibilities clearly bounded

## Related pages

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
