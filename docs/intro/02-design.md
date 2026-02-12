---
id: design
title: Design Philosophy
slug: intro/design
---

# Design Philosophy

The core philosophy of Go-Lynx is that everything is a plugin. We achieve automatic assembly through plugins, allowing us to focus more on business logic. We treat each module's capabilities as a plugin, making plugins the soul of Go-Lynx. All third-party components, database management, message queues, monitoring, tracing, and other functionalities required by microservices are automatically assembled and managed through plugins.

Additionally, from the very beginning, Go-Lynx was designed to allow integration between plugins, making it possible to design more powerful components.

## Design Advantages

Go-Lynx is akin to Spring-Boot's auto-configuration, but we manage the complete lifecycle of each plugin and the domain modules they are responsible for, such as microservice registration, discovery, monitoring, tracing, routing capabilities, internal network communication encryption, distributed transaction management, and other microservice capabilities. We encapsulate all these functionalities through plugins to achieve a plug-and-play effect, eliminating the need to write repetitive and tedious code for creating, connecting, and configuring each module's specific client.

## Architecture Diagram

<img alt="architecture" src="/img/diagram.png" width="940"/>

Based on the architecture diagram, we can clearly understand that Go-Lynx is a framework that extends capabilities through plugins. The bootstrapper initiates the application startup. After the application is successfully started, our plugin manager retrieves the global configuration file to load the corresponding plugins. Each plugin only receives its specific configuration, not the global one. We also ensure the loading order of plugins, making Go-Lynx full of infinite possibilities. In the future, we will provide hot updates for plugins, lifecycle management, and status detection. If you are interested in this framework, welcome to join our community and help develop it together.

> **bootstrap**: Initiates the application startup  
> **LynxApplication**: The application, containing global configuration, plugin manager, and control plane  
> **PluginManager**: The plugin manager, responsible for plugin loading, unloading, and configuration file parsing

See also: [Lynx Framework Architecture](/docs/intro/arch) for the layered runtime model and service startup flow.