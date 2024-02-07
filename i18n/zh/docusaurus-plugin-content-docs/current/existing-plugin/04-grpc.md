---
id: grpc
title: grpc客户端
---

# grpc客户端

Go-Lynx 提供了grpc协议客户端插件，我们可以不用关心如何去编写创建客户端的相关代码，只需要提供对应的配置文件即可自动进行grpc客户端初始化。

## 客户端配置

指定grpc客户端需要在配置文件中进行配置，文件内容如下：

```yaml
lynx:
  grpc:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

其中的 `lynx.grpc` 相关内容就是grpc客户端配置信息。目前底层是使用的 `kratos.grpc` 模块。  
`tls: true` 表示开启证书验证并加密通讯，需要配合 `cert` 插件模块进行使用。

配置完成之后，应用程序一旦启动就会根据插件顺序进行加载grpc客户端。

```go
import (
  bg "github.com/go-lynx/lynx/plugin/grpc"
)

func NewGRPCServer(
login *service.LoginService,
register *service.RegisterService,
account *service.AccountService) *grpc.Server {
    g := bg.GetServer()
    loginV1.RegisterLoginServer(g, login)
    registerV1.RegisterRegisterServer(g, register)
    accountV1.RegisterAccountServer(g, account)
    return g
}
```

我们初始化成功grpc客户端之后，需要自己去手动把对应业务模块的service注册到grpc客户端中，以便于进行路由匹配从而调用您的函数。