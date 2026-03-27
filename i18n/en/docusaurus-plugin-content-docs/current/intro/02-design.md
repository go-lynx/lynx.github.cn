---
id: design
title: Design Philosophy
---

# Design Philosophy

Lynx is not trying to wrap every infrastructure product behind one more generic facade. Its real design goal is narrower and more practical: turn repeated microservice infrastructure wiring into one **shared runtime model**.

That is why the current codebase centers on plugin registration, dependency-aware startup, runtime-owned resources, and managed lifecycle hooks.

## The core design choices

The current Lynx design is easiest to understand through these choices:

- **plugin-first, but not SDK-first**: a plugin is expected to participate in runtime assembly, not just expose a client constructor
- **runtime-owned lifecycle**: initialization, startup tasks, cleanup, and health checks are part of the model
- **typed registration over ad hoc discovery**: official plugins register into `factory.GlobalTypedFactory()` with a concrete plugin name and config prefix
- **config drives preparation, not magic**: config tells Lynx what should be prepared, but config alone does not create a capability
- **business code stays outside infra assembly**: service layers and business layers should consume prepared capabilities, not rebuild them

## What problem this is actually solving

In real projects, teams repeatedly end up writing the same categories of code:

- bootstrap config readers for listeners, registries, and remote config entry points
- startup ordering for HTTP, gRPC, TLS, config centers, caches, queues, and tracing
- resource sharing logic for clients that should be reused instead of re-created
- shutdown and cleanup logic for long-lived external integrations
- one-off helper glue to make local startup behave like production startup

Lynx treats those as one framework problem rather than many unrelated SDK problems.

## Why Lynx is more than “auto configuration”

If Lynx only decided whether a module was enabled, it would just be another auto-config layer. The actual design goes further:

- the plugin manager prepares plugin instances from registered creators
- dependency order is resolved before runtime lifecycle begins
- plugins initialize against a shared `plugins.Runtime`
- resources are exposed centrally instead of every integration inventing its own ownership model

That is why the public shape of a plugin in current Lynx is built around lifecycle hooks like `InitializeResources`, `StartupTasks`, `CleanupTasks`, and `CheckHealth`.

## A deliberate tradeoff: restart-based config

Current Lynx core does not treat in-process plugin reconfiguration as the default path. The design has moved toward a simpler and more reliable rule:

- bootstrap and runtime capabilities are assembled from config at startup
- configuration changes that affect loaded plugins are expected to be applied by restart or external rollout

This is why the core now exposes reports like `GetRestartRequirementReport()` instead of promising universal hot reload.

## What this means for plugin authors

A Lynx plugin is expected to declare concrete runtime facts:

- plugin name
- config prefix
- dependencies
- lifecycle behavior
- public integration entry, whether that is a Getter or plugin-manager lookup

That is also why many official docs now describe each plugin in terms of module path, config prefix, runtime plugin name, and actual API surface.

## What this means for application teams

The intended usage model is:

1. add the module
2. provide the right startup config
3. import the plugin so registration happens
4. let `boot.NewApplication(wireApp).Run()` assemble it
5. consume the prepared capability through its public API

If you skip that runtime path and only treat a plugin as a random SDK, you lose most of the value Lynx is designed to provide.

## Practical outcomes

- **Cleaner application code**: less infrastructure bootstrap logic leaks into `service`, `biz`, or `data`
- **More predictable startup**: capability ordering is part of the framework contract
- **Clearer ownership**: shared resources belong to the runtime instead of scattered package globals
- **A more coherent official ecosystem**: HTTP, gRPC, config centers, data stores, queues, tracing, and distributed coordination can follow one model

## Relationship to the architecture page

If this page answers why Lynx is designed this way, then [Lynx Framework Architecture](/docs/intro/arch) explains how those decisions show up in the actual runtime structure.
