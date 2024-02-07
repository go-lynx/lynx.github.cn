---
id: tracer
title: Tracer Plugin
---

# Tracer Plugin

Go-Lynx provides a tracing plugin for scheduling between microservices to facilitate error troubleshooting, performance analysis, and log auditing, currently using the `otlp` module.

## Configuration of the Tracer Plugin

To specify the tracer plugin, you need to configure it in the configuration file, with the content as follows:

```yaml
lynx:
  tracer:
    addr: 127.0.0.1:4317
    ratio: 1
```

The `lynx.tracer` section contains the configuration for the tracing plugin.  
`addr` represents the address of the tracer server.  
`ratio` indicates the sampling rate, with a range between 0-1, where 1 means that every request is sampled. It is suggested to set it to 1 for testing environments, and to reduce the value appropriately for production environments.

> After the configuration is complete, you can start the service and view the collected information on the Web-UI of the corresponding tracer server. We don't need to write any additional code. Go-Lynx takes care of everything; all you need to do is configure it.