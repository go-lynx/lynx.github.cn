---
id: etcd
title: Etcd 插件
---

# Etcd 插件

Etcd 在 Lynx 里有两种典型角色：配置中心，以及服务注册/发现后端。它也是 [Etcd Lock](/docs/existing-plugin/etcd-lock) 的必需上游客户端。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-etcd` |
| 配置前缀 | `lynx.etcd` |
| Runtime 插件名 | `etcd.config.center` |
| 公开 API | `GetClient()`, `GetEtcdConfig()`, `GetNamespace()`, `GetConfigSources()`, `GetConfigValue(prefix, key)`, `NewEtcdRegistrar(...)`, `NewEtcdDiscovery(...)` |

## 配置来源

| 文件 | 范围 | 实际影响 |
| --- | --- | --- |
| `lynx-etcd/conf/example_config.yml` | Lynx runtime 与 etcd client 初始化 | endpoints、TLS/鉴权、缓存/指标/重试、配置前缀加载、可选的注册/发现，以及几项仅为兼容保留的 schema 字段 |

## 先看几个实现要点

- `endpoints` 必填，而且每一项都不能为空。
- `namespace` 留空时回退为 `lynx/config`，`timeout` 默认 `10s`，`dial_timeout` 默认 `5s`。
- `enable_register` 和 `enable_discovery` 默认都为 `false`。对应开关不开时，`NewServiceRegistry()` 和 `NewServiceDiscovery()` 会返回 `nil`。
- 注册/发现使用时，`registry_namespace` 默认是 `lynx/services`；`ttl` 在缺失或非正数时会回退到 `30s`。
- `enable_metrics` 和 `enable_retry` 是真实 runtime 开关。只有 `enable_retry` 为 `true` 时，`3` 次重试和 `1s` 间隔的回退默认值才会生效。
- `service_config.prefix` 会回退到顶层 `namespace`。
- `service_config.additional_prefixes` 是真实生效的，且按声明顺序加载。
- `enable_graceful_shutdown`、`enable_logging`、`log_level`、`service_config.priority`、`service_config.merge_strategy` 虽然被 schema 接受，但当前插件并不把它们当作活跃的行为开关。

## 字段说明

### `lynx.etcd`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `endpoints` | etcd 集群地址列表。 | 总是必填。 | 必填；模板使用 host:port 列表。 | 留空，或列表里混入空字符串。 |
| `timeout` | etcd 通用操作超时。 | 建议总是显式考虑，尤其是跨网络部署。 | 默认 `10s`；合法范围 `100ms..60s`。 | 配得低于 `100ms`，或把它误当成注册 TTL。 |
| `dial_timeout` | 建连超时。 | etcd 节点较远或网络建立连接较慢时。 | 默认 `5s`；合法范围 `100ms..30s`。 | 直接照抄 `timeout`，导致建连窗口过小。 |
| `namespace` | 默认配置键前缀。 | 希望配置落在非默认 etcd 前缀下时。 | 默认 `lynx/config`；`service_config.prefix` 会回退到它。 | 多个服务混用前缀，却没意识到读取是按前缀进行的。 |
| `username` | etcd 用户名鉴权字段。 | etcd 开启鉴权时。 | 可选。 | 只配用户名不配密码。 |
| `password` | etcd 密码鉴权字段。 | etcd 开启鉴权时。 | 可选。 | 把真实凭证直接写进示例衍生配置。 |
| `enable_tls` | 是否启用 etcd TLS 连接。 | etcd 集群要求 TLS 时。 | TLS 文件处理的主开关。 | 打开后却没把证书路径配对齐。 |
| `cert_file` | 客户端证书路径。 | 需要双向 TLS 时。 | 除非集群要求客户端证书，否则可选。 | 只配 cert 不配 key。 |
| `key_file` | 客户端私钥路径。 | 需要双向 TLS 时。 | 除非集群要求客户端证书，否则可选。 | key 与 cert 不匹配。 |
| `ca_file` | CA 证书路径。 | etcd 使用私有 CA 时。 | 可选。 | 误以为系统默认证书足够信任私有 CA。 |
| `enable_cache` | 是否启用本地配置缓存。 | 希望配置读取能受益于本地缓存时。 | 真实生效开关。 | 开了缓存却没规划缓存新鲜度。 |
| `enable_metrics` | 是否启用插件指标。 | 运维需要 etcd 插件指标时。 | 真实生效开关。 | 开关没开却期待指标存在。 |
| `enable_retry` | 是否创建重试管理器。 | 希望对短暂 etcd 故障做重试时。 | 真实生效开关；打开后缺省值会回退到 `3` 次、`1s`。 | 以为不开它也会有默认重试。 |
| `max_retry_times` | 最大重试次数。 | 开启重试时。 | 合法范围 `0..10`。 | 使用负数或过大值。 |
| `retry_interval` | 重试间隔。 | 开启重试时。 | 合法范围 `100ms..10s`；若启用重试且留空，会回退到 `1s`。 | 明明想做亚秒级退避，却按秒去配。 |
| `shutdown_timeout` | 停机清理超时。 | etcd 清理质量重要时。 | 留空回退到 `10s`；合法范围 `1s..60s`。 | 配得太短，lease/watch 清理来不及完成。 |
| `enable_register` | 是否启用服务注册。 | 当前服务要把自己注册进 etcd 发现体系时。 | 默认 `false`。 | 开关没开，却期待得到 registrar。 |
| `enable_discovery` | 是否启用服务发现。 | 当前服务要从 etcd 拉上游实例时。 | 默认 `false`。 | 开关没开，却期待 watch 能工作。 |
| `registry_namespace` | 服务注册记录的键前缀。 | 想把服务记录放到自定义 etcd 前缀时。 | 注册/发现场景默认 `lynx/services`。 | 把配置前缀误用成注册前缀，导致配置数据和服务记录混在一起。 |
| `ttl` | 注册实例的租约 TTL。 | 开启注册时。 | 在 registrar 创建时，缺失或非正数会回退到 `30s`。 | 把 `0` 理解成“关闭注册”；实际上只是回退到默认 TTL。 |
| `service_config` | 远程配置前缀加载策略。 | 一个服务需要从一个或多个 etcd 前缀读取配置时。 | 可选嵌套对象。 | 额外前缀一加一堆，却没决定加载顺序。 |

### `lynx.etcd.service_config`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `prefix` | 主配置加载前缀。 | 运行时配置不想直接沿用顶层 `namespace` 时。 | 回退到顶层 `namespace`。 | 留空却以为会自动读取别的前缀。 |
| `additional_prefixes` | 主前缀之后继续合并的额外前缀列表。 | 共享配置和业务配置分布在不同 key 树下时。 | 按声明顺序加载。 | 期待自动去重或自动排序冲突。 |

### 仅兼容保留的 schema 字段

示例文件里把这些字段写成注释，是因为 schema 仍然接受它们，但当前插件不会把它们当作活跃 runtime 开关：

| 字段 | 需要知道什么 |
| --- | --- |
| `enable_graceful_shutdown` | 当前仍会做 cleanup；真正起作用的是 `shutdown_timeout`。 |
| `enable_logging` | 为兼容保留，但不是插件本地日志总开关。 |
| `log_level` | 为兼容保留，但不是当前插件的活跃本地开关。 |
| `service_config.priority` | schema 还在，但插件不会按它重排配置源。 |
| `service_config.merge_strategy` | schema 还在，但插件不会据此实现插件本地自定义合并算法。 |

## 完整 YAML 示例

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379 # 必填的 etcd endpoint 列表；每一项都不能为空
    timeout: 10s # 操作超时；validator 要求 100ms-60s
    dial_timeout: 5s # 建连超时；validator 要求 100ms-30s
    namespace: lynx/config # 默认配置 key namespace 前缀
    username: "" # 认证集群下可选的用户名
    password: "" # 与 username 配套的密码
    enable_tls: false # 让共享 etcd client 走 TLS
    cert_file: "" # 需要双向 TLS 时的客户端证书路径
    key_file: "" # 需要双向 TLS 时的客户端私钥路径
    ca_file: "" # 需要校验服务端证书时的 CA 文件路径
    enable_cache: true # 开启配置缓存能力
    enable_metrics: true # 开启指标采集
    enable_retry: true # 开启上游重试管理器
    max_retry_times: 3 # 重试管理器的最大重试次数
    retry_interval: 1s # 重试间隔
    shutdown_timeout: 10s # 卸载阶段清理超时
    enable_register: false # 开启服务注册能力
    enable_discovery: false # 开启服务发现能力
    registry_namespace: lynx/services # 注册开启时使用的服务注册 namespace
    ttl: 30s # 注册开启时使用的注册 TTL
    service_config:
      prefix: lynx/config # 从 etcd 加载的主配置前缀
      additional_prefixes:
        - lynx/config/app # 在主前缀后继续加载的额外前缀
    # enable_graceful_shutdown: true # 仅为兼容保留的 schema 字段
    # enable_logging: true # 仅为兼容保留的 schema 字段
    # log_level: info # 仅为兼容保留的 schema 字段
    # service_config.priority: 0 # 仅为兼容保留的 schema 字段
    # service_config.merge_strategy: override # 仅为兼容保留的 schema 字段
```

## 最小可用 YAML 示例

etcd 插件真正必需的只有一个可达的 endpoint 列表。timeout、namespace、清理窗口等字段都能回退到运行时默认值。

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379 # 必填的共享 etcd endpoint
```

## 常见误配

- 打开 `enable_tls`，却忽略 cert/key/CA 文件必须与集群 TLS 模式匹配。
- 把 `enable_graceful_shutdown`、`enable_logging`、`log_level` 当成当前插件真实生效的 runtime 开关。
- `enable_register` / `enable_discovery` 仍是 `false`，却期待拿到注册器或发现器。
- 配置 key 前缀和服务注册前缀混用。
- 以为 `service_config.priority` 或 `merge_strategy` 会改变当前插件的加载顺序；实际上现在还是按声明顺序。

## 运行时接入

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("etcd.config.center")
etcdPlugin := plugin.(*etcd.PlugEtcd)

client := etcdPlugin.GetClient()
cfg := etcdPlugin.GetEtcdConfig()
sources, err := etcdPlugin.GetConfigSources()
value, err := etcdPlugin.GetConfigValue("lynx/config", "feature.flag")
registrar := etcdPlugin.NewServiceRegistry()
discovery := etcdPlugin.NewServiceDiscovery()
```

当一个 etcd 集群既要承载配置前缀，又要承载可选的注册/发现能力时，这个插件很合适。如果你只需要配置中心，不关心注册体系，[Apollo](/docs/existing-plugin/apollo) 会更简单。

## 相关页面

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
