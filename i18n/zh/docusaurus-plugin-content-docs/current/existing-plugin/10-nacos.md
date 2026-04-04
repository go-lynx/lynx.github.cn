---
id: nacos
title: Nacos 插件
---

# Nacos 插件

Nacos 是一个同时覆盖服务注册、服务发现和远程配置的控制面插件。三类能力可以分别开启，但同一份 YAML 在不同能力开启状态下的真实效果并不完全一样。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-nacos` |
| 配置前缀 | `lynx.nacos` |
| Runtime 插件名 | `nacos.control.plane` |
| 公开 API | 通过 plugin-manager 获取实例后使用 `GetConfig(dataId, group)`、`GetConfigSources()`、`GetNamespace()`、`NewServiceRegistry()`、`NewServiceDiscovery()` |

## 配置来源

| 文件 | 范围 | 实际影响 |
| --- | --- | --- |
| `lynx-nacos/conf/example_config.yml` | Lynx runtime 与 Nacos SDK 客户端初始化 | 服务端地址、namespace/鉴权、注册/发现/配置开关、健康检查、额外配置源以及 SDK 日志/缓存目录 |

## 先看几个实现要点

- `server_addresses` 和 `endpoint` 至少要有一个；两个都空会直接校验失败。
- 如果 `enable_register`、`enable_discovery`、`enable_config` 全是 `false`，运行时不会初始化任何 Nacos client，启动会报 `no Nacos client initialized`。
- `namespace_id` 和 `namespace` 都空时，会回退到 `public`。
- `server_addresses` 会做规范化处理：去掉 `http://`、`https://` 前缀，并按逗号拆分。
- `endpoint` 可以作为替代方案，但直接使用 `server_addresses` 通常更清晰；即使走 endpoint，SDK 侧仍会保留兼容性的 server config。
- `service_config.service_name` 只会影响主配置文件的 `dataId` 命名，即 `<service_name>.yaml`。真正注册到 Nacos naming 的服务名仍然来自应用运行时提供的 `registry.ServiceInstance.Name`。
- `enable_config` 才会初始化 config client，并决定 `WatchConfig()`、`GetConfigSources()` 是否可用。`enable_register` / `enable_discovery` 决定 naming client 是否初始化。
- `additional_configs[*].format` 留空时会先按文件后缀推断，推断不出再回退到 `yaml`。

## 字段说明

### `lynx.nacos`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `server_addresses` | 直连 Nacos server 的地址列表，逗号分隔。 | 优先推荐用它做显式服务端连接。 | 除非设置了 `endpoint`，否则它是必填。 | 带着协议前缀和空格直接复制，误以为 SDK 会原样保留。 |
| `namespace_id` | Nacos namespace ID。 | 平台直接给你 namespace ID 时。 | 两个 namespace 字段都空时回退到 `public`。 | `namespace_id` 和 `namespace` 填成两个不相干的值。 |
| `namespace` | 可读的 namespace 名称，或兼容场景下的 namespace 标识。 | 使用 namespace 名称而不是纯 ID 时。 | 运行时会把它作为可见 namespace；在 SDK 兼容路径里也可能把它当 namespace ID 用。 | 以为它只是展示字段，实际上客户端隔离也会受它影响。 |
| `username` | 用户名密码鉴权里的用户名。 | Nacos 使用基础账号密码鉴权时。 | 可选。 | 只配用户名不配密码。 |
| `password` | 用户名密码鉴权里的密码。 | Nacos 使用基础账号密码鉴权时。 | 可选。 | 把真实密码直接写进示例衍生配置。 |
| `access_key` | AK/SK 鉴权里的 access key。 | 平台使用 access key / secret key 鉴权时。 | 可选；必须和 `secret_key` 配对。 | 和 username/password 同时配置，却不知道最终哪套生效。 |
| `secret_key` | AK/SK 鉴权里的 secret key。 | 使用 AK/SK 鉴权时。 | 可选；必须和 `access_key` 配对。 | 只配了一半。 |
| `weight` | Nacos registrar 使用的默认实例权重。 | 需要给实例设置非均匀流量权重时。 | 默认 `1.0`。 | 用 `0` 表示“不改”，结果运行时回退为默认 `1.0`。 |
| `metadata` | 注册实例时附带的默认 metadata。 | 需要发布版本、环境、区域等标签时。 | 可选 map。 | 把机密信息塞进 metadata，或跨服务标签名不统一。 |
| `enable_register` | 是否启用服务注册。 | 当前服务需要把自己注册进 Nacos naming 时。 | 只要注册或发现任一开启，就会初始化 naming client。 | 服务本身没有正确暴露 endpoint，却先打开注册。 |
| `enable_discovery` | 是否启用服务发现。 | 当前服务要从 Nacos naming 拉取上游实例时。 | 只要注册或发现任一开启，就会初始化 naming client。 | 业务代码仍然使用另一套注册中心，却误开了它。 |
| `enable_config` | 是否启用 Nacos 配置中心。 | 应用配置或配置 watch 需要从 Nacos 来时。 | 它是 config client、`GetConfigSources()`、`WatchConfig()` 的前置开关。 | 开关没开，却期待配置 API 正常工作。 |
| `timeout` | 客户端超时，单位秒。 | 建议总是显式考虑，尤其是跨网络部署。 | 默认 `5` 秒。 | 按毫秒理解它。 |
| `log_level` | Nacos SDK 日志级别。 | 需要排查客户端行为时。 | 默认 `info`；支持 `debug`、`info`、`warn`、`error`。 | 填了一个 SDK 不认识的自定义值。 |
| `log_dir` | SDK 日志目录。 | 希望 SDK 日志写到可预期且可写的位置时。 | 默认 `./logs/nacos`。 | 指到只读容器目录。 |
| `cache_dir` | SDK 缓存目录。 | 希望 Nacos SDK 本地缓存落到固定位置时。 | 默认 `./cache/nacos`。 | 多个环境/应用共用一个 cache 目录。 |
| `notify_timeout` | 通知超时，单位毫秒。 | 需要调节配置通知窗口和回调容忍度时。 | 默认 `3000`。 | 按秒去填，结果值大得离谱。 |
| `service_config` | 注册相关行为和主配置文件命名提示。 | 需要显式配置注册/发现 group、cluster，或主配置 dataId 命名时。 | 可选嵌套对象。 | 误以为里面每个字段都会同时影响配置中心和注册中心。 |
| `additional_configs` | 需要额外加载的配置源列表。 | 一个服务要合并多个 Nacos 配置文件时。 | 可选列表；每个条目都可以自行推断格式。 | 加入根本不存在的配置文件，却期待启动强失败；当前实现是告警后继续。 |
| `context_path` | server config 里的上下文路径。 | Nacos 服务不是挂在 `/nacos` 根路径时。 | 默认 `/nacos`。 | 反向代理有自定义 base path，却忘了同步这里。 |
| `endpoint` | endpoint 形式的服务发现入口。 | 平台通过 endpoint 暴露 Nacos，而不是静态 server 地址时。 | 是 `server_addresses` 的替代方案。 | 配了 endpoint，却还保留了一组指向别的集群的 `server_addresses`。 |
| `region_id` | 传给 SDK 的 region 提示。 | 云上部署或 endpoint 发现要求 region 时。 | 可选。 | region 值与 Nacos 实际环境不匹配。 |

### `lynx.nacos.service_config`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `service_name` | 把主配置文件命名为 `<service_name>.yaml`，同时表达期望的业务服务名。 | 主配置 dataId 需要稳定的服务级命名时。 | 留空时主配置回退为 `<应用名>.yaml`。注册时真实服务名仍由应用传入的 service instance 决定。 | 误以为它单独就会改写注册到 Nacos naming 的服务名。 |
| `group` | 主配置和注册/发现共用的默认 group。 | 环境或团队按 group 隔离资源时。 | 默认 `DEFAULT_GROUP`。 | 文件根本不在默认 group，却留空。 |
| `cluster` | 注册/发现使用的 cluster 标签。 | 希望实例选择限制在某个 Nacos cluster 内时。 | 默认 `DEFAULT`。 | 配了一个实例根本不会注册进去的 cluster。 |
| `health_check` | 是否在注册信息里启用 Nacos 健康检查配置。 | 服务注册需要对外声明健康检查策略时。 | 只有注册开启时才会校验相关字段。 | 开了它，却没补齐 HTTP 健康检查专属字段。 |
| `health_check_interval` | 健康检查间隔，单位秒。 | 启用健康检查时。 | 默认 `5`。 | 按毫秒理解。 |
| `health_check_timeout` | 健康检查超时，单位秒。 | 启用健康检查时。 | 默认 `3`。 | 配得比间隔还长。 |
| `health_check_type` | 健康检查模式。 | 启用健康检查时。 | 默认 `tcp`；支持 `none`、`tcp`、`http`、`mysql`。 | 选了 `http` 却没配 URL。 |
| `health_check_url` | HTTP 健康检查目标地址。 | `health_check_type` 为 `http` 时。 | HTTP 模式下必填。 | 留空却希望 validator 放行。 |

### `lynx.nacos.additional_configs[*]`

| 字段 | 作用 | 何时设置 / 启用 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `data_id` | 远程配置标识。 | 每个额外配置源都必须有。 | 实际上是必填。 | 漏写后缀，或填了远端根本不存在的 dataId。 |
| `group` | 该配置源所属 group。 | 额外配置不在 `DEFAULT_GROUP` 时。 | 默认 `DEFAULT_GROUP`。 | 共享配置明明在别的 group，却机械复制主配置 group。 |
| `format` | 交给 Kratos 配置加载器的格式。 | dataId 后缀不明显或根本没后缀时。 | 留空时先按后缀推断，推不出来再回退到 `yaml`。 | 远端内容明明是 YAML，却硬写成 `json`。 |

## 完整 YAML 示例

```yaml
lynx:
  nacos:
    server_addresses: 127.0.0.1:8848 # 必填，除非你改用 endpoint
    namespace_id: "" # 可选 namespace ID；一旦设置，优先于 namespace
    namespace: public # namespace 名称回退值；运行时默认是 public
    username: "" # 开启鉴权时可选的用户名
    password: "" # 与 username 配套的密码
    access_key: "" # 可选云厂商风格 access key
    secret_key: "" # 与 access_key 配套的 secret
    weight: 1.0 # 注册实例权重
    metadata:
      version: v1.0.0 # 示例版本元数据
      env: production # 示例环境标签
    enable_register: true # 开启 naming client 注册能力
    enable_discovery: true # 开启 naming client 发现能力
    enable_config: true # 开启配置中心 client
    timeout: 5 # client 超时，单位秒；运行时默认 5
    log_level: info # 支持 debug、info、warn、error
    log_dir: ./logs/nacos # SDK 日志目录
    cache_dir: ./cache/nacos # SDK 缓存目录
    notify_timeout: 3000 # 配置通知超时，单位毫秒
    service_config:
      service_name: my-service # 注册侧服务名提示
      group: DEFAULT_GROUP # 默认 Nacos group
      cluster: DEFAULT # 默认 Nacos cluster 标签
      health_check: true # 在注册信息里带上健康检查元数据
      health_check_interval: 5 # 健康检查间隔，单位秒
      health_check_timeout: 3 # 健康检查超时，单位秒
      health_check_type: tcp # 支持 none、tcp、http、mysql
      health_check_url: "" # 只有 health_check_type=http 时才必填
    additional_configs:
      - data_id: database-config.yaml # 额外远程配置源
        group: DEFAULT_GROUP # 该配置源所在 group
        format: yaml # 拉取内容交给加载器时的格式
      - data_id: feature-flags.json # 第二个额外远程配置源
        group: DEFAULT_GROUP # 该配置源所在 group
        format: json # 拉取内容交给加载器时的格式
    context_path: /nacos # Nacos 服务端 context path
    endpoint: "" # 可选服务端 endpoint，可替代 server_addresses
    region_id: "" # 云环境下可选的 region 提示
```

## 最小可用 YAML 示例

至少要打开一个能力开关，否则插件虽然加载了配置，却不会真正创建任何 Nacos client。

```yaml
lynx:
  nacos:
    server_addresses: 127.0.0.1:8848 # 不使用 endpoint 时必须提供的服务端地址
    enable_config: true # 最小有意义开关：创建配置中心 client
```

## 常见误配

- 三个能力开关全是 `false`，导致插件启动后根本没有 Nacos client。
- 把 `service_config.service_name` 当成注册服务名理解，实际 registrar 仍使用应用运行时提供的 service instance name。
- `health_check_type: http` 却没配 `health_check_url`。
- `notify_timeout` 按秒填写，实际字段单位是毫秒。
- `endpoint` 和 `server_addresses` 指向不同集群，运行行为变得难以判断。

## 运行时接入

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("nacos.control.plane")
nacosPlugin := plugin.(*nacos.PlugNacos)

sources, err := nacosPlugin.GetConfigSources()
source, err := nacosPlugin.GetConfig("application.yaml", "DEFAULT_GROUP")
registrar := nacosPlugin.NewServiceRegistry()
discovery := nacosPlugin.NewServiceDiscovery()
```

当组织已经统一采用 Nacos naming 或 Nacos 配置中心时，这个插件是合适的默认选择。如果你只需要配置中心，[Apollo](/docs/existing-plugin/apollo) 或 [Etcd](/docs/existing-plugin/etcd) 通常更聚焦。

## 相关页面

- [Polaris](/docs/existing-plugin/polaris)
- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
