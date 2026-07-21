# 反向记账

移动端优先的 React + TypeScript MVP。应用只记录收入和储蓄，自动计算储蓄率与总支出。业务数据只保存在当前浏览器的 IndexedDB 中，不需要业务服务器。

## 当前功能

- 记录、查看、编辑和删除收入。
- 以“增加储蓄”为主要入口记录存下的钱；需要时可通过次级入口记录“取用储蓄”。
- 编辑储蓄记录时，修改“增加/取用”类型必须再次确认，避免把新增操作误认为编辑操作。
- 查看月度收入、净储蓄、储蓄率、目标进度和年度趋势。
- 使用密码导出、恢复 `.backup` 加密备份。
- 针对手机软键盘、安全区和短屏底部弹层进行适配。

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
npm run build:pages # 构建 GitHub Pages 版本
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

## 匿名使用统计

生产版本使用 Umami 统计页面访问和关键功能是否成功使用。本地开发默认关闭统计。统计不包含金额、日期、备注、目标数值、密码、文件内容或记录 ID，统计脚本加载失败也不会影响记账功能。

## GitHub Pages 发布

正式地址：

```text
https://dutongyu413-rgb.github.io/web-save-money/
```

推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动执行测试，构建 `dist/`，再发布到 GitHub Pages。`dist/` 是自动生成的临时目录，不需要提交到仓库。

第一次发布前，需要在 GitHub 仓库的 `Settings → Pages` 中，将 `Source` 设为 `GitHub Actions`。本地预览继续使用根路径；Pages 构建会自动使用 `/web-save-money/` 子路径。

## 技术栈

- Vite、React、TypeScript
- React Router
- Dexie + IndexedDB
- Zod
- Phosphor Icons
- Vitest + Testing Library

## 仓库说明

- `src/`：React 应用源代码与测试。
- `index.html`：Vite 应用入口。
- `package-lock.json`：锁定依赖版本，应提交到仓库。
- `dist/`、`node_modules/`：生成内容和本地依赖，不提交到仓库。
- 产品需求、技术方案、视觉规范和操作指南属于内部资料，仅保存在本地，不提交到公开仓库。

当前仓库未附带开源许可证。公开仓库可供查看，但在明确选择许可证前不自动授予复制、修改或分发权利。
