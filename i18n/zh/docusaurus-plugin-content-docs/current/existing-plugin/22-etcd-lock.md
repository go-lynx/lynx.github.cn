---
id: etcd-lock
title: Etcd Lock 插件
---

# Etcd Lock 插件

Etcd Lock 插件是一层构建在 Etcd 插件客户端资源之上的分布式锁能力，它不是一个独立的存储连接器。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-etcd-lock` |
| 配置前缀 | `lynx.etcd-lock` |
| Runtime 插件名 | `etcd.distributed.lock` |
| 依赖 | runtime 资源 `etcd.config.center` |
| 公开 API | `Lock`、`LockWithOptions`、`LockWithRetry`、`NewLockFromClient`、`GetStats()` |

## 实现里提供了什么

从代码看，这个插件会：

- 在初始化阶段从 Etcd 插件解析出 Etcd Client
- 暴露自动加锁与自动释放的 helper API
- 支持 retry strategy 与 operation timeout
- 支持长时间持锁下的自动续租
- 维护全局 lock manager 统计

所以它的 API 是明显面向业务调用的，你不必每次都直接操作原始 Etcd lease。

## 使用模式

```go
err := etcdlock.Lock(ctx, "order:123", 15*time.Second, func() error {
    return doBusinessWork()
})
```

需要更强控制时：

```go
opts := etcdlock.DefaultLockOptions
opts.RenewalEnabled = true
opts.RetryStrategy.MaxRetries = 3

err := etcdlock.LockWithOptions(ctx, "order:123", opts, fn)
```

## 重要约束

如果 `etcd.config.center` 没有先加载，这个插件会初始化失败，因为它必须从该 runtime 资源里取共享的 Etcd Client。

## 相关页面

- [Etcd](/docs/existing-plugin/etcd)
- [Redis Lock](/docs/existing-plugin/redis-lock)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
