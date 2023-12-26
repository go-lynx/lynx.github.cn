# Quick Start

This guide will help you get started with the go-lynx CLI project scaffolding tool.

## Installation

First, install the go-lynx CLI using the following command:

```shell
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

Once the installation is complete, you can create your microservice modules using the following command:

```shell
lynx new demo1 demo2 demo3
```

The module names (`demo1`, `demo2`, `demo3` in this case) can be customized according to the modules in your business.

By following these steps, you can quickly obtain the go-lynx project scaffold.

## About go-lynx

By default, go-lynx uses a combination of Kratos and Polaris, providing a range of microservice capabilities such as registration, discovery, rate limiting, degradation, routing, and more.

go-lynx works by parsing yaml configuration files to load specified plugins. You can view the plugin modules in the go-lynx source code to learn more.

Similar to the mindset of Spring Boot, you only need to focus on whether the configuration file is edited correctly. go-lynx will automatically fetch configurations from the remote configuration center upon startup. If you're not using a configuration center, it will only load the local bootstrap configuration file to start the application.

This makes go-lynx a highly flexible and powerful tool for managing and deploying microservices.

## Conclusion

With go-lynx, you can quickly and easily set up your project, define your microservices, and get your application up and running. With its robust set of features and easy-to-use interface, go-lynx is a valuable tool for any developer working with microservices.