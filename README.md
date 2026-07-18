# 反向记账

移动端优先的 React + TypeScript MVP。应用只记录收入和储蓄，自动计算储蓄率与总支出。业务数据只保存在当前浏览器的 IndexedDB 中，不需要业务服务器。

## 环境要求

- Node.js `20.19+` 或 `22.12+`
- npm `10+`

## 本地预览

安装锁定版本的依赖并启动开发服务器：

```bash
npm ci
npm run dev
```

然后打开：

```text
http://127.0.0.1:8417/
```

## 工程命令

```bash
npm run dev      # 本地开发
npm run test     # 单元测试
npm run build    # 类型检查和生产构建
npm run preview  # 预览生产构建
```

提交代码前建议运行：

```bash
npm test
npm run build
```

## 数据说明

正式数据保存在 IndexedDB，不上传服务器。第一次启动时，如果当前地址存在旧静态原型的 `localStorage` 数据，工程会尝试迁移一次。

导出的 `.backup` 文件使用 PBKDF2 和 AES-GCM 在本机加密。密码不会保存，也无法找回。

`.backup` 文件可能包含真实财务数据，已通过 `.gitignore` 排除，请勿手动提交到公开仓库。

## 技术栈

- Vite、React、TypeScript
- React Router
- Dexie + IndexedDB
- Zod
- Phosphor Icons
- Vitest + Testing Library

## 正式开发文档

- `MVP产品需求文档.md`：产品范围、页面、数据模型、计算和异常状态。
- `MVP技术方案.md`：技术架构、IndexedDB、备份加密、测试和部署。
- `UI视觉规范.md`：颜色、字体、间距、组件、状态和开发交付标准。

## 仓库说明

- `src/`：React 应用源代码与测试。
- `index.html`：Vite 应用入口。
- `package-lock.json`：锁定依赖版本，应提交到仓库。
- `dist/`、`node_modules/`：生成内容和本地依赖，不提交到仓库。

当前仓库未附带开源许可证。公开仓库可供查看，但在明确选择许可证前不自动授予复制、修改或分发权利。
