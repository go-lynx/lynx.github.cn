---
id: apollo
title: Apollo 插件
---

# Apollo 插件

Apollo 是 Lynx 的配置中心插件，适合已经把配置发布、namespace 管理、集群切分都收敛到 Apollo 的团队。它不负责服务注册和发现，只负责远程配置读取与变更感知。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-apollo` |
| 配置前缀 | `lynx.apollo` |
| Runtime 插件名 | `apollo.config.center` |
| 公开 API | `GetConfigSources()`、`GetConfigValue(namespace, key)`、`GetApolloConfig()`、`GetNamespace()`、`GetMetrics()` |

## 配置来源

| 文件 | 范围 | 实际影响 |
| --- | --- | --- |
| `lynx-apollo/conf/example_config.yml` | Lynx runtime 与 Apollo HTTP client 初始化 | 应用标识、meta server、通知/缓存行为、重试/熔断/日志 schema 字段，以及多 namespace 合并规则 |

## 先看几个实现要点

- `app_id` 必填，最长 `128` 个字符，且只能包含字母、数字、`_`、`-`。
- `meta_server` 必填且必须是合法 URL。当前 validator 会把明文 `http://` 当成生产风险错误，所以真实配置应使用 HTTPS 地址。
- `namespace` 默认 `application`，`cluster` 默认 `default`，`timeout` 默认 `10s`，`notification_timeout` 默认 `30s`，`cache_dir` 默认 `/tmp/apollo-cache`。
- `timeout` 必须严格小于 `notification_timeout`，否则校验失败。
- `service_config.additional_namespaces` 按声明顺序加载；`priority` 和 `merge_strategy` 更像 schema 层的合并提示，插件本身保持插入顺序，真实冲突处理交给框架合并层。
- `enable_cache` 对读取路径是真生效的：命中缓存时会先返回缓存值。
- `enable_metrics`、`enable_retry`、`enable_circuit_breaker` 在当前初始化路径里不是严格的硬关闭开关；helper 组件仍会按回退默认值创建。
- `release_key` 和 `ip` 虽然在 schema 里存在，但当前运行时代码并不会直接从配置里消费它们。

## 字段说明

### `lynx.apollo`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `app_id` | Apollo 应用 ID。 | 总是必填，它是 Apollo 定位配置的主标识。 | 必填且带格式校验。 | 包含空格、点号或其他不支持字符。 |
| `cluster` | Apollo 集群名。 | 一个 Apollo 应用会按 cluster 切分配置时。 | 默认 `default`。 | 实际配置只发布到其他 cluster，却仍保留默认值。 |
| `namespace` | 主 Apollo namespace。 | 主运行时配置不在默认 namespace 时。 | 默认 `application`。 | 把 namespace 当成服务名理解。 |
| `meta_server` | 用于发现 Apollo config server 的 Meta Server 地址。 | 总是要配置。 | 必填；当前 validator 既要求合法 URL，也会把明文 HTTP 视作生产风险。 | 直接复用示例里的 `http://localhost:8080` 到需要通过校验的真实配置里。 |
| `token` | Apollo 鉴权 token。 | Apollo 开启 token 鉴权时。 | 可选；设置后长度必须在 `8..1024`。 | 生产配置里继续用很短的占位 token。 |
| `timeout` | Apollo HTTP 调用超时。 | 建议总是显式考虑，尤其是跨网络部署。 | 默认 `10s`；合法范围 `1s..60s`；必须小于 `notification_timeout`。 | 配得大于等于 `notification_timeout`。 |
| `enable_notification` | 声明是否启用配置变更通知。 | 应用依赖 watch / long poll 时。 | 应和 `notification_timeout` 搭配考虑。 | 打开它，却没有考虑长轮询窗口和发布延迟。 |
| `notification_timeout` | 通知 / watch 等待超时。 | 配置变更感知时延很重要时。 | 默认 `30s`；合法范围 `5s..300s`；必须大于 `timeout`。 | 把它当成重试间隔去理解。 |
| `enable_cache` | 是否启用进程内配置缓存。 | 希望热点读取能抗短暂 Apollo 抖动或减少重复网络请求时。 | 读取路径会配合 `cache_dir` 使用；默认 cache_dir 已非空。 | 开了缓存，但没有考虑缓存一致性预期。 |
| `cache_dir` | 本地缓存目录。 | 启用缓存且需要固定可写路径时。 | 默认 `/tmp/apollo-cache`。 | 指向只读目录或强临时目录，却误以为缓存可持久。 |
| `enable_metrics` | 声明指标意图。 | 运维需要关注 Apollo 插件指标时。 | 当前初始化仍会创建 metrics helper。 | 把它当成“完全不初始化 metrics 逻辑”的开关。 |
| `enable_retry` | 声明重试意图。 | 希望对短暂 Apollo 故障做重试时。 | 当前初始化仍会创建带回退默认值的 retry manager。 | 误以为 `false` 就能全局彻底取消重试路径。 |
| `max_retry_times` | 最大重试次数。 | 需要明确限定重试深度时。 | 建议范围 `0..10`；helper 回退默认 `3`。 | 传负数或过大值。 |
| `retry_interval` | 重试间隔。 | 开启重试意图时。 | 合法范围 `100ms..30s`；helper 回退默认 `1s`。 | 比整个请求 deadline 还长。 |
| `enable_circuit_breaker` | 声明熔断意图。 | 需要把 Apollo 故障隔离在调用边界内时。 | 当前初始化仍会创建 threshold 回退为 `0.5` 的 breaker。 | 把 `false` 理解成“绝对没有熔断器”。 |
| `circuit_breaker_threshold` | 熔断错误率阈值。 | 需要调整熔断敏感度时。 | 合法范围 `0.1..0.9`；默认 `0.5`。 | 配成 `0` 或 `1`。 |
| `enable_graceful_shutdown` | 声明优雅清理意图。 | watch/client 停止过程需要受控时。 | 应与 `shutdown_timeout` 一起考虑。 | 想优雅停机，却把超时窗口配得过短。 |
| `shutdown_timeout` | 停机清理超时。 | 关停质量重要时。 | 合法范围 `5s..300s`；默认 `30s`。 | 太短，导致长轮询和资源回收来不及完成。 |
| `enable_logging` | 声明详细日志意图。 | 需要排查 Apollo 客户端行为时。 | schema 字段；真实输出还取决于应用全局日志系统。 | 误以为它单独就能接管日志策略。 |
| `log_level` | 插件期望日志级别。 | 需要更细粒度诊断时。 | 支持 `debug`、`info`、`warn`、`error`。 | 填了不支持的自定义级别。 |
| `service_config` | 多 namespace 加载规则。 | 一个服务要把多个 Apollo namespace 合并到运行时配置里时。 | 可选嵌套对象。 | 加了很多 namespace，却没想清楚冲突覆盖顺序。 |
| `release_key` | Apollo 发布版本跟踪字段。 | 只有外围工具链需要记录 release marker 时。 | schema 存在，但当前 runtime 不会直接从配置里消费它。 | 以为改它就会影响 Apollo 请求行为。 |
| `ip` | 客户端 IP 声明字段。 | 只在你需要文档化预期客户端 IP 元数据时。 | schema 存在，但当前 HTTP client 不直接读取这个配置字段。 | 配了它，却以为当前 client 会自动透传。 |

### `lynx.apollo.service_config`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `namespace` | 多配置加载时的主 namespace。 | 运行时主配置不想直接沿用顶层 `namespace` 时。 | 回退到顶层 `namespace`。 | 留空却以为主配置会自动来自另一个 namespace。 |
| `additional_namespaces` | 额外合并进来的 Apollo namespace 列表。 | 共享配置、特性开关、环境覆盖项分散在不同 namespace 时。 | 在主 namespace 之后按声明顺序加载。 | 没规划冲突优先级就堆多个 namespace。 |
| `priority` | 合并优先级提示。 | 需要让运维和开发理解预期优先级时。 | 默认 `0`；当前插件本身不按它重排，实际合并优先级交给框架层。 | 误以为插件会自动按 priority 重排 namespace。 |
| `merge_strategy` | 冲突合并策略提示。 | 需要明确冲突处理约定时。 | 支持 `override`、`merge`、`append`。 | 使用了框架不认识的策略名。 |

## 完整 YAML 模板

```yaml
lynx:
  apollo:
    app_id: demo-app
    cluster: default
    namespace: application
    meta_server: https://apollo-config.example.com
    token: your-apollo-token
    timeout: 10s
    enable_notification: true
    notification_timeout: 30s
    enable_cache: true
    cache_dir: /tmp/apollo-cache
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    enable_circuit_breaker: true
    circuit_breaker_threshold: 0.5
    enable_graceful_shutdown: true
    shutdown_timeout: 30s
    enable_logging: true
    log_level: info
    service_config:
      namespace: application
      additional_namespaces:
        - shared-config
        - feature-flags
      priority: 0
      merge_strategy: override
    release_key: ""
    ip: ""
```

## 常见误配

- 把示例里的占位式 `http://` Meta Server 地址直接用于需要通过当前 validator 的真实配置。
- `timeout` 配得大于等于 `notification_timeout`。
- 把 `enable_metrics`、`enable_retry`、`enable_circuit_breaker` 当成严格的运行时硬关闭开关。
- 期待修改 `release_key` 或 `ip` 能直接影响当前 HTTP client 路径。
- 同时加载多个 namespace，但没有决定冲突时谁覆盖谁。

## 运行时接入

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
apolloPlugin := plugin.(*apollo.PlugApollo)

value, err := apolloPlugin.GetConfigValue("application", "feature.flag")
sources, err := apolloPlugin.GetConfigSources()
cfg := apolloPlugin.GetApolloConfig()
namespace := apolloPlugin.GetNamespace()
```

如果你的核心诉求就是远程配置，并且环境已经把发布流程、namespace 管理都统一在 Apollo 里，这个插件是最直接的选择。如果还需要同一后端提供注册或发现能力，可以优先看 [Polaris](/docs/existing-plugin/polaris)、[Nacos](/docs/existing-plugin/nacos) 或 [Etcd](/docs/existing-plugin/etcd)。

## 相关页面

- [Nacos](/docs/existing-plugin/nacos)
- [Polaris](/docs/existing-plugin/polaris)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
