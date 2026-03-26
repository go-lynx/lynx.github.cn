---
id: plugin-manager
title: Plugin Management
---

# Plugin Management

In Go-Lynx, plugin management is not a side feature. It is one of the core mechanisms of the framework.

The framework is not only loading plugins. It is also answering questions like:

- which plugins should be enabled for this startup
- what depends on what
- what must initialize first and what can initialize later
- which resources are private and which are shared
- how those resources should be released on shutdown

## What The Plugin Manager Actually Does

From a user-facing perspective, the plugin manager is mainly responsible for:

- determining which plugins are needed based on configuration and registration
- resolving dependencies and producing a valid startup order
- initializing plugins, assembling them, and registering resources
- unwinding resources in a reasonable order during shutdown

That is why plugin management is not just a list of plugins; it is the center of runtime assembly.

## Why Ordering Matters

A typical real-world chain looks like this:

- a business-facing plugin may depend on Redis
- Redis-related plugins may depend on configuration already being available
- HTTP / gRPC services may depend on earlier plugins having registered resources

If the order is wrong, the result is not merely “one missing feature”. The application can enter an invalid startup state. Go-Lynx therefore treats ordering as a framework responsibility instead of a detail left to business code.

## Common Shape Of A Custom Plugin

A typical plugin abstraction looks roughly like this:

```go
type Plugin interface {
    LoaderPlugin
    SupportPlugin
}

type LoaderPlugin interface {
    Load(config.Value) (Plugin, error)
    Unload() error
}

type SupportPlugin interface {
    Name() string
    Weight() int
    DependsOn(config.Value) []string
    ConfPrefix() string
}
```

You may not write custom plugins every day, but understanding these interfaces helps you read:

- how a plugin declares its identity and config prefix
- how it expresses dependencies
- how it is loaded and unloaded inside the runtime

## What Registration Means In Practice

A plugin is not recognized only because a config section exists. It also needs to be registered into the plugin system.

A typical registration pattern looks like:

```go
func init() {
    factory.GlobalPluginFactory().Register(name, confPrefix, func() plugin.Plugin {
        return Db()
    })
}
```

That is why some plugins must be imported explicitly even when your business code does not call them directly.

## A Practical Mental Model

In real usage, plugin management is easiest to think of as this chain:

1. the plugin module exists
2. the module registers itself
3. configuration declares which capabilities should be enabled
4. the plugin manager resolves dependencies and assembles them
5. the runtime exposes resources for the application layer

Once you internalize that chain, it becomes much easier to debug questions such as:

- why a plugin did not activate
- why a resource is missing
- why startup order looks wrong

## Next Steps

After this page, continue with:

- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Framework Architecture](/docs/intro/arch)
