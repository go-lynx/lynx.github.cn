---
id: etcd-lock
title: Etcd Lock 插件
---

# Etcd Lock 插件

`github.com/go-lynx/lynx-etcd-lock` 是 Lynx 基于 etcd 的分布式锁层。它是一个 runtime plugin，但**没有**独立的 YAML 配置 schema，也没有单独的 `example_config.yml`。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-etcd-lock` |
| Runtime 插件名 | `etcd.distributed.lock` |
| 插件元数据配置前缀 | `lynx.etcd-lock` |
| 必需的上游 runtime 资源 | `etcd.config.center` |
| 公开 API | `SetCallback`, `Lock`, `LockWithOptions`, `LockWithRetry`, `NewLockFromClient`, `GetStats()`, `Shutdown()` |

## 配置边界

- 仓库模板里没有专门的 `lynx.etcd-lock` YAML 树。
- 没有独立的 `conf` schema，也没有单独的 `conf/example_config.yml`。
- 启动依赖上游 etcd 插件先发布 `etcd.config.center` 这个共享 runtime 资源。
- 如果上游 etcd 插件不存在，或者没有暴露可用 client，初始化会直接失败，常见报错包括 `etcd config center plugin not found`、`etcd client is nil`。
- 锁行为通过代码里的 `LockOptions`、`RetryStrategy`、`RenewalConfig` 配置，而不是通过 YAML 配置。

## 实际生效的 YAML：全部继承自 `lynx.etcd`

因为 Etcd Lock 直接复用上游 etcd client，所以真正影响它的 YAML 只有上游 [Etcd](/docs/existing-plugin/etcd) 插件配置。

### 继承的 `lynx.etcd` 字段

| 字段 | 对 Etcd Lock 的影响 | 默认值 / 交互影响 | 常见误解 |
| --- | --- | --- | --- |
| `endpoints` | 决定锁请求最终连到哪个 etcd 集群。 | 上游 client 的必填项。 | 以为不配置 endpoints 也能加锁。 |
| `timeout` | 影响共享 etcd client 的操作超时。 | 上游默认 `10s`。 | 把它当成锁租约 TTL。 |
| `dial_timeout` | 影响共享 client 的建连等待时间。 | 上游默认 `5s`。 | 忽略慢连接，结果还没加锁就先建连失败。 |
| `namespace` | 影响上游 etcd 插件的配置读取前缀，但**不会**改写锁 key 前缀。 | 上游默认 `lynx/config`。 | 以为它能改变锁在 etcd 里的存储 key 前缀。 |
| `username` / `password` | 给共享 etcd client 做鉴权。 | 可选。 | 认证集群里忘了配置。 |
| `enable_tls` | 让共享 etcd client 使用 TLS。 | 需要与证书路径配套。 | 想要安全链路，却忘了开 TLS。 |
| `cert_file` / `key_file` / `ca_file` | 提供共享 client 的 TLS 材料。 | 仅当集群 TLS 模式要求时才需要。 | 以为 Etcd Lock 还有自己单独的一套 TLS 配置。 |
| `enable_cache` | 控制上游 etcd 配置中心缓存。 | 上游真实开关。 | 以为它会改变锁语义；实际上不会，它只影响配置中心行为。 |
| `enable_metrics` | 控制上游 etcd 指标采集。 | 上游真实开关。 | 以为它是专门的锁指标开关。 |
| `enable_retry` / `max_retry_times` / `retry_interval` | 控制上游 etcd 插件的重试管理器。 | 上游真实开关和默认值。 | 把上游 client 重试和锁抢占重试策略混为一谈。 |
| `shutdown_timeout` | 影响上游 client 清理窗口。 | 上游默认回退 `10s`。 | 以为它等同于锁续约超时或锁操作超时。 |
| `enable_register` / `enable_discovery` | 只影响上游注册/发现逻辑。 | 默认 `false`。 | 误以为加锁必须开启注册或发现。实际上不需要。 |
| `registry_namespace` / `ttl` | 只影响上游服务注册逻辑。 | 上游默认 `lynx/services` 和 `30s`。 | 误以为它们定义了锁 key 命名空间或锁过期时间。 |
| `service_config.prefix` / `additional_prefixes` | 只影响上游配置源加载。 | 回退到上游 namespace，并按声明顺序加载。 | 误以为它们会影响分布式锁存储路径。 |
| `enable_graceful_shutdown` / `enable_logging` / `log_level` / `service_config.priority` / `service_config.merge_strategy` | 上游 schema 兼容字段。 | 上游 schema 接受，但不是活跃锁配置开关。 | 误以为这些是锁专用控制项。 |

## 完整 YAML 示例

这里依然没有独立的 `lynx.etcd-lock` schema。下面这份完整示例实际就是锁插件真正消费的上游 `lynx.etcd` 配置。

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379 # 复用 client 时必填的共享 etcd endpoint 列表
    timeout: 10s # 共享 client 的操作超时
    dial_timeout: 5s # 共享 client 的建连超时
    namespace: lynx/config # 上游配置 key namespace；不会改写锁 key
    username: "" # 认证集群下可选的用户名
    password: "" # 与 username 配套的密码
    enable_tls: false # 让共享 etcd client 走 TLS
    cert_file: "" # 需要双向 TLS 时的客户端证书路径
    key_file: "" # 需要双向 TLS 时的客户端私钥路径
    ca_file: "" # 需要校验服务端证书时的 CA 文件路径
    enable_cache: true # 只影响上游配置缓存，不会改变锁语义
    enable_metrics: true # 上游 etcd 指标开关
    enable_retry: true # 上游 client 重试管理器开关
    max_retry_times: 3 # 上游重试上限
    retry_interval: 1s # 上游重试间隔
    shutdown_timeout: 10s # 共享 client 清理超时
    enable_register: false # 只影响上游注册能力；加锁不需要
    enable_discovery: false # 只影响上游发现能力；加锁不需要
    registry_namespace: lynx/services # 只影响上游服务注册 namespace
    ttl: 30s # 只影响上游服务注册 TTL
    service_config:
      prefix: lynx/config # 只影响上游配置加载前缀
      additional_prefixes:
        - lynx/config/app # 额外的上游配置前缀
    # enable_graceful_shutdown: true # 上游仅兼容保留的 schema 字段
    # enable_logging: true # 上游仅兼容保留的 schema 字段
    # log_level: info # 上游仅兼容保留的 schema 字段
    # service_config.priority: 0 # 上游仅兼容保留的 schema 字段
    # service_config.merge_strategy: override # 上游仅兼容保留的 schema 字段

  # 仓库里不存在独立的 lynx.etcd-lock schema。
  # 锁行为通过代码里的 LockOptions 配置。
```

## 最小可用 YAML 示例

Etcd Lock 的启动配置直接继承自 etcd 插件。因为没有独立的 `lynx.etcd-lock` YAML 树，所以最小可运行配置就是下面这个共享的 `lynx.etcd` 子集。

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379 # 复用锁 client 时必填的共享 etcd endpoint
```

## 代码级锁参数

### `LockOptions`

| 字段 | 作用 | 何时使用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `Expiration` | 一次加锁成功后的租约 TTL。 | 总是必填；每个锁都必须有正数过期时间。 | 默认 `30s`；校验要求 `> 0`。 | 传 `0`，以为锁可以永久持有。 |
| `RetryStrategy` | 抢锁冲突后的重试策略。 | 业务希望在竞争失败后继续重试时。 | 默认 `MaxRetries: 3`、`RetryDelay: 100ms`。 | 把它和上游 etcd client 的重试策略混淆。 |
| `RenewalEnabled` | 加锁成功后是否启用后台续约。 | 临界区可能长于单个租约 TTL 时。 | 默认 `true`。 | 长任务场景关闭它，结果锁中途过期。 |
| `RenewalThreshold` | 剩余 TTL 低到什么比例时开始续约。 | 开启自动续约且需要更细粒度控制时。 | 默认 `0.3`；校验范围 `0..1`。 | 配成大于 `1` 或小于 `0`。 |
| `WorkerPoolSize` | 续约 worker 池容量。 | 可能同时有很多锁续约时。 | 默认 `50`；必须 `>= 0`。 | 传负数，或把 `0` 误解成“关闭续约”。 |
| `RenewalConfig` | 续约重试与轮询细节。 | 需要调节续约压力或退避行为时。 | 默认使用下方 `DefaultRenewalConfig`。 | 只改顶层 RetryStrategy，却以为续约重试也会一起变。 |
| `OperationTimeout` | acquire/release 单次操作超时。 | 需要比外层 context 更严格的单操作上限时。 | 默认 `600ms`；`0` 表示不额外设置操作超时。 | 把它当成锁过期时间。 |

### `RenewalConfig`

| 字段 | 作用 | 默认值 | 常见误配 |
| --- | --- | --- | --- |
| `MaxRetries` | 续约最大重试次数。 | `4` | 设得太低，遇到短暂 etcd 抖动就续约失败。 |
| `BaseDelay` | 续约退避基础延迟。 | `100ms` | 设得太高，第一次重试就太慢。 |
| `MaxDelay` | 续约退避上限。 | `800ms` | 上限过大，吞掉太多剩余租约时间。 |
| `CheckInterval` | 续约检查轮询周期。 | `300ms` | 比安全续约窗口还长。 |
| `OperationTimeout` | 单次续约操作超时。 | `600ms` | 以为它会改变锁租约 TTL。 |

### 锁 key 规则

| 规则 | 含义 |
| --- | --- |
| 业务 key 不能为空 | `ValidateKey` 会拒绝空字符串。 |
| 业务 key 长度必须 `<= 255` | 超长 key 会在创建锁前被拒绝。 |
| 真正写入 etcd 的 key 是 `lynx/lock/<business-key>` | 这个前缀在代码里写死，当前不能通过 YAML 改。 |

## 用法示例

```go
options := etcdlock.DefaultLockOptions
options.Expiration = 30 * time.Second
options.RetryStrategy = etcdlock.RetryStrategy{
    MaxRetries: 3,
    RetryDelay: 100 * time.Millisecond,
}
options.RenewalEnabled = true

err := etcdlock.LockWithOptions(ctx, "order:123", options, func() error {
    return doBusiness()
})
```

```go
lock, err := etcdlock.NewLockFromClient(ctx, "inventory:sku-1", etcdlock.DefaultLockOptions)
if err != nil {
    return err
}
if err := lock.Acquire(ctx); err != nil {
    return err
}
defer lock.Release(ctx)
```

## 常见误配

- 自己新增一个 `lynx.etcd-lock` YAML block，并期待仓库能识别或校验它。当前没有独立 schema。
- 在上游 etcd 插件还没准备好之前就加载 `lynx-etcd-lock`。
- 把上游 `registry_namespace` 或 `ttl` 当成锁 key 布局或锁过期时间。锁过期时间由代码级 `LockOptions.Expiration` 决定。
- 使用非法业务 key：空字符串或长度超过 `255`。
- 把上游 etcd client 的重试配置和锁竞争重试配置混在一起。

## 相关页面

- [Etcd](/docs/existing-plugin/etcd)
- [Redis Lock](/docs/existing-plugin/redis-lock)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
