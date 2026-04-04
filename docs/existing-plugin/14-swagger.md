---
id: swagger
title: Swagger Plugin
---

# Swagger Plugin

This page covers the three shipped templates:

- `lynx-swagger/conf/swagger-simple.yml`
- `lynx-swagger/conf/swagger.yml`
- `lynx-swagger/conf/swagger-secure.yml`

The critical detail is that the current runtime reads a custom YAML struct in `swagger.go`, not the protobuf/template surface one-to-one. Some template keys are live, some are stale, and some changed name.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-swagger` |
| Config prefix | `lynx.swagger` |
| Runtime plugin name | `swagger` |
| Getter boundary | Instance method `(*PlugSwagger).GetSwagger()` only; there is no package-level `swagger.GetSwagger()` |

## Before You Configure It

- The runtime reads `lynx.swagger.enabled`, `generator`, `ui`, `info`, `security`, and `api_server`.
- `api_server.host` is the address Swagger UI uses for "Try it out". If you leave it empty, the plugin tries to derive it from `lynx.http.addr`.
- The actual file-watch switch is `generator.watch_files`. The template key `watch_enabled` is not consumed by the current runtime.
- `ui.title` from the templates is not used. The HTML page title is built from `info.title`.
- `ui.deep_linking`, `ui.doc_expansion`, `ui.display_request_duration`, and `ui.default_models_expand_depth` are template-era snake_case keys. The runtime struct uses camelCase fields, and only `deepLinking` plus `docExpansion` are rendered into the current UI HTML.
- `info.terms_of_service` from the templates does not map to the current runtime field. The current struct expects `termsOfService`.
- `servers`, `base_path`, `schemes`, `consumes`, `produces`, `tags`, `external_docs`, `security_definitions`, top-level Swagger `security` requirements, and `advanced` are not consumed by the current runtime YAML struct.
- `disable_in_production` is effectively always `true` today because `SetDefaultValues()` turns a false value back into true. In practice, production and staging remain blocked unless the code changes.

## Keys The Runtime Reads Today

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | Turns the whole Swagger plugin on or off. | At startup. | Default `true`. | Leaving it on in environments where docs should never be exposed. |
| `generator.enabled` | Enables annotation scanning and generated doc rebuilds. | At startup and on file changes. | Default `true`; if `false` and `ui.enabled: true`, you still need `generator.spec_files`. | Disabling generation without providing any spec file to serve. |
| `generator.spec_files` | Loads external Swagger/OpenAPI files before any annotation scan. | At startup and rebuild time. | Optional, but required when the generator is off and the UI is still on. | Pointing outside the workspace; validation rejects paths outside the current working directory. |
| `generator.scan_dirs` | Lists directories scanned for Go annotations. | When `generator.enabled: true`. | Default `["./"]` if nothing is set. | Adding directories that do not exist or are outside the repo root. |
| `generator.output_path` | Persists the merged doc to disk. | After rebuild. | Default `./docs/openapi.yaml`; `.yaml` / `.yml` writes YAML, other suffixes write JSON. | Expecting `spec_url` to control the saved filename instead of `output_path`. |
| `generator.watch_files` | Turns on the file watcher for scan directories. | Only when generation is enabled and `scan_dirs` is non-empty. | Default `true`. | Using `watch_enabled` from the templates and assuming the watcher really changed. |
| `ui.enabled` | Starts or skips the separate Swagger UI HTTP server. | At startup. | Default `true`. | Turning off the UI and then looking for `/swagger` in the browser. |
| `ui.port` | Binds the Swagger UI HTTP server. | Only when `ui.enabled: true`. | Default `8081`; must be `1024..65535`. | Reusing the same port as `lynx-http` and causing a bind conflict. |
| `ui.path` | Sets the UI route prefix. | Only when `ui.enabled: true`. | Default `/swagger`; must start with `/`. | Forgetting the leading slash. |
| `info.title` | Sets the OpenAPI title and also the page title used by the current HTML wrapper. | At startup and rebuild time. | Default `API Documentation`. | Setting `ui.title` and wondering why the page title did not change. |
| `info.description` | Sets the OpenAPI description. | At rebuild time. | Optional. | Putting long operational notes here instead of linking out with external docs. |
| `info.version` | Sets the OpenAPI version string. | At rebuild time. | Default `1.0.0`. | Treating it as a deploy SHA instead of an API version. |
| `info.contact.name` | Populates the spec contact name. | At rebuild time. | Optional. | Forgetting to update it after team ownership changes. |
| `info.contact.email` | Populates the spec contact email. | At rebuild time. | Optional. | Publishing a dead mailbox in public docs. |
| `info.contact.url` | Populates the spec contact URL. | At rebuild time. | Optional. | Pointing to an internal-only URL on external docs. |
| `info.license.name` | Populates the spec license name. | At rebuild time. | Optional. | Leaving it inconsistent with the actual repo/license. |
| `info.license.url` | Populates the spec license URL. | At rebuild time. | Optional. | Using a stale legal URL. |
| `security.environment` | Labels the current environment for allow-list checks. | At startup validation time. | Default `development`. | Forgetting that env vars `ENV`, `GO_ENV`, and `APP_ENV` override this value. |
| `security.allowed_environments` | Lists environments where the plugin may run. | At startup validation time. | Default `development`, `testing`. | Adding `production` here and assuming it bypasses `disable_in_production`. |
| `security.disable_in_production` | Blocks production and staging. | At startup validation time. | Current defaults force it back to `true`, even if YAML sets `false`. | Trying to allow production with only this field. |
| `security.trusted_origins` | Controls CORS allow-list for the UI server. | On every UI request. | Defaults to localhost origins only. | Forgetting to add the real browser origin that loads Swagger UI. |
| `security.require_auth` | Intended extra auth switch for the UI. | Parsed during startup. | Stored, but not enforced by the current handler. | Setting it `true` and assuming the UI is now protected. |
| `api_server.host` | Sets the target API host used by Swagger UI "Try it out". | At startup and rebuild time. | If empty, runtime tries `lynx.http.addr`; `:8080` and `0.0.0.0:8080` are rewritten to `localhost:8080`. | Leaving it empty when `lynx.http.addr` is unavailable or not browser-reachable. |
| `api_server.base_path` | Sets Swagger `basePath` for "Try it out". | At rebuild time. | Optional. | Filling top-level `base_path` from the full template and expecting the runtime to read it. |

## Template Keys That Are Stale Or No-Ops Today

| Template key | Current runtime status | What to use instead / what really happens | Common misconfiguration |
| --- | --- | --- | --- |
| `generator.exclude_dirs` | Not consumed. | The current generator only stores `scan_dirs`; exclusion logic from the template is not wired. | Assuming vendored or generated paths are skipped automatically because you listed them. |
| `generator.recursive` | Not consumed. | Directory scanning behavior comes from the parser implementation, not this YAML key. | Setting it `false` and expecting shallow scans only. |
| `generator.watch_enabled` | Not consumed. | Use `generator.watch_files` for the actual watcher toggle. | Setting `watch_enabled: false` and still seeing live rebuilds. |
| `generator.watch_interval` | Not consumed. | The current watcher uses fixed defaults from code. | Tuning it and expecting rebuild cadence to change. |
| `generator.gen_on_startup` | Not consumed. | The plugin always rebuilds docs on startup when enabled. | Setting it `false` and expecting startup to skip generation. |
| `ui.title` | Not consumed. | Use `info.title`; the current UI HTML reads that value instead. | Editing `ui.title` only. |
| `ui.spec_url` | Not consumed. | The current UI serves `path + "/doc.json"` and `/swagger.json`. | Pointing it at another URL and expecting the browser to follow it. |
| `ui.auto_refresh` | Not consumed. | No current runtime support. | Enabling it and waiting for auto-refresh that never happens. |
| `ui.refresh_interval` | Not consumed. | No current runtime support. | Tuning it and expecting hot browser refresh. |
| `ui.deep_linking` | Not consumed in snake_case. | If you need it, the runtime struct field is `ui.deepLinking`, and the current HTML does render that camelCase field. | Copy-pasting the secure template as-is and seeing no deep-link behavior. |
| `ui.display_request_duration` | Not consumed in the current HTML. | Even the camelCase field is stored but not rendered. | Expecting request duration badges in Swagger UI. |
| `ui.doc_expansion` | Not consumed in snake_case. | If you need it, the runtime struct field is `ui.docExpansion`, and the current HTML does render that camelCase field. | Setting the snake_case key and assuming the UI expansion mode changed. |
| `ui.default_models_expand_depth` | Not consumed in the current HTML. | Stored only if written in camelCase, but unused by the current renderer. | Expecting model tree depth changes from the secure template key. |
| `info.terms_of_service` | Not consumed in snake_case. | The current struct field is `termsOfService`. | Setting the template key and wondering why the spec stays empty. |
| `servers` | Not consumed from YAML. | The plugin only sets `Host` / `BasePath` through `api_server`. | Maintaining environment server lists in YAML and expecting them in the output spec. |
| `base_path` | Not consumed from YAML. | Use `api_server.base_path` for current runtime behavior. | Filling both and assuming the top-level key wins. |
| `schemes` | Not consumed from YAML. | The base spec is currently initialized with fixed `http` and `https`. | Editing the template key and expecting the served spec to change. |
| `consumes` | Not consumed from YAML. | No current runtime mapping. | Listing media types and assuming the spec output adopts them. |
| `produces` | Not consumed from YAML. | No current runtime mapping. | Same as above for response types. |
| `tags` | Not consumed from YAML. | Route tags come from merged specs and annotation parsing, not this block. | Curating tag metadata here and expecting the UI to show it. |
| `external_docs` | Not consumed from YAML. | No current runtime mapping. | Adding handbook links here and expecting them in the output. |
| `security_definitions` | Not consumed from YAML. | No current runtime mapping from the custom config struct. | Assuming API auth schemes are published because the template contains them. |
| Top-level Swagger `security` requirements | Not consumed from YAML. | No current runtime mapping. | Expecting global auth requirements to appear in the generated doc. |
| `advanced.*` | Not consumed from YAML. | No current runtime mapping for validation, pretty JSON, cache, or scan concurrency from this block. | Tuning performance / cache knobs and seeing no change. |

## `swagger-simple.yml`

Use this template when you need the smallest working surface:

- `enabled`
- `generator.enabled`
- `generator.spec_files`
- `generator.scan_dirs`
- `generator.output_path`
- `generator.watch_files` if you want a real runtime watcher toggle
- `ui.enabled`
- `ui.port`
- `ui.path`
- `info.title`
- `info.version`
- `info.description`
- `api_server.host`
- `api_server.base_path`

The shipped `watch_enabled` line in `swagger-simple.yml` is a stale key. Replace it with `watch_files` if you want the setting to be explicit.

## `swagger.yml`

Treat the full template as a split document:

- the live runtime keys are still the ones listed under "Keys The Runtime Reads Today"
- the metadata-heavy blocks such as `servers`, `schemes`, `consumes`, `produces`, `tags`, `external_docs`, `security_definitions`, `security`, and `advanced` are currently descriptive only

That means `swagger.yml` is useful as an inventory of desired features, but not every key in that file changes runtime behavior yet.

## `swagger-secure.yml`

The secure template is the most misleading one if copied verbatim:

- `security.environment`, `allowed_environments`, `disable_in_production`, and `trusted_origins` are live
- `require_auth` is stored but not enforced
- `ui.deep_linking`, `ui.display_request_duration`, `ui.doc_expansion`, and `ui.default_models_expand_depth` are written in snake_case, while the current runtime struct expects camelCase names
- `generator.watch_enabled`, `generator.watch_interval`, and `generator.gen_on_startup` are stale keys

If you keep `swagger-secure.yml`, treat it as a checklist of intent and then rename the keys that the current runtime actually understands.

## Complete YAML Example

This block merges the live runtime keys with the full template inventory from `swagger.yml`, `swagger-simple.yml`, and `swagger-secure.yml`. Keys that the current runtime ignores are kept as commented template-only lines so the example stays copyable.

```yaml
lynx:
  swagger:
    enabled: true # master switch; default true

    security:
      environment: "development" # runtime environment label
      allowed_environments:
        - "development" # environments where Swagger may run
        - "testing"
      disable_in_production: true # current default logic forces this back to true
      trusted_origins:
        - "http://localhost:8080" # allowed browser origins for the UI server
        - "http://127.0.0.1:8081"
      require_auth: false # stored today, but not enforced by the current handler

    generator:
      enabled: true # annotation scan / rebuild switch
      spec_files:
        - "./openapi/openapi.yaml" # optional external OAS files loaded before scanning
      scan_dirs:
        - "./app/controllers" # directories scanned for annotations
        - "./app/handlers"
        - "./plugins"
      output_path: "./docs/swagger.json" # merged output path
      watch_files: true # live runtime key; shipped templates still call this watch_enabled
      # exclude_dirs: ["./vendor", "./test", "./docs", "./.git"] # template-era key, not consumed today
      # recursive: true # template-era key, not consumed today
      # watch_enabled: true # template-era key, replaced by watch_files in current runtime docs
      # watch_interval: 5s # template-era key, not consumed today
      # gen_on_startup: true # template-era key, not consumed today

    ui:
      enabled: true # UI HTTP server switch
      port: 8081 # UI server port; default 8081
      path: "/swagger" # UI route prefix
      deepLinking: true # runtime camelCase key actually rendered by the current HTML
      docExpansion: "list" # runtime camelCase key actually rendered by the current HTML
      # title: "Lynx API Documentation" # template-era key; current page title comes from info.title
      # spec_url: "/swagger.json" # template-era key, not consumed today
      # auto_refresh: false # template-era key, not consumed today
      # refresh_interval: 5000 # template-era key, not consumed today
      # deep_linking: true # template snake_case key; runtime expects deepLinking
      # display_request_duration: true # template key stored but not rendered today
      # doc_expansion: "list" # template snake_case key; runtime expects docExpansion
      # default_models_expand_depth: 1 # template key stored but current HTML ignores it

    info:
      title: "Lynx Microservice API" # OpenAPI title and current HTML page title
      description: "Secure API documentation built on Lynx framework" # OpenAPI description
      version: "1.0.0" # API version string
      termsOfService: "http://swagger.io/terms/" # runtime camelCase field for terms of service
      contact:
        name: "API Support Team" # contact name
        email: "api-support@lynx.io" # contact email
        url: "https://lynx.io/support" # contact URL
      license:
        name: "Apache 2.0" # license name
        url: "http://www.apache.org/licenses/LICENSE-2.0.html" # license URL
      # terms_of_service: "http://swagger.io/terms/" # template snake_case key, not consumed today

    api_server:
      host: "localhost:8080" # target API host used by Swagger UI "Try it out"
      base_path: "/api/v1" # Swagger basePath for "Try it out"

    # servers: # template-only inventory; current runtime does not read this block
    #   - url: "http://localhost:8080"
    #     description: "Development environment"
    # base_path: "/api/v1" # template-only top-level key; use api_server.base_path instead
    # schemes: ["http", "https"] # template-only today
    # consumes: ["application/json", "application/xml", "multipart/form-data"] # template-only today
    # produces: ["application/json", "application/xml"] # template-only today
    # tags: # template-only today
    #   - name: "User Management"
    #     description: "User-related operations"
    #     external_docs:
    #       description: "More information"
    #       url: "https://lynx.io/docs/user"
    # external_docs: # template-only today
    #   description: "Lynx Framework Documentation"
    #   url: "https://lynx.io/docs"
    # security_definitions: # template-only today
    #   api_key:
    #     type: "apiKey"
    #     name: "X-API-Key"
    #     in: "header"
    #     description: "API key authentication"
    # security: # top-level Swagger security requirements; template-only today
    #   - api_key: []
    # advanced: # template-only today
    #   validate_spec: true
    #   pretty_json: true
    #   include_unused_definitions: false
    #   generate_examples: true
    #   max_file_size: 10485760
    #   scan_concurrency: 4
    #   cache:
    #     enabled: true
    #     ttl: 300s
    #     max_size: 100
```

## Minimum Viable YAML Example

```yaml
lynx:
  swagger:
    enabled: true # master switch
    generator:
      enabled: true # build the spec from code
      scan_dirs:
        - "./" # smallest scan scope from swagger-simple.yml
      output_path: "./docs/openapi.yaml" # where the generated spec is written
    ui:
      enabled: true # start the Swagger UI server
      port: 8081 # keep it separate from lynx-http
      path: "/swagger" # UI route
    info:
      title: "My API" # page title and OpenAPI title
      version: "1.0.0" # OpenAPI version
    api_server:
      host: "localhost:8080" # lynx-http address used by "Try it out"
```

If `lynx.http.addr` is already browser-safe, `api_server.host` can be omitted and derived at runtime.

## Practical Rules

- If you want Swagger UI to call the right backend, make `api_server.host` explicit unless `lynx.http.addr` is already browser-safe.
- If you want production Swagger, the current code path is stricter than the template implies; the default logic still blocks production and staging.
- If a key came from the old proto/template surface, verify that `swagger.go` has a matching field before relying on it.
