---
id: plugin-manager
title: Plugin Management
---

# Plugin Management

In Lynx, the plugin manager is the runtime assembly center. It does more than "load plugins": it prepares plugin instances from the global typed factory, resolves lifecycle order, owns the shared runtime, and exposes managed plugin instances to the application.

## What the plugin manager actually owns

The current public API on `TypedPluginManager` includes:

- `LoadPlugins(...)`, `LoadPluginsByName(...)`, `PreparePlug(...)`
- `GetPlugin(name)`, `GetPluginByID(id)`
- `GetPluginCapabilities(name)`
- `GetRuntime()`, `SetConfig(...)`
- `StopPlugin(...)`, `ListResources()`, `GetResourceStats()`
- `GetRestartRequirementReport()`

This already tells you something important: plugin management in Lynx is about lifecycle and runtime ownership, not only discovery.

## The real runtime chain

The actual flow in current Lynx is:

1. plugin modules register themselves into `factory.GlobalTypedFactory()`
2. the application creates a plugin manager
3. startup passes config into the manager
4. the manager prepares plugin instances for the configured prefixes
5. the manager initializes them against a shared `plugins.Runtime`
6. application code retrieves managed instances through exported getters or `GetPlugin(...)`

If one link is missing, the plugin will not become available just because config exists.

## The current plugin contract

The old `Load/Unload` style examples are no longer the right mental model. The current core contract is:

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

The step-level hooks managed by Lynx today are:

```go
type LifecycleSteps interface {
    InitializeResources(rt Runtime) error
    StartupTasks() error
    CleanupTasks() error
    CheckHealth() error
}
```

Most real plugins embed `plugins.BasePlugin` or `plugins.TypedBasePlugin[...]` and then implement the hooks they actually need.

## What registration means in practice

Current plugins usually register like this:

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

That is why anonymous import is part of the normal integration path. If the module is never imported, the typed factory has no creator for that plugin name.

## Why ordering matters

A practical dependency chain can look like this:

- `etcd.distributed.lock` depends on the Etcd runtime resource
- HTTP and gRPC services may depend on TLS material already being available
- governance or config-center plugins may need to finish before business-facing layers start

The manager resolves that startup order so application code does not have to hand-assemble it.

## Debugging with the current model

When a plugin does not appear to work, check these questions in order:

1. Was the correct module imported so `RegisterPlugin(...)` ran?
2. Does config exist under the actual prefix used in code?
3. Did startup run through `boot.NewApplication(wireApp).Run()`?
4. Are you retrieving the capability through the plugin's public getter or the correct plugin-manager name?
5. Does the plugin depend on another runtime resource that was never initialized?

## One more current constraint

Lynx core now treats configuration changes as restart-based. The plugin manager exposes `GetRestartRequirementReport()` because in-process plugin reconfiguration is not the default model.

## Next steps

- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Framework Architecture](/docs/intro/arch)
