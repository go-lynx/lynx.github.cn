---
id: plugin-manager
title: 插件管理
---

# 插件管理

在 Lynx 里，插件管理器就是运行时装配中心。它做的事不只是“加载插件”，而是从全局 typed factory 准备插件实例、解析生命周期顺序、持有共享 runtime，并把受管理的插件实例暴露给应用层。

## 插件管理器现在实际负责什么

当前 `TypedPluginManager` 暴露的公开能力包括：

- `LoadPlugins(...)`、`LoadPluginsByName(...)`、`PreparePlug(...)`
- `GetPlugin(name)`、`GetPluginByID(id)`
- `GetPluginCapabilities(name)`
- `GetRuntime()`、`SetConfig(...)`
- `StopPlugin(...)`、`ListResources()`、`GetResourceStats()`
- `GetRestartRequirementReport()`

这已经说明一个事实：Lynx 里的插件管理，本质上是生命周期和运行时资源管理，不只是发现插件。

## 当前真实的运行时链路

现在 Lynx 里的实际流程是：

1. 插件模块把自己注册进 `factory.GlobalTypedFactory()`
2. 应用创建插件管理器
3. 启动阶段把配置交给管理器
4. 管理器按已配置前缀准备插件实例
5. 管理器基于共享 `plugins.Runtime` 初始化这些插件
6. 应用代码通过公开 Getter 或 `GetPlugin(...)` 取得受管理实例

这条链里任何一环缺失，插件都不会因为“配置写了”就自动可用。

## 当前插件契约长什么样

旧文档里那种 `Load/Unload` 风格接口，已经不是现在最合适的理解方式。当前 core 里的主契约是：

```go
type CorePlugin interface {
    Metadata
    Lifecycle
    DependencyAware
}

type Plugin interface {
    CorePlugin
    LifecycleSteps
}
```

Lynx 当前管理的步骤级 hook 是：

```go
type LifecycleSteps interface {
    InitializeResources(rt Runtime) error
    StartupTasks() error
    CleanupTasks() error
    CheckHealth() error
}
```

大多数真实插件都会嵌入 `plugins.BasePlugin` 或 `plugins.TypedBasePlugin[...]`，再按需实现这些 hook。

## 注册在现在意味着什么

当前插件通常是这样注册的：

```go
func init() {
    factory.GlobalTypedFactory().RegisterPlugin(
        pluginName,
        confPrefix,
        func() plugins.Plugin {
            return NewPlugin()
        },
    )
}
```

这也是为什么匿名导入是标准接入路径的一部分。如果模块从未被导入，typed factory 里就没有这个插件名对应的 creator。

## 为什么顺序仍然关键

一个很实际的依赖链可能是：

- `etcd.distributed.lock` 依赖 Etcd runtime 资源
- HTTP / gRPC 服务依赖 TLS 材料已经可用
- 配置中心或治理插件需要先于业务入口完成初始化

插件管理器负责把这套顺序排出来，业务代码不需要手工拼接。

## 按现在的模型排查问题

如果一个插件看起来没有生效，建议按这个顺序检查：

1. 是否导入了正确模块，让 `RegisterPlugin(...)` 真正执行了
2. 配置是不是写在代码实际使用的前缀下
3. 启动是不是经过了 `boot.NewApplication(wireApp).Run()`
4. 获取能力时是不是用了插件公开 Getter 或正确的 plugin-manager 名称
5. 这个插件是否依赖另一个根本没初始化出来的 runtime 资源

## 还有一个当前约束

Lynx core 现在默认把配置变更视为“需要重启才能生效”的模型，所以插件管理器提供了 `GetRestartRequirementReport()`，而不是把进程内热更新当成默认能力。

## 下一步

- [插件使用指南](/docs/getting-started/plugin-usage-guide)
- [引导配置](/docs/getting-started/bootstrap-config)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
- [框架架构](/docs/intro/arch)
