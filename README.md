# @butler

一个现代化的 TypeScript 多包管理项目 (Monorepo)。

## 项目结构

```
butler/
├── packages/                 # 核心包
│   ├── types/               # 类型定义
│   ├── utils/               # 工具函数
│   └── core/                # 核心功能
├── apps/                    # 应用程序 (可选)
├── .changeset/              # 版本管理配置
├── .husky/                  # Git hooks
├── package.json             # 根配置
├── pnpm-workspace.yaml      # pnpm workspace 配置
└── tsconfig.json            # TypeScript 配置
```

## 包说明

### @butler/types
提供整个项目的 TypeScript 类型定义。

### @butler/utils
包含通用的工具函数和帮助方法。

### @butler/core
Butler 的核心功能，包括插件系统、任务管理等。

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 启动所有包的开发模式
pnpm dev

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 添加新包

1. 在 `packages/` 目录下创建新的包文件夹
2. 添加 `package.json` 文件，确保包名以 `@butler/` 开头
3. 添加 `tsconfig.json` 文件
4. 在根目录的 `tsconfig.json` 中添加路径映射

### 包之间的依赖

在包的 `package.json` 中使用 `workspace:*` 来引用其他包：

```json
{
  "dependencies": {
    "@butler/types": "workspace:*",
    "@butler/utils": "workspace:*"
  }
}
```

## 版本管理

项目使用 [Changesets](https://github.com/changesets/changesets) 进行版本管理：

```bash
# 添加变更集
pnpm changeset

# 更新版本号
pnpm version-packages

# 发布包
pnpm release
```

## 代码质量

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks
- **lint-staged**: 提交前检查

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT