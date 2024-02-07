---
id: http
title: http客户端
---

# http客户端

Go-Lynx 提供了http协议客户端插件，我们可以不用关心如何去编写创建客户端的相关代码，只需要提供对应的配置文件即可自动进行http客户端初始化。

## 客户端配置

指定http客户端需要在配置文件中进行配置，文件内容如下：

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

其中的 `lynx.http` 相关内容就是http客户端配置信息。目前底层是使用的 `kratos.http` 模块。  
`tls: true` 表示开启证书验证并加密通讯，需要配合 `cert` 插件模块进行使用。  

配置完成之后，应用程序一旦启动就会根据插件顺序进行加载http客户端。

```go
import (
  bh "github.com/go-lynx/lynx/plugin/http"
)

func NewHTTPServer(
login *service.LoginService,
register *service.RegisterService,
account *service.AccountService
) *http.Server {
    h := bh.GetServer()
    loginV1.RegisterLoginHTTPServer(h, login)
    registerV1.RegisterRegisterHTTPServer(h, register)
    accountV1.RegisterAccountHTTPServer(h, account)
return h
}
```

我们初始化成功http客户端之后，需要自己去手动把对应业务模块的service注册到http客户端中，以便于进行路由匹配从而调用您的函数。