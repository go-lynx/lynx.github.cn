---
id: seata
title: 分布式事务插件
---

# Seata 分布式事务插件

`lynx-seata` 在 Lynx 里真正负责的事情只有两件：决定要不要启动 Seata Client，以及告诉 Seata 去加载哪一份外部配置文件。注册中心、协调器、命名空间、鉴权、传输等参数仍然写在 `config_file_path` 指向的 Seata YAML 里。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-seata` |
| 配置前缀 | `lynx.seata` |
| Runtime 插件名 | `seata.server` |
| 公开 API | `GetPlugin()`、`GetConfig()`、`GetConfigFilePath()`、`IsEnabled()`、`WithGlobalTx(...)`、`GetMetrics()` |

## 这份 YAML 实际控制什么

- 只有当服务本来就处在 Seata 事务体系里，并且你希望由 Lynx 启动流程接管 `client.InitPath(...)` 时，才需要启用它。
- 插件不会帮你定义事务边界，业务代码仍然要自己决定在哪里调用 `WithGlobalTx(...)`。
- 如果调用 `WithGlobalTx(...)` 时把 `timeout` 传成 `0`，插件内部会回退到 `60s` 默认值；这个超时不在 `lynx.seata` 里配置。

## YAML 模板

```yaml
lynx:
  seata:
    enabled: true
    config_file_path: "./conf/seata.yml"
```

## 字段说明

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 控制 Lynx 是否启动 Seata Client 并注册共享资源。 | 只有为 `true` 时才会执行；否则启动阶段直接返回，`WithGlobalTx(...)` 也会报插件已禁用。 | 默认 `false`。它才是真正的总开关，单独配置 `config_file_path` 不会自动启用插件。 | 已经填了配置路径，却忘了把 `enabled` 打开。 |
| `config_file_path` | 传给 `client.InitPath(...)` 的 Seata 配置文件路径。 | 只有在 `enabled: true` 时才会被消费。 | 省略时默认回退到 `./conf/seata.yml`。这里可以指向本地 `seata.yml` / `seatago.yml`，也可以指向由配置中心落地出来、seata-go 能直接读取的文件。 | 把协调器地址直接写进这个字段，而不是指向一份真实的 Seata YAML 文件。 |

## 完整 YAML 示例

```yaml
lynx:
  seata:
    enabled: true # 必填开关；为 false 时会完全跳过 Seata Client 启动
    config_file_path: "./conf/seata.yml" # 默认就是 ./conf/seata.yml；这里应指向外部 Seata Client 配置文件
```

## 最小可用 YAML 示例

```yaml
lynx:
  seata:
    enabled: true # 打开插件
    config_file_path: "./conf/seata.yml" # 指向 seata-go 实际要加载的外部 Seata 配置文件
```

## 运行注意点

- `config_file_path` 指向的 Seata YAML 不是 Lynx 自动生成的，真正的 registry、coordinator、auth、namespace、transport 参数都要写在那份文件里。
- `CheckHealth()` 在插件启用时只检查路径是否为空，不会验证文件是否存在，也不会验证 Seata 连接是否真的成功。
- 如果你的诉求更偏向业务层的 Saga / TCC / XA / 两阶段消息编排，应该优先对照 [DTM](/docs/existing-plugin/dtm)，而不是默认把两套事务模型叠在一起。

## 如何使用

```go
plugin := seata.GetPlugin()

err := plugin.WithGlobalTx(ctx, "CreateOrderTx", 30*time.Second, func(ctx context.Context) error {
    return doBusiness(ctx)
})
```

`WithGlobalTx(...)` 是当前最直接的接入方式：既复用 Lynx 持有的 Seata runtime 状态，又保留业务侧显式事务边界。

## 相关页面

- [DTM](/docs/existing-plugin/dtm)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
