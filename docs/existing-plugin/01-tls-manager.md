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

## Complete YAML Example

This snippet stays under the `lynx:` root from `boot-example.yml`; only the TLS subtree is shown here.

```yaml
lynx:
  tls:
    source_type: "local_file" # control_plane | local_file | memory | auto; default is control_plane
    file_name: "gateway-tls" # control-plane payload name when source_type=control_plane
    group: "gateway-tls" # optional control-plane group; empty falls back to file_name
    local_file:
      cert_file: "/etc/ssl/certs/server.crt" # required in local_file mode
      key_file: "/etc/ssl/private/server.key" # required in local_file mode
      root_ca_file: "/etc/ssl/certs/root-ca.pem" # optional custom root CA for peer validation
      watch_files: true # local_file-only hot reload switch; default false
      reload_interval: "10s" # local file reload check interval; default 5s
      cert_format: "pem" # pem or der; default pem
    memory:
      cert_data: "-----BEGIN CERTIFICATE-----..." # required only in memory mode
      key_data: "-----BEGIN PRIVATE KEY-----..." # required only in memory mode
      root_ca_data: "-----BEGIN CERTIFICATE-----..." # optional inline CA bundle
    common:
      auth_type: 0 # crypto/tls.ClientAuthType value 0..4
      verify_hostname: true # accepted and validated, but not wired into tls.Config today
      min_tls_version: "1.2" # default 1.2; accepts 1.0/1.1/1.2/1.3
      cipher_suites: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" # parsed but not enforced today
      session_cache_size: 32 # default 32; 0 disables the client session cache object
      session_ticket_key: "00112233445566778899aabbccddeeff" # accepted but not applied today
    auto:
      rotation_interval: "24h" # only used when source_type=auto; default 24h
      service_name: "user-service" # certificate identity when app identity is not enough
      hostname: "user-service.internal" # optional primary SAN hostname
      sans:
        - "localhost" # extra DNS/IP SAN entries
        - "127.0.0.1"
      cert_validity: "48h" # empty falls back to rotation_interval; keep it >= rotation cadence
      shared_ca:
        from: "file" # file or control_plane
        cert_file: "/etc/ssl/certs/shared-ca.crt" # required when from=file
        key_file: "/etc/ssl/private/shared-ca.key" # required when from=file
        config_name: "shared-ca" # required when from=control_plane
        config_group: "shared-ca" # optional; empty falls back to config_name
```

## Minimum Viable YAML Example

```yaml
lynx:
  tls:
    source_type: "local_file" # simplest copy-runnable mode
    local_file:
      cert_file: "/etc/ssl/certs/server.crt" # required leaf certificate
      key_file: "/etc/ssl/private/server.key" # required matching private key
```

After this loader succeeds, HTTP and gRPC still need their own `tls_enable: true` switches.
