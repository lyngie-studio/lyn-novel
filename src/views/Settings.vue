<template>
  <div class="settingsContainer">
    <header class="settingsHeader">
      <button class="backButton" @click="goBack">
        <span class="settingsIcon">←</span>
      </button>
      <h1 class="settingsTitle">设置</h1>
    </header>
    <main class="settingsContent">
      <div class="settingsSection">
        <h2 class="settingsSectionTitle">大模型设置</h2>
        <div class="settingsItem">
          <label class="settingsLabel">调用方式</label>
          <select v-model="modelSettings.provider" class="settingsSelect">
            <option value="ollama">Ollama</option>
            <option value="llama">Llama</option>
            <option value="openai">OpenAI兼容</option>
            <option value="anthropic">Anthropic兼容</option>
          </select>
        </div>
        
        <!-- Ollama 设置 -->
        <div v-if="modelSettings.provider === 'ollama'" class="providerSettings">
          <div class="settingsItem">
            <label class="settingsLabel">API地址</label>
            <input 
              v-model="modelSettings.ollama.apiUrl" 
              class="settingsInput" 
              type="text"
              placeholder="http://localhost:11434/api/generate"
            />
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">模型名称</label>
            <input 
              v-model="modelSettings.ollama.model" 
              class="settingsInput" 
              type="text"
              placeholder="gemma3:1b"
            />
          </div>
        </div>
        
        <!-- Llama 设置 -->
        <div v-if="modelSettings.provider === 'llama'" class="providerSettings">
          <div class="settingsItem">
            <label class="settingsLabel">API地址</label>
            <input 
              v-model="modelSettings.llama.apiUrl" 
              class="settingsInput" 
              type="text"
              placeholder="http://localhost:8080/v1/chat/completions"
            />
            <div class="settingsHint">llama.cpp 的默认地址是 http://localhost:8080/v1/chat/completions</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">API密钥</label>
            <div v-if="modelSettings.llama.hasApiKey" class="apiKeyPreview">
              <span class="apiKeyPreviewLabel">当前密钥：</span>
              <code class="apiKeyPreviewValue">{{ modelSettings.llama.keyPreview }}</code>
            </div>
            <input 
              v-model="modelSettings.llama.apiKey" 
              class="settingsInput" 
              type="password"
              placeholder="可选：留空表示不修改已保存的密钥"
            />
            <div class="settingsHint">密钥仅保存在本机后端 config.json，浏览器不持久化</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">模型路径</label>
            <input 
              v-model="modelSettings.llama.modelPath" 
              class="settingsInput" 
              type="text"
              placeholder="/path/to/model"
            />
            <div class="settingsHint">请提供 Llama 模型的完整路径（llama.cpp 可能不需要此设置）</div>
          </div>
        </div>
        
        <!-- OpenAI 兼容设置 -->
        <div v-if="modelSettings.provider === 'openai'" class="providerSettings">
          <div class="settingsItem">
            <label class="settingsLabel">API地址</label>
            <div class="apiUrlInputWrapper">
              <input
                v-model="modelSettings.openai.apiUrl"
                class="settingsInput"
                type="text"
                placeholder="https://api.openai.com/v1/chat/completions"
                @input="onApiUrlInput"
              />
              <div v-if="urlSuggestion.show" class="urlSuggestionDropdown">
                <div class="urlSuggestionContent">
                  <div class="urlSuggestionLabel">自动补全：</div>
                  <div class="urlSuggestionValue">{{ urlSuggestion.fullUrl }}</div>
                </div>
                <div class="urlSuggestionActions">
                  <button class="urlSuggestionBtn urlSuggestionUse" @click="applySuggestion">使用</button>
                  <button class="urlSuggestionBtn urlSuggestionCancel" @click="dismissSuggestion">取消</button>
                </div>
              </div>
            </div>
            <div class="settingsHint">兼容 OpenAI Chat Completions 接口的地址，例如 OpenAI、Azure OpenAI、DeepSeek、Moonshot、智谱等</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">API密钥</label>
            <div v-if="modelSettings.openai.hasApiKey" class="apiKeyPreview">
              <span class="apiKeyPreviewLabel">当前密钥：</span>
              <code class="apiKeyPreviewValue">{{ modelSettings.openai.keyPreview }}</code>
            </div>
            <input 
              v-model="modelSettings.openai.apiKey" 
              class="settingsInput" 
              type="password"
              placeholder="留空表示不修改已保存的密钥"
            />
            <div class="settingsHint">密钥仅保存在本机后端 config.json，浏览器不持久化</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">模型名称</label>
            <input 
              v-model="modelSettings.openai.model" 
              class="settingsInput" 
              type="text"
              placeholder="gpt-3.5-turbo"
            />
            <div class="settingsHint">例如：gpt-3.5-turbo、gpt-4、deepseek-chat 等</div>
          </div>
        </div>

        <!-- Anthropic 设置 -->
        <div v-if="modelSettings.provider === 'anthropic'" class="providerSettings">
          <div class="settingsItem">
            <label class="settingsLabel">API地址</label>
            <div class="apiUrlInputWrapper">
              <input
                v-model="modelSettings.anthropic.apiUrl"
                class="settingsInput"
                type="text"
                placeholder="https://api.anthropic.com/v1/messages"
                @input="onAnthropicApiUrlInput"
              />
              <div v-if="anthropicUrlSuggestion.show" class="urlSuggestionDropdown">
                <div class="urlSuggestionContent">
                  <div class="urlSuggestionLabel">自动补全：</div>
                  <div class="urlSuggestionValue">{{ anthropicUrlSuggestion.fullUrl }}</div>
                </div>
                <div class="urlSuggestionActions">
                  <button class="urlSuggestionBtn urlSuggestionUse" @click="applyAnthropicSuggestion">使用</button>
                  <button class="urlSuggestionBtn urlSuggestionCancel" @click="dismissAnthropicSuggestion">取消</button>
                </div>
              </div>
            </div>
            <div class="settingsHint">必须以 /v1/messages 结尾。例如：https://api.minimaxi.com/anthropic/v1/messages</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">API密钥</label>
            <div v-if="modelSettings.anthropic.hasApiKey" class="apiKeyPreview">
              <span class="apiKeyPreviewLabel">当前密钥：</span>
              <code class="apiKeyPreviewValue">{{ modelSettings.anthropic.keyPreview }}</code>
            </div>
            <input
              v-model="modelSettings.anthropic.apiKey"
              class="settingsInput"
              type="password"
              placeholder="留空表示不修改已保存的密钥"
            />
            <div class="settingsHint">使用 x-api-key 头发送（不是 Bearer），同时附带 anthropic-version</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">模型名称</label>
            <input
              v-model="modelSettings.anthropic.model"
              class="settingsInput"
              type="text"
              placeholder="claude-3-5-sonnet-20241022"
            />
            <div class="settingsHint">例如：claude-3-5-sonnet-20241022、claude-3-opus-20240229</div>
          </div>
          <div class="settingsItem">
            <label class="settingsLabel">anthropic-version</label>
            <input
              v-model="modelSettings.anthropic.anthropicVersion"
              class="settingsInput"
              type="text"
              placeholder="2023-06-01"
            />
            <div class="settingsHint">API 版本号，一般无需修改</div>
          </div>
        </div>
      </div>
      
      <div class="settingsSection">
        <h2 class="settingsSectionTitle">Prompt模板</h2>
        <div class="settingsItem">
          <label class="settingsLabel">全局追加指令</label>
          <textarea 
            v-model="modelSettings.promptKeywords" 
            class="settingsTextarea" 
            placeholder="每次AI调用时统一追加到prompt末尾的补充指令，每行一个"
            rows="3"
          ></textarea>
          <div class="settingsHint">例如：请用现代白话文写作、多使用对话描写等。会追加在所有功能的prompt之后。</div>
        </div>
        <div class="settingsItem">
          <label class="settingsLabel">小说设定</label>
          <textarea 
            v-model="prompts.settings" 
            class="settingsTextarea" 
            placeholder="小说设定 prompt 模板"
            rows="3"
          ></textarea>
          <div class="settingsHint">可用变量：{novelName}、{style}</div>
        </div>
        <div class="settingsItem">
          <label class="settingsLabel">人物生成</label>
          <textarea 
            v-model="prompts.characters" 
            class="settingsTextarea" 
            placeholder="人物生成 prompt 模板"
            rows="4"
          ></textarea>
          <div class="settingsHint">可用变量：{novelName}、{style}、{charactersInfo}</div>
        </div>
        <div class="settingsItem">
          <label class="settingsLabel">情节生成</label>
          <textarea 
            v-model="prompts.plots" 
            class="settingsTextarea" 
            placeholder="情节生成 prompt 模板"
            rows="4"
          ></textarea>
          <div class="settingsHint">可用变量：{novelName}、{style}、{plotsInfo}</div>
        </div>
        <div class="settingsItem">
          <label class="settingsLabel">章节生成（首次）</label>
          <textarea 
            v-model="prompts.chapters.firstTime" 
            class="settingsTextarea" 
            placeholder="章节首次生成 prompt 模板"
            rows="4"
          ></textarea>
          <div class="settingsHint">可用变量：{novelName}、{style}、{settings}、{plotsList}、{charactersList}、{chapterTitle}、{previousChapterSection}</div>
        </div>
        <div class="settingsItem">
          <label class="settingsLabel">章节生成（重新生成）</label>
          <textarea 
            v-model="prompts.chapters.regenerate" 
            class="settingsTextarea" 
            placeholder="章节重新生成 prompt 模板"
            rows="4"
          ></textarea>
          <div class="settingsHint">可用变量：{novelName}、{style}、{settings}、{plotsList}、{charactersList}、{chapterTitle}、{currentContent}</div>
        </div>
        <div class="settingsActions" style="margin-top: 15px;">
          <button class="btn btnPrimary" @click="savePrompts">保存模板</button>
          <button class="btn btnSecondary" @click="resetPrompts">恢复默认</button>
        </div>
      </div>
      
      <div class="settingsActions">
        <button class="btn btnPrimary" @click="saveSettings">保存设置</button>
        <button class="btn btnSecondary" @click="resetSettings">恢复默认</button>
        <button class="btn btnTertiary" @click="testConnection">测试连接</button>
        <button class="btn btnAbout" @click="showAbout = true">关于</button>
      </div>
      
      <div class="dangerSection">
        <h2 class="dangerSectionTitle">危险操作</h2>
        <div class="dangerItem">
          <p class="dangerDescription">删除所有小说数据，此操作不可恢复。</p>
          <button class="btn btnDanger" @click="confirmDeleteAll">删除全部内容</button>
        </div>
      </div>
      
      <div v-if="showDeleteConfirm" class="dialogOverlay" @click.self="showDeleteConfirm = false">
        <div class="dialog">
          <h2 class="dialogTitle">确认删除</h2>
          <p class="dialogMessage">确定要删除所有小说数据吗？此操作不可恢复！</p>
          <div class="dialogActions">
            <button class="btn btnSecondary" @click="showDeleteConfirm = false">取消</button>
            <button class="btn btnDanger" @click="deleteAllNovels">确认删除</button>
          </div>
        </div>
      </div>

      <div v-if="showAbout" class="dialogOverlay" @click.self="showAbout = false">
        <div class="dialog aboutDialog">
          <h2 class="dialogTitle">关于 Lyn Novel</h2>
          <div class="aboutContent">
            <div class="aboutName">Lyn Novel</div>
            <div class="aboutVersion">版本 v1.1.0</div>
            <div class="aboutDescription">
              Lyn Novel 是一款智能小说创作工具，支持多种 AI 大模型（Ollama、Llama、OpenAI 兼容、Anthropic 兼容）辅助写作、章节管理、人物设定、情节规划等功能。所有数据本地存储，API 密钥仅保存在后端，保障您的创作安全和隐私。
            </div>
          </div>
          <div class="dialogActions">
            <button class="btn btnPrimary" @click="showAbout = false">确定</button>
          </div>
        </div>
      </div>

      <div v-if="dialogMessage.show" class="dialogOverlay" @click.self="dialogMessage.show = false">
        <div class="dialog">
          <h2 class="dialogTitle">{{ dialogMessage.title }}</h2>
          <p class="dialogMessage">{{ dialogMessage.message }}</p>
          <div class="dialogActions">
            <button class="btn btnPrimary" @click="dialogMessage.show = false">确定</button>
          </div>
        </div>
      </div>

      <div v-if="notification.show" class="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const modelSettings = ref({
  provider: 'ollama',
  ollama: {
    apiUrl: 'http://localhost:11434/api/generate',
    model: 'gemma3:1b'
  },
  llama: {
    apiUrl: 'http://localhost:8080/v1/chat/completions',
    apiKey: '',
    hasApiKey: false,
    keyPreview: '',
    modelPath: ''
  },
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    hasApiKey: false,
    keyPreview: '',
    model: 'gpt-3.5-turbo'
  },
  anthropic: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: '',
    hasApiKey: false,
    keyPreview: '',
    model: 'claude-3-5-sonnet-20241022',
    anthropicVersion: '2023-06-01'
  },
  promptKeywords: ''
})

const prompts = ref({
  settings: '',
  characters: '',
  plots: '',
  chapters: {
    regenerate: '',
    firstTime: ''
  }
})

const DEFAULT_PROMPTS_FRONTEND = {
  settings: '基于以下信息，为小说《{novelName}》生成一段吸引人的故事背景和世界观设定。\n小说类型：{style}\n请用中文回答，200字以内。',
  characters: '返回一个JSON对象，不要有多余文字和内容。为小说《{novelName}》（类型：{style}）生成一个新角色。\n\n已有角色：{charactersInfo}\n\n比如：\n{\n  "name":"艾瑟琳","description":"艾瑟琳是一个科学家，在国家研究所上班。她的口头禅是：我是一个伟大的女性。短头发，深棕色的眼睛，高挺的鼻梁。"\n}',
  plots: '为小说《{novelName}》（类型：{style}）设计一个新情节。\n\n已有情节：{plotsInfo}\n\n只返回以下格式的JSON，不要有任何其他内容：\n{\n  "title":"情节标题","content":"情节内容"\n}',
  chapters: {
    regenerate: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n请重新生成章节"{chapterTitle}"的内容。\n\n当前章节内容：\n{currentContent}\n\n请重新创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。请在正文开头以"# 章节标题"的格式输出一个更合适的章节标题，然后换行输出正文内容。',
    firstTime: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n{previousChapterSection}请生成章节"{chapterTitle}"的内容。\n\n请创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。请在正文开头以"# 章节标题"的格式输出一个更合适的章节标题，然后换行输出正文内容。'
  }
}

async function loadPrompts() {
  try {
    const response = await fetch('http://localhost:3001/api/prompts')
    if (response.ok) {
      const data = await response.json()
      prompts.value = {
        settings: data.settings || DEFAULT_PROMPTS_FRONTEND.settings,
        characters: data.characters || DEFAULT_PROMPTS_FRONTEND.characters,
        plots: data.plots || DEFAULT_PROMPTS_FRONTEND.plots,
        chapters: {
          regenerate: (data.chapters && data.chapters.regenerate) || DEFAULT_PROMPTS_FRONTEND.chapters.regenerate,
          firstTime: (data.chapters && data.chapters.firstTime) || DEFAULT_PROMPTS_FRONTEND.chapters.firstTime
        }
      }
    }
  } catch (e) {
    prompts.value = JSON.parse(JSON.stringify(DEFAULT_PROMPTS_FRONTEND))
  }
}

function normalizePromptsForSave(raw) {
  const defaults = DEFAULT_PROMPTS_FRONTEND
  return {
    settings: raw.settings.trim() || defaults.settings,
    characters: raw.characters.trim() || defaults.characters,
    plots: raw.plots.trim() || defaults.plots,
    chapters: {
      regenerate: raw.chapters.regenerate.trim() || defaults.chapters.regenerate,
      firstTime: raw.chapters.firstTime.trim() || defaults.chapters.firstTime
    }
  }
}

async function savePrompts(silent = false) {
  const sanitized = normalizePromptsForSave(prompts.value)
  prompts.value = sanitized
  try {
    const response = await fetch('http://localhost:3001/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    })
    if (response.ok) {
      if (!silent) showNotification('Prompt 模板已保存', 'success')
      return true
    } else {
      if (!silent) showNotification('Prompt 模板保存失败', 'error')
      return false
    }
  } catch (e) {
    if (!silent) showNotification('Prompt 模板保存失败：后端未连接', 'error')
    return false
  }
}

async function resetPrompts(silent = false) {
  prompts.value = JSON.parse(JSON.stringify(DEFAULT_PROMPTS_FRONTEND))
  try {
    const response = await fetch('http://localhost:3001/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompts.value)
    })
    if (response.ok) {
      if (!silent) showNotification('Prompt 模板已恢复默认', 'success')
      return true
    } else {
      if (!silent) showNotification('恢复默认失败', 'error')
      return false
    }
  } catch (e) {
    if (!silent) showNotification('恢复默认失败：后端未连接', 'error')
    return false
  }
}

const BASE_URL_MAP = {
  'https://api.deepseek.com': 'https://api.deepseek.com/v1/chat/completions',
  'https://api.openai.com': 'https://api.openai.com/v1/chat/completions',
  'https://api.moonshot.cn': 'https://api.moonshot.cn/v1/chat/completions',
  'https://open.bigmodel.cn': 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
}

const urlSuggestion = ref({ show: false, fullUrl: '', baseUrl: '' })

function onApiUrlInput() {
  const current = modelSettings.value.openai.apiUrl || ''
  for (const [base, full] of Object.entries(BASE_URL_MAP)) {
    if (current === base || current.startsWith(base + '/')) {
      if (current !== full) {
        urlSuggestion.value = { show: true, fullUrl: full, baseUrl: base }
        return
      }
    }
  }
  urlSuggestion.value = { show: false, fullUrl: '', baseUrl: '' }
}

function applySuggestion() {
  modelSettings.value.openai.apiUrl = urlSuggestion.value.fullUrl
  urlSuggestion.value.show = false
}

function dismissSuggestion() {
  urlSuggestion.value.show = false
}

const ANTHROPIC_BASE_URL_MAP = {
  'https://api.anthropic.com': 'https://api.anthropic.com/v1/messages',
  'https://api.deepseek.com/anthropic': 'https://api.deepseek.com/anthropic/v1/messages'
}

const anthropicUrlSuggestion = ref({ show: false, fullUrl: '', baseUrl: '' })

function onAnthropicApiUrlInput() {
  const current = modelSettings.value.anthropic.apiUrl || ''
  for (const [base, full] of Object.entries(ANTHROPIC_BASE_URL_MAP)) {
    if (current === base || current.startsWith(base + '/')) {
      if (current !== full) {
        anthropicUrlSuggestion.value = { show: true, fullUrl: full, baseUrl: base }
        return
      }
    }
  }
  anthropicUrlSuggestion.value = { show: false, fullUrl: '', baseUrl: '' }
}

function applyAnthropicSuggestion() {
  modelSettings.value.anthropic.apiUrl = anthropicUrlSuggestion.value.fullUrl
  anthropicUrlSuggestion.value.show = false
}

function dismissAnthropicSuggestion() {
  anthropicUrlSuggestion.value.show = false
}

const dialogMessage = ref({ show: false, title: '提示', message: '' })

function showDialogMessage(message, title = '提示') {
  dialogMessage.value = { show: true, title, message }
}

const showDeleteConfirm = ref(false)
const showAbout = ref(false)
const notification = ref({ show: false, message: '', type: 'success' })

function showNotification(message, type = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 2000)
}

async function loadSettings() {
  try {
    const response = await fetch('http://localhost:3001/api/settings')
    if (response.ok) {
      const data = await response.json()
      // 后端只返回脱敏配置（hasApiKey 标记，apiKey 字段为空）
      if (data && typeof data === 'object') {
        if (data.openai && data.openai.apiKey === '') data.openai.apiKey = ''
        if (data.llama && data.llama.apiKey === '') data.llama.apiKey = ''
        modelSettings.value = data
      }
    }
  } catch (e) {
    // 后端未启动时静默失败，使用本地默认值
  }
}

async function saveSettings() {
  try {
    const response = await fetch('http://localhost:3001/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelSettings.value)
    })
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      if (data && data.config) {
        // 同步后端脱敏后的配置（清空 apiKey 字段、保留 hasApiKey 标记）
        modelSettings.value.openai = { ...modelSettings.value.openai, ...data.config.openai, apiKey: '' }
        modelSettings.value.llama = { ...modelSettings.value.llama, ...data.config.llama, apiKey: '' }
        if (data.config.anthropic) {
          modelSettings.value.anthropic = { ...modelSettings.value.anthropic, ...data.config.anthropic, apiKey: '' }
        }
      }
      showNotification('设置已保存到本地后端', 'success')
      await savePrompts(true)
    } else {
      showNotification('保存失败', 'error')
    }
  } catch (e) {
    showNotification('保存失败：后端未连接', 'error')
  }
}

async function resetSettings() {
  try {
    const response = await fetch('http://localhost:3001/api/settings/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      if (data && data.config) {
        modelSettings.value = data.config
      } else {
        modelSettings.value = {
          provider: 'ollama',
          ollama: { apiUrl: 'http://localhost:11434/api/generate', model: 'gemma3:1b' },
          llama: { apiUrl: 'http://localhost:8080/v1/chat/completions', apiKey: '', modelPath: '' },
          openai: { apiUrl: 'https://api.openai.com/v1/chat/completions', apiKey: '', model: 'gpt-3.5-turbo' },
          anthropic: { apiUrl: 'https://api.anthropic.com/v1/messages', apiKey: '', model: 'claude-3-5-sonnet-20241022', anthropicVersion: '2023-06-01' },
          promptKeywords: ''
        }
      }
      showNotification('已恢复默认设置', 'success')
      await resetPrompts(true)
    } else {
      showNotification('恢复失败', 'error')
    }
  } catch (e) {
    showNotification('恢复失败：后端未连接', 'error')
  }
}

function goBack() {
  router.push('/')
}

async function testConnection() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    console.log('[testConnection] 开始测试，provider=', modelSettings.value.provider)
    const response = await fetch('http://localhost:3001/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelSettings.value),
      signal: controller.signal
    })
    let data = {}
    try {
      data = await response.json()
    } catch (parseErr) {
      console.warn('[testConnection] 响应不是合法 JSON:', parseErr)
    }
    if (response.ok && data.success) {
      const providerName = { ollama: 'Ollama', llama: 'Llama', openai: 'OpenAI 兼容', anthropic: 'Anthropic 兼容' }[modelSettings.value.provider] || 'AI'
      showDialogMessage(`${providerName} 服务连接成功！`)
    } else {
      const errMsg = (data && data.error) ? String(data.error) : response.statusText
      const detail = (data && data.detail) ? String(data.detail) : ''
      const stack = (data && data.stack) ? String(data.stack) : ''
      console.error('[testConnection] 后端返回失败:', { status: response.status, data })
      showDialogMessage(`连接失败 (${response.status}): ${errMsg}\n${detail}${stack ? '\n' + stack : ''}`)
    }
  } catch (error) {
    console.error('[testConnection] 请求异常:', error)
    if (error.name === 'AbortError') {
      showDialogMessage('连接超时（15s），请检查后端是否启动或网络是否可达')
    } else {
      showDialogMessage(`连接失败: ${error.message || error}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

function confirmDeleteAll() {
  showDeleteConfirm.value = true
}

async function deleteAllNovels() {
  try {
    const response = await fetch('http://localhost:3001/api/novels', {
      method: 'DELETE'
    })
    
    if (response.ok) {
      showDialogMessage('所有小说数据已删除')
      showDeleteConfirm.value = false
    } else {
      showDialogMessage('删除失败，请重试')
    }
  } catch (error) {
    showDialogMessage(`删除失败: ${error.message}`)
  }
}

onMounted(() => {
  loadSettings()
  loadPrompts()
})
</script>

<style scoped>
.settingsContainer {
  position: relative;
  width: 1280px;
  height: 720px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #ffffff;
}

.settingsHeader {
  width: 1280px;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #2d2d30;
  border-bottom: 2px solid #3e3e42;
}

.backButton {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4a4a4e;
  border: 1px solid #5a5a5e;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  margin-right: 20px;
}

.backButton:hover {
  background: #5a5a5e;
  border-color: #6a6a6e;
}

.settingsIcon {
  font-size: 22px;
  color: #ffffff;
  font-weight: bold;
}

.settingsTitle {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 2px;
}

.settingsContent {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.settingsSection {
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.settingsSectionTitle {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3e3e42;
}

.settingsItem {
  margin-bottom: 15px;
}

.settingsLabel {
  display: block;
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 8px;
}

.settingsInput {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.settingsInput:focus {
  border-color: #0078d4;
}

.settingsSelect {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.settingsSelect:focus {
  border-color: #0078d4;
}

.settingsTextarea {
  width: 100%;
  padding: 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.settingsTextarea:focus {
  border-color: #0078d4;
}

.settingsHint {
  font-size: 12px;
  color: #888888;
  margin-top: 5px;
  margin-left: 2px;
}

.apiKeyPreview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-left: 3px solid #4ec9b0;
  border-radius: 4px;
}

.apiKeyPreviewLabel {
  font-size: 12px;
  color: #4ec9b0;
  flex-shrink: 0;
}

.apiKeyPreviewValue {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  color: #ffffff;
  background: transparent;
  letter-spacing: 1px;
}

.providerSettings {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #3e3e42;
}

.settingsActions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  height: 40px;
  padding: 0 24px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  border-radius: 4px;
}

.btnPrimary {
  background: #0078d4;
  color: #ffffff;
}

.btnPrimary:hover {
  background: #1a86d9;
}

.btnSecondary {
  background: #3e3e42;
  color: #ffffff;
}

.btnSecondary:hover {
  background: #4a4a4e;
}

.btnTertiary {
  background: #6e6e73;
  color: #ffffff;
}

.btnTertiary:hover {
  background: #7a7a7f;
}

.btnDanger {
  background: #d32f2f;
  color: #ffffff;
}

.btnDanger:hover {
  background: #e53935;
}

.btnAbout {
  background: #4caf50;
  color: #ffffff;
}

.btnAbout:hover {
  background: #5cbf60;
}

.aboutDialog {
  text-align: center;
}

.aboutContent {
  margin-bottom: 20px;
}

.aboutName {
  font-size: 24px;
  font-weight: 600;
  color: #0078d4;
  margin-bottom: 8px;
}

.aboutVersion {
  font-size: 14px;
  color: #888888;
  margin-bottom: 16px;
}

.aboutDescription {
  font-size: 14px;
  color: #cccccc;
  line-height: 1.6;
}

.dangerSection {
  background: #252526;
  border: 1px solid #d32f2f;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
}

.dangerSectionTitle {
  font-size: 18px;
  font-weight: 500;
  color: #d32f2f;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3e3e42;
}

.dangerItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dangerDescription {
  font-size: 14px;
  color: #cccccc;
  margin: 0;
}

.dialogOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 1280px;
  height: 720px;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
}

.dialogTitle {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 16px;
}

.dialogMessage {
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 24px;
  line-height: 1.5;
}

.dialogActions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #4caf50;
  color: #ffffff;
}

.notification.error {
  background: #d32f2f;
  color: #ffffff;
}

@keyframes slideIn {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.apiUrlInputWrapper {
  position: relative;
}

.urlSuggestionDropdown {
  position: absolute;
  top: 38px;
  left: 0;
  width: 100%;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.urlSuggestionContent {
  margin-bottom: 10px;
}

.urlSuggestionLabel {
  font-size: 12px;
  color: #888888;
  margin-bottom: 4px;
}

.urlSuggestionValue {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #4ec9b0;
  word-break: break-all;
}

.urlSuggestionActions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.urlSuggestionBtn {
  height: 28px;
  padding: 0 14px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  border-radius: 3px;
  transition: background 0.2s;
}

.urlSuggestionUse {
  background: #0078d4;
  color: #ffffff;
}

.urlSuggestionUse:hover {
  background: #1a86d9;
}

.urlSuggestionCancel {
  background: #3e3e42;
  color: #cccccc;
}

.urlSuggestionCancel:hover {
  background: #4a4a4e;
}
</style>