---
id: polaris
title: 北极星服务治理
---

# 北极星服务治理

Go-Lynx 在进行微服务治理方面高度集成到了 `polaris`，用户无需做任何额外配置，即可使用北极星提供的服务治理能力。但是首先我们得编写一个北极星的连接信息，然后才能享受服务治理。

## 北极星配置

在配置文件中先配置连接北极星信息，文件内容如下：

```yaml
lynx:
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 5s
```

然后再在本地文件夹中放入该文件 `polaris.yaml` , 该文件是北极星官方标准配置文件，而上面的配置文件需要和 `polaris.yaml` 进行配合使用。

`polaris.yaml` 文件内容如下 (此处只是基本配置示例)：

```yaml
global:
  serverConnector:
    protocol: grpc
    addresses:
      - 127.0.0.1:8091
  statReporter:
    enable: true
    chain:
      - prometheus
    plugin:
      prometheus:
        type: push
        address: 127.0.0.1:9091
        interval: 10s
config:
  configConnector:
    addresses:
      - 127.0.0.1:8093
```
`polaris.yaml` 文件详情，以及具体部署可以查看：[腾讯北极星官网文档](https://polarismesh.cn/docs)

接入北极星之后，我们的 Go-Lynx 应用程序就具备了服务发现、服务路由、服务配置、服务元数据管理、服务限流降级，遥测，灰度等功能。