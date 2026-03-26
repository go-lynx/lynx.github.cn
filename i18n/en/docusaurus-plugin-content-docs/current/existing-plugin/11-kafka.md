---
id: kafka
title: Kafka Plugin
---

# Kafka Plugin

The Kafka plugin provides **Apache Kafka** integration for the Lynx framework, including producers and consumers with batching, retries, SASL/TLS, and Prometheus metrics.

## Features

- **Producer/Consumer**: Full producer and consumer API support.
- **Batch processing**: Configurable batch size and timeout for throughput.
- **Retries**: Retry with exponential backoff.
- **SASL**: SASL/PLAIN, SASL/SCRAM, SASL/GSSAPI.
- **TLS**: Encrypted connections.
- **Compression**: gzip, snappy, lz4, zstd.
- **Dead letter queue**: Built-in DLQ support.
- **Metrics**: Prometheus metrics and health checks.

## Configuration

Example configuration under `lynx.kafka`:

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

## Usage

After configuration, import the plugin and use the Kafka plugin’s getters (e.g. producer/consumer managers) in your wire sets. The plugin registers resources with the Lynx runtime so you can inject the Kafka client or consumer/producer instances where needed.

## Installation

```bash
go get github.com/go-lynx/lynx/plugins/kafka
```

For full options (SASL, TLS, schema registry, etc.), refer to the plugin’s README on GitHub.
