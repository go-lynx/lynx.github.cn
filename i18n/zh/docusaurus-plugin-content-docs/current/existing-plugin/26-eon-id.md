---
id: eon-id
title: Eon ID 分布式 ID 生成器
---

# Eon ID 分布式 ID 生成器

`lynx-eon-id` 是 Lynx 里的 Snowflake 风格 64 位 ID 生成插件。它最关键的运行时选择，其实是 worker ID 究竟走手工分配，还是走共享 Redis 自动注册。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-eon-id` |
| 配置前缀 | `lynx.eon-id` |
| Runtime 插件名 | `eon-id` |
| 公开 API | `GetEonIdPlugin()`、`GetEonIdGenerator()`、`GenerateID()`、`GenerateIDWithMetadata()`、`ParseID()`、`GetGenerator()`、`CheckHealth()` |

如果需要直接通过插件管理器查找，runtime 名称就是 `eon-id`：

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("eon-id")
```

## 依赖模型

- `auto_register_worker_id: true` 是 Redis 成为运行时依赖的关键开关。
- 在 Lynx runtime 模式下，插件会先尝试你配置的共享资源名，然后在 `redis.client` 与历史 `redis` 别名之间做回退。
- 如果 Redis 资源查找失败，启动阶段不会直接崩掉，而是打 warning 并静默关闭自动注册。从这一刻开始，worker ID 唯一性就重新落回你自己身上。
- 如果 `auto_register_worker_id: false`，插件就没有 Lynx 侧的 Redis 依赖，但你必须保证每个实例的手工 `worker_id` 真正唯一。

## YAML 模板

```yaml
lynx:
  eon-id:
    datacenter_id: 1
    # worker_id: 1
    auto_register_worker_id: true
    redis_key_prefix: "lynx:eon-id:"
    worker_id_ttl: "30s"
    heartbeat_interval: "10s"
    enable_clock_drift_protection: true
    max_clock_drift: "5s"
    clock_check_interval: "1s"
    clock_drift_action: "wait"
    enable_sequence_cache: true
    sequence_cache_size: 1000
    enable_metrics: true
    redis_plugin_name: "redis"
    redis_db: 0
    custom_epoch: 1609459200000
    worker_id_bits: 5
    sequence_bits: 12
```

`example_config.yml` 里的注释还带着更宽的 worker ID 范围暗示，但按当前 Lynx runtime，如果你省略 `worker_id_bits`，实际会回退到 `5`，所以默认有效 worker ID 范围是 `0-31`，不是 `0-1023`。

## 字段说明

### 标识布局与 Redis worker 注册

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `datacenter_id` | 决定 ID 里编码的机房位。 | 始终生效。 | 示例值是 `1`，但正常 runtime 扫描下如果省略，值会保持 `0`。由于 runtime 固定保留 `5` 个 datacenter bits，它必须在 `0-31` 之间。 | 在多个真实机房里复用同一个 datacenter ID，以为只靠 worker ID 就足够避免冲突。 |
| `worker_id` | 作为手工 worker ID，或自动注册模式下的“优先尝试值”。 | 始终在配置里存在，但具体行为取决于 `auto_register_worker_id`。 | 关闭自动注册时，生成器直接使用它；开启自动注册且 `worker_id > 0` 时，启动会先尝试抢占这个具体 worker ID，失败后再回退到自动分配。省略时是 `0`。 | 关闭自动注册后，多个副本仍然沿用同一个默认 worker ID。 |
| `auto_register_worker_id` | 决定是走 Redis 自动分配，还是走手工 worker ID。 | 始终生效。 | 示例里是 `true`，但在正常 runtime 扫描路径里，省略布尔值会保持 `false`。一旦为 `true`，Redis 查找就变成运行时依赖；查不到时插件会打 warning 并退回手工模式。 | 以为示例里的 `true` 就是隐式默认值，结果实际上根本没启用自动注册。 |
| `redis_key_prefix` | 指定 Redis 里 worker 注册 key 的命名空间。 | 只有 `auto_register_worker_id: true` 时。 | 为空时会被标准化成 `lynx:eon-id:`，末尾缺少 `:` / `_` 也会自动补齐。多个环境复用同一前缀时，会让原本不相关的部署争夺同一批 worker ID。 | 开发、测试、生产共用同一个前缀。 |
| `worker_id_ttl` | 指定 Redis 里 worker 注册记录的 TTL。 | 只有 `auto_register_worker_id: true` 时。 | 省略时 runtime 用 `30s`。在实践上它应该大于 `heartbeat_interval`，校验 helper 还建议至少保持到 heartbeat 的 `3x`。 | 配得过短，导致 worker 记录频繁过期或发生争抢抖动。 |
| `heartbeat_interval` | 指定刷新 worker 注册记录的心跳间隔。 | 只有 `auto_register_worker_id: true` 时。 | 省略时 runtime 用 `10s`。它应当小于 `worker_id_ttl`；过小则会增加 Redis 心跳开销。 | 配成大于等于 TTL，最后 worker 注册一直不稳定。 |
| `redis_plugin_name` | 指定优先使用的共享 Redis 资源名。 | 只有 `auto_register_worker_id: true` 时。 | 这里填的是 Lynx 插件资源名，不是 DSN。为空时 runtime 会优先尝试 `redis`，同时仍会回退到 `redis.client` / 历史别名路径。 | 在这里直接写 `127.0.0.1:6379` 这类 Redis 地址。 |
| `redis_db` | 记录期望使用的 Redis DB 编号。 | 配置始终会被解析，但当前 Lynx runtime 不会靠它切换共享 Redis 客户端的 DB。 | 这个字段在配置和校验 helper 里会保留，但 runtime 路径复用的是已经启动好的共享 Redis client。 | 以为单改这个字段就能把 worker 注册迁移到另一逻辑库。 |

### 时钟回拨与运行保护

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enable_clock_drift_protection` | 控制生成器是否处理时钟回拨。 | 每次发号路径上都会受它影响。 | 示例里是 `true`，但正常 runtime 扫描路径里省略布尔值会保持 `false`。 | 以为示例里默认开启，就代表生产里天然开启了保护。 |
| `max_clock_drift` | 指定可容忍的最大回拨幅度。 | 只有启用了时钟回拨保护时。 | 省略时 runtime 用 `5s`。生成器校验会拒绝 `<100ms` 或 `>1h` 的值。 | 配得过低，稍微有点时钟修正就频繁触发等待或报错。 |
| `clock_check_interval` | 为时钟检查预留的间隔字段。 | 当前会被解析，但 Lynx runtime 还不会据此启动独立的周期检查器。 | 它更多是 schema / helper 校验对齐字段；当前生成器是在发号时内联检查时钟回拨。 | 看到这个字段就以为后台已经有独立时钟巡检协程。 |
| `clock_drift_action` | 决定检测到时钟回拨后的处理方式。 | 真正发生回拨时。 | 为空时回退到 `wait`。合法值只有 `wait`、`error`、`ignore`。 | 直接选 `ignore`，却没有接受它在单调性和监控上的代价。 |

### 吞吐、指标与位分配

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enable_sequence_cache` | 控制是否启用 sequence cache 提升吞吐。 | 始终在生成器内部生效。 | 示例里是 `true`，但正常 runtime 扫描路径里省略布尔值会保持 `false`。它直接依赖 `sequence_cache_size` 和 `sequence_bits`。 | 因为示例文件开着，就以为缓存默认一直开启。 |
| `sequence_cache_size` | 指定 sequence cache 的大小。 | 只有 `enable_sequence_cache: true` 时。 | 若为 `0`，runtime 会补成 `1000`。它必须小于等于 `2^sequence_bits`。 | 还保持默认 `sequence_bits: 12`，却把缓存配到 `4096` 以上。 |
| `enable_metrics` | 控制是否创建生成器指标。 | 始终生效。 | 示例里是 `true`，但正常 runtime 扫描路径里省略布尔值会保持 `false`。关闭后，metrics / health 相关细节会明显变少。 | 期待所有环境默认都有指标，而没有显式开启。 |
| `custom_epoch` | 指定自定义 epoch 毫秒值。 | 始终生效。 | 为 `0` 时 runtime 会补成 `1609459200000`（`2021-01-01 00:00:00 UTC`）。生成器校验会拒绝未来时间、过旧时间，以及导致未来可用时间位空间不足的配置。 | 只是为了“看起来顺眼”改 epoch，结果缩短了 ID 的可用寿命。 |
| `worker_id_bits` | 指定 worker ID 占用多少位。 | 始终生效。 | 为 `0` 时 runtime 会补成 `5`。它会和固定的 `5` 个 datacenter bits 以及 `sequence_bits` 一起参与总位数约束，三者之和不能超过 `22`。 | 继续沿用旧的 `10` 位 worker 假设，却忘了同步调低 `sequence_bits`。 |
| `sequence_bits` | 指定每毫秒 sequence 占用多少位。 | 始终生效。 | 为 `0` 时 runtime 会补成 `12`。如果你增加 `worker_id_bits`，就必须相应降低 `sequence_bits`，因为固定 datacenter bits + worker bits + sequence bits 总和不能超过 `22`。 | 写了 `worker_id_bits: 10` 却还保留 `sequence_bits: 12`，导致生成器校验失败。 |

## 如何使用

```go
import eonid "github.com/go-lynx/lynx-eon-id"

id, err := eonid.GenerateID()
id, metadata, err := eonid.GenerateIDWithMetadata()
parsed, err := eonid.ParseID(id)
plugin, err := eonid.GetEonIdPlugin()
```

## 实际注意点

- 只有当你能自己严格保证全局唯一性时，才建议使用手工 `worker_id`；多实例部署通常更适合 Redis 自动注册。
- 当 worker 注册状态变得不健康时，插件会拒绝继续发号，这是刻意的 fail-closed 设计，用来降低重复 ID 风险。
- `redis_db` 与 `clock_check_interval` 目前看起来比真实行为“更强”，可以保留在文档里，但不要默认它们已经实现了 DB 切换或后台时钟轮询。

## 相关页面

- [Redis](/docs/existing-plugin/redis)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
- [Layout](/docs/existing-plugin/layout)
