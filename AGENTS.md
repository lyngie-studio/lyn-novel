# Lyn Novel — AI 编码助手指南

本文件面向需要在这个仓库中工作的 AI 编码助手。阅读前请假定你对本项目一无所知。

## 项目概述

**Lyn Novel** 是一款本地优先的 AI 辅助小说创作工具。用户可以在固定分辨率（1280×720）的窗口中创建小说、管理人物与情节、撰写章节，并通过本地或远程大语言模型生成/续写内容。

- **前端**：Vue 3（Composition API / `<script setup>`）+ Vue Router + Vite
- **后端**：Node.js + Express，单文件入口 `server/index.cjs`（CommonJS）
- **持久化**：每本小说保存为一个 Markdown 文件，存放在操作系统应用数据目录（Windows 为 `%APPDATA%/LynNovel/data/{id}.md`）
- **AI 代理**：后端提供 `/api/ai/chat` 与 `/api/ai/test`，将前端请求转发到 Ollama、Llama、OpenAI 兼容或 Anthropic 兼容的上游接口
- **状态缓存**：前端同时使用 `localStorage`（键名 `lyn_novel_data`）作为小说列表的离线缓存

## 仓库结构

```
lyn-novel/
├── server/
│   ├── index.cjs              # Express 后端：REST API、Markdown 转换、AI 代理、配置管理
│   └── data/                  # 开发占位目录（实际被 gitignore，不用于真实存储）
├── src/
│   ├── main.js                # Vue 应用入口
│   ├── App.vue                # 仅包含 <router-view/> 的根组件
│   ├── style.css              # 全局唯一 CSS 文件（禁止新增全局样式表）
│   ├── router/index.js        # 三条路由：/、/novel/:id、/settings
│   ├── store/novelStore.js    # 基于 reactive + localStorage 的轻量级状态管理
│   └── views/
│       ├── Home.vue           # 小说列表、新建小说、导出/删除
│       ├── NovelEdit.vue      # 小说编辑器（设定/人物/情节/章节 + AI 生成）
│       └── Settings.vue       # AI 模型配置、Prompt 模板、全局追加指令
├── index.html                 # viewport 锁定 1280×720
├── vite.config.js             # Vite 配置：Vue 插件、端口 5173、host: true
├── check-settings.js          # localStorage 调试脚本（node 直接运行）
├── package.json               # 项目脚本与依赖
└── README.md                  # 中英双语用户文档
```

## 关键配置

- `package.json`：
  - `"type": "module"` 表示前端源码默认 ESM；后端因使用 `.cjs` 后缀保持 CommonJS。
  - 无测试框架、无 linter、无格式化工具。
- `vite.config.js`：仅注册 `@vitejs/plugin-vue`，开发服务器监听 `5173`。
- `.gitignore`：排除 `node_modules/`、`server/data/`、`.env`、`dist/`。

## 常用命令

```bash
# 安装依赖
npm install

# 同时启动前端（Vite，5173）和后端（Express，3001）
npm run dev

# 单独启动前端
npm run dev:frontend

# 单独启动后端
npm run dev:backend
# 或
npm run server

# 生产构建，输出到 dist/
npm run build

# 预览生产构建
npm run preview
```

> 注意：前端页面通过硬编码的 `http://localhost:3001` 调用后端 API，因此必须同时运行后端才能完整使用。

## 运行时架构

### 数据流

1. **持久化**：小说以 Markdown 格式存储在 `DATA_DIR`（`%APPDATA%/LynNovel/data`）。
2. **后端 API**：
   - `GET    /api/novels`        列出所有小说
   - `GET    /api/novels/:id`    获取单本小说
   - `POST   /api/novels`        保存/更新小说
   - `DELETE /api/novels/:id`    删除单本小说
   - `DELETE /api/novels`        删除全部小说
   - `GET    /api/settings`      获取 AI 配置（已脱敏）
   - `POST   /api/settings`      保存 AI 配置（含 API 密钥）
   - `POST   /api/settings/reset` 恢复默认配置
   - `GET    /api/prompts`       获取 Prompt 模板
   - `POST   /api/prompts`       保存 Prompt 模板
   - `POST   /api/ai/test`       测试上游 AI 连接
   - `POST   /api/ai/chat`       流式聊天代理
3. **前端状态**：`src/store/novelStore.js` 维护 `reactive` 状态并同步到 `localStorage`（`lyn_novel_data`），作为后端不可用时的降级缓存。
4. **AI 调用**：前端通过 `/api/ai/chat` 发送消息；后端根据 `provider` 构造对应上游请求并透传/转换 SSE 流。

### 小说数据模型

```js
{
  id: String,                // 时间戳字符串
  name: String,              // 小说名称
  style: String,             // 玄幻/言情/科幻/悬疑/恐怖/剧情/喜剧/动作
  settings: String,          // 世界设定
  characters: [{ name, description }],
  plots: [{ title, content }],
  chapters: [{ id, title, content, wordCount }]
}
```

### 后端配置

- 配置文件：`%APPDATA%/LynNovel/config.json`
- Prompt 模板文件：`%APPDATA%/LynNovel/data/prompts.json`
- 默认 AI provider：`ollama`，默认地址 `http://localhost:11434/api/generate`
- API 密钥仅保存在后端 `config.json`，前端通过 `hasApiKey` / `keyPreview` 感知是否存在密钥，但绝不接收完整密钥。

## 代码组织约定

### 文件与模块

- 前端统一使用 ESM，Vue 单文件组件（SFC）全部使用 `<script setup>`。
- 后端统一使用 CommonJS，文件后缀 `.cjs`。
- **只允许一个全局 CSS 文件**：`src/style.css`。各 `.vue` 组件可以使用 `<style scoped>`，但禁止新增全局样式表。
- 无组件库依赖，UI 全部由手写 CSS 实现。

### 命名规范

- Vue 组件：PascalCase（如 `Home.vue`、`NovelEdit.vue`）。
- 函数/方法：camelCase。
- 本地状态变量：camelCase，使用 `ref` / `computed` / `watch`。

### 固定分辨率布局

- 应用目标分辨率固定为 **1280×720**。
- `index.html` 的 viewport meta 设置为 `width=1280, height=720`。
- `#app` 在 `style.css` 中固定为 `1280px × 720px`。
- **禁止**：使用媒体查询、`vh` / `vw` 单位。所有尺寸使用 `px`。
- `html, body` 使用 `display: flex; justify-content: center;` 居中应用窗口，并设置 `overflow: hidden`。

### DOM 与结构

- 禁止在 `html` / `body` 中直接放置 DOM 元素；所有内容必须位于 Vue 组件内部 `#app` 之下。
- 组件内部大量通过 `ref` 引用 DOM 元素以实现富文本编辑、滚动、菜单定位等功能。

## 代码风格指南

- 使用 **2 空格缩进**。
- 字符串优先使用单引号（与现有代码保持一致）。
- 条件/循环后的大括号即使只有一条语句也保留。
- Vue 模板属性较长时保持换行对齐。
- 后端函数注重错误捕获与默认值回退，参考 `loadConfig` / `loadPrompts` 的写法。
- 不要留下未使用的依赖：删除功能时同步清理 `package.json`。

## AI 功能实现要点

- 前端根据当前标签页决定 AI 按钮行为：
  - `settings`：生成/续写世界观设定
  - `characters`：生成新角色（要求返回 JSON）
  - `plots`：生成新情节（要求返回 JSON）
  - `chapters`：生成/重新生成当前章节内容
- Prompt 模板支持变量替换，如 `{novelName}`、`{style}`、`{settings}`、`{plotsList}`、`{charactersList}`、`{chapterTitle}` 等。
- 章节生成要求模型在正文开头输出 `# 章节标题`，前端会解析并替换当前章节标题。
- `modelSettings.promptKeywords` 作为全局追加指令，会在每次 AI 调用时附加到 prompt 末尾。

## 测试说明

- 本项目**没有单元测试、集成测试或 E2E 测试**。
- 手动验证流程：
  1. `npm run dev` 同时启动前后端；
  2. 浏览器访问 `http://localhost:5173`；
  3. 创建小说、添加人物/情节/章节、保存并刷新，确认 `%APPDATA%/LynNovel/data` 下生成对应 `.md`；
  4. 在设置页配置 Ollama/LLM 地址，点击「测试连接」验证代理；
  5. 在编辑页使用 AI 生成内容，确认 SSE 流式输出正常。

## 安全与隐私注意事项

- API 密钥只保存在后端 `%APPDATA%/LynNovel/config.json`，不会发送到浏览器持久化。
- 前端向后端发送设置时，若未提供新的 `apiKey`，后端会保留旧值（便于只改 URL 不重输密钥）。
- `/api/settings` GET 接口会调用 `stripApiKeys()` 对返回内容进行脱敏。
- 后端 `/api/ai/chat` 在转发请求时使用已保存配置中的密钥，而不是信任前端入参中的密钥。
- 本项目不处理用户认证，默认在本地单用户环境运行。

## 修改前必读

1. 不要引入媒体查询或响应式单位（`vh`/`vw`/`%` 布局）。
2. 不要新增全局 CSS 文件；样式优先放在组件 `<style scoped>` 中，必要时追加到 `src/style.css`。
3. 修改后端接口时，同步检查前端 `Home.vue`、`NovelEdit.vue`、`Settings.vue` 中的硬编码 `http://localhost:3001` 调用。
4. 修改数据模型时，同步更新 `novelToMarkdown` 与 `markdownToNovel` 两个转换函数。
5. 删除功能或依赖时，同步清理 `package.json`。
