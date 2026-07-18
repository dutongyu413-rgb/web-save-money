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

## Umami 匿名统计

项目支持 Umami 页面访问和关键行为统计。生产构建已经配置 `web-save-money` 对应的 Website ID，无需额外设置即可开始统计。

本地开发默认关闭统计，避免调试数据污染正式结果。如需在本地联调，可复制环境变量示例：

```bash
cp .env.example .env.local
```

```text
VITE_UMAMI_WEBSITE_ID=ebe13ff1-7a56-4a1d-ab6d-3a4c2e8df138
VITE_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

所有自定义事件统一使用 `save_money_` 前缀：

| 事件 | 含义 |
| --- | --- |
| `save_money_page_viewed` | 进入某个功能页面 |
| `save_money_income_record_saved` | 收入记录成功新增或编辑 |
| `save_money_savings_record_saved` | 储蓄记录成功新增或编辑 |
| `save_money_target_rate_saved` | 目标储蓄率保存成功 |
| `save_money_backup_downloaded` | 已触发加密备份下载 |
| `save_money_backup_restored` | 备份恢复成功 |

统计只包含页面名称、创建/编辑、增加/取用等非敏感分类，不上传金额、日期、备注、目标值、密码和备份内容。未配置 Umami 或统计脚本加载失败时，不影响应用正常使用。

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
