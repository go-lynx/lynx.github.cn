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

## 自签证书

可查看作者blog文章，里面详细的记录了如何通过 openSSL 进行自签证书，并且配置证书对应信息。

文章地址：
[TLS 自签证书](https://tanzhuo.xyz/grpcs-t-l-s/)

也可以继续阅读以下证书生成教程，我把大部分内容复制到了这篇文档中。

### 证书生成

以下是在 Linux 或 MacOS 系统上使用 OpenSSL 命令行工具生成自签名证书的步骤。这个过程将创建一个新的根证书（CA），然后使用这个根证书签名一个新的服务器证书。

#### 整体流程

> 1 根证书：  
> 1.1 生成根私钥  
> 1.2 通过根私钥生成根证书

> 2 服务证书  
> 2.1 生成服务私钥  
> 2.2 通过服务私钥生成服务CSR  
> 2.3 通过服务.csr 文件 + 根证书 + 根证书 key 签名出服务证书.crt文件

#### 生成根证书的私钥
openssl genrsa -out ca.key 2048
这个命令将生成一个新的 RSA 私钥，长度为 2048 位。这个私钥将被保存到名为 ca.key 的文件中。

#### 生成根证书
```bash
openssl req -new -x509 -days 365 -key ca.key -out ca.crt
```
这个命令将生成一个新的 X.509 根证书，使用 SHA-256 算法进行签名，有效期为 365 天 (可自己调整日期)。这个证书将被保存到名为 ca.crt 的文件中。

在执行这个命令时，OpenSSL 会提示你输入一些信息，这些信息将被包含在证书中。在大多数情况下，你可以直接按 Enter 键接受默认值。

但 Subject Name 或 Common Name 需要填写微服务端的名称。

#### 生成服务器证书的私钥
```bash
openssl genrsa -out [service-name].key 2048
```
这个命令与第一个命令类似，生成的私钥将被保存到名为 [service-name].key 的文件中。[service-name] 为你自己的服务名称。

#### 生成服务器证书的证书签名请求（CSR）
```bash
openssl req -new -key [service-name].key -out [service-name].csr
```
这个命令将生成一个新的证书签名请求（CSR），这个请求包含了服务器证书的公钥和一些附加信息。这个请求将被保存到名为 server.csr 的文件中。

同样，在执行这个命令时，OpenSSL 会提示你输入一些信息，这些信息将被包含在 CSR 中。

#### 使用根证书签名服务器证书
```bash
openssl x509 -req -in [service-name].csr -CA ca.crt -CAkey ca.key -CAcreateserial -out [service-name].crt -days 365
```
这个命令将使用根证书对服务器证书进行签名，生成的证书将被保存到名为 server.crt 的文件中。

以上步骤生成的 rootCA.crt、server.crt 和 server.key 就可以用于 GRPC 加密通讯了，配置到对应的服务器端以及客户端。

#### 自定义证书字段信息
由于在Go更高的版本中，对证书内部分字段的值验证与获取有调整。（Go 1.15版本之后会获取证书alt_names字段信息进行服务名称验证）所以我们需要在生成证书时，指定部分自定义字段信息。

创建一个 san.cnf 文件内容如下：
```text
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C = CN
ST = Beijing
L = Beijing
O = 'lynx'
OU = 'lynx'
emailAddress = 'lynx'
CN = [service-name]

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = [service-name]

[v3_ext]
authorityKeyIdentifier=keyid,issuer:always
basicConstraints=CA:FALSE
keyUsage=keyEncipherment,dataEncipherment,digitalSignature
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names
```

然后在上面的生成证书文件的步骤中带上

在生成服务csr文件时添加 -extensions req_ext -config san.cnf 命令
```bash
openssl req -new -key [service-name].key -out [service-name].csr -extensions req_ext -config san.cnf
```
在生成服务证书时，也需要添加 -extensions v3_ext -extfile san.cnf 命令

```bash
openssl x509 -req -in [service-name].csr -CA ca.crt -CAkey ca.key -CAcreateserial -out [service-name].crt -days 365 -extensions v3_ext -extfile san.cnf
```
这样生成出来的证书文件就包含了我们指定字段的内容，以及部分证书描述信息。

### 证书内容验证
可通过命令，查看生成出来的证书是否确实包含字段信息

```bash
openssl x509 -in [service-name].crt -text -noout
```