---
id: etcd-lock
title: Etcd Lock Plugin
---

# Etcd Lock Plugin

The Etcd Lock plugin provides distributed locking with stronger consistency semantics on top of Etcd. It fits systems that need higher lock correctness and already accept Etcd as coordination infrastructure.

## What it is mainly for

- distributed locking through Etcd lease and watch behavior
- stronger coordination semantics than lighter alternatives
- bringing lock lifecycle into the Lynx runtime

## When to use it

- your correctness requirement is higher than a typical Redis-lock case
- your team already uses Etcd for config or registry behavior
- you accept the heavier coordination cost

## Practical guidance

- lock-path naming should map clearly to business resources
- lease lifetime and business timeout should be designed together
- if you only need simple mutual exclusion and your main infrastructure is Redis, start with [Redis Lock](/docs/existing-plugin/redis-lock)

## Related pages

- [Etcd](/docs/existing-plugin/etcd)
- [Redis Lock](/docs/existing-plugin/redis-lock)
