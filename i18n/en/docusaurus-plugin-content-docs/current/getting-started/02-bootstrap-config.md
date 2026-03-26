---
id: bootstrap-config
title: Bootstrap Configuration
---

# Bootstrap Configuration

In Go-Lynx, “bootstrap configuration” is not your full business configuration. It is the **first layer of configuration read during startup**. Its job is to tell the framework:

- who this application is
- which local capabilities must come up first
- whether a config center / discovery backend / control-plane-facing module is needed
- where the rest of the configuration should come from

## Bootstrap vs Full Configuration

It helps to think about configuration in two layers:

- **bootstrap configuration**: enough to bring up the application and the base runtime
- **full application configuration**: loaded or merged after the base runtime is available

That is why bootstrap config should stay focused on startup-critical information instead of becoming a giant dump of every business setting.

## Common Loading Pattern

In the official template and common startup flows, `-conf` points to a config file or directory:

```bash
./your-service -conf ./configs
```

If you do not specify it explicitly, the application usually falls back to the project’s conventional config path.

## Minimal Example

A current-style minimal bootstrap config can look like this:

```yaml
lynx:
  application:
    name: user-service
    version: v0.1.0
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
```

This is enough to start the service locally and add more plugins incrementally afterwards.

## Example With Config Center / Discovery

If you want config-center or service-governance modules to participate during startup, add only the required entry information, for example:

```yaml
lynx:
  application:
    name: user-service
    version: v0.1.0
  polaris:
    namespace: default
    token: your-token
  nacos:
    server_configs:
      - ip_addr: 127.0.0.1
        port: 8848
```

The exact fields depend on the plugin documentation. The key rule is: **only put startup-critical remote entry information in bootstrap config.**

## Configuration Only Works If The Plugin Exists

Writing configuration alone does not guarantee that a plugin will load. In practice, a plugin usually needs both:

1. the plugin module dependency in your project
2. registration into the runtime / plugin factory

So:

- **module without config** usually means no initialization
- **config without module** usually means no effect

## Recommended Organization

In the current Go-Lynx workflow, a good rule of thumb is:

- keep application identity, protocol listeners, and config-center/discovery entry info in bootstrap config
- keep detailed business-facing plugin parameters in the full config layer
- isolate environment differences through separate files or config-center data instead of one giant config file

## Next Steps

After this page, continue with:

- [Plugin Management](/docs/getting-started/plugin-manager): understand how config becomes plugin ordering and assembly
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide): use a consistent integration flow for concrete plugins
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem): browse the current module family
