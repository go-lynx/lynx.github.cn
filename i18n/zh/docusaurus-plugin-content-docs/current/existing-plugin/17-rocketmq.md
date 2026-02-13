---
id: rocketmq
title: RocketMQ Plugin
slug: existing-plugin/rocketmq
---

# RocketMQ Plugin

Go-Lynx 的 RocketMQ 插件用于集成 Apache RocketMQ，支持多实例生产者/消费者、健康检查、指标与重试，以及集群/广播消费模式。

## 功能概览

- **多实例**：多 Producer/Consumer 实例
- **健康与指标**：连接与收发健康检查、Prometheus 指标
- **重试与超时**：可配置重试、退避与发送超时
- **消费模式**：CLUSTERING（集群）与 BROADCASTING（广播）
- **消费顺序**：CONCURRENTLY / ORDERLY

## 配置说明

在配置文件中增加 `lynx.rocketmq`（或项目实际使用的 `rocketmq`）段：

```yaml
lynx:
  rocketmq:
    name_server:
      - "127.0.0.1:9876"
    access_key: "your-access-key"
    secret_key: "your-secret-key"
    dial_timeout: "3s"
    request_timeout: "30s"

    producers:
      - name: "default-producer"
        enabled: true
        group_name: "lynx-producer-group"
        max_retries: 3
        retry_backoff: "100ms"
        send_timeout: "3s"
        enable_trace: false

    consumers:
      - name: "default-consumer"
        enabled: true
        group_name: "lynx-consumer-group"
        consume_model: "CLUSTERING"
        consume_order: "CONCURRENTLY"
        max_concurrency: 1
        pull_batch_size: 32
        pull_interval: "100ms"
        topics:
          - "test-topic"
        enable_trace: false
```

`consume_model`：`CLUSTERING`（集群负载均衡）或 `BROADCASTING`（广播）。  
`consume_order`：`CONCURRENTLY` 或 `ORDERLY`。

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-rocketmq
```

### 2. 从插件管理器获取客户端

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/rocketmq"
)

client := pluginManager.GetPlugin("rocketmq").(rocketmq.ClientInterface)
```

### 3. 发送消息

```go
err := client.SendMessage(ctx, "test-topic", []byte("Hello RocketMQ"))
err = client.SendMessageWith(ctx, "default-producer", "test-topic", []byte("Hello"))
```

### 4. 消费消息

```go
import "github.com/apache/rocketmq-client-go/v2/primitive"

handler := func(ctx context.Context, msg *primitive.MessageExt) error {
    log.Printf("Received: %s", string(msg.Body))
    return nil
}
err := client.Subscribe(ctx, []string{"test-topic"}, handler)
// 指定 consumer 且多 topic
err = client.SubscribeWith(ctx, "default-consumer", []string{"topic-a", "topic-b"}, handler)
```

### 5. 健康与指标

```go
if client.IsProducerReady("default-producer") { /* ... */ }
if client.IsConsumerReady("default-consumer") { /* ... */ }
metrics := client.GetMetrics()
```

## 注意事项

- 多 Topic 订阅时，请确保配置与代码中传入的 `topics` 列表一致，插件会对每个 topic 分别调用 Subscribe。
- 事务消息需在业务层或扩展插件中自行实现。

## 相关链接

- 仓库：[go-lynx/lynx-rocketmq](https://github.com/go-lynx/lynx-rocketmq)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
