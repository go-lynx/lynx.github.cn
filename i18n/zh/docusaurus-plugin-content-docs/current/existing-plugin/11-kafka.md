---
id: kafka
title: Kafka 插件
slug: existing-plugin/kafka
---

# Kafka 插件

Kafka 插件为 Lynx 提供 **Apache Kafka** 集成，包括生产者与消费者，支持批量、重试、SASL/TLS 以及 Prometheus 指标。

## 功能

- **生产者/消费者**：完整的生产者和消费者 API。
- **批量处理**：可配置批量大小与超时，提高吞吐。
- **重试**：支持指数退避重试。
- **SASL**：SASL/PLAIN、SASL/SCRAM、SASL/GSSAPI。
- **TLS**：加密连接。
- **压缩**：gzip、snappy、lz4、zstd。
- **死信队列**：内置 DLQ 支持。
- **指标**：Prometheus 指标与健康检查。

## 配置

在 `lynx.kafka` 下配置示例：

```yaml
lynx:
  kafka:
    brokers:
      - "localhost:9092"
      - "localhost:9093"
    client_id: "lynx-kafka-client"
    group_id: "lynx-consumer-group"
    producers:
      - name: "default-producer"
        enabled: true
        topic: "default-topic"
        max_retries: 3
        retry_backoff: "100ms"
        batch_size: 16384
        compression: "gzip"
    consumers:
      - name: "default-consumer"
        enabled: true
        topics:
          - "default-topic"
        group_id: "lynx-consumer-group"
```

## 使用

配置完成后，在 main 中导入插件，并在 wire 中通过插件提供的 getter（如生产者/消费者管理器）注入。插件会向 Lynx 运行时注册资源，可在业务中注入 Kafka 客户端或消费者/生产者实例。

## 安装

```bash
go get github.com/go-lynx/lynx/plugins/kafka
```

完整选项（SASL、TLS、Schema Registry 等）请参阅该插件在 GitHub 上的 README。
