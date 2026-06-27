# Lyn Novel

<div align="center">

**一款智能小说创作工具**

[English](#english) | [中文](#chinese)

</div>

---

## Chinese

### 软件介绍

Lyn Novel 是一款基于 Vue 3 和 Vite 构建的智能小说创作工具，专为小说创作者设计。它集成了 AI 辅助写作功能，支持多种大语言模型（Ollama、Llama、OpenAI 兼容、Anthropic 兼容），帮助您更高效地完成小说创作。

### 主要功能

- **小说设定管理**：创建和管理小说的基本信息，包括名称、类型、简介等
- **人物角色管理**：添加、编辑和删除小说中的人物角色及其描述
- **故事情节管理**：规划和组织小说的情节发展
- **章节内容管理**：编写和管理小说的各个章节内容
- **AI 辅助写作**：支持 AI 自动生成小说设定、人物描述、情节内容和章节文字
- **流式输出**：AI 生成内容实时显示，无需等待
- **本地服务器存储**：数据自动保存到本地服务器，支持数据持久化
- **实时字数统计**：自动统计章节字数和段落数
- **Prompt 模板自定义**：支持自定义各功能的 AI 提示词模板，灵活控制生成内容
- **全局追加指令**：支持设置全局追加指令，统一影响所有 AI 生成内容

### 技术栈

- **前端**：Vue 3 + Vite
- **后端**：Node.js + Express
- **AI 集成**：支持 Ollama、Llama、OpenAI 兼容、Anthropic 兼容大语言模型

### 安装步骤

#### 环境要求

- Node.js 16+ 
- npm 或 yarn

#### 安装

1. 克隆项目到本地：

```bash
git clone https://github.com/lyngie-studio/lyn-novel
cd lyn-novel
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器（同时启动前端和后端）：

```bash
npm run dev
```

4. 打开浏览器访问：http://localhost:5173/

#### 配置 AI 模型

1. 进入设置页面
2. 选择 AI 模型调用方式（Ollama、Llama、OpenAI 兼容、Anthropic 兼容）
3. 配置 API 地址和模型名称
   - OpenAI 兼容：支持 DeepSeek、Moonshot、智谱等
   - Anthropic 兼容：支持 Claude 等
4. 点击"测试连接"验证配置
5. 支持 baseURL 自动补全功能，输入已知地址前缀可自动补全完整 API 路径

### 项目结构

```
lyn-novel/
├── server/          # 后端服务
│   ├── index.cjs    # Express 服务器
│   └── data/        # 数据存储目录
├── src/             # 前端源码
│   ├── views/       # 页面组件
│   ├── store/       # 状态管理
│   ├── router/      # 路由配置
│   └── App.vue      # 根组件
├── package.json     # 项目配置
└── vite.config.js   # Vite 配置
```

---

## English

### Introduction

Lyn Novel is an intelligent novel writing tool built with Vue 3 and Vite, designed specifically for novel creators. It integrates AI-assisted writing capabilities and supports multiple large language models (Ollama, Llama, OpenAI-compatible, Anthropic-compatible) to help you complete novel writing more efficiently.

### Key Features

- **Novel Settings Management**: Create and manage basic novel information including name, genre, synopsis, etc.
- **Character Management**: Add, edit, and delete characters and their descriptions
- **Plot Management**: Plan and organize novel plot development
- **Chapter Content Management**: Write and manage novel chapters
- **AI-Assisted Writing**: Support AI automatic generation of novel settings, character descriptions, plot content, and chapter text
- **Streaming Output**: AI-generated content displays in real-time without waiting
- **Local Server Storage**: Data automatically saved to local server with persistence support
- **Real-time Word Count**: Automatic statistics for chapter word count and paragraph count
- **Prompt Template Customization**: Support custom AI prompt templates for each feature
- **Global Append Instructions**: Support global append instructions that affect all AI generation

### Tech Stack

- **Frontend**: Vue 3 + Vite
- **Backend**: Node.js + Express
- **AI Integration**: Supports Ollama, Llama, OpenAI-compatible, Anthropic-compatible large language models

### Installation

#### Prerequisites

- Node.js 16+
- npm or yarn

#### Setup

1. Clone the repository:

```bash
git clone https://github.com/lyngie-studio/lyn-novel.git
cd lyn-novel
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server (both frontend and backend):

```bash
npm run dev
```

4. Open your browser and visit: http://localhost:5173/

#### Configure AI Model

1. Navigate to the Settings page
2. Select AI model provider (Ollama, Llama, OpenAI-compatible, Anthropic-compatible)
3. Configure API address and model name
   - OpenAI-compatible: Supports DeepSeek, Moonshot, Zhipu, etc.
   - Anthropic-compatible: Supports Claude, etc.
4. Click "Test Connection" to verify configuration
5. Supports baseURL auto-completion, entering known address prefixes will auto-complete the full API path

### Project Structure

```
lyn-novel/
├── server/          # Backend service
│   ├── index.cjs    # Express server
│   └── data/        # Data storage directory
├── src/             # Frontend source code
│   ├── views/       # Page components
│   ├── store/       # State management
│   ├── router/      # Route configuration
│   └── App.vue      # Root component
├── package.json     # Project configuration
└── vite.config.js   # Vite configuration
```