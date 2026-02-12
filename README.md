<p align="center"><a href="https://go-lynx.cn/" target="_blank"><img width="120" src="https://avatars.githubusercontent.com/u/150900434?s=250&u=8f8e9a5d1fab6f321b4aa350283197fc1d100efa&v=4" alt="logo"></a></p>

<p align="center">
<a href="https://pkg.go.dev/github.com/go-lynx/lynx"><img src="https://pkg.go.dev/badge/github.com/go-lynx/lynx/v2" alt="GoDoc"></a>
<a href="https://codecov.io/gh/go-lynx/lynx"><img src="https://codecov.io/gh/go-lynx/lynx/master/graph/badge.svg" alt="codeCov"></a>
<a href="https://goreportcard.com/report/github.com/go-lynx/lynx"><img src="https://goreportcard.com/badge/github.com/go-lynx/lynx" alt="Go Report Card"></a>
<a href="https://github.com/go-lynx/lynx/blob/main/LICENSE"><img src="https://img.shields.io/github/license/go-lynx/lynx" alt="License"></a>
<a href="https://discord.gg/2vq2Zsqq"><img src="https://img.shields.io/discord/1174545542689337497?label=chat&logo=discord" alt="Discord"></a>
</p>

# lynx.github.cn

**中文** | [English](#english)

本仓库为 [Go-Lynx](https://go-lynx.cn) 官方文档站点，提供**中英双版本**文档，基于 [Docusaurus](https://docusaurus.io/) 构建。

### 安装依赖

```bash
yarn
```

### 本地开发

```bash
yarn start
```

启动后可在浏览器中查看站点，修改内容会热更新。

### 构建

```bash
yarn build
```

构建产物输出到 `build` 目录，可用于任意静态站点托管。

### 部署（GitHub Pages）

使用 SSH：

```bash
USE_SSH=true yarn deploy
```

不使用 SSH：

```bash
GIT_USER=<你的 GitHub 用户名> yarn deploy
```

该命令会构建站点并推送到 `gh-pages` 分支。

---

## English

This repository is the **official documentation site** for [Go-Lynx](https://go-lynx.cn), with **Chinese and English** versions, built with [Docusaurus](https://docusaurus.io/).

### Installation

```bash
yarn
```

### Local Development

```bash
yarn start
```

This starts a local dev server; most changes hot-reload.

### Build

```bash
yarn build
```

Output is in the `build` directory.

### Deployment (GitHub Pages)

With SSH:

```bash
USE_SSH=true yarn deploy
```

Without SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

This builds the site and pushes to the `gh-pages` branch.
