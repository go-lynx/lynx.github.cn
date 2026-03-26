---
id: design
title: Design Philosophy
---

# Design Philosophy

Go-Lynx is not primarily trying to wrap every technology with one more abstraction layer. Its design focus is to collapse the repeated infrastructure wiring in microservice projects into one **plugin runtime model**.

## Core Ideas

The current Lynx codebase is best understood through these ideas:

- **plugin-first**: services, config, storage, messaging, governance, tracing, and flow control are integrated as modular capabilities
- **runtime-first**: the framework is responsible for assembly, ordering, resources, and lifecycle, not only client creation
- **configuration-driven**: whether a capability is enabled, how it is initialized, and what it depends on is decided through config plus runtime assembly
- **clear boundaries**: business logic stays in business layers, plugins own infra capabilities, and the runtime organizes them

## The Problem It Solves Is Bigger Than A Single SDK

In real service projects, teams repeatedly need to:

- initialize databases, caches, queues, discovery backends, and tracing clients
- decide what depends on what and what must start first
- share resources across modules safely
- attach health checks, metrics, and lifecycle hooks to integrations
- keep local development and production bootstrap paths as consistent as possible

The value of Go-Lynx is that these jobs are handled in one plugin runtime instead of being scattered across application code.

## Why It Is More Than “Auto Configuration”

At a glance, Lynx can look similar to familiar auto-assembly frameworks. But it goes beyond deciding **what to load**.

It also decides:

- **in which order to load**
- **which resources are owned where**
- **when those resources are created and released**

That makes Lynx closer to a runtime orchestration layer for plugins than to a simple configuration parser.

## Practical Outcomes

- **Cleaner business code**: less infrastructure bootstrap logic inside application layers
- **More consistent integrations**: plugins follow one configuration and lifecycle model
- **A more stable startup path**: dependency ordering and runtime resources are no longer maintained manually
- **A more extensible ecosystem**: official modules and internal plugins can plug into the same model

## Relationship To The Architecture Page

If this page answers “why Lynx is designed this way”, then [Lynx Framework Architecture](/docs/intro/arch) answers “how that design is realized at runtime”.
