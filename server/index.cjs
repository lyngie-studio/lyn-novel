const express = require('express')
const cors = require('cors')
const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require('fs')
const { Readable } = require('node:stream')
const path = require('path')
const net = require('net')
const { execSync } = require('child_process')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const appDataDir = process.env.APPDATA || path.join(process.env.HOME || '', 'AppData', 'Roaming')
const DATA_DIR = path.join(appDataDir, 'LynNovel', 'data')
const CONFIG_DIR = path.join(appDataDir, 'LynNovel')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json')

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

const DEFAULT_CONFIG = {
  provider: 'ollama',
  ollama: { apiUrl: 'http://localhost:11434/api/generate', model: 'gemma3:1b' },
  llama: { apiUrl: 'http://localhost:8080/v1/chat/completions', apiKey: '', modelPath: '' },
  openai: { apiUrl: 'https://api.openai.com/v1/chat/completions', apiKey: '', model: 'gpt-3.5-turbo' },
  anthropic: { apiUrl: 'https://api.anthropic.com/v1/messages', apiKey: '', model: 'claude-3-5-sonnet-20241022', anthropicVersion: '2023-06-01' },
  promptKeywords: ''
}

function loadConfig() {
  try {
    ensureConfigDir()
    if (!existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG }
    }
    const raw = readFileSync(CONFIG_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    // 合并默认值，避免缺字段
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      ollama: { ...DEFAULT_CONFIG.ollama, ...(parsed.ollama || {}) },
      llama: { ...DEFAULT_CONFIG.llama, ...(parsed.llama || {}) },
      openai: { ...DEFAULT_CONFIG.openai, ...(parsed.openai || {}) },
      anthropic: { ...DEFAULT_CONFIG.anthropic, ...(parsed.anthropic || {}) }
    }
  } catch (e) {
    console.error('Error loading config:', e)
    return { ...DEFAULT_CONFIG }
  }
}

function saveConfig(config) {
  try {
    ensureConfigDir()
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8' })
    return true
  } catch (e) {
    console.error('Error saving config:', e)
    return false
  }
}

const DEFAULT_PROMPTS = {
  settings: '基于以下信息，为小说《{novelName}》生成一段吸引人的故事背景和世界观设定。\n小说类型：{style}\n请用中文回答，200字以内。',
  settingsContinue: '你是小说《{novelName}》的作者。\n小说类型：{style}\n\n当前已有世界设定：\n{settings}\n\n请根据以上已有内容继续续写世界观设定，保持风格一致、剧情连贯，不要重复已有内容。用中文回答，只回复续写内容，200字以内。',
  characters: '返回一个JSON对象，不要有多余文字和内容。为小说《{novelName}》（类型：{style}）生成一个新角色。\n\n已有角色：{charactersInfo}\n\n比如：\n{\n  "name":"艾瑟琳","description":"艾瑟琳是一个科学家，在国家研究所上班。她的口头禅是：我是一个伟大的女性。短头发，深棕色的眼睛，高挺的鼻梁。"\n}',
  plots: '为小说《{novelName}》（类型：{style}）设计一个新情节。\n\n已有情节：{plotsInfo}\n\n只返回以下格式的JSON，不要有任何其他内容：\n{\n  "title":"情节标题","content":"情节内容"\n}',
  chapters: {
    regenerate: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n请重新生成章节"{chapterTitle}"的内容。\n\n当前章节内容：\n{currentContent}\n\n请重新创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。请在正文开头以"# 章节标题"的格式输出一个更合适的章节标题，然后换行输出正文内容。',
    firstTime: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n{previousChapterSection}请生成章节"{chapterTitle}"的内容。\n\n请创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。请在正文开头以"# 章节标题"的格式输出一个更合适的章节标题，然后换行输出正文内容。'
  }
}

function loadPrompts() {
  try {
    ensureDataDir()
    if (!existsSync(PROMPTS_FILE)) {
      return JSON.parse(JSON.stringify(DEFAULT_PROMPTS))
    }
    const raw = readFileSync(PROMPTS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...JSON.parse(JSON.stringify(DEFAULT_PROMPTS)), ...parsed }
  } catch (e) {
    console.error('Error loading prompts:', e)
    return JSON.parse(JSON.stringify(DEFAULT_PROMPTS))
  }
}

function savePrompts(prompts) {
  try {
    ensureDataDir()
    writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), { encoding: 'utf-8' })
    return true
  } catch (e) {
    console.error('Error saving prompts:', e)
    return false
  }
}

function maskKey(key) {
  // 显示前 5 位 + "********" + 后 4 位；极短 key 用首末各 1 位 + ********
  if (!key) return ''
  if (key.length <= 9) return key[0] + '********' + key[key.length - 1]
  return key.slice(0, 5) + '********' + key.slice(-4)
}

function stripApiKeys(config) {
  // 返回给前端的配置：去掉 apiKey，附 hasApiKey + keyPreview 供 UI 提示
  const safe = JSON.parse(JSON.stringify(config))
  if (safe.openai) {
    safe.openai.hasApiKey = !!safe.openai.apiKey
    safe.openai.keyPreview = safe.openai.apiKey ? maskKey(safe.openai.apiKey) : ''
    safe.openai.apiKey = ''
  }
  if (safe.llama) {
    safe.llama.hasApiKey = !!safe.llama.apiKey
    safe.llama.keyPreview = safe.llama.apiKey ? maskKey(safe.llama.apiKey) : ''
    safe.llama.apiKey = ''
  }
  if (safe.anthropic) {
    safe.anthropic.hasApiKey = !!safe.anthropic.apiKey
    safe.anthropic.keyPreview = safe.anthropic.apiKey ? maskKey(safe.anthropic.apiKey) : ''
    safe.anthropic.apiKey = ''
  }
  return safe
}

function buildUpstreamRequest(provider, config) {
  // 根据 provider 构造上游请求的 URL、headers、body
  let url, headers, body
  if (provider === 'ollama') {
    url = config.ollama.apiUrl
    headers = { 'Content-Type': 'application/json' }
    body = {
      model: config.ollama.model,
      prompt: config.__messages?.[0]?.content || '',
      stream: !!config.__stream
    }
    console.log('[buildUpstreamRequest/ollama] url=', url, 'model=', config.ollama.model, 'promptLength=', (body.prompt || '').length)
  } else if (provider === 'llama') {
    url = config.llama.apiUrl
    headers = { 'Content-Type': 'application/json' }
    if (config.llama.apiKey) headers['Authorization'] = `Bearer ${config.llama.apiKey}`
    body = {
      model: 'gpt-3.5-turbo',
      messages: config.__messages || [],
      temperature: config.__temperature ?? 0.7,
      max_tokens: config.__maxTokens ?? 4096,
      stream: !!config.__stream
    }
    if (provider === 'llama') body.repeat_penalty = 1.10
  } else if (provider === 'openai') {
    url = config.openai.apiUrl
    headers = { 'Content-Type': 'application/json' }
    if (config.openai.apiKey) headers['Authorization'] = `Bearer ${config.openai.apiKey}`
    body = {
      model: config.openai.model || 'gpt-3.5-turbo',
      messages: config.__messages || [],
      temperature: config.__temperature ?? 0.7,
      max_tokens: config.__maxTokens ?? 4096,
      stream: !!config.__stream
    }
  } else if (provider === 'anthropic') {
    url = config.anthropic.apiUrl
    headers = {
      'Content-Type': 'application/json',
      'anthropic-version': config.anthropic.anthropicVersion || '2023-06-01'
    }
    if (config.anthropic.apiKey) {
      headers['x-api-key'] = config.anthropic.apiKey
      headers['Authorization'] = `Bearer ${config.anthropic.apiKey}`
    }
    // Anthropic 要求 max_tokens 必填且 ≥ 1
    const maxTokens = Math.max(1, Number(config.__maxTokens) || 4096)
    body = {
      model: config.anthropic.model || 'claude-3-5-sonnet-20241022',
      messages: config.__messages || [],
      max_tokens: maxTokens,
      stream: !!config.__stream
    }
    if (typeof config.__temperature === 'number') body.temperature = config.__temperature
  } else {
    throw new Error(`Unknown provider: ${provider}`)
  }
  return { url, headers, body }
}

function novelToMarkdown(novel) {
  let md = `# ${novel.name}\n\n`
  md += `## 风格：${novel.style}\n\n`
  
  if (novel.settings) {
    md += `## 世界设定\n\n${novel.settings}\n\n`
  }
  
  if (novel.characters && novel.characters.length > 0) {
    md += `## 人物设定\n\n`
    novel.characters.forEach(char => {
      md += `### ${char.name}\n\n${char.description || '暂无描述'}\n\n`
    })
  }
  
  if (novel.plots && novel.plots.length > 0) {
    md += `## 故事情节\n\n`
    novel.plots.forEach(plot => {
      if (plot.content) {
        md += `### ${plot.title}\n\n${plot.content}\n\n`
      } else {
        md += `### ${plot.title}\n\n`
      }
    })
  }
  
  if (novel.chapters && novel.chapters.length > 0) {
    md += `## 章节\n\n`
    novel.chapters.forEach(chapter => {
      if (chapter.content) {
        md += `### ${chapter.title}\n\n${chapter.content}\n\n`
      } else {
        md += `### ${chapter.title}\n\n`
      }
    })
  }
  
  return md
}

function markdownToNovel(mdContent, filename) {
  // 移除 UTF-8 BOM
  if (mdContent.charCodeAt(0) === 0xFEFF) {
    mdContent = mdContent.substring(1)
  }
  
  const lines = mdContent.split('\n')
  const novel = {
    id: filename.replace('.md', ''),
    name: '',
    style: '',
    settings: '',
    characters: [],
    plots: [],
    chapters: []
  }
  
  let currentSection = ''
  let currentSubSection = ''
  let currentContent = []
  
  function flushContent() {
    const content = currentContent.join('\n').trim()
    if (content) {
      // 过滤掉"暂无内容"占位文本
      const cleanContent = content === '暂无内容' ? '' : content
      if (cleanContent) {
        if (currentSection === 'settings') {
          novel.settings = cleanContent
        } else if (currentSubSection) {
          if (currentSection === 'characters') {
            novel.characters.push({ name: currentSubSection, description: cleanContent })
          } else if (currentSection === 'plots') {
            novel.plots.push({ title: currentSubSection, content: cleanContent })
          } else if (currentSection === 'chapters') {
            novel.chapters.push({ 
              id: Date.now().toString(),
              title: currentSubSection, 
              content: cleanContent,
              wordCount: cleanContent.length
            })
          }
        }
      }
    }
    currentContent = []
    currentSubSection = ''
  }
  
  for (const line of lines) {
    // 移除行首的 BOM 字符（如果存在）
    const cleanLine = line.replace(/^\uFEFF/, '')
    
    const h1Match = cleanLine.match(/^# (.+)$/)
    const h2Match = cleanLine.match(/^## (.+)$/)
    const h3Match = cleanLine.match(/^### (.+)$/)
    
    if (h1Match) {
      novel.name = h1Match[1]
    } else if (h2Match) {
      flushContent()
      const heading = h2Match[1]
      if (heading.startsWith('风格：')) {
        novel.style = heading.replace('风格：', '')
        currentSection = ''
      } else if (heading === '世界设定') {
        currentSection = 'settings'
      } else if (heading === '人物设定') {
        currentSection = 'characters'
      } else if (heading === '故事情节') {
        currentSection = 'plots'
      } else if (heading === '章节') {
        currentSection = 'chapters'
      }
    } else if (h3Match && currentSection) {
      flushContent()
      currentSubSection = h3Match[1]
    } else if (line.trim()) {
      currentContent.push(line)
    }
  }
  
  flushContent()
  return novel
}

function loadNovels() {
  try {
    ensureDataDir()
    const novels = []
    
    if (existsSync(DATA_DIR)) {
      const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.md'))
      
      for (const file of files) {
        const filePath = path.join(DATA_DIR, file)
        const mdContent = readFileSync(filePath, 'utf-8')
        const novel = markdownToNovel(mdContent, file)
        novels.push(novel)
      }
    }
    
    return { novels }
  } catch (e) {
    console.error('Error loading novels:', e)
    return { novels: [] }
  }
}

function saveNovel(novel) {
  try {
    ensureDataDir()
    const mdContent = novelToMarkdown(novel)
    const filename = `${novel.id}.md`
    const filePath = path.join(DATA_DIR, filename)
    writeFileSync(filePath, mdContent, { encoding: 'utf-8' })
    return true
  } catch (e) {
    console.error('Error saving novel:', e)
    return false
  }
}

function deleteNovelFile(novelId) {
  try {
    const filename = `${novelId}.md`
    const filePath = path.join(DATA_DIR, filename)
    if (existsSync(filePath)) {
      require('fs').unlinkSync(filePath)
    }
    return true
  } catch (e) {
    console.error('Error deleting novel:', e)
    return false
  }
}

app.get('/api/novels', (req, res) => {
  const data = loadNovels()
  res.json(data)
})

app.get('/api/novels/:id', (req, res) => {
  const data = loadNovels()
  const novel = data.novels.find(n => n.id === req.params.id)
  if (novel) {
    res.json(novel)
  } else {
    res.status(404).json({ error: 'Novel not found' })
  }
})

app.post('/api/novels', (req, res) => {
  const novel = req.body
  if (saveNovel(novel)) {
    res.json({ success: true })
  } else {
    res.status(500).json({ error: 'Failed to save' })
  }
})

app.delete('/api/novels/:id', (req, res) => {
  if (deleteNovelFile(req.params.id)) {
    res.json({ success: true })
  } else {
    res.status(500).json({ error: 'Failed to delete' })
  }
})

app.delete('/api/novels', (req, res) => {
  try {
    ensureDataDir()
    const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const filePath = path.join(DATA_DIR, file)
      require('fs').unlinkSync(filePath)
    }
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete all' })
  }
})

// ===== 配置相关 API =====

// 获取配置（脱敏：不返回 apiKey，用 hasApiKey 标记）
app.get('/api/settings', (req, res) => {
  const config = loadConfig()
  res.json(stripApiKeys(config))
})

// 保存配置（含 apiKey，写入后端 config.json）
app.post('/api/settings', (req, res) => {
  const incoming = req.body || {}
  const current = loadConfig()
  // 对每个 provider，若入参未提供 apiKey 或为占位空字符串，保留已保存的旧 key（便于"只改 URL 不重输 key"）
  const merged = {
    ...current,
    ...incoming,
    ollama: { ...current.ollama, ...(incoming.ollama || {}) },
    llama: {
      ...current.llama,
      ...(incoming.llama || {}),
      apiKey: (incoming.llama && incoming.llama.apiKey) ? incoming.llama.apiKey : current.llama.apiKey
    },
    openai: {
      ...current.openai,
      ...(incoming.openai || {}),
      apiKey: (incoming.openai && incoming.openai.apiKey) ? incoming.openai.apiKey : current.openai.apiKey
    },
    anthropic: {
      ...current.anthropic,
      ...(incoming.anthropic || {}),
      apiKey: (incoming.anthropic && incoming.anthropic.apiKey) ? incoming.anthropic.apiKey : current.anthropic.apiKey
    },
    promptKeywords: incoming.promptKeywords !== undefined ? incoming.promptKeywords : current.promptKeywords
  }
  if (saveConfig(merged)) {
    res.json({ success: true, config: stripApiKeys(merged) })
  } else {
    res.status(500).json({ error: 'Failed to save config' })
  }
})

// 恢复默认配置
app.post('/api/settings/reset', (req, res) => {
  if (saveConfig(DEFAULT_CONFIG)) {
    res.json({ success: true, config: stripApiKeys(DEFAULT_CONFIG) })
  } else {
    res.status(500).json({ error: 'Failed to reset config' })
  }
})

// 获取 Prompts 模板
app.get('/api/prompts', (req, res) => {
  const prompts = loadPrompts()
  res.json(prompts)
})

function sanitizePrompts(incoming) {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_PROMPTS))
  const result = {}
  for (const key of ['settings', 'settingsContinue', 'characters', 'plots']) {
    const val = incoming[key]
    result[key] = (typeof val === 'string' && val.trim()) ? val.trim() : defaults[key]
  }
  result.chapters = {}
  for (const subKey of ['regenerate', 'firstTime']) {
    const val = incoming.chapters && incoming.chapters[subKey]
    result.chapters[subKey] = (typeof val === 'string' && val.trim()) ? val.trim() : defaults.chapters[subKey]
  }
  return result
}

// 保存 Prompts 模板
app.post('/api/prompts', (req, res) => {
  const incoming = req.body || {}
  const sanitized = sanitizePrompts(incoming)
  if (savePrompts(sanitized)) {
    res.json({ success: true, prompts: sanitized })
  } else {
    res.status(500).json({ error: 'Failed to save prompts' })
  }
})

// ===== AI 代理相关 API =====

// 测试连接：接收完整配置（含 apiKey），不保存
app.post('/api/ai/test', async (req, res) => {
  try {
    const incoming = req.body || {}
    const provider = incoming.provider || 'ollama'
    // 入参优先，未提供的字段从已保存配置中补
    const current = loadConfig()
    const config = {
      ...current,
      ...incoming,
      ollama: { ...current.ollama, ...(incoming.ollama || {}) },
      llama: {
        ...current.llama,
        ...(incoming.llama || {}),
        apiKey: (incoming.llama && incoming.llama.apiKey) ? incoming.llama.apiKey : current.llama.apiKey
      },
      openai: {
        ...current.openai,
        ...(incoming.openai || {}),
        apiKey: (incoming.openai && incoming.openai.apiKey) ? incoming.openai.apiKey : current.openai.apiKey
      },
      anthropic: {
        ...current.anthropic,
        ...(incoming.anthropic || {}),
        apiKey: (incoming.anthropic && incoming.anthropic.apiKey) ? incoming.anthropic.apiKey : current.anthropic.apiKey
      }
    }
    // 测试连接时发送一条最小测试消息，确保上游 API 不会因为空 messages 而拒绝
    config.__messages = config.__messages || [{ role: 'user', content: 'Hi' }]
    config.__stream = false
    console.log(`[/api/ai/test] incoming.anthropic:`, JSON.stringify(incoming.anthropic || {}))
    console.log(`[/api/ai/test] merged.anthropic.apiUrl:`, config.anthropic?.apiUrl)
    const { url, headers, body } = buildUpstreamRequest(provider, config)
    console.log(`[/api/ai/test] provider=${provider} upstream=${url}`)
    console.log(`[/api/ai/test] hasApiKey=${!!config.anthropic?.apiKey}, apiKeyLen=${(config.anthropic?.apiKey || '').length}`)
    console.log(`[/api/ai/test] headers keys:`, Object.keys(headers))
    console.log(`[/api/ai/test] body keys:`, Object.keys(body))
    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    if (upstreamRes.ok) {
      res.json({ success: true })
    } else {
      const errText = await upstreamRes.text().catch(() => '')
      console.error(`[/api/ai/test] upstream ${upstreamRes.status}: ${errText.slice(0, 300)}`)
      res.status(upstreamRes.status).json({ success: false, error: `${upstreamRes.status} ${upstreamRes.statusText}`, detail: errText })
    }
  } catch (e) {
    console.error('[/api/ai/test] exception:', e)
    res.status(500).json({ success: false, error: e.message || String(e), stack: (e && e.stack) ? String(e.stack).split('\n').slice(0, 3).join('\n') : '' })
  }
})

// AI 聊天代理（流式）：使用已保存配置中的 apiKey
app.post('/api/ai/chat', async (req, res) => {
  try {
    const incoming = req.body || {}
    const provider = incoming.provider || 'ollama'
    const config = loadConfig()
    // 允许入参覆盖 model / apiUrl（便于自定义），但 apiKey 始终从已保存配置读取
    if (incoming.ollama) config.ollama = { ...config.ollama, ...incoming.ollama }
    if (incoming.llama) config.llama = { ...config.llama, ...incoming.llama, apiKey: config.llama.apiKey }
    if (incoming.openai) config.openai = { ...config.openai, ...incoming.openai, apiKey: config.openai.apiKey }
    if (incoming.anthropic) config.anthropic = { ...config.anthropic, ...incoming.anthropic, apiKey: config.anthropic.apiKey }
    config.__messages = incoming.messages || []
    config.__stream = incoming.stream !== false
    config.__temperature = incoming.temperature
    config.__maxTokens = incoming.max_tokens

    const { url, headers, body } = buildUpstreamRequest(provider, config)
    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '')
      res.status(upstreamRes.status).json({ error: `AI upstream failed: ${upstreamRes.status} ${upstreamRes.statusText}`, detail: errText, url })
      return
    }

    // 透传上游响应头（保留 content-type 等）
    res.status(200)
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Ollama 返回 JSON Lines，需转换为 SSE 格式以便前端统一解析
    if (provider === 'ollama') {
      res.setHeader('Content-Type', 'text/event-stream')
      let buffer = ''

      function processChunk(chunk) {
        console.log('[ollama/stream] raw chunk:', chunk.slice(0, 200))
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line)
            console.log('[ollama/stream] parsed done=', parsed.done, 'response=', (parsed.response || '').slice(0, 50))
            if (parsed.response && !parsed.done) {
              const sseData = JSON.stringify({ choices: [{ delta: { content: parsed.response } }] })
              console.log('[ollama/stream] sending SSE:', sseData.slice(0, 100))
              res.write(`data: ${sseData}\n\n`)
            }
          } catch (e) {
            console.log('[ollama/stream] parse error:', e.message, 'line=', line.slice(0, 100))
          }
        }
      }

      const isWebStream = upstreamRes.body && typeof upstreamRes.body.getReader === 'function'
      if (isWebStream) {
        const reader = upstreamRes.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          processChunk(decoder.decode(value, { stream: true }))
        }
      } else {
        for await (const chunk of upstreamRes.body) {
          processChunk(chunk.toString('utf-8'))
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed.response && !parsed.done) {
            const sseData = JSON.stringify({ choices: [{ delta: { content: parsed.response } }] })
            res.write(`data: ${sseData}\n\n`)
          }
        } catch (e) {}
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream'
      res.setHeader('Content-Type', contentType)

      if (upstreamRes.body && typeof upstreamRes.body.pipe === 'function') {
        upstreamRes.body.pipe(res)
      } else if (upstreamRes.body && typeof upstreamRes.body[Symbol.asyncIterator] === 'function') {
        Readable.fromWeb(upstreamRes.body).pipe(res)
      } else {
        const text = await upstreamRes.text().catch(() => '')
        res.end(text)
      }
    }
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message })
    } else {
      res.end()
    }
  }
})

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close()
        resolve(true)
      })
      .listen(port, '127.0.0.1')
  })
}

function killProcessOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', windowsHide: true })
    const lines = output.trim().split('\n')
    const pids = new Set()
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 5 && parts[3] === 'LISTENING' && parts[4] !== '0') {
        pids.add(parts[4])
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { windowsHide: true })
        console.log(`[backend] Killed old backend process PID ${pid}`)
      } catch (e) {
        console.log(`[backend] Failed to kill PID ${pid}`)
      }
    }
    return pids.size > 0
  } catch (e) {
    return false
  }
}

async function startServer() {
  let available = await checkPortAvailable(PORT)
  if (!available) {
    console.log(`[backend] Port ${PORT} is already in use. Cleaning up old backend...`)
    const killed = killProcessOnPort(PORT)
    if (killed) {
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500))
        available = await checkPortAvailable(PORT)
        if (available) break
      }
    }
    if (!available) {
      console.error(`[backend] Port ${PORT} is still in use after cleanup.`)
      process.exit(1)
    }
  }

  const server = app.listen(PORT, '127.0.0.1')
  server.on('listening', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`)
    console.log(`Data directory: ${DATA_DIR}`)
  })
  server.on('error', (err) => {
    console.error(`[backend] Failed to start: ${err.message}`)
    process.exit(1)
  })
}

startServer()
