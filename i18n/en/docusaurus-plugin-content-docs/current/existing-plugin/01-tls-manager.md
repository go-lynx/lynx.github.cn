---
id: tls-manager
title: Certificate Management
---

# Certificate Management

This page is scoped to the `lynx.tls` and `lynx.tls.auto` part of `lynx/conf/boot-example.yml`.
The current boot example does not inline a TLS block, so you add these keys under `lynx:` yourself.

The TLS loader lives in `github.com/go-lynx/lynx/tls`. It loads certificate material, registers a `lynx.CertificateProvider`, and is then consumed by HTTP, gRPC, and any other transport plugin that turns its own `tls_enable` flag on.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx/tls` |
| Main config prefix | `lynx.tls` |
| Auto supplement key | `lynx.tls.auto` |
| Runtime plugin name | `tls` |
| Default source type | `control_plane` |
| Transport interaction | HTTP/gRPC still need their own `tls_enable: true` |

## Before You Configure It

- `source_type: auto` is implemented by code, even though the protobuf message only defines `control_plane`, `local_file`, and `memory`.
- `lynx.tls.auto` is scanned only when `lynx.tls.source_type` is `auto`.
- `group` falls back to `file_name` for control-plane loading.
- `shared_ca.config_group` falls back to `shared_ca.config_name`.
- `verify_hostname`, `cipher_suites`, and `session_ticket_key` are accepted and validated, but the current `applyCommonConfig()` implementation does not wire them into `tls.Config`.

## `lynx.tls`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `source_type` | Chooses where certs come from. | Always. | Default `control_plane`; valid values are `control_plane`, `local_file`, `memory`, `auto`. | Setting `auto` and forgetting that `lynx.tls.auto` is a separate sibling tree. |
| `file_name` | Names the control-plane TLS config payload. | Only when `source_type: control_plane`. | Required for `control_plane`. | Leaving it empty and expecting the loader to infer a file. |
| `group` | Selects the control-plane group. | Only when `source_type: control_plane`. | Optional; empty means "use `file_name` as the group too". | Setting a wrong group and debugging the wrong remote config. |
| `local_file` | Holds the file-backed certificate source. | Only when `source_type: local_file`. | Must be present for local files. | Filling this block while leaving `source_type` on the default `control_plane`. |
| `memory` | Holds inline PEM strings. | Only when `source_type: memory`. | Must be present for in-memory PEM. | Supplying raw file paths here; this block expects PEM content, not filenames. |
| `common` | Applies shared TLS policy after certificates are loaded. | Used with every source type when present. | Optional; only a subset of fields currently reaches `tls.Config`. | Assuming every proto field in `common` is enforced at runtime. |

## `lynx.tls.local_file`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `cert_file` | Path to the server certificate file. | Required in `local_file` mode. | Validator resolves the absolute path and checks readability. | Pointing to a relative path that does not exist in the service working directory. |
| `key_file` | Path to the private key file. | Required in `local_file` mode. | Validator resolves and checks readability. | Swapping cert and key paths. |
| `root_ca_file` | Optional CA bundle used to populate `ClientCAs` / root verification state. | Only when you provide a custom CA. | Optional; validated when set. | Forgetting it in mTLS deployments and then expecting peer verification to work. |
| `watch_files` | Enables file watching and certificate hot reload. | Only in `local_file` mode. | Default `false`. | Enabling it for `memory` or `control_plane` and expecting reloads. |
| `reload_interval` | Poll / watch interval for file reload checks. | Only when `watch_files: true`. | Default `5s`; valid range `1s` to `300s`. | Setting sub-second or very large values that fail validation. |
| `cert_format` | Declares the on-disk cert format. | Only in `local_file` mode. | Default `pem`; valid values `pem` and `der`. | Writing `crt` or `x509`; those strings are not accepted. |

## `lynx.tls.memory`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `cert_data` | Inline certificate PEM content. | Required in `memory` mode. | No default. | Supplying a file path instead of PEM text. |
| `key_data` | Inline private-key PEM content. | Required in `memory` mode. | No default. | Copying only the cert and forgetting the matching private key. |
| `root_ca_data` | Optional inline CA PEM content. | Used when peer validation needs a custom CA. | Optional. | Omitting it in self-signed environments and then blaming the transport plugin. |

## `lynx.tls.common`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `auth_type` | Maps directly to Go's `crypto/tls.ClientAuthType`. | Used whenever `common` is present. | Default `0`; valid range `0..4`. | Reading old comments and assuming Lynx remaps the values. It does a direct cast. |
| `verify_hostname` | Declares hostname verification intent. | Parsed whenever present. | Default `true`, but the current implementation does not apply it in `applyCommonConfig()`. | Setting it to `false` and expecting hostname checks to switch off. |
| `min_tls_version` | Sets the minimum TLS protocol version. | Used whenever `common` is present. | Default `"1.2"`; valid values `1.0`, `1.1`, `1.2`, `1.3`. | Using `TLS1.2` instead of the literal string `1.2`. |
| `cipher_suites` | Intended cipher-suite override list. | Parsed whenever present. | Accepted by config, but not wired into `tls.Config` today. | Assuming a custom cipher list is already enforced. |
| `session_cache_size` | Enables a client session cache when greater than zero. | Used whenever `common` is present. | Default `32`; range `0..10000`; `0` means no cache object is created. | Setting a negative number or expecting `0` to keep the default cache. |
| `session_ticket_key` | Intended session-ticket override. | Parsed whenever present. | Accepted by config, but not wired today. | Rotating this value in config and expecting live ticket-key changes. |

## `lynx.tls.auto`

Code reads this sibling tree from `lynx.tls.auto` only when `lynx.tls.source_type: auto`.

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `rotation_interval` | Rotates the generated leaf certificate on this cadence. | Only when `source_type: auto`. | Default `24h`; valid range `1h` to `168h`. | Using minutes or days outside the validator range. |
| `service_name` | Supplies the CN / SAN service identity. | Only in `auto` mode. | Optional; falls back to the current app identity when available. | Leaving it empty in multi-service test clusters and getting generic cert identities. |
| `hostname` | Adds the primary hostname SAN. | Only in `auto` mode. | Optional; falls back to `os.Hostname()` and then `localhost`. | Expecting remote clients to verify a hostname that never appears in SANs. |
| `sans` | Adds extra SAN entries such as DNS names or IPs. | Only in `auto` mode. | Optional list. | Forgetting to include `127.0.0.1` or service DNS names used by clients. |
| `cert_validity` | Controls how long the generated leaf cert stays valid. | Only in `auto` mode. | Empty means "same as `rotation_interval`"; the current code does not reject a value shorter than the rotation interval, so keep it sensible yourself. | Making it shorter than the rotation cadence and creating avoidable expiry gaps. |
| `shared_ca.from` | Chooses whether the shared CA comes from files or the control plane. | Only when you use `shared_ca`. | Required when `shared_ca` is present; valid values `file`, `control_plane`. | Defining `shared_ca` without `from`. |
| `shared_ca.cert_file` | CA certificate path for `shared_ca.from: file`. | Only when `shared_ca.from: file`. | Required in file mode; validated for readability. | Providing only the cert and forgetting the CA private key. |
| `shared_ca.key_file` | CA private-key path for `shared_ca.from: file`. | Only when `shared_ca.from: file`. | Required in file mode; validated for readability. | Pointing it to the leaf key instead of the CA key. |
| `shared_ca.config_name` | Control-plane config name for the shared CA payload. | Only when `shared_ca.from: control_plane`. | Required in control-plane mode. | Expecting `file_name` from `lynx.tls` to double as the shared CA source. |
| `shared_ca.config_group` | Control-plane group for the shared CA payload. | Only when `shared_ca.from: control_plane`. | Optional; empty falls back to `config_name`. | Setting a different group name but forgetting the remote config lives elsewhere. |

## Practical YAML Skeleton

```yaml
lynx:
  tls:
    source_type: "local_file" # control_plane | local_file | memory | auto
    file_name: ""
    group: ""
    local_file:
      cert_file: "/etc/ssl/certs/server.crt"
      key_file: "/etc/ssl/private/server.key"
      root_ca_file: "/etc/ssl/certs/ca.crt"
      watch_files: false
      reload_interval: "5s"
      cert_format: "pem"
    memory:
      cert_data: ""
      key_data: ""
      root_ca_data: ""
    common:
      auth_type: 0
      verify_hostname: true
      min_tls_version: "1.2"
      cipher_suites: ""
      session_cache_size: 32
      session_ticket_key: ""
    auto:
      rotation_interval: "24h"
      service_name: "user-service"
      hostname: ""
      sans:
        - "localhost"
        - "127.0.0.1"
      cert_validity: "24h"
      shared_ca:
        from: "file"
        cert_file: ""
        key_file: ""
        config_name: ""
        config_group: ""
```

Use the `auto` block only when `source_type: auto`. HTTP and gRPC still need their own transport-level TLS switches after certificate loading succeeds.
