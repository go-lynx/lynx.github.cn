---
id: tls-manager
title: 证书管理
---

# 证书管理

Go-Lynx 为微服务之间的内网加密通讯提供了证书加载插件，通过此插件可以自动加载指定证书。并且纳入根证书进行默认信任，安全等级可以自行调整。

## 证书加载

指定证书加载需要在配置文件中进行配置，文件内容如下：

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
```

其中的 `lynx.application.tls` 相关内容就是证书存放位置。目前默认是使用的配置中心进行加载，后续会更新支持本地以及远程加载。
证书加载完成之后，应用程序就已具备证书信息。在对应的Grpc以及Http客户端中只需要开启配置即可提供对应的tls通讯。配置如下：

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
```

其中的 `lynx.http.tls` 配置为 `true` 值时，在加载http插件时就会自动装配对应证书信息。从而提供https协议功能。

## 如何自签证书

可查看作者blog文章，里面详细的记录了如何通过 openSSL 进行自签证书，并且配置证书对应信息。

文章地址：
[TLS 自签证书](https://tanzhuo.xyz/grpcs-t-l-s/)