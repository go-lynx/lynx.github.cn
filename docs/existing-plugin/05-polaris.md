---
id: Polaris
title: Polaris Service Governance
---

# Polaris Service Governance

Go-Lynx integrates seamlessly with `Polaris` for microservice governance, allowing users to leverage Polaris's service governance capabilities without any additional configuration. However, you must first write a Polaris connection configuration to enjoy these services.

## Polaris Configuration

First, configure the connection to Polaris in your configuration file, with the content as follows:

```yaml
lynx:
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 5s
```

Then, place this file, named `polaris.yaml`, in your local folder. This file is the official standard configuration file for Polaris, and the above configuration file should be used in conjunction with `polaris.yaml`.

The content of the `polaris.yaml` file (this is just a basic configuration example) is as follows:

```yaml
global:
  serverConnector:
    protocol: grpc
    addresses:
      - 127.0.0.1:8091
  statReporter:
    enable: true
    chain:
      - prometheus
    plugin:
      prometheus:
        type: push
        address: 127.0.0.1:9091
        interval: 10s
config:
  configConnector:
    addresses:
      - 127.0.0.1:8093
```

For detailed information on the `polaris.yaml` file and specific deployment, please refer to the [Tencent Polaris Official Documentation](https://polarismesh.cn/docs). After integrating with Polaris, your Go-Lynx application will have capabilities such as service discovery, service routing, service configuration, service metadata management, service rate limiting and degradation, telemetry, and canary releases.