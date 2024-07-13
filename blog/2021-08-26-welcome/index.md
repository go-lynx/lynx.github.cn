---
slug: welcome
title: Welcome
authors: [tanzhuo]
tags: [go-lynx, introduction, docusaurus]
---

# Welcome to the Go-Lynx official documentation and introduction page!

Go-Lynx is a revolutionary open-source microservices framework that offers a seamless plug-and-play experience for developers. Built on the solid foundations of Seata, Polaris, and Kratos, Go-Lynx's primary goal is to simplify the development process of microservices. It allows developers to focus on writing business logic rather than getting entangled in the complexity of microservices infrastructure.

## Key Features

Go-Lynx comes with a comprehensive set of microservices capabilities, including:

- **Service Registration and Discovery:** Simplifies the process of microservice registration and discovery.
- **Encrypted Internal Communication:** Ensures the security of communication data within the microservices architecture, ensuring trust and data reliability between services.
- **Rate Limiting:** Prevents microservice overload, ensuring robustness and high-quality user experience.
- **Routing:** Intelligent routing to specify microservice versions, providing multi-version traffic routing, blue-green, and canary release capabilities.
- **Degradation:** Provides graceful fault handling to ensure service availability and resilience.
- **Distributed Transactions:** Simplifies transaction management across multiple services, promoting data consistency and reliability.

## Plugin-Driven Modular Design

Go-Lynx proudly introduces a plugin-driven modular design, where microservices functionality modules are combined through plugins. This unique approach allows for high customization and adaptation to diverse business needs. Any third-party tool can be easily integrated as a plugin, providing developers with a flexible and expandable platform. Go-Lynx is committed to simplifying the microservices ecosystem, offering developers an efficient and user-friendly platform.

In future versions, Go-Lynx will develop and integrate more middleware, enhancing microservice scalability while incorporating more mainstream framework components.

## Built With

Go-Lynx leverages the power of several open-source projects as its core components, including:

- [Seata](https://github.com/seata/seata)
- [Kratos](https://github.com/go-kratos/kratos)
- [Polaris](https://github.com/polarismesh/polaris)

## Quick Installation

If you want to use Go-Lynx microservices, simply execute the following command to install the Go-Lynx CLI tool, then run the `new` command to automatically initialize a runnable project (the `new` command supports multiple project names).

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

```shell
lynx new demo1 demo2 demo3
```

## Quick Start Code

To quickly launch your microservice, use the following code (some features may be inserted or removed based on your configuration file):

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

Join us in using Go-Lynx, the plug-and-play Go microservices framework, to simplify microservices development. We look forward to your participation.

## DingTalk Communication

![DingTalk Group](https://github.com/go-lynx/lynx/assets/32378959/cfeacfb8-95d4-4b23-8299-a868502f1076)

---

Please replace `"Your Name"` with the actual author's name or leave it as a placeholder if not applicable. Adjust the markdown as needed to fit the specific formatting requirements of your Docusaurus site.
