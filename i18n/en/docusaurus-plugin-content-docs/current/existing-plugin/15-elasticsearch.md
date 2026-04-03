---
id: elasticsearch
title: Elasticsearch Plugin
---

# Elasticsearch Plugin

`lynx-elasticsearch` owns the runtime Elasticsearch client for Lynx. This page stays aligned with `lynx-elasticsearch/conf/example_config.yml` and explains what each YAML key actually changes, when it matters, and where the sample is easy to misuse.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-elasticsearch` |
| Config prefix | `lynx.elasticsearch` |
| Runtime plugin name | `elasticsearch.client` |
| Public getters | `GetElasticsearch()`, `GetElasticsearchPlugin()`, `GetIndexName(name)` |

## Template Field Guide

| Field | What it controls | Enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `addresses` | Elasticsearch node bootstrap addresses. | Always. | Default `["http://localhost:9200"]`. | Leaving the local default in production or providing only one node when you intended multi-node bootstrap. |
| `username` | Basic-auth username. | Only for basic auth. | Default empty. The plugin only sends basic auth when both `username` and `password` are non-empty. | Setting only the username and assuming authentication is active. |
| `password` | Basic-auth password. | Only for basic auth. | Default empty. | Keeping stale credentials here while also trying to move to API-key auth. |
| `api_key` | Elasticsearch API key authentication. | When the cluster uses API keys. | Default empty. The current implementation forwards any non-empty auth style to the client config. | Leaving `api_key` populated together with `username/password` or `service_token` and creating ambiguous auth ownership. |
| `service_token` | Elasticsearch service-token authentication. | When your platform standardizes on service tokens. | Default empty. Like `api_key`, it should be the only active auth style. | Populating it on top of another auth method and then debugging the wrong credential path. |
| `certificate_fingerprint` | TLS certificate fingerprint pinning. | When you use HTTPS and want explicit certificate pinning. | Default empty. | Expecting it to matter on plain `http://` endpoints. |
| `compress_request_body` | HTTP request-body compression. | Mostly for bulk indexing or large write payloads. | Default `false`. | Turning it on for tiny requests and expecting a visible throughput win. |
| `connect_timeout` | TCP connect timeout for the transport dialer. | Usually always. | Default `"30s"`. It is a dial timeout, not a full request deadline. | Treating it as a search/index request timeout. |
| `max_retries` | Client HTTP retry count. | Usually always. | Default `3`. | Setting it high and then being surprised by long tail latency during cluster trouble. |
| `enable_metrics` | Enables Elasticsearch metrics collection. | When you want plugin-local metrics. | Default `false`. When enabled, the plugin installs an instrumented transport and starts background metrics collection. | Enabling it without planning how those metrics will be scraped or queried. |
| `enable_health_check` | Enables background health checks. | When you want periodic cluster-health probing. | Default `false`. Startup ping still runs even when this flag is false. | Assuming `false` means the plugin will skip startup connectivity tests. |
| `health_check_interval` | Background health-check interval. | Only when `enable_health_check: true`. | Default `"30s"`. | Tuning it without enabling health checks and expecting any change. |
| `index_prefix` | Prefix used by `GetIndexName(name)`. | When shared clusters need service or environment isolation. | Default empty. It only affects the helper; it does not create indices, mappings, or aliases for you. | Expecting the plugin to auto-create prefixed indices or migrations. |
| `log_level` | Stored logging-level field. | Only if you want to preserve an intended level in config. | Default empty. The current implementation stores it but does not reconfigure logging from it. | Changing this field and expecting immediate plugin log-level changes. |

## Practical Notes

- Keep exactly one authentication path active: basic auth, API key, or service token.
- `enable_metrics` and `enable_health_check` are runtime toggles; `index_prefix` is only a naming helper for `GetIndexName`.
- The plugin owns client startup, retry, and health loops. Your service still owns index creation, mappings, aliases, and query DSL.

## Related Pages

- [Layout](/docs/existing-plugin/layout)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
