---
id: seata
title: 分布式事务插件
---

# Seata 分布式事务插件

Seata 模块是一个由 runtime 管理的 Seata Client 插件。它不会替你自动推断事务边界，但它会把 Seata Client 初始化和全局事务入口纳入 Lynx 的启动模型。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-seata` |
| 配置前缀 | `lynx.seata` |
| Runtime 插件名 | `seata.server` |
| 公开 API | `GetPlugin()`、`GetConfig()`、`GetConfigFilePath()`、`IsEnabled()`、`WithGlobalTx(...)`、`GetMetrics()` |

## 实现提供了什么

当前实现包括：

- 配置驱动的 Seata Client 初始化
- enable/disable 开关
- 明确的配置文件路径处理
- 基于 seata-go 全局事务的 `WithGlobalTx(...)` helper
- 指标暴露

所以这个插件并不是只告诉你“支持 Seata”，而是已经提供了框架持有的事务入口。

## 配置

```yaml
lynx:
  seata:
    enabled: true
    config_file_path: "./conf/seata.yml"
```

如果不显式指定，插件默认使用 `./conf/seata.yml`。

## 如何使用

```go
plugin := seata.GetPlugin()

err := plugin.WithGlobalTx(ctx, "CreateOrderTx", 30*time.Second, func(ctx context.Context) error {
    return doBusiness(ctx)
})
```

## 实际注意点

- 插件通过 `client.InitPath(...)` 初始化客户端。
- 当前 shutdown 比较轻，因为 seata-go 本身没有暴露很丰富的公共关闭 API。
- 如果你的场景更偏向编排式分布式事务，应对照 [DTM](/docs/existing-plugin/dtm) 一起看。

## 相关页面

- [DTM](/docs/existing-plugin/dtm)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
