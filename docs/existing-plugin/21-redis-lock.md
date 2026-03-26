---
id: redis-lock
title: Redis Lock Plugin
---

# Redis Lock Plugin

The Redis Lock plugin provides distributed locking on top of Redis. It fits systems that already rely on Redis and need lightweight coordination semantics.

## What it is mainly for

- mutual exclusion based on Redis
- centralized handling of lock renewal, timeout, and retry behavior
- bringing lock capability into Lynx runtime assembly

## Basic configuration

Redis Lock usually depends on the Redis plugin itself, so Redis connectivity should be available before the lock capability is used.

## When to use it

- the lock scope is reasonably clear
- you need stronger coordination than a local lock but not necessarily the stronger semantics of Etcd
- your team already has stable Redis infrastructure

## Practical guidance

- lock-key design must be understandable at the business level; do not let random strings become your contract
- expiration, renewal strategy, and idempotent compensation should be designed together
- if the scenario needs stronger consistency, evaluate [Etcd Lock](/docs/existing-plugin/etcd-lock) first

## Related pages

- [Redis](/docs/existing-plugin/redis)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
