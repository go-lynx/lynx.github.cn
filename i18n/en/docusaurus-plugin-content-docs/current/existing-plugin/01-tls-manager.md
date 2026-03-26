---
id: tls-manager
title: Certificate Management
---

# Certificate Management

The TLS manager plugin brings certificate loading into the Lynx runtime for encrypted HTTP and gRPC communication. Its value is that **certificate retrieval, default trust chain handling, and TLS enablement on servers** can follow one configuration path instead of every service implementing its own loading logic.

## What it covers

- a certificate-loading entry for HTTP and gRPC
- default trust-chain integration for root certificates
- bringing certificate material into the runtime during startup

## Basic configuration

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
```

Here `lynx.application.tls` describes the certificate configuration entry. In the current docs model, it usually tells the application where to read certificate material from.

## How it works with HTTP and gRPC

Once certificates are configured, the HTTP and gRPC sides only need their TLS switches enabled:

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
  grpc:
    addr: 0.0.0.0:9000
    timeout: 5s
    tls: true
```

When `lynx.http.tls` or `lynx.grpc.tls` is `true`, the corresponding plugin assembles certificate material during startup.

## What the certificate payload usually contains

Whether certificates come from a config center or another source, the payload usually includes at least:

- service certificate `crt`
- private key `key`
- root certificate `rootCA`

## Practical guidance

- self-signed certificates are fine for local development, but service names and SAN values must be correct
- production environments should use your team's proper issuance and rotation process
- this plugin page explains how Lynx loads certificates, not a full PKI design guide

## Related pages

- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
