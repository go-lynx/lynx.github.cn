---
id: redis
title: Redis 插件
---

# Redis 插件

Redis 插件是 Lynx 运行时持有的 Redis client，也是 Redis Lock 这类上层包复用的基础资源。本页刻意只围绕 `lynx-redis/conf/example_config.yml` 里出现过的键来写，因为这个文件仍然存在，但其中有一部分已经是遗留写法。

## Runtime Facts（运行时事实）

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-redis` |
| 配置前缀 | `lynx.redis` |
| Runtime 插件名 | `redis.client` |
| 跨拓扑稳定 API | `GetUniversalRedis()` |
| 仅单机场景便利 API | `GetRedis()` |

## What The Example File Actually Represents（这个示例文件现在到底代表什么）

- `lynx-redis/conf/example_config.yml` 是一个遗留的单机样例。
- 当前 runtime schema 已经以 `conf/redis.proto` 为准，使用的是 `addrs`，不是 `addr`，而且不再包含示例文件里的部分旧开关键。
- metrics hook、启动期 ping、readiness 检查、shared-resource 注册都已经是当前实现的固定行为，不受旧样例里的 `enable_metrics` / `enable_health_check` 控制。

## Example Template Field Guide（示例模板字段说明）

| 字段 | 它在示例文件中的含义 | 什么时候启用 | 当前默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `addr` | 遗留的单地址写法。 | 只在阅读旧样例并准备迁移时。 | 这个键已经不在 `conf/redis.proto` 里。当前配置必须改成 `addrs: ["host:port"]`。 | 把 `addr` 直接复制到新配置里，然后疑惑为什么校验报 `addrs` 缺失。 |
| `password` | Redis AUTH 密码。 | Redis 实例要求认证时。 | 默认空。若部署启用了 ACL，当前 schema 还可能需要 `username`，而旧样例表达不了这一点。 | 以为只有密码就足够覆盖所有 ACL 场景。 |
| `db` | Redis 逻辑库编号。 | 主要用于单机或 sentinel 场景。 | 默认 `0`。Redis Cluster 只支持数据库 `0`。 | 把单机样例直接搬到 cluster，上来就配 `db > 0`。 |
| `pool_size` | 旧样例里的连接池大小键。 | 只在把旧样例翻译成新 schema 时有意义。 | 这个键不在当前 protobuf schema 里。现代对应物通常是 `max_active_conns`，必要时再补 `max_idle_conns`。 | 今天还在写 `pool_size`，却期待当前 runtime 真能按它缩放连接池。 |
| `min_idle_conns` | 连接池最小空闲连接数。 | 需要提前保留一些空闲连接时。 | 省略时当前启动路径会自己补默认值；它应该和现代的活跃/空闲池字段一起考虑，而不是继续和旧 `pool_size` 绑在一起。 | 迁移后把它设得高于真正想用的活跃连接上限。 |
| `max_retries` | Redis 命令重试次数。 | 需要对瞬时故障做重试时。 | 当前启动路径默认会补成 `3`，而且把 `0` 当作“使用默认值”，不是“禁用重试”。 | 把 `0` 当成真正的 no-retry。 |
| `enable_metrics` | 旧样例里的 metrics 开关。 | 只在审计旧配置时。 | 这个键已经不在当前 protobuf schema 里。当前插件总会安装命令级和连接池级 metrics hook。 | 改这个值却期待 metrics 真正被关闭。 |
| `enable_health_check` | 旧样例里的健康检查开关。 | 只在审计旧配置时。 | 这个键已经不在当前 protobuf schema 里。当前实现本来就会做启动期 ping 和 readiness 检查。 | 改这个值却期待启动连通性检查消失。 |

## How To Migrate The Legacy Sample（如何把旧样例迁移到当前 schema）

如果你要写一个现代的单机 Redis 配置，应该把旧样例翻译成当前 schema，而不是照抄：

```yaml
lynx:
  redis:
    addrs:
      - "localhost:6379"
    password: ""
    db: 0
    min_idle_conns: 5
    max_active_conns: 10
    max_retries: 3
```

当前 schema 还支持 `network`、`username`、`client_name`、连接生命周期字段、TLS、Sentinel / Cluster 等能力，这些新字段都在 `conf/redis.proto` 里，只是旧 `example_config.yml` 没有覆盖到。

## Usage Guidance（使用建议）

- 除非服务永远只跑单机 Redis，否则优先使用 `GetUniversalRedis()`。
- `GetRedis()` 只有在 standalone 模式下才会返回具体的 `*redis.Client`。
- 像 [Redis Lock](/docs/existing-plugin/redis-lock) 这样的上层包，应复用 runtime 持有的 client，而不是另建一套连接池。

## Related Pages（相关页面）

- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Layout](/docs/existing-plugin/layout)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
