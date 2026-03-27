---
id: pulsar
title: Pulsar 插件
---

# Pulsar 插件

Pulsar 插件是一个由 runtime 持有的 Pulsar Client，同时管理命名 producer 和 consumer 资源。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-pulsar` |
| 配置前缀 | `lynx.pulsar` |
| Runtime 插件名 | `pulsar.client` |
| 公开 API | `GetPulsarClient()`、`GetPulsarClientByName()` |

## 实现里支持什么

当前插件包含：

- 一个受管的 Pulsar client
- 多个配置化 producer
- 多个配置化 consumer
- 鉴权与 TLS 设置
- connection manager
- retry manager
- 健康检查与指标

`GetPulsarClientByName()` 这个 API 已经存在，但当前实现仍然返回主 client，并不代表真正的多 runtime 插件实例。

## 配置

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650"
    producers:
      - name: "order-producer"
        enabled: true
        topic: "orders"
    consumers:
      - name: "order-consumer"
        enabled: true
        topics:
          - "orders"
        subscription_name: "order-subscription"
```

## 如何使用

```go
import pulsarplug "github.com/go-lynx/lynx-pulsar"

client, err := pulsarplug.GetPulsarClient()
```

拿到插件对象后，应该使用它现有的 producer、consumer、config 和 stats 方法，而不是继续假设旧的 `github.com/go-lynx/lynx/plugin/pulsar` 包结构还存在。

## 相关页面

- [Kafka](/docs/existing-plugin/kafka)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
