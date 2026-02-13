---
id: layout
title: Lynx 项目模板 (Layout)
slug: existing-plugin/layout
---

# Lynx 项目模板 (Layout)

Lynx-Layout 是 Go-Lynx 的**官方微服务项目模板**，提供标准目录结构、Polaris 集成与本地无 Polaris 开发方式，便于快速搭建微服务项目。

## 功能概览

- **标准目录**：api / biz / bo / code / conf / data / service / server 分层
- **Polaris 集成**：服务发现、限流、熔断（可选）
- **开箱即用**：HTTP、gRPC、MySQL/PostgreSQL、Redis、Tracer、Token 等可插拔
- **CLI 脚手架**：通过 `lynx new` 一键生成项目

## 项目结构概览

```
📦 微服务模板项目
 ┣ 📂 api     - Protobuf 及生成的 Go 代码
 ┣ 📂 biz     - 业务逻辑与流程
 ┣ 📂 bo      - biz 与 data 层之间的数据对象
 ┣ 📂 code    - 应用状态码与错误码
 ┣ 📂 conf    - 配置文件与映射
 ┣ 📂 data    - 数据访问（DB、远程调用）
 ┣ 📂 service - 服务声明、参数校验、数据转换
 ┗ 📂 server  - HTTP/gRPC 等接口配置与注册
```

## 如何使用

### 1. 安装 Lynx CLI

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

### 2. 使用模板创建项目

```bash
# 创建单个服务
lynx new demo1

# 一次创建多个服务
lynx new demo1 demo2 demo3
```

### 3. 启动应用

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

默认会加载 HTTP、gRPC（含 TLS）、MySQL/PostgreSQL、Redis、Tracer、Token 等组件，可按需在配置与 wire 中增删插件。

## 本地开发（不依赖 Polaris）

若仅需本地调试、不接入 Polaris，可按以下步骤：

1. **Go 版本**：建议 Go 1.25.3（或项目要求的版本）  
   ```bash
   go env -w GOTOOLCHAIN=go1.25.3
   ```

2. **启动本地依赖（如 PostgreSQL、Redis）**  
   ```bash
   docker compose -f deployments/docker-compose.local.yml up -d
   ```  
   默认会提供 `postgres://lynx:lynx@127.0.0.1:5432/lynx` 与 `redis://127.0.0.1:6379`。

3. **使用本地配置启动**（不加载 Polaris）  
   ```bash
   go run ./cmd/user -conf ./configs/bootstrap.local.yaml
   ```  
   可根据需要修改 `configs/bootstrap.local.yaml` 中的数据库与 Redis 配置。

4. **关闭依赖**  
   ```bash
   docker compose -f deployments/docker-compose.local.yml down
   ```

生产或需要 Polaris 时，使用 `configs/bootstrap.yaml` 等正式配置即可。

## 相关链接

- 仓库：[go-lynx/lynx-layout](https://github.com/go-lynx/lynx-layout)
- [快速开始](/docs/getting-started/quick-start) | [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
