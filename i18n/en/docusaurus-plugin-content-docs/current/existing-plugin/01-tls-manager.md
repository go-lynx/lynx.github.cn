---
id: tls-manager
title: Certificate Management
---

# Certificate Management

The TLS capability in Lynx is a runtime certificate loader plugin inside the core repository. It is not configured under `lynx.application.tls`.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx/tls` |
| Config prefix | `lynx.tls` |
| Runtime plugin name | `tls` |
| Public methods | `GetCertificate()`, `GetPrivateKey()`, `GetRootCACertificate()` |

## What The Implementation Actually Supports

The current TLS loader supports multiple certificate sources:

- `local_file`
- `memory`
- `control_plane`
- `auto`

It also supports:

- file watching and hot reload
- certificate-manager based loading
- backward-compatible control-plane fallback
- common TLS settings such as auth type, hostname verification, and minimum TLS version

## Configuration

```yaml
lynx:
  tls:
    source_type: "local_file"
    local_file:
      cert_file: "/etc/ssl/certs/server.crt"
      key_file: "/etc/ssl/private/server.key"
      root_ca_file: "/etc/ssl/certs/ca.crt"
      watch_files: true
      reload_interval: "5s"
    common:
      auth_type: 4
      verify_hostname: true
      min_tls_version: "1.2"
```

If you still rely on control-plane sourced certificates, the loader also supports:

```yaml
lynx:
  tls:
    source_type: "control_plane"
    file_name: "tls-config"
    group: "security"
```

## What The Official Template Uses

The official template does not enable TLS by default in `bootstrap.local.yaml`.

That is why the template's HTTP and gRPC examples look plain-text first. TLS is treated as an operational layer you add later by combining:

- `lynx.tls`
- `lynx.http.tls_enable: true`
- `lynx.grpc.service.tls_enable: true`

So this page should be read as the certificate-provider layer that HTTP and gRPC depend on once transport security is turned on, not as a separate business-facing service plugin.

## How It Connects To HTTP And gRPC

The TLS loader publishes a certificate provider into the Lynx app. HTTP and gRPC then consume that provider when their own TLS switches are enabled:

```yaml
lynx:
  tls:
    source_type: "local_file"
    local_file:
      cert_file: "/etc/ssl/certs/server.crt"
      key_file: "/etc/ssl/private/server.key"
  http:
    addr: ":8080"
    tls_enable: true
  grpc:
    service:
      addr: ":9090"
      tls_enable: true
```

The important correction is that current docs should refer to `lynx.tls`, `lynx.http.tls_enable`, and `lynx.grpc.service.tls_enable`.

## Related Pages

- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
