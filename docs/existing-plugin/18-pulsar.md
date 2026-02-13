---
id: pulsar
title: Pulsar Plugin
slug: existing-plugin/pulsar
---

# Pulsar Plugin

Go-Lynx 的 Apache Pulsar 插件提供消息生产/消费、多订阅类型、Schema、多租户、批处理与压缩等能力，并具备健康检查与指标。

## 功能概览

- **生产/消费**：完整 Producer/Consumer API
- **订阅类型**：Exclusive、Shared、Failover、Key-Shared
- **Topic 与 Schema**：Topic 管理、Schema Registry
- **安全**：Token、OAuth2、TLS
- **性能**：批处理、压缩（LZ4/Zlib/Zstd/Snappy）、连接池
- **可靠性**：重试、死信队列

## 配置说明

在 `config.yaml` 中增加 `lynx.pulsar`：

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650"

    producers:
      - name: "default-producer"
        enabled: true
        topic: "default-topic"

    consumers:
      - name: "default-consumer"
        enabled: true
        topics:
          - "default-topic"
        subscription_name: "default-subscription"
```

高级示例（认证、TLS、批处理）：

```yaml
lynx:
  pulsar:
    service_url: "pulsar://pulsar-cluster:6650"
    auth:
      type: "token"
      token: "your-auth-token"
    tls:
      enable: true
      trust_certs_file: "/path/to/certs.pem"
    connection:
      connection_timeout: 60s
      operation_timeout: 60s
      max_connections_per_host: 5
    producers:
      - name: "batch-producer"
        enabled: true
        topic: "batch-topic"
        options:
          batching_enabled: true
          compression_type: "lz4"
          max_pending_messages: 10000
    consumers:
      - name: "batch-consumer"
        enabled: true
        topics:
          - "batch-topic"
        subscription_name: "batch-sub"
        options:
          subscription_type: "shared"
          receiver_queue_size: 5000
```

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-pulsar
```

### 2. 获取客户端

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/pulsar"
)

pulsarClient := pulsar.GetPulsarClient()
```

### 3. 发送消息

```go
err := pulsarClient.Produce(ctx, "my-topic", []byte("key"), []byte("value"))
// 带属性
err = pulsarClient.ProduceWithProperties(ctx, "my-topic", []byte("key"), []byte("value"), map[string]string{"source": "lynx"})
// 异步
err = pulsarClient.ProduceAsync(ctx, "my-topic", []byte("key"), []byte("value"), func(id pulsar.MessageID, msg *pulsar.ProducerMessage, err error) {
    // 回调
})
```

### 4. 消费消息

```go
err := pulsarClient.Subscribe(ctx, []string{"my-topic"}, func(ctx context.Context, msg pulsar.Message) error {
    fmt.Printf("Received: %s\n", string(msg.Payload()))
    return nil
})
// 正则订阅
err = pulsarClient.SubscribeWithRegex(ctx, "tenant-.*/namespace-.*/topic-.*", messageHandler)
```

### 5. 健康与指标

```go
err := pulsarClient.CheckHealth()
metrics := pulsarClient.GetMetrics()
producer := pulsarClient.GetProducer("default-producer")
consumer := pulsarClient.GetConsumer("default-consumer")
```

## 相关链接

- 仓库：[go-lynx/lynx-pulsar](https://github.com/go-lynx/lynx-pulsar)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
