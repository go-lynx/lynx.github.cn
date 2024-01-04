---
id: bootstrap-config
title: 引导配置
---

# YAML 配置

在 go-lynx 中，应用程序配置通过 YAML 文件进行管理。可以在应用程序启动时使用 `-conf configs` 命令指定这些文件或目录，其中 `configs` 是包含配置文件的目录。

## 本地引导配置文件

如果您使用配置中心组件，本地引导文件非常简单，只需要几行配置。主要包括远程注册中心的配置信息：

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

## 完整配置

go-lynx 的完整配置文件，展示了目前支持所有可用的插件配置。每个配置项对应一个插件。如果配置文件和插件匹配，框架将在启动时自动加载插件：

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

## 插件注册

需要注意的是，要使用某个插件，必须导入相应插件的包到您的项目中。如果你导入了包，则只需编辑配置信息，插件将会自动注册到插件管理器中。如果未导入包，则配置文件将不会有任何作用。

## 启动加载

Go-Lynx 在启动时会优先加载本地引导配置文件，文件地址就是启动时的参数`-conf configs` 命令指定这些文件或目录，加载本地配置之后如果发现其中存在控制平面相关插件，会在控制平面插件初始化完成之后自动进行远程配置文件拉取，拉取的文件默认为 application-name.yaml 其中 application-name 就是启动时指定的应用名称。

## 注册中心，配置中心

目前 go-lynx 所实现的控制面相关插件是腾讯 Polaris 服务治理框架，如果您需要使用注册发现，配置管理，以及微服务限流等功能，您需要先部署 Polaris 服务治理框架。

相关文档：https://polarismesh.cn/docs

## 结论

go-lynx 主要通过 Yaml 配置提供了一种灵活且简单的方式来管理应用程序的设置。通过将配置文件与相应的插件对齐，您可以轻松定制应用程序以满足特定需求。本地引导配置文件和完整配置文件提供了不同级别的定制化，可以选择最适合应用程序需求的方法。此外，请记得导入插件所需的包，以确保它们按预期工作。