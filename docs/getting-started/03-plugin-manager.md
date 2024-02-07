---
id: plugin-manager
title: Plugin Management
---

# Plugin Management

In Go-Lynx, all functionalities are designed with a plugin-centric approach. This method provides a high degree of modularity and flexibility, allowing you to easily customize your application to meet specific needs.

## Current Plugins Available

Go-Lynx currently offers a variety of plugins, including:

1. Configuration Center
2. Registry Center
3. Tracing
4. Distributed Transactions
5. Message Queue
6. Database Management
7. Redis
8. HTTP
9. GRPC
10. TLS Certificate Management

These plugins cover a wide range of functionalities, and the list is constantly growing to accommodate various business scenarios.

## Custom Plugins

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

By implementing the above interfaces, you can create custom plugins. LoaderPlugin provides the ability to load and unload plugins, while SupportPlugin is related to plugin dependencies, names, and configuration file matching.

## Plugin Registration

You need to register your plugins with the global plugin factory to extend plugin support. Here's an example of how to do this:

```go
func init() {
    factory.GlobalPluginFactory().Register(name, confPrefix, func() plugin.Plugin {
        return Db()
    })
}
```

If you are unsure about this process, you can refer to the implementation of official plugins in the Go-Lynx source code.

## Plugin Management Mechanism

Go-Lynx's plugin management mechanism supports automatic topological sorting to resolve dependency issues. This corresponds to a directed acyclic graph, enabling the automatic sequential loading of plugins.

## Future Enhancements

The future enhancement plans for plugin management include the following aspects:

1. **Instance Management**: Design support for plugins with multiple instances or single instances, and manage the ability to handle multiple instances.
2. **Hot Updates**: The ability to update the configuration files of certain plugins without significantly impacting the application, achieving seamless plugin updates.
3. **State Management**: A state machine is needed to manage the state of plugins, enabling global dynamic shutdown and activation of plugins under specific circumstances.

With these enhanced features, Go-Lynx will continue to improve its capabilities as a powerful, flexible, and user-friendly microservice management and deployment platform. Go-Lynx's plugin-oriented design makes it a versatile tool for building and managing microservices. With the various plugins already provided and more to come, you can customize your application as needed and also benefit from the continuous improvements and enhancements of the Go-Lynx platform.