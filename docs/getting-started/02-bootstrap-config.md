---
id: bootstrap-config
title: Bootstrap Configuration
slug: getting-started/bootstrap-config
---

# Bootstrap Configuration

In Go-Lynx, application configuration is managed through YAML files for plugin management. You can specify the configuration file or directory at application startup using the `-conf` flag (e.g. `-conf configs`, where `configs` is the directory containing your YAML files). If not specified, the application typically looks for a default path such as `configs/config.yaml` depending on your project layout. Go-Lynx provides a flexible way to manage application settings through YAML: align configuration keys with the plugins you use, and the framework loads the corresponding plugins at startup. You can use either a minimal local bootstrap (for example when using a config center) or a full local YAML with all plugin settings. Remember to import the packages of the plugins you need so they register with the plugin manager.

Besides Polaris, you can also use [Nacos](/docs/existing-plugin/nacos) as the configuration center; configure `lynx.nacos` and enable config in the bootstrap accordingly.

## Local Bootstrap Configuration

If you are using components related to a configuration center, the local bootstrap file is quite simple, requiring only a few lines of configuration. It mainly includes the configuration information for the remote configuration center (using Polaris as an example):

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

Go-Lynx's full configuration file shows all currently supported plugin configurations. Each configuration item corresponds to a plugin. If the configuration file matches the plugin, the framework will automatically load the plugin at startup:

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

## Plugin Registration

It's important to note that to use a specific plugin, you must import the corresponding plugin's package into your project. If you import the package, simply edit the configuration information, and the plugin will automatically register with the plugin manager. If the package is not imported, the configuration file will have no effect.

## Startup Loading

Go-Lynx will prioritize loading the local bootstrap configuration file at startup, with the file address specified by the `-conf configs` command at startup. After loading the local configuration, if it detects control plane-related plugins, it will automatically pull the remote configuration file after the control plane plugin is initialized. The default pulled file is application-name.yaml, where application-name is the application name specified at startup.

## Service Governance

The control plane-related plugins implemented in Go-Lynx are based on the Tencent Polaris service governance framework. If you need to use features such as registration discovery, configuration management, and microservice rate limiting, you will need to deploy the Polaris service governance framework first.

Related Documentation: [Tencent Polaris Official Documentation](https://polarismesh.cn/docs)