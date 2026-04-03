---
id: swagger
title: Swagger 插件
---

# Swagger 插件

本页覆盖这三个模板：

- `lynx-swagger/conf/swagger-simple.yml`
- `lynx-swagger/conf/swagger.yml`
- `lynx-swagger/conf/swagger-secure.yml`

关键现实是：当前运行时读取的是 `swagger.go` 里的自定义 YAML 结构，而不是把 protobuf / 模板字段一比一全部接线。模板里有些键是 live 的，有些已经过时，有些还改了名字。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-swagger` |
| 配置前缀 | `lynx.swagger` |
| Runtime 插件名 | `swagger` |
| Getter 边界 | 只有实例方法 `(*PlugSwagger).GetSwagger()`；不存在 package-level `swagger.GetSwagger()` |

## 配置前先知道

- 运行时会读取 `lynx.swagger.enabled`、`generator`、`ui`、`info`、`security`、`api_server`。
- `api_server.host` 是 Swagger UI 里 “Try it out” 真正会调用的后端地址；留空时插件会尝试从 `lynx.http.addr` 推导。
- 真正的文件监听开关是 `generator.watch_files`。模板里的 `watch_enabled` 当前运行时并不会读取。
- 模板里的 `ui.title` 当前没有运行时效果，页面标题实际上来自 `info.title`。
- `ui.deep_linking`、`ui.doc_expansion`、`ui.display_request_duration`、`ui.default_models_expand_depth` 都是模板时代的 snake_case 键；当前结构体期望 camelCase，而且真正渲染到 UI HTML 的只有 `deepLinking` 和 `docExpansion`。
- 模板里的 `info.terms_of_service` 不会映射到当前运行时字段，当前结构体期望的是 `termsOfService`。
- `servers`、`base_path`、`schemes`、`consumes`、`produces`、`tags`、`external_docs`、`security_definitions`、顶层 Swagger `security` 要求，以及 `advanced` 目前都不会被运行时 YAML 结构消费。
- `disable_in_production` 在当前实现里几乎总会被强制保持为 `true`，因为 `SetDefaultValues()` 会把 `false` 又改回 `true`。实际效果是：除非改代码，生产和 staging 仍会被拦住。

## 当前运行时真正读取的键

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 打开或关闭整个 Swagger 插件。 | 启动时。 | 默认 `true`。 | 在不该暴露文档面的环境里忘了关闭。 |
| `generator.enabled` | 打开注解扫描和文档重建。 | 启动时与文件变更时。 | 默认 `true`；若设为 `false` 且 `ui.enabled: true`，就仍然需要 `generator.spec_files`。 | 关掉生成，却又没提供任何可展示的 spec 文件。 |
| `generator.spec_files` | 在注解扫描前先加载外部 Swagger/OpenAPI 文件。 | 启动和重建时。 | 可选，但如果 generator 关闭而 UI 还要开，它就变成必需项。 | 指到工作区外的路径；当前校验会拒绝工作区外路径。 |
| `generator.scan_dirs` | 指定扫描 Go 注解的目录。 | 仅 `generator.enabled: true`。 | 没配时默认 `["./"]`。 | 加入不存在目录，或把仓库外路径塞进来。 |
| `generator.output_path` | 把合并后的文档写回磁盘。 | 每次重建后。 | 默认 `./docs/openapi.yaml`；以 `.yaml` / `.yml` 结尾写 YAML，其他后缀写 JSON。 | 误以为保存文件名由 `spec_url` 决定。 |
| `generator.watch_files` | 打开扫描目录的文件监听。 | 仅生成开启且 `scan_dirs` 非空时。 | 默认 `true`。 | 还在用模板里的 `watch_enabled`，却以为 watcher 已被改掉。 |
| `ui.enabled` | 启动或跳过 Swagger UI HTTP 服务。 | 启动时。 | 默认 `true`。 | 关了 UI 后还去浏览器找 `/swagger`。 |
| `ui.port` | Swagger UI HTTP 服务监听端口。 | 仅 `ui.enabled: true`。 | 默认 `8081`；合法范围 `1024..65535`。 | 和 `lynx-http` 业务端口复用，导致端口冲突。 |
| `ui.path` | Swagger UI 路由前缀。 | 仅 `ui.enabled: true`。 | 默认 `/swagger`；必须以 `/` 开头。 | 忘了写前导斜杠。 |
| `info.title` | 设置 OpenAPI 标题，同时也是当前 HTML 包装页使用的页面标题。 | 启动时和重建时。 | 默认 `API Documentation`。 | 只改 `ui.title`，却疑惑页面标题没变。 |
| `info.description` | 设置 OpenAPI 描述。 | 重建时。 | 可选。 | 把大量运维说明硬塞进这里，而不是链到外部文档。 |
| `info.version` | 设置 OpenAPI 版本号。 | 重建时。 | 默认 `1.0.0`。 | 把它当部署 SHA，而不是 API 版本。 |
| `info.contact.name` | 设置 spec 联系人名字。 | 重建时。 | 可选。 | 团队归属变了却没更新。 |
| `info.contact.email` | 设置 spec 联系邮箱。 | 重建时。 | 可选。 | 对外文档里仍暴露一个失效邮箱。 |
| `info.contact.url` | 设置 spec 联系链接。 | 重建时。 | 可选。 | 外部文档指向内部地址。 |
| `info.license.name` | 设置 spec 许可证名称。 | 重建时。 | 可选。 | 和仓库真实 license 不一致。 |
| `info.license.url` | 设置 spec 许可证链接。 | 重建时。 | 可选。 | 法务链接已过期。 |
| `security.environment` | 标记当前环境，用于允许列表校验。 | 启动校验时。 | 默认 `development`。 | 忘了 `ENV`、`GO_ENV`、`APP_ENV` 会覆盖这个值。 |
| `security.allowed_environments` | 允许插件运行的环境列表。 | 启动校验时。 | 默认 `development`、`testing`。 | 加了 `production` 还以为能绕过 `disable_in_production`。 |
| `security.disable_in_production` | 阻止生产和 staging 环境启用 Swagger。 | 启动校验时。 | 当前默认逻辑会强制它回到 `true`，即便 YAML 写 `false`。 | 只改这个字段就想在生产开放 Swagger。 |
| `security.trusted_origins` | 控制 UI 服务的 CORS 允许来源。 | 每次 UI 请求。 | 默认只允许 localhost 来源。 | 忘了把实际加载 Swagger UI 的浏览器来源加进去。 |
| `security.require_auth` | 预期中的 UI 额外鉴权开关。 | 启动时会解析。 | 当前会存储，但 handler 并不真正执行鉴权。 | 设成 `true` 就以为 UI 已经被保护。 |
| `api_server.host` | 设置 Swagger UI “Try it out” 调用的目标 API host。 | 启动和重建时。 | 留空时会尝试读取 `lynx.http.addr`；`:8080` 和 `0.0.0.0:8080` 会被改写成 `localhost:8080`。 | 留空后却没有可推导的 `lynx.http.addr`，或该地址浏览器根本不可达。 |
| `api_server.base_path` | 设置 “Try it out” 的 Swagger `basePath`。 | 重建时。 | 可选。 | 继续填顶层 `base_path`，以为当前运行时会读。 |

## 当前已过时或无运行时效果的模板键

| 模板键 | 当前运行时状态 | 应该怎么理解 / 用什么替代 | 常见误配 |
| --- | --- | --- | --- |
| `generator.exclude_dirs` | 不会被消费。 | 当前 generator 只保存 `scan_dirs`，模板里的排除逻辑还没接线。 | 以为列了 vendor / docs 就会自动跳过。 |
| `generator.recursive` | 不会被消费。 | 目录扫描行为来自解析器实现，而不是这个 YAML 键。 | 设成 `false` 还以为只会浅层扫描。 |
| `generator.watch_enabled` | 不会被消费。 | 真正的 watcher 开关是 `generator.watch_files`。 | 设成 `false` 后还在看到热更新。 |
| `generator.watch_interval` | 不会被消费。 | 当前 watcher 使用代码内固定默认值。 | 调了它却看不到重建节奏变化。 |
| `generator.gen_on_startup` | 不会被消费。 | 当前只要 generator 启用，启动就会重建文档。 | 设成 `false` 还以为启动会跳过生成。 |
| `ui.title` | 不会被消费。 | 应改 `info.title`；当前页面标题读的是后者。 | 只改 `ui.title`。 |
| `ui.spec_url` | 不会被消费。 | 当前 UI 会固定服务 `path + "/doc.json"` 和 `/swagger.json`。 | 以为浏览器会跟着这个 URL 取文档。 |
| `ui.auto_refresh` | 不会被消费。 | 当前没有这项运行时支持。 | 开了它却等不到自动刷新。 |
| `ui.refresh_interval` | 不会被消费。 | 当前没有这项运行时支持。 | 调了它却没有任何浏览器刷新效果。 |
| `ui.deep_linking` | snake_case 不会被消费。 | 需要时应改为 camelCase `ui.deepLinking`，当前 HTML 确实会渲染它。 | 直接照抄 secure 模板后发现深链接没生效。 |
| `ui.display_request_duration` | 当前 HTML 不会渲染。 | 即便改成 camelCase 也只是存储，页面不会展示。 | 期待 Swagger UI 显示请求耗时标签。 |
| `ui.doc_expansion` | snake_case 不会被消费。 | 需要时应改为 camelCase `ui.docExpansion`，当前 HTML 会渲染它。 | 用 snake_case 去调展开策略。 |
| `ui.default_models_expand_depth` | 当前 HTML 不会渲染。 | 即便 camelCase 存储了，现有 renderer 也不用。 | 期待模型树展开层级变化。 |
| `info.terms_of_service` | snake_case 不会被消费。 | 当前结构体字段是 `termsOfService`。 | 填了模板键却发现 spec 里仍为空。 |
| `servers` | 不会从 YAML 读取。 | 当前插件只通过 `api_server` 设置 `Host` / `BasePath`。 | 在 YAML 里维护多环境 servers，却期待输出 spec 带上它们。 |
| `base_path` | 不会从 YAML 读取。 | 当前应使用 `api_server.base_path`。 | 两边都填，还以为顶层会覆盖。 |
| `schemes` | 不会从 YAML 读取。 | 基础 spec 当前由代码固定初始化 `http` 和 `https`。 | 调整模板后却发现输出 spec 没变。 |
| `consumes` | 不会从 YAML 读取。 | 当前没有运行时映射。 | 列了 media type 就以为输出 spec 会采用。 |
| `produces` | 不会从 YAML 读取。 | 当前没有运行时映射。 | 同上。 |
| `tags` | 不会从 YAML 读取。 | 路由 tag 仍来自合并 spec 和注解解析。 | 在这里维护标签描述，却期待 UI 自动展示。 |
| `external_docs` | 不会从 YAML 读取。 | 当前没有运行时映射。 | 填了手册链接却在输出里看不到。 |
| `security_definitions` | 不会从 YAML 读取。 | 当前自定义配置结构没有这部分映射。 | 以为模板里写了认证方案，生成文档就会自动包含。 |
| 顶层 Swagger `security` 要求 | 不会从 YAML 读取。 | 当前没有运行时映射。 | 期待全局认证要求自动出现在生成文档里。 |
| `advanced.*` | 不会从 YAML 读取。 | 当前没有验证、pretty JSON、缓存、扫描并发等映射。 | 调性能 / 缓存参数却看不到任何变化。 |

## `swagger-simple.yml`

这个模板适合只保留最小工作面：

- `enabled`
- `generator.enabled`
- `generator.spec_files`
- `generator.scan_dirs`
- `generator.output_path`
- `generator.watch_files`，如果你希望显式控制 watcher
- `ui.enabled`
- `ui.port`
- `ui.path`
- `info.title`
- `info.version`
- `info.description`
- `api_server.host`
- `api_server.base_path`

模板里自带的 `watch_enabled` 是过时键；如果你想把 watcher 写明，请改成 `watch_files`。

## `swagger.yml`

完整版模板要拆成两部分理解：

- 真正 live 的，仍然只是上面“当前运行时真正读取的键”那一批。
- `servers`、`schemes`、`consumes`、`produces`、`tags`、`external_docs`、`security_definitions`、`security`、`advanced` 这些偏元数据 / 高级输出块，目前更像“愿景清单”，还不是会驱动现有运行时行为的键。

所以 `swagger.yml` 更适合当成能力库存，而不是“所有字段都能立刻生效”的现成运行时配置。

## `swagger-secure.yml`

secure 模板是最容易直接误抄的一份：

- `security.environment`、`allowed_environments`、`disable_in_production`、`trusted_origins` 是 live 的。
- `require_auth` 会被读取，但当前并不真正执行鉴权。
- `ui.deep_linking`、`ui.display_request_duration`、`ui.doc_expansion`、`ui.default_models_expand_depth` 都写成了 snake_case，而当前运行时结构体期望 camelCase。
- `generator.watch_enabled`、`generator.watch_interval`、`generator.gen_on_startup` 都是过时键。

如果你保留 `swagger-secure.yml`，应该把它当成“安全意图清单”，然后把真正被当前运行时理解的字段名改正后再使用。

## 实用规则

- 想让 Swagger UI 调到正确后端，最好显式写 `api_server.host`，除非 `lynx.http.addr` 本身已经是浏览器可访问的地址。
- 想在生产环境开放 Swagger，当前代码路径比模板暗示得更严格；默认逻辑仍会拦 production 和 staging。
- 只要某个键来自旧 proto / 旧模板表面，正式依赖它前都应先确认 `swagger.go` 里是否真有对应字段。
