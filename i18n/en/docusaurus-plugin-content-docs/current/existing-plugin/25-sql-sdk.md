---
id: sql-sdk
title: SQL SDK
---

# SQL SDK

The SQL SDK is the shared base layer behind Lynx SQL-related plugins. It is closer to a common capability layer than to a standalone plugin you use directly for business access.

## What it is mainly for

- providing shared abstractions for MySQL, PostgreSQL, MSSQL, and similar SQL integrations
- unifying health checks, metrics, pooling, and base resource handling
- reducing duplicated low-level logic across SQL plugins

## When you will care about it

- when you are reading implementation details or extension points of SQL plugins
- when you need multi-datasource or platform-level data infrastructure
- when you are extending the Lynx SQL ecosystem itself

## Practical guidance

- application teams should usually focus on the concrete SQL plugin rather than coding directly around SQL SDK
- if you are building platform extensions, SQL SDK is the more relevant entry point
- keep business repositories, ORM models, and the shared SQL base cleanly separated

## Related pages

- [Database Plugin](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
