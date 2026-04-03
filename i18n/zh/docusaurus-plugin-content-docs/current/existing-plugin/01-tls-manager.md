---
id: tls-manager
title: 证书管理
---

# 证书管理

本页只解释 `lynx/conf/boot-example.yml` 里归属于 `lynx.tls` 和 `lynx.tls.auto` 的配置范围。
当前 `boot-example.yml` 并没有直接展开这段 TLS 配置，所以需要你自己把这些键补到 `lynx:` 下面。

TLS 加载器位于 `github.com/go-lynx/lynx/tls`。它负责加载证书、向应用注册 `lynx.CertificateProvider`，然后由 HTTP、gRPC 等真正打开 `tls_enable` 的传输插件消费。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx/tls` |
| 主配置前缀 | `lynx.tls` |
| 自动证书补充键 | `lynx.tls.auto` |
| Runtime 插件名 | `tls` |
| 默认来源类型 | `control_plane` |
| 传输层联动 | HTTP / gRPC 还要各自再开 `tls_enable: true` |

## 配置前先知道

- `source_type: auto` 是代码层支持的能力，虽然 protobuf 本身只声明了 `control_plane`、`local_file`、`memory`。
- 只有当 `lynx.tls.source_type` 为 `auto` 时，代码才会去读取 `lynx.tls.auto`。
- 控制面模式下，`group` 为空会回退到 `file_name`。
- `shared_ca.config_group` 为空会回退到 `shared_ca.config_name`。
- `verify_hostname`、`cipher_suites`、`session_ticket_key` 会被接收和校验，但当前 `applyCommonConfig()` 还没有把它们真正写进 `tls.Config`。

## `lynx.tls`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `source_type` | 选择证书来源。 | 一直生效。 | 默认 `control_plane`；可选 `control_plane`、`local_file`、`memory`、`auto`。 | 想用自动证书却忘了把来源切到 `auto`。 |
| `file_name` | 指定控制面里的 TLS 配置名。 | 仅 `source_type: control_plane`。 | 控制面模式必填。 | 留空后还以为会自动推导。 |
| `group` | 指定控制面分组。 | 仅 `source_type: control_plane`。 | 可选；为空时会使用 `file_name`。 | 分组写错，结果一直在读错的远程配置。 |
| `local_file` | 文件证书来源配置块。 | 仅 `source_type: local_file`。 | 本模式必须提供。 | 填了文件块，却把 `source_type` 留在默认值。 |
| `memory` | 内嵌 PEM 内容配置块。 | 仅 `source_type: memory`。 | 本模式必须提供。 | 往这里填文件路径，而不是 PEM 内容。 |
| `common` | 证书加载完成后再套一层通用 TLS 策略。 | 任意来源都可用。 | 可选；但并不是块里的每个字段都已经接线到运行时。 | 以为 `common` 里所有字段都会立即影响实际握手。 |

## `lynx.tls.local_file`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `cert_file` | 服务端证书文件路径。 | `local_file` 模式必填。 | 校验器会解析绝对路径并检查可读性。 | 相对路径写对了仓库位置，但服务进程工作目录下找不到。 |
| `key_file` | 私钥文件路径。 | `local_file` 模式必填。 | 校验器会检查可读性。 | 把证书和私钥路径写反。 |
| `root_ca_file` | 可选根 CA 文件路径。 | 需要自定义 CA 验证时。 | 可选；有值就会校验。 | mTLS 场景漏掉 CA，结果对端校验失败。 |
| `watch_files` | 是否监听证书文件变化并热重载。 | 仅 `local_file` 模式。 | 默认 `false`。 | 在 `memory` 或 `control_plane` 模式里开它，结果当然没有热更新。 |
| `reload_interval` | 文件轮询 / 重载间隔。 | 仅 `watch_files: true` 时。 | 默认 `5s`；合法范围 `1s` 到 `300s`。 | 填成过小或过大的值触发校验失败。 |
| `cert_format` | 声明磁盘证书格式。 | 仅 `local_file` 模式。 | 默认 `pem`；只接受 `pem` 和 `der`。 | 写成 `crt`、`x509` 之类代码不认识的字符串。 |

## `lynx.tls.memory`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `cert_data` | 直接内嵌证书 PEM 内容。 | `memory` 模式必填。 | 无默认值。 | 填成文件路径。 |
| `key_data` | 直接内嵌私钥 PEM 内容。 | `memory` 模式必填。 | 无默认值。 | 只贴了证书，没贴对应私钥。 |
| `root_ca_data` | 直接内嵌根 CA PEM 内容。 | 需要自定义 CA 校验时。 | 可选。 | 自签环境不填它，还希望对端验证通过。 |

## `lynx.tls.common`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `auth_type` | 直接映射 Go 的 `crypto/tls.ClientAuthType`。 | `common` 存在时。 | 默认 `0`；合法范围 `0..4`。 | 参考过期注释，以为 Lynx 会重新解释这些值。 |
| `verify_hostname` | 声明是否做主机名校验。 | 配置能读到。 | 默认 `true`，但当前实现还没有把它应用进 `tls.Config`。 | 设成 `false` 后还期待主机名校验真的关闭。 |
| `min_tls_version` | 设置最低 TLS 协议版本。 | `common` 存在时。 | 默认 `"1.2"`；支持 `1.0`、`1.1`、`1.2`、`1.3`。 | 写成 `TLS1.2` 而不是字面值 `1.2`。 |
| `cipher_suites` | 预留的密码套件覆盖项。 | 配置能读到。 | 当前会接收，但还没有真正接线到 `tls.Config`。 | 以为改了这里，握手就会立刻换套件。 |
| `session_cache_size` | 大于 0 时创建客户端会话缓存。 | `common` 存在时。 | 默认 `32`；合法范围 `0..10000`；`0` 表示不创建缓存对象。 | 把 `0` 当成“继续用默认缓存”。 |
| `session_ticket_key` | 预留的 session ticket 覆盖项。 | 配置能读到。 | 当前会接收，但还没有真正接线。 | 轮换这个值后期待运行中 ticket 立刻变化。 |

## `lynx.tls.auto`

代码只有在 `lynx.tls.source_type: auto` 时才会读取这段。

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `rotation_interval` | 自动生成叶子证书的轮换周期。 | 仅 `auto` 模式。 | 默认 `24h`；合法范围 `1h` 到 `168h`。 | 填了超出范围的分钟级或多天值。 |
| `service_name` | 作为 CN / SAN 的服务标识。 | 仅 `auto` 模式。 | 可选；为空时回退到当前应用标识。 | 多服务测试环境不填，最后证书身份都很模糊。 |
| `hostname` | 主机名 SAN 覆盖。 | 仅 `auto` 模式。 | 可选；为空时回退到 `os.Hostname()`，再退到 `localhost`。 | 客户端校验的主机名根本没写进 SAN。 |
| `sans` | 追加 SAN 列表。 | 仅 `auto` 模式。 | 可选。 | 忘记把 `127.0.0.1` 或服务 DNS 名写进去。 |
| `cert_validity` | 自动生成叶子证书的有效期。 | 仅 `auto` 模式。 | 为空时等于 `rotation_interval`；当前代码并不会强制它必须大于轮换周期，需自行保证合理。 | 有效期比轮换周期还短，导致证书先过期。 |
| `shared_ca.from` | 指定共享 CA 来源是文件还是控制面。 | 仅使用 `shared_ca` 时。 | `shared_ca` 出现时必填；可选 `file`、`control_plane`。 | 写了 `shared_ca` 却没写 `from`。 |
| `shared_ca.cert_file` | `file` 模式下的 CA 证书路径。 | 仅 `shared_ca.from: file`。 | 文件模式必填。 | 只配了 CA 证书，没配 CA 私钥。 |
| `shared_ca.key_file` | `file` 模式下的 CA 私钥路径。 | 仅 `shared_ca.from: file`。 | 文件模式必填。 | 误填成叶子证书私钥。 |
| `shared_ca.config_name` | `control_plane` 模式下共享 CA 的配置名。 | 仅 `shared_ca.from: control_plane`。 | 控制面模式必填。 | 误以为会复用 `lynx.tls.file_name`。 |
| `shared_ca.config_group` | `control_plane` 模式下共享 CA 的分组。 | 仅 `shared_ca.from: control_plane`。 | 可选；为空回退到 `config_name`。 | 分组填错后一直在读错误的 CA 配置。 |

## 实用 YAML 骨架

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

只有在 `source_type: auto` 时才应该填写 `auto` 这段。证书加载成功后，HTTP / gRPC 还要各自显式打开自己的传输层 TLS 开关。
