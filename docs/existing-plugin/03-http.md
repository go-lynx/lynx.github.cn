---
id: http
title: Http Client
---

# Http Client

The Go-Lynx provides an HTTP protocol client plugin, which allows us to initialize an HTTP client without worrying about writing the client creation code ourselves. We only need to provide the corresponding configuration file.

## Client Configuration

To specify an HTTP client, you need to configure it in the configuration file as follows:

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

The `lynx.http` section contains the HTTP client configuration information. The underlying implementation uses the `kratos.http` module.

Once the configuration is complete, the application will load the HTTP client according to the plugin order when it starts.

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

After successfully initializing the HTTP client, you need to manually register the corresponding service modules of your business logic to the HTTP client. This is necessary for route matching to call your functions.