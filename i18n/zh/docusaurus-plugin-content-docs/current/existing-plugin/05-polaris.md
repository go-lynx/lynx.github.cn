---
id: polaris
title: Polaris 服务治理
---

# Polaris 服务治理

Polaris 是 Lynx 里能力最完整的控制面插件之一。在这个仓库里，它同时依赖两份 YAML：

- `lynx-polaris/conf/example_config.yml` 中的 `lynx.polaris` 控制 Lynx 插件本身。
- `lynx-polaris/conf/polaris.yaml` 是由 `config_path` 引用的 Polaris SDK 连接与配置中心文件。

同一个示例文件里还带了 `lynx.service_info`。它不属于 Polaris 插件 schema，但在服务注册场景下通常会与 Polaris 一起使用。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-polaris` |
| 配置前缀 | `lynx.polaris` |
| Runtime 插件名 | `polaris.control.plane` |
| 公开 API | `GetPolarisPlugin()`、`GetPolaris()`、`GetServiceInstances()`、`GetConfig(fileName, group)`、`WatchService(serviceName)`、`WatchConfig(fileName, group)`、`CheckRateLimit(serviceName, labels)`、`GetMetrics()` |

## 配置来源

| 文件 | 范围 | 实际影响 |
| --- | --- | --- |
| `lynx-polaris/conf/example_config.yml` | Lynx runtime | 命名空间、重试、熔断、watch、限流、优雅停机、远程配置加载，以及服务注册配套信息 |
| `lynx-polaris/conf/polaris.yaml` | Polaris SDK | gRPC 连接地址、配置中心地址，以及可选的 SDK 侧指标上报 |

## 先看几个实现要点

- `namespace` 会被 validator 强校验，长度不能超过 `64`，且只能包含字母、数字、`_`、`-`。
- `weight` 必须在 `1..1000` 之间，`ttl` 必须在 `5..300` 秒之间。
- `timeout` 必须在 `1s..60s` 之间，并且必须严格小于 `ttl`，否则启动校验失败。
- `config_path` 可选；但如果路径不存在，插件只会告警并回退到默认 Polaris SDK 配置，不会按你期望的自定义地址生效。
- `service_config.additional_configs` 会按 `priority` 升序加载，所以优先级越大，越靠后覆盖。
- `service_config.namespace` 和 `additional_configs[*].namespace` 虽然在 schema 里存在，但当前配置源调用路径仍然走插件 namespace。不要把它们当成独立的真实路由开关，最好和顶层 `namespace` 保持一致。
- `enable_metrics`、`enable_retry`、`enable_circuit_breaker` 是 schema 字段，但当前初始化流程仍会创建对应 helper，并套用回退默认值。它们更像“意图声明”，不是严格的硬关闭开关。

## 字段说明

### `lynx.polaris`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `namespace` | Polaris 的主命名空间，用于服务发现、注册和配置读取。 | 总是要配；这是最核心的租户隔离边界。 | 未显式配置时回退为 `default`，但进入校验时必须已经是合法非空值。 | 留空、跨环境共用一个 namespace。 |
| `token` | 访问 Polaris API 的认证令牌。 | 控制面开启鉴权时。 | 可选；一旦设置，长度必须在 `8..1024`。 | 用过短的占位 token，以为本地不会校验。 |
| `weight` | Polaris 侧负载均衡权重。 | 需要调节实例流量占比时。 | 默认 `100`；合法范围 `1..1000`。 | 用 `0` 表示“不设置”，结果运行时被回退成 `100`。 |
| `ttl` | 服务租约 / 心跳有效期，单位秒。 | 需要服务注册和过期剔除时。 | 默认 `30`；合法范围 `5..300`。 | TTL 太小，同时又把 `timeout` 配得很大。 |
| `timeout` | Polaris 操作超时。 | 总是建议显式考虑，尤其是跨网络部署。 | 默认 `10s`；合法范围 `1s..60s`；必须 `< ttl`。 | 配成等于或大于 `ttl`，直接触发校验失败。 |
| `config_path` | Polaris SDK YAML 文件路径。 | 需要显式指定 server connector、配置中心地址或 SDK 侧 metrics reporter 时。 | 可选；文件存在时会设置 `POLARIS_CONFIG_PATH` 并按该文件初始化 SDK。 | 写成 `lynx-polaris/polaris.yaml`；本仓库真实路径是 `lynx-polaris/conf/polaris.yaml`。 |
| `enable_health_check` | 声明是否启用 Polaris 健康检查能力。 | 需要围绕注册做 Polaris 侧健康探测时。 | schema 开关；应和 `health_check_interval`、部署策略一起看。 | 控制面不可达却打开该字段，误以为本地探针足够。 |
| `health_check_interval` | 健康检查间隔。 | 打开健康检查且需要稳定轮询节奏时。 | 模板使用 `30s`；helper 默认值也是 `30s`。 | 间隔太短，导致检查噪声过高。 |
| `enable_metrics` | 声明插件指标意图。 | 需要消费插件指标时。 | 字段存在，但当前初始化仍会创建指标 helper。 | 误以为 `false` 一定代表完全不做 metrics 相关初始化。 |
| `enable_retry` | 声明插件侧重试意图。 | 需要对短暂 Polaris 故障做重试时。 | 当前重试管理器在值缺失时仍会回退到 `3` 次、`1s`。 | 打开重试但没考虑重试次数和间隔上界。 |
| `max_retry_times` | 最大重试次数。 | 开启重试且需要明确重试深度时。 | 合法范围 `0..10`；当前 helper 在 `<= 0` 时会回退为 `3`。 | 传负数，或误以为 `0` 就一定代表“彻底不重试”。 |
| `retry_interval` | 重试间隔。 | 开启重试时。 | helper 回退默认是 `1s`。 | 和上层调用方自己的重试策略打架。 |
| `enable_circuit_breaker` | 声明熔断意图。 | 需要隔离 Polaris 调用失败时。 | 当前初始化仍会创建 threshold 回退为 `0.5` 的 breaker。 | 误以为 `false` 就是完全没有熔断路径。 |
| `circuit_breaker_threshold` | 熔断错误率阈值。 | 需要显式控制熔断敏感度时。 | 默认 `0.5`；实践上应落在 `0.1..0.9`。 | 配成 `0` 或 `1`，导致校验失败或策略失真。 |
| `enable_service_watch` | 声明服务实例 watch 意图。 | 业务代码会调用 `WatchService()`，或确实需要服务实例热更新时。 | 只有在发现流量场景下才有意义。 | 打开了但没有任何消费者，只增加复杂度。 |
| `enable_config_watch` | 声明配置 watch 意图。 | 业务代码会调用 `WatchConfig()`，或期望配置变更回调时。 | 应与远程配置加载、`service_config` 一起使用。 | 没走 Polaris 配置中心，却打开了 config watch。 |
| `load_balancer_type` | 指定 Polaris 侧发现负载均衡策略。 | 服务发现启用，且治理规则依赖某种策略时。 | 默认支持值为 `weighted_random`、`ring_hash`、`maglev`、`l5cst`。 | 填了当前 Polaris 环境不支持的策略名，或忘了它只对发现流量生效。 |
| `enable_route_rule` | 声明是否启用路由规则。 | 环境里真的维护了 Polaris 路由规则时。 | 这是治理字段，通常要与发现流量一起看。 | 集群里没有路由规则却期望开启后马上见效。 |
| `enable_rate_limit` | 是否启用限流检查。 | 会调用 `CheckRateLimit()`，或网关/服务要依赖 Polaris 配额时。 | 需与 `rate_limit_type` 和服务端限流规则配合。 | 没有实际配置限流规则，只开了开关。 |
| `rate_limit_type` | 限流模式。 | 开启限流时。 | 支持值为 `local`、`global`。 | `enable_rate_limit` 没开却单独设置它，或模式与服务端策略不匹配。 |
| `enable_graceful_shutdown` | 声明优雅下线意图。 | 服务停机时需要优雅注销。 | 清理窗口仍然由 `shutdown_timeout` 决定。 | 只开开关，不给足够的停机窗口。 |
| `shutdown_timeout` | 停机清理最长时长。 | 只要停机质量重要，都应显式考虑。 | 默认 `30s`；清理逻辑会把它夹在 `5s..300s` 范围内。 | 配得过短，导致注销和 watcher 停止来不及完成。 |
| `enable_logging` | 声明详细日志意图。 | 需要排查控制面行为时。 | schema 字段；真实输出还受全局日志系统影响。 | 误以为它单独就能接管应用日志级别。 |
| `log_level` | 插件期望日志级别。 | 需要更细粒度日志时。 | 支持值为 `debug`、`info`、`warn`、`error`。 | 自定义了运行时不认识的级别。 |
| `service_config` | Polaris 配置中心多配置源加载设置。 | 希望 Lynx 从 Polaris 启动配置，而不是只读一个固定文件时。 | 可选嵌套对象。 | 想做 config watch，却没定义主配置源逻辑。 |

### `lynx.polaris.service_config`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `group` | 主配置文件所在分组。 | 配置中心按业务或环境拆 group 时。 | 为空时优先回退到当前应用名；应用名不可用时再回退到 `DEFAULT_GROUP`。 | 实际文件不在默认组里，却留空。 |
| `filename` | 主远程配置文件名。 | 主配置不是 `<应用名>.yaml` 时。 | 默认回退为 `<应用名>.yaml`。 | 少写后缀，远端存成了 `application` 而不是 `application.yaml`。 |
| `namespace` | 声明配置读取所用 namespace。 | 需要在文档和配置里显式表达配置租户边界时。 | 回退到顶层 `namespace`；当前实现里最好与顶层保持一致。 | 把它当成真实的独立 namespace 路由开关。 |
| `additional_configs` | 额外加载并合并的配置文件集合。 | 服务同时消费共享配置和业务配置时。 | 主配置之后加载，并按 `priority` 升序排列。 | 没想清楚谁覆盖谁就堆多个文件。 |

### `lynx.polaris.service_config.additional_configs[*]`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `group` | 某个额外配置文件所属 group。 | 额外文件不在主 group 里时。 | 不会自动帮你改写。 | 习惯性抄主 group，结果共享文件其实在别的组。 |
| `filename` | 额外远程配置文件名。 | 每个额外文件都必须有。 | 实际上是必填。 | 留空，导致插件无法拉取具体配置文件。 |
| `namespace` | 该额外文件声明使用的 namespace。 | 希望让运维显式看到租户边界时。 | 先回退到 `service_config.namespace`，再回退顶层 `namespace`。 | 和顶层 namespace 不一致，却期望当前实现真的切换租户读取。 |
| `priority` | 合并优先级提示。 | 多个文件会写同一批 key 时。 | 默认 `0`；值越小越早加载，值越大越晚覆盖。 | 误以为优先级越大越先加载。 |
| `merge_strategy` | 合并冲突策略元数据。 | 需要明确冲突处理约定时。 | 当前文档和运行时意图支持 `override`、`merge`、`append`；缺省时按 `override` 处理。 | 写了自定义策略名，但配置合并栈并不认识。 |

### 配套的 `lynx.service_info`

示例模板里还有根级别的 `lynx.service_info`。它属于 Lynx 应用注册信息，不属于 Polaris 插件 schema，但在 Polaris 注册场景下必须和 `lynx.polaris` 保持一致。

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `service_name` | 对外发布的服务名。 | 需要把服务注册进 Polaris 发现体系时。 | 应和调用方查询的服务名、路由规则中的服务名一致。 | 注册名和下游查找名不一致。 |
| `namespace` | service_info 层面的 namespace。 | 需要显式标注服务归属时。 | 应和 `lynx.polaris.namespace` 保持一致。 | `service_info` 和 `lynx.polaris` 使用了不同 namespace。 |
| `host` | 注册出去的主机地址。 | 运行时无法自动推导出正确可达地址时。 | 这里没有插件级默认值说明。 | 在容器或远程环境里仍然发布 `127.0.0.1`。 |
| `port` | 注册出去的端口。 | 服务要参与发现时。 | 必须与真实监听端口一致。 | 注册端口和真实监听端口不一致。 |
| `weight` | 注册信息里的权重副本。 | 希望注册载荷和插件权重一致时。 | 应与 `lynx.polaris.weight` 保持一致。 | 只改了其中一个 weight。 |
| `ttl` | 注册信息里的 TTL 副本。 | 希望注册载荷和插件 TTL 一致时。 | 应与 `lynx.polaris.ttl` 保持一致。 | 顶层 TTL 和这里的 TTL 漂移，造成排障困难。 |
| `metadata` | 实例附加元数据。 | 服务发现、路由、可观测性需要版本、机房、区域等标签时。 | 可选 map。 | 把 metadata 当秘密信息存储，或跨服务使用不统一的标签名。 |

### `lynx-polaris/conf/polaris.yaml`

| YAML 路径 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `global.serverConnector.protocol` | SDK 访问 Polaris server 的传输协议。 | Polaris 部署要求某种 connector 协议时。 | 模板使用 `grpc`。 | 改了协议，但服务端根本不支持。 |
| `global.serverConnector.addresses` | SDK connector 访问的 Polaris server 地址列表。 | 只要 `config_path` 用于显式连控制面，就应该正确设置。 | 模板使用 `127.0.0.1:8091`。 | 把配置中心地址误填到服务治理 connector 上。 |
| `global.statReporter.enable` | 是否启用 SDK 侧统计上报。 | 需要导出 Polaris SDK 指标时。 | 模板开启。 | 开了但 reporter 后端根本不可达。 |
| `global.statReporter.chain` | reporter 管道列表。 | 需要启用一个或多个统计上报插件时。 | 模板使用 `prometheus`。 | chain 里写了 reporter，但 `plugin` 下没配对应实现。 |
| `global.statReporter.plugin.prometheus.type` | Prometheus reporter 的工作模式。 | 启用 Prometheus reporter 时。 | 模板使用 `push`。 | 以为是 pull 模式，却还配了 push 地址。 |
| `global.statReporter.plugin.prometheus.address` | Prometheus push 目标地址。 | reporter 类型要求目标地址时。 | 模板使用 `127.0.0.1:9091`。 | 生产环境仍保留本地占位地址，结果指标没人收。 |
| `global.statReporter.plugin.prometheus.interval` | reporter 推送间隔。 | 开启 SDK 侧统计上报时。 | 模板使用 `10s`。 | 配得太小，制造无意义的上报压力。 |
| `config.configConnector.addresses` | Polaris 配置中心地址列表。 | 需要从 Polaris 拉远程配置时。 | 模板使用 `127.0.0.1:8093`。 | 直接复用 server connector 地址，忽略配置中心端口可能不同。 |

## 完整 YAML 模板

```yaml
lynx:
  polaris:
    namespace: default
    token: your-polaris-token
    weight: 100
    ttl: 30
    timeout: 10s
    config_path: ./conf/polaris.yaml
    enable_health_check: true
    health_check_interval: 30s
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    enable_circuit_breaker: true
    circuit_breaker_threshold: 0.5
    enable_service_watch: true
    enable_config_watch: true
    load_balancer_type: weighted_random
    enable_route_rule: true
    enable_rate_limit: true
    rate_limit_type: local
    enable_graceful_shutdown: true
    shutdown_timeout: 30s
    enable_logging: true
    log_level: info
    service_config:
      group: DEFAULT_GROUP
      filename: application.yaml
      namespace: default
      additional_configs:
        - group: SHARED_GROUP
          filename: shared-config.yaml
          namespace: default
          priority: 10
          merge_strategy: override

  service_info:
    service_name: my-service
    namespace: default
    host: 127.0.0.1
    port: 8080
    weight: 100
    ttl: 30
    metadata:
      version: "1.0.0"
      environment: production
      region: us-west-1
```

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

## 常见误配

- `config_path` 写错路径。本仓库真实 SDK 文件路径是 `lynx-polaris/conf/polaris.yaml`，不是 `lynx-polaris/polaris.yaml`。
- `timeout` 大于等于 `ttl`，直接触发校验失败。
- `service_info.namespace`、`service_info.weight`、`service_info.ttl` 与顶层 `lynx.polaris` 漂移。
- 把 `service_config.namespace` 或 `additional_configs[*].namespace` 配成别的 namespace，并期待当前实现真的切到另一套控制面租户读取配置。
- 在 Polaris 里还没有真实限流/路由治理规则时，就先打开 `enable_rate_limit`、`enable_route_rule`、`load_balancer_type` 等治理字段。

## 运行时接入

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
content, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
watcher, err := polaris.WatchConfig("application.yaml", "DEFAULT_GROUP")
allowed, err := polaris.CheckRateLimit("user-service", map[string]string{"region": "ap-northeast-1"})
```

当注册、发现、配置中心和治理都明确要统一收敛到一个控制面时，Polaris 才是合适选择。如果你只需要配置中心能力，[Apollo](/docs/existing-plugin/apollo) 或 [Etcd](/docs/existing-plugin/etcd) 通常更收敛。

## 相关页面

- [Nacos](/docs/existing-plugin/nacos)
- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
