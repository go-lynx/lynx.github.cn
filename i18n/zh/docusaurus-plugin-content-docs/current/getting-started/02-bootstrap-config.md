---
id: bootstrap-config
title: 引导配置
---

# YAML Configuration

In go-lynx, the application configuration is managed through YAML files. These files can be specified at application startup using the `-conf configs` command, where `configs` is the directory containing the configuration files.

## Local Bootstrap Configuration File

If you are using the Configuration Center component, the local bootstrap file is very simple and requires only a few lines of configuration. This primarily includes the configuration information for the remote registration center:

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 1s
```

## Full Configuration

The full configuration file in go-lynx supports all available settings. Each configuration item corresponds to a plugin. The framework will automatically load the plugin at startup if the configuration file and the plugin match:

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
  grpc:
    addr: 0.0.0.0:9000
    timeout: 5s
    tls: true
  tracer:
    addr: 127.0.0.1:4317
    ratio: 1
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 5s
  db:
    driver: mysql
    source: root:123@tcp(127.0.0.1:3306)/demo?parseTime=True
    min_conn: 50
    max_conn: 50
    max_idle_time: 30s
  redis:
    addr: 127.0.0.1:6379
    password: 123456
    db: 0
    dial_timeout: 3s
    read_timeout: 1s
    write_timeout: 1s
```

## Plugin Activation

It's important to note that for a plugin to be activated, its corresponding package must be imported into your project. If the package is imported, you only need to edit the configuration information and the plugin will become active. If the package is not imported, the configuration file will not be effective.

## Conclusion

The YAML configuration in go-lynx provides a flexible and straightforward way to manage your application's settings. By aligning your configuration files with the corresponding plugins, you can easily customize your application to suit your specific needs. The local bootstrap configuration file and the full configuration file provide different levels of customization, allowing you to choose the approach that best fits your application's requirements. Furthermore, remember to import the necessary packages for your plugins to ensure they function as expected.