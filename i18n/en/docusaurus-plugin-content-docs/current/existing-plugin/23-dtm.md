---
id: dtm
title: DTM Plugin
---

# DTM Plugin

The DTM plugin brings DTM distributed transaction capability into Lynx. Like Seata, it is not meant to push every workflow into distributed transactions. It is meant to provide a standard path for cases that truly need cross-service transaction orchestration.

## What it is mainly for

- integrating SAGA, TCC, XA, and two-phase message patterns
- bringing the DTM client and orchestration capability into the runtime
- keeping transaction infrastructure aligned with service startup

## When to use it

- you clearly need orchestration-oriented distributed transactions rather than only local transactions
- your team accepts the debugging and operational cost of distributed transactions
- you need more flexible orchestration patterns than a single transaction model provides

## Practical guidance

- define transaction boundaries and compensation semantics before adding framework integration
- choose SAGA, TCC, or XA based on consistency and failure-recovery requirements
- the DTM plugin handles integration and lifecycle; it does not define your business workflow for you

## Related pages

- [Seata](/docs/existing-plugin/seata)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
