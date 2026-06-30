<template>
  <div class="editContainer">
    <header class="editHeader">
      <button class="backButton" @click="goBack">
        <span class="settingsIcon">←</span>
      </button>
      <div class="rightButtons">
        <button class="saveButton" @click="handleSave">保存</button>
      </div>
    </header>
    <div class="editBody">
      <aside class="editSidebar">
        <div class="tabBar">
          <button
            :class="['tabItem', { tabItemActive: activeTab === 'settings' }]"
            @click="switchTab('settings')"
          >
            小说设定
          </button>
          <button
            :class="['tabItem', { tabItemActive: activeTab === 'characters' }]"
            @click="switchTab('characters')"
          >
            人物列表
          </button>
          <button
            :class="['tabItem', { tabItemActive: activeTab === 'plots' }]"
            @click="switchTab('plots')"
          >
            故事情节
          </button>
          <button
            :class="['tabItem', { tabItemActive: activeTab === 'chapters' }]"
            @click="switchTab('chapters')"
          >
            章节列表
          </button>
        </div>
        <div class="tabContent">
          <div v-if="activeTab === 'settings'" class="settingContent">
            <div class="settingSection">
              <h3 class="settingSectionTitle">小说名称</h3>
              <input
                v-model="novelData.name"
                class="settingInput"
                type="text"
                placeholder="请输入小说名称"
              />
            </div>
            <div class="settingSection">
              <h3 class="settingSectionTitle">小说类型</h3>
              <select v-model="novelData.style" class="settingSelect">
                <option value="玄幻">玄幻</option>
                <option value="言情">言情</option>
                <option value="科幻">科幻</option>
                <option value="悬疑">悬疑</option>
                <option value="恐怖">恐怖</option>
                <option value="剧情">剧情</option>
                <option value="喜剧">喜剧</option>
                <option value="动作">动作</option>
              </select>
            </div>
            <div class="settingSection" style="flex: 4;">
              <h3 class="settingSectionTitle">世界设定</h3>
              <textarea
                ref="settingsTextareaRef"
                v-model="settingsValue"
                class="settingTextarea"
                placeholder="请输入世界设定..."
                @input="onSettingsInput"
                :disabled="isGenerating"
              ></textarea>
            </div>
          </div>
          <div v-if="activeTab === 'characters'" class="characterListContainer" ref="charactersContainerRef">
            <div
              v-for="(char, index) in novelData.characters"
              :key="index"
              class="characterItem"
              @mouseenter="handleCharacterMouseEnter(index, $event)"
              @mouseleave="handleCharacterMouseLeave"
            >
              <div class="characterHeader" @click="toggleCharacter(index)">
                <input
                  v-if="renamingCharacterIndex === index"
                  v-model="renamingCharacterName"
                  class="characterNameInput"
                  type="text"
                  @click.stop
                  @blur="saveCharacterName(index)"
                  @keyup.enter="saveCharacterName(index)"
                  @keyup.esc="cancelRenameCharacter"
                  autofocus
                />
                <span v-else class="characterName">{{ char.name }}</span>
                <div class="headerRight">
                  <button 
                    v-if="hoveredCharacterIndex === index" 
                    class="moreOptionsButton"
                    @click="showCharacterOptions(index, $event)"
                  >
                    ⋮
                  </button>
                  <span class="expandIcon">{{ expandedCharacters.includes(index) ? '▼' : '▶' }}</span>
                </div>
              </div>
              <div v-if="expandedCharacters.includes(index)" class="characterDesc">
                <textarea
                  v-if="editingCharacterIndex === index"
                  v-model="editingCharacterDescription"
                  class="characterDescEditor"
                  @blur="saveCharacterDescription(index)"
                  @keyup.enter="saveCharacterDescription(index)"
                  @keyup.esc="cancelEditCharacterDescription"
                  autofocus
                ></textarea>
                <span v-else @click="startEditCharacterDescription(index)">{{ char.description }}</span>
              </div>
            </div>
            <!-- 人物操作菜单 -->
            <div 
              v-if="showCharacterMenu" 
              class="characterMenu"
              :style="{ left: characterMenuPosition.x + 'px', top: characterMenuPosition.y + 'px' }"
              @mouseenter="() => {}"
              @mouseleave="handleMenuMouseLeave"
            >
              <div class="menuItem" @click="startRenameCharacter(selectedCharacterIndex)">重命名</div>
              <div class="menuItem" @click="moveCharacterToTop(selectedCharacterIndex)">置顶</div>
              <div class="menuItem" @click="regenerateCharacter(selectedCharacterIndex)">重新生成</div>
              <div class="menuItem" @click="deleteCharacter(selectedCharacterIndex)">删除</div>
            </div>
          </div>
          <div v-if="activeTab === 'plots'" class="plotListContainer" ref="plotsContainerRef">
            <div
              v-for="(plot, index) in novelData.plots"
              :key="index"
              class="plotItem"
              @mouseenter="handlePlotMouseEnter(index, $event)"
              @mouseleave="handlePlotMouseLeave"
            >
              <div class="plotHeader" @click="togglePlot(index)">
                <input
                  v-if="renamingPlotIndex === index"
                  v-model="renamingPlotTitle"
                  class="plotTitleInput"
                  type="text"
                  @click.stop
                  @blur="savePlotTitle(index)"
                  @keyup.enter="savePlotTitle(index)"
                  @keyup.esc="cancelRenamePlot"
                  autofocus
                />
                <span v-else class="plotTitle">{{ plot.title }}</span>
                <div class="headerRight">
                  <button 
                    v-if="hoveredPlotIndex === index" 
                    class="moreOptionsButton"
                    @click="showPlotOptions(index, $event)"
                  >
                    ⋮
                  </button>
                  <span class="expandIcon">{{ expandedPlots.includes(index) ? '▼' : '▶' }}</span>
                </div>
              </div>
              <div v-if="expandedPlots.includes(index)" class="plotContent">
                <textarea
                  v-if="editingPlotIndex === index"
                  v-model="editingPlotContent"
                  class="plotContentEditor"
                  :style="{ height: (plotContentHeights[index] || 100) + 'px' }"
                  @blur="savePlotContent(index)"
                  @keyup.enter="savePlotContent(index)"
                  @keyup.esc="cancelEditPlotContent"
                  autofocus
                ></textarea>
                <span v-else :ref="el => plotContentSpanRefs[index] = el" class="plotContentText" @click="startEditPlotContent(index)">{{ plot.content }}</span>
              </div>
            </div>
            <!-- 情节操作菜单 -->
            <div 
              v-if="showPlotMenu" 
              class="plotMenu"
              :style="{ left: plotMenuPosition.x + 'px', top: plotMenuPosition.y + 'px' }"
              @mouseenter="() => {}"
              @mouseleave="handlePlotMenuMouseLeave"
            >
              <div class="menuItem" @click="startRenamePlot(selectedPlotIndex)">重命名</div>
              <div class="menuItem" @click="movePlotToTop(selectedPlotIndex)">置顶</div>
              <div class="menuItem" @click="regeneratePlot(selectedPlotIndex)">重新生成</div>
              <div class="menuItem" @click="deletePlot(selectedPlotIndex)">删除</div>
            </div>
          </div>
          <div v-if="activeTab === 'chapters'" class="chapterListContainer" ref="chaptersContainerRef">
            <div
              v-for="(chapter, index) in novelData.chapters"
              :key="chapter.id"
              :class="['chapterItem', { chapterItemActive: currentChapterId === chapter.id }]"
              @click="selectChapter(chapter.id)"
              @mouseenter="handleChapterMouseEnter(index, $event)"
              @mouseleave="handleChapterMouseLeave"
            >
              <div class="chapterItemTitle">{{ chapter.title }}</div>
              <div class="chapterItemRight">
                <div class="chapterItemWordCount">{{ chapter.wordCount }} 字</div>
                <button 
                  v-if="hoveredChapterIndex === index" 
                  class="moreOptionsButton"
                  @click="showChapterOptions(index, $event)"
                >
                  ⋮
                </button>
              </div>
            </div>
            <!-- 章节操作菜单 -->
            <div 
              v-if="showChapterMenu" 
              class="chapterMenu"
              :style="{ left: chapterMenuPosition.x + 'px', top: chapterMenuPosition.y + 'px' }"
              @mouseenter="() => {}"
              @mouseleave="handleChapterMenuMouseLeave"
            >
              <div class="menuItem" @click="regenerateChapter(selectedChapterIndex)">重新生成</div>
              <div class="menuItem" @click="optimizeChapter(selectedChapterIndex)">AI优化</div>
              <div class="menuItem" @click="deleteChapter(selectedChapterIndex)">删除</div>
            </div>
          </div>
        </div>
        <div class="aiSection">
          <button v-if="activeTab === 'characters'" class="newChapterButton" @click="addCharacter">+ 添加人物</button>
          <button v-if="activeTab === 'plots'" class="newChapterButton" @click="addPlot">+ 添加情节</button>
          <button v-if="activeTab === 'chapters'" class="newChapterButton" @click="addChapter">+ 添加章节</button>
          <button class="aiGenerateButton" @click="isGenerating ? stopGenerating() : generateWithAI()" :disabled="false">
            {{ isGenerating ? '停止生成' : getAIButtonText() }}
          </button>
        </div>
      </aside>
      <main class="editMain">
        <div class="editorHeader">
          <h2 class="editorTitle">
            <input
              v-if="currentChapter"
              v-model="currentChapter.title"
              class="titleInput"
              type="text"
              @click.stop
            />
            <input
              v-else
              v-model="draftChapterTitle"
              class="titleInput"
              type="text"
              placeholder="输入章节标题"
              @click.stop
              @blur="ensureDraftChapter"
              @keyup.enter="ensureDraftChapter"
            />
          </h2>
          <div class="editorStats">
            <span>章节字数: {{ currentChapter?.wordCount || 0 }}</span>
            <span>段落数: {{ currentParagraphCount }}</span>
            <span v-if="currentParagraphWordCount > 0">当前段落: {{ currentParagraphWordCount }} 字</span>
          </div>
        </div>
        <div class="editorArea">
          <textarea
            ref="editorRef"
            v-model="chapterContentValue"
            class="editorTextarea"
            :placeholder="currentChapterContent ? '开始写作...' : '暂无内容'"
            @input="updateWordCount"
            @click="updateCursorParagraphCount"
            @keyup="updateCursorParagraphCount"
            :disabled="isGenerating"
          ></textarea>
        </div>
      </main>
    </div>

    <div v-if="showCharDialog" class="dialogOverlay" @click.self="closeCharDialog">
      <div class="dialog">
        <h2 class="dialogTitle">添加人物</h2>
        <div class="formGroup">
          <label class="formLabel">人物名称</label>
          <input v-model="charName" class="formInput" type="text" placeholder="请输入人物名称" />
        </div>
        <div class="formGroup">
          <label class="formLabel">人物描述</label>
          <textarea v-model="charDesc" class="formTextarea" placeholder="请输入人物描述"></textarea>
        </div>
        <div class="dialogActions">
          <button class="btn btnSecondary" @click="closeCharDialog">取消</button>
          <button class="btn btnPrimary" @click="confirmAddCharacter">确定</button>
        </div>
      </div>
    </div>

    <div v-if="isSaving" class="savingToast">
      <span class="savingSpinner"></span>
      <span>正在保存...</span>
    </div>

    <div v-if="showPlotDialog" class="dialogOverlay" @click.self="closePlotDialog">
      <div class="dialog">
        <h2 class="dialogTitle">添加情节</h2>
        <div class="formGroup">
          <label class="formLabel">情节标题</label>
          <input v-model="plotTitle" class="formInput" type="text" placeholder="请输入情节标题" />
        </div>
        <div class="formGroup">
          <label class="formLabel">情节内容</label>
          <input v-model="plotContent" class="formInput" type="text" placeholder="请输入情节内容" />
        </div>
        <div class="dialogActions">
          <button class="btn btnSecondary" @click="closePlotDialog">取消</button>
          <button class="btn btnPrimary" @click="confirmAddPlot">确定</button>
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

    <div v-if="dialogConfirm.show" class="dialogOverlay" @click.self="onConfirmNo">
      <div class="dialog">
        <h2 class="dialogTitle">{{ dialogConfirm.title }}</h2>
        <p class="dialogMessage">{{ dialogConfirm.message }}</p>
        <div class="dialogActions">
          <button class="btn btnSecondary" @click="onConfirmNo">取消</button>
          <button class="btn btnPrimary" @click="onConfirmYes">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showSettingsContinueDialog" class="continueDialogOverlay" @click.self="cancelSettingsContinue">
      <div class="continueDialog">
        <div class="continueDialogHeader">
          <h2 class="continueDialogTitle">AI 续写内容</h2>
          <div class="continueDialogActions">
            <button class="btn btnSecondary" @click="cancelSettingsContinue">取消</button>
            <button class="btn btnPrimary" @click="confirmSettingsContinue" :disabled="isGenerating">采用</button>
          </div>
        </div>
        <textarea ref="settingsContinueTextareaRef" v-model="aiThinking" class="continueDialogTextarea" readonly></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelStore } from '../store/novelStore'

const route = useRoute()
const router = useRouter()
const { getNovel, saveNovel } = useNovelStore()

const novelData = ref({
  id: '',
  name: '',
  style: '',
  settings: '',
  characters: [],
  plots: [],
  chapters: []
})

const activeTab = ref('settings')
const currentChapterId = ref('')
const currentChapterContent = ref('')
const draftChapterTitle = ref('')
const generatingChapterId = ref('')
const generatingChapterContent = ref('')
const editorRef = ref(null)
const settingsTextareaRef = ref(null)
const settingsContinueTextareaRef = ref(null)
const charactersContainerRef = ref(null)
const plotsContainerRef = ref(null)
const chaptersContainerRef = ref(null)
const plotContentSpanRefs = ref([])
const plotContentHeights = ref({})

const dialogMessage = ref({ show: false, title: '提示', message: '' })

function showDialogMessage(message, title = '提示') {
  dialogMessage.value = { show: true, title, message }
}

const dialogConfirm = ref({ show: false, title: '确认', message: '' })
let confirmResolve = null

function showDialogConfirm(message, title = '确认') {
  return new Promise((resolve) => {
    confirmResolve = resolve
    dialogConfirm.value = { show: true, title, message }
  })
}

function onConfirmYes() {
  dialogConfirm.value.show = false
  if (confirmResolve) confirmResolve(true)
}

function onConfirmNo() {
  dialogConfirm.value.show = false
  if (confirmResolve) confirmResolve(false)
}

const showCharDialog = ref(false)
const charName = ref('')
const charDesc = ref('')

const showPlotDialog = ref(false)
const plotTitle = ref('')
const plotContent = ref('')
const expandedCharacters = ref([])
const expandedPlots = ref([])
const currentParagraphWordCount = ref(0)
const isSaving = ref(false)
const isGenerating = ref(false)
const aiThinking = ref('')
const aiGeneratedSettings = ref(false)
const userEditedSettings = ref(false)
const abortController = ref(null)
const showSettingsContinueDialog = ref(false)

// 人物生成相关状态
const characterData = ref({
  name: '',
  description: '',
  nameExtracted: false,
  lastDescription: '',
  targetCharIndex: undefined
})

// 故事情节生成相关状态
const plotData = ref({
  title: '',
  content: '',
  titleExtracted: false,
  lastContent: '',
  targetPlotIndex: undefined
})

// 人物菜单相关状态
const hoveredCharacterIndex = ref(-1)
const showCharacterMenu = ref(false)
const characterMenuPosition = ref({ x: 0, y: 0 })
const editingCharacterIndex = ref(-1)
const editingCharacterDescription = ref('')
const selectedCharacterIndex = ref(-1)
const renamingCharacterIndex = ref(-1)
const renamingCharacterName = ref('')

// 情节菜单相关状态
const hoveredPlotIndex = ref(-1)
const showPlotMenu = ref(false)
const plotMenuPosition = ref({ x: 0, y: 0 })
const selectedPlotIndex = ref(-1)
const renamingPlotIndex = ref(-1)
const renamingPlotTitle = ref('')
const editingPlotIndex = ref(-1)
const editingPlotContent = ref('')

const hoveredChapterIndex = ref(-1)
const showChapterMenu = ref(false)
const chapterMenuPosition = ref({ x: 0, y: 0 })
const selectedChapterIndex = ref(-1)

const currentChapter = computed(() => {
  return novelData.value.chapters.find(c => c.id === currentChapterId.value)
})

const currentParagraphCount = computed(() => {
  if (!currentChapterContent.value) return 0
  const paragraphs = currentChapterContent.value.split('\n').filter(p => p.trim())
  return paragraphs.length
})

const totalWordCount = computed(() => {
  return novelData.value.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
})

const settingsValue = computed({
  get: () => {
    // 续写模式下保持编辑框显示原始内容，弹窗中显示 AI 生成内容
    if (isGenerating.value && activeTab.value === 'settings' && !showSettingsContinueDialog.value) {
      return aiThinking.value
    }
    return novelData.value.settings
  },
  set: (value) => {
    if (!isGenerating.value) {
      novelData.value.settings = value
    }
  }
})

const chapterContentValue = computed({
  get: () => {
    if (isGenerating.value && activeTab.value === 'chapters') {
      if (currentChapterId.value === generatingChapterId.value) {
        return aiThinking.value
      }
      return currentChapterContent.value
    }
    return currentChapterContent.value
  },
  set: (value) => {
    if (!isGenerating.value) {
      currentChapterContent.value = value
      ensureDraftChapter()
    }
  }
})

function goBack() {
  saveNovelData()
  router.push('/')
}

function openSettings() {
  saveNovelData()
  router.push('/settings')
}

function saveNovelData() {
  ensureDraftChapter()
  if (currentChapter.value) {
    currentChapter.value.content = currentChapterContent.value
    currentChapter.value.wordCount = countWords(currentChapterContent.value)
  }
  saveNovel(novelData.value)
}

function ensureDraftChapter() {
  if (currentChapter.value) return currentChapter.value
  const title = draftChapterTitle.value.trim()
  if (!title && !currentChapterContent.value.trim()) return null
  const newId = Date.now().toString()
  const chapter = {
    id: newId,
    title: title || `第${novelData.value.chapters.length + 1}章`,
    content: currentChapterContent.value,
    wordCount: countWords(currentChapterContent.value)
  }
  novelData.value.chapters.push(chapter)
  currentChapterId.value = newId
  draftChapterTitle.value = ''
  return chapter
}

function countWords(text) {
  if (!text) return 0
  return text.replace(/\s/g, '').length
}

function updateWordCount() {
  ensureDraftChapter()
  if (currentChapter.value) {
    currentChapter.value.wordCount = countWords(currentChapterContent.value)
  }
}

function updateCursorParagraphCount() {
  const textarea = editorRef.value
  if (!textarea) return

  const text = textarea.value
  const cursorPos = textarea.selectionStart
  const textBeforeCursor = text.substring(0, cursorPos)
  const paragraphs = text.split('\n')
  let charCount = 0
  let currentParagraphIndex = 0
  let charInCurrentParagraph = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const paraTextBefore = charCount + (i > 0 ? 1 : 0)
    const paraTextAfter = charCount + para.length + (i > 0 ? 1 : 0)

    if (cursorPos >= paraTextBefore && cursorPos <= paraTextAfter) {
      currentParagraphIndex = i
      charInCurrentParagraph = cursorPos - paraTextBefore
      break
    }
    charCount += para.length + 1
  }

  const currentPara = paragraphs[currentParagraphIndex]
  if (currentPara && currentPara.trim()) {
    currentParagraphWordCount.value = countWords(currentPara)
  } else {
    currentParagraphWordCount.value = 0
  }
}

function selectChapter(id) {
  if (currentChapter.value) {
    if (isGenerating.value && currentChapterId.value === generatingChapterId.value) {
      currentChapter.value.content = generatingChapterContent.value
      currentChapter.value.wordCount = countWords(generatingChapterContent.value)
    } else {
      currentChapter.value.content = currentChapterContent.value
      currentChapter.value.wordCount = countWords(currentChapterContent.value)
    }
  }
  currentChapterId.value = id
  const chapter = novelData.value.chapters.find(c => c.id === id)
  if (isGenerating.value && id === generatingChapterId.value) {
    currentChapterContent.value = generatingChapterContent.value
  } else {
    currentChapterContent.value = chapter?.content || ''
  }
}

function addChapter() {
  const newId = (Date.now()).toString()
  const chapterCount = novelData.value.chapters.length + 1
  novelData.value.chapters.push({
    id: newId,
    title: `第${chapterCount}章`,
    content: '',
    wordCount: 0
  })
  selectChapter(newId)
  activeTab.value = 'chapters'
}

function closeCharDialog() {
  showCharDialog.value = false
  charName.value = ''
  charDesc.value = ''
}

function addCharacter() {
  showCharDialog.value = true
}

function confirmAddCharacter() {
  if (!charName.value.trim()) return
  const newIndex = novelData.value.characters.length
  novelData.value.characters.push({
    name: charName.value.trim(),
    description: charDesc.value.trim()
  })
  expandedCharacters.value.push(newIndex)
  closeCharDialog()
}

function closePlotDialog() {
  showPlotDialog.value = false
  plotTitle.value = ''
  plotContent.value = ''
}

function addPlot() {
  showPlotDialog.value = true
}

function confirmAddPlot() {
  if (!plotTitle.value.trim()) return
  const newIndex = novelData.value.plots.length
  novelData.value.plots.push({
    title: plotTitle.value.trim(),
    content: plotContent.value.trim()
  })
  expandedPlots.value.push(newIndex)
  closePlotDialog()
}

function toggleCharacter(index) {
  if (expandedCharacters.value.includes(index)) {
    expandedCharacters.value = expandedCharacters.value.filter(i => i !== index)
  } else {
    expandedCharacters.value.push(index)
  }
}

function togglePlot(index) {
  if (expandedPlots.value.includes(index)) {
    expandedPlots.value = expandedPlots.value.filter(i => i !== index)
  } else {
    expandedPlots.value.push(index)
  }
}

function getAIButtonText() {
  if (activeTab.value === 'settings') {
    if (!novelData.value.settings || novelData.value.settings.trim() === '') {
      return '✨ AI生成'
    }
    return '✨ AI续写'
  }
  if (activeTab.value === 'chapters') {
    const currentContent = currentChapterContent.value || ''
    if (currentContent.trim().length > 0) {
      return '✨ 重新生成'
    }
  }
  return '✨ AI生成'
}

function onSettingsInput() {
  if (activeTab.value === 'settings') {
    if (aiGeneratedSettings.value) {
      userEditedSettings.value = true
    }
  }
}

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'settings') {
    userEditedSettings.value = false
  }
})

onMounted(async () => {
  const novelId = route.params.id
  try {
    const res = await fetch(`http://localhost:3001/api/novels/${novelId}`)
    if (res.ok) {
      const novel = await res.json()
      novelData.value = novel
      if (novelData.value.chapters.length > 0) {
        selectChapter(novelData.value.chapters[0].id)
      }
    } else {
      router.push('/')
      return
    }
  } catch (e) {
    const novel = getNovel(novelId)
    if (!novel) {
      router.push('/')
      return
    }
    novelData.value = JSON.parse(JSON.stringify(novel))
    if (novelData.value.chapters.length > 0) {
      selectChapter(novelData.value.chapters[0].id)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e) {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveToServer()
  }
}

function handleSave() {
  saveToServer()
}

function saveToServer() {
  saveNovelData()
  isSaving.value = true
  const apiUrl = 'http://localhost:3001/api/novels'
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(novelData.value)
  })
    .then(res => {
      isSaving.value = false
      setTimeout(() => {
        if (res.ok) {
          showDialogMessage('保存成功')
        } else {
          showDialogMessage('保存失败，请重试')
        }
      }, 1000)
    })
    .catch(err => {
      isSaving.value = false
      setTimeout(() => {
        showDialogMessage('保存失败，请检查服务器是否运行')
      }, 1000)
    })
}

// 人物菜单相关方法
function handleCharacterMouseEnter(index, event) {
  hoveredCharacterIndex.value = index
}

function handleCharacterMouseLeave(event) {
  // 检查鼠标是否移动到了菜单上
  const menuElement = document.querySelector('.characterMenu')
  if (menuElement && menuElement.contains(event.relatedTarget)) {
    return // 鼠标移到了菜单上，不关闭菜单
  }
  hoveredCharacterIndex.value = -1
  showCharacterMenu.value = false
}

function showCharacterOptions(index, event) {
  event.stopPropagation()
  selectedCharacterIndex.value = index
  // 使用moreOptionsButton作为定位基准
  const buttonRect = event.target.getBoundingClientRect()
  const containerRect = document.querySelector('.characterListContainer').getBoundingClientRect()
  characterMenuPosition.value = {
    x: buttonRect.left - containerRect.left - 120, // 菜单宽度120px，向左偏移120px
    y: buttonRect.top - containerRect.top + 24 // 向下偏移一个按钮高度，避免覆盖按钮
  }
  showCharacterMenu.value = true
  
  // 点击外部关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeCharacterMenu)
  }, 0)
}

function closeCharacterMenu() {
  showCharacterMenu.value = false
  document.removeEventListener('click', closeCharacterMenu)
}

function moveCharacterToTop(index) {
  if (index > 0) {
    const char = novelData.value.characters.splice(index, 1)[0]
    novelData.value.characters.unshift(char)
    // 更新展开状态
    expandedCharacters.value = expandedCharacters.value.map(i => i === index ? 0 : i > index ? i - 1 : i)
  }
  showCharacterMenu.value = false
}

function regenerateCharacter(index) {
  // 重新生成人物逻辑
  const char = novelData.value.characters[index]
  // 这里可以调用AI生成方法，暂时只做简单处理
  showDialogMessage('重新生成功能需要调用AI，暂未实现')
  showCharacterMenu.value = false
}

async function deleteCharacter(index) {
  if (await showDialogConfirm('确定要删除这个人物吗？')) {
    novelData.value.characters.splice(index, 1)
    expandedCharacters.value = expandedCharacters.value.filter(i => i !== index).map(i => i > index ? i - 1 : i)
  }
  showCharacterMenu.value = false
}

// 人物描述编辑方法
function startEditCharacterDescription(index) {
  editingCharacterIndex.value = index
  editingCharacterDescription.value = novelData.value.characters[index].description
}

function saveCharacterDescription(index) {
  novelData.value.characters[index].description = editingCharacterDescription.value
  editingCharacterIndex.value = -1
  editingCharacterDescription.value = ''
}

function cancelEditCharacterDescription() {
  editingCharacterIndex.value = -1
  editingCharacterDescription.value = ''
}

function startRenameCharacter(index) {
  renamingCharacterIndex.value = index
  renamingCharacterName.value = novelData.value.characters[index].name
  showCharacterMenu.value = false
}

function saveCharacterName(index) {
  const newName = renamingCharacterName.value.trim()
  if (newName) {
    novelData.value.characters[index].name = newName
  }
  renamingCharacterIndex.value = -1
  renamingCharacterName.value = ''
}

function cancelRenameCharacter() {
  renamingCharacterIndex.value = -1
  renamingCharacterName.value = ''
}

function handleMenuMouseLeave(event) {
  // 检查鼠标是否移动回了人物项
  const characterItems = document.querySelectorAll('.characterItem')
  const movedToCharacterItem = Array.from(characterItems).some(item => item.contains(event.relatedTarget))
  if (!movedToCharacterItem) {
    showCharacterMenu.value = false
  }
}

// 情节菜单相关方法
function handlePlotMouseEnter(index, event) {
  hoveredPlotIndex.value = index
}

function handlePlotMouseLeave(event) {
  const menuElement = document.querySelector('.plotMenu')
  if (menuElement && menuElement.contains(event.relatedTarget)) {
    return
  }
  hoveredPlotIndex.value = -1
  showPlotMenu.value = false
}

function showPlotOptions(index, event) {
  event.stopPropagation()
  selectedPlotIndex.value = index
  const buttonRect = event.target.getBoundingClientRect()
  const containerRect = document.querySelector('.plotListContainer').getBoundingClientRect()
  plotMenuPosition.value = {
    x: buttonRect.left - containerRect.left - 120,
    y: buttonRect.top - containerRect.top + 24
  }
  showPlotMenu.value = true
  
  setTimeout(() => {
    document.addEventListener('click', closePlotMenu)
  }, 0)
}

function closePlotMenu() {
  showPlotMenu.value = false
  document.removeEventListener('click', closePlotMenu)
}

function handlePlotMenuMouseLeave(event) {
  const plotItems = document.querySelectorAll('.plotItem')
  const movedToPlotItem = Array.from(plotItems).some(item => item.contains(event.relatedTarget))
  if (!movedToPlotItem) {
    showPlotMenu.value = false
  }
}

function movePlotToTop(index) {
  if (index > 0) {
    const plot = novelData.value.plots.splice(index, 1)[0]
    novelData.value.plots.unshift(plot)
    expandedPlots.value = expandedPlots.value.map(i => i === index ? 0 : i > index ? i - 1 : i)
  }
  showPlotMenu.value = false
}

function regeneratePlot(index) {
  showDialogMessage('重新生成功能需要调用AI，暂未实现')
  showPlotMenu.value = false
}

async function deletePlot(index) {
  if (await showDialogConfirm('确定要删除这个情节吗？')) {
    novelData.value.plots.splice(index, 1)
    expandedPlots.value = expandedPlots.value.filter(i => i !== index).map(i => i > index ? i - 1 : i)
  }
  showPlotMenu.value = false
}

function startEditPlotContent(index) {
  editingPlotIndex.value = index
  editingPlotContent.value = novelData.value.plots[index].content
  nextTick(() => {
    const spanEl = plotContentSpanRefs.value[index]
    if (spanEl) {
      const content = novelData.value.plots[index].content
      const lines = content.split('\n').length
      const lineHeight = 16.8
      const padding = 16
      const calculatedHeight = Math.max(lines * lineHeight + padding, spanEl.scrollHeight)
      plotContentHeights.value[index] = calculatedHeight
    }
  })
}

function savePlotContent(index) {
  novelData.value.plots[index].content = editingPlotContent.value
  editingPlotIndex.value = -1
  editingPlotContent.value = ''
}

function cancelEditPlotContent() {
  editingPlotIndex.value = -1
  editingPlotContent.value = ''
}

function startRenamePlot(index) {
  renamingPlotIndex.value = index
  renamingPlotTitle.value = novelData.value.plots[index].title
  showPlotMenu.value = false
}

function savePlotTitle(index) {
  const newTitle = renamingPlotTitle.value.trim()
  if (newTitle) {
    novelData.value.plots[index].title = newTitle
  }
  renamingPlotIndex.value = -1
  renamingPlotTitle.value = ''
}

function cancelRenamePlot() {
  renamingPlotIndex.value = -1
  renamingPlotTitle.value = ''
}

function handleChapterMouseEnter(index, event) {
  hoveredChapterIndex.value = index
}

function handleChapterMouseLeave(event) {
  const menuElement = document.querySelector('.chapterMenu')
  if (menuElement && menuElement.contains(event.relatedTarget)) {
    return
  }
  hoveredChapterIndex.value = -1
  showChapterMenu.value = false
}

function showChapterOptions(index, event) {
  event.stopPropagation()
  selectedChapterIndex.value = index
  const rect = event.target.getBoundingClientRect()
  chapterMenuPosition.value = {
    x: rect.right + 5,
    y: rect.top
  }
  showChapterMenu.value = true
}

function handleChapterMenuMouseLeave(event) {
  const chapterItems = document.querySelectorAll('.chapterItem')
  const movedToChapterItem = Array.from(chapterItems).some(item => item.contains(event.relatedTarget))
  if (!movedToChapterItem) {
    showChapterMenu.value = false
  }
}

function regenerateChapter(index) {
  showDialogMessage('重新生成功能需要调用AI，暂未实现')
  showChapterMenu.value = false
}

function optimizeChapter(index) {
  showDialogMessage('AI优化功能需要调用AI，暂未实现')
  showChapterMenu.value = false
}

async function deleteChapter(index) {
  if (await showDialogConfirm('确定要删除这个章节吗？')) {
    const chapterId = novelData.value.chapters[index].id
    novelData.value.chapters.splice(index, 1)
    if (currentChapterId.value === chapterId) {
      if (novelData.value.chapters.length > 0) {
        selectChapter(novelData.value.chapters[0].id)
      } else {
        currentChapterId.value = ''
        currentChapterContent.value = ''
      }
    }
  }
  showChapterMenu.value = false
}

async function generateWithAI() {
  if (isGenerating.value) return

  // 章节模式下：如果当前章节已有内容，弹出确认框
  if (activeTab.value === 'chapters') {
    const currentContent = currentChapterContent.value || ''
    if (currentContent.trim().length > 0) {
      if (!await showDialogConfirm(`确定要重新生成"${currentChapter.value?.title || ''}"吗？\n\n新生成的内容将覆盖当前章节的已有内容。`)) {
        return
      }
    }
  }

  isGenerating.value = true
  aiThinking.value = ''
  generatingChapterId.value = currentChapterId.value
  
  // 创建AbortController用于取消请求
  abortController.value = new AbortController()
  
  // 重置人物生成相关状态
  if (activeTab.value === 'characters') {
    characterData.value = {
      name: '',
      description: '',
      nameExtracted: false,
      lastDescription: '',
      targetCharIndex: undefined
    }
  } else if (activeTab.value === 'plots') {
    // 重置故事情节生成相关状态
    plotData.value = {
      title: '',
      content: '',
      titleExtracted: false,
      lastContent: '',
      targetPlotIndex: undefined
    }
  }

  try {
    // 加载设置（仅用于获取 provider 与 promptKeywords；apiKey/真实 URL 由后端代理处理）
    let modelSettings = {
      provider: 'ollama',
      ollama: { apiUrl: 'http://localhost:11434/api/generate', model: 'gemma3:1b' },
      llama: { apiUrl: 'http://localhost:8080/v1/chat/completions', apiKey: '', modelPath: '' },
      openai: { apiUrl: 'https://api.openai.com/v1/chat/completions', apiKey: '', model: 'gpt-3.5-turbo' },
      anthropic: { apiUrl: 'https://api.anthropic.com/v1/messages', apiKey: '', model: 'claude-3-5-sonnet-20241022', anthropicVersion: '2023-06-01' },
      promptKeywords: ''
    }

    try {
      const resp = await fetch('http://localhost:3001/api/settings')
      if (resp.ok) {
        const data = await resp.json()
        if (data && typeof data === 'object') {
          modelSettings = { ...modelSettings, ...data }
        }
      }
    } catch (e) {
      // 后端未启动时使用本地默认值
    }

    let prompt = ''

    function replaceVars(template, vars) {
      return template.replace(/\{(\w+)\}/g, (match, key) => {
        return vars[key] !== undefined ? vars[key] : match
      })
    }

    // 加载 prompts 模板
    let prompts = {}
    try {
      const promptsResp = await fetch('http://localhost:3001/api/prompts')
      if (promptsResp.ok) {
        prompts = await promptsResp.json()
      }
    } catch (e) {
      // 后端未启动时使用空对象，后续会 fallback 到默认模板
    }

    const fallbackPrompts = {
      settings: '基于以下信息，为小说《{novelName}》生成一段吸引人的故事背景和世界观设定。\n小说类型：{style}\n请用中文回答，200字以内。',
      settingsContinue: '你是小说《{novelName}》的作者。\n小说类型：{style}\n\n当前已有世界设定：\n{settings}\n\n请根据以上已有内容继续续写世界观设定，保持风格一致、剧情连贯，不要重复已有内容。用中文回答，只回复续写内容，200字以内。',
      characters: '返回一个JSON对象，不要有多余文字和内容。为小说《{novelName}》（类型：{style}）生成一个新角色。\n\n已有角色：{charactersInfo}\n\n比如：\n{\n  "name":"艾瑟琳","description":"艾瑟琳是一个科学家，在国家研究所上班。她的口头禅是：我是一个伟大的女性。短头发，深棕色的眼睛，高挺的鼻梁。"\n}',
      plots: '为小说《{novelName}》（类型：{style}）设计一个新情节。\n\n已有情节：{plotsInfo}\n\n只返回以下格式的JSON，不要有任何其他内容：\n{\n  "title":"情节标题","content":"情节内容"\n}',
      chapters: {
        regenerate: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n请重新生成章节"{chapterTitle}"的内容。\n\n当前章节内容：\n{currentContent}\n\n请重新创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。',
        firstTime: '你是小说《{novelName}》的作者。\n小说类型：{style}\n小说设定：{settings}\n已有情节：{plotsList}\n已有角色：{charactersList}\n\n{previousChapterSection}请生成章节"{chapterTitle}"的内容。\n\n请创作该章节，保持文风和剧情连贯性。用中文回复，只回复章节内容，总章节字数2000字以上。'
      }
    }

    if (activeTab.value === 'settings') {
      const hasSettings = novelData.value.settings && novelData.value.settings.trim().length > 0
      if (hasSettings) {
        showSettingsContinueDialog.value = true
        const template = prompts.settingsContinue || fallbackPrompts.settingsContinue
        prompt = replaceVars(template, {
          novelName: novelData.value.name,
          style: novelData.value.style,
          settings: novelData.value.settings
        })
      } else {
        const template = prompts.settings || fallbackPrompts.settings
        prompt = replaceVars(template, {
          novelName: novelData.value.name,
          style: novelData.value.style
        })
      }
    } else if (activeTab.value === 'characters') {
      const charactersInfo = novelData.value.characters.map(c => `人物：${c.name}，描述：${c.description}`).join('\n')
      const template = prompts.characters || fallbackPrompts.characters
      prompt = replaceVars(template, {
        novelName: novelData.value.name,
        style: novelData.value.style,
        charactersInfo: charactersInfo || '暂无'
      })
    } else if (activeTab.value === 'plots') {
      const plotsInfo = novelData.value.plots.map(p => `情节：${p.title}，${p.content}`).join('\n')
      const template = prompts.plots || fallbackPrompts.plots
      prompt = replaceVars(template, {
        novelName: novelData.value.name,
        style: novelData.value.style,
        plotsInfo: plotsInfo || '暂无'
      })
    } else if (activeTab.value === 'chapters') {
      const currentContent = currentChapterContent.value || ''
      const currentIndex = novelData.value.chapters.findIndex(c => c.id === currentChapterId.value)

      let previousChapterSection = ''
      if (currentIndex > 0) {
        const prevChapter = novelData.value.chapters[currentIndex - 1]
        const prevContent = prevChapter.content || ''
        if (prevContent) {
          previousChapterSection = `前一章节"${prevChapter.title}"的完整内容：\n${prevContent}\n\n`
        }
      }

      const baseVars = {
        novelName: novelData.value.name,
        style: novelData.value.style,
        settings: novelData.value.settings,
        plotsList: novelData.value.plots.map(p => p.title).join('、'),
        charactersList: novelData.value.characters.map(c => c.name).join('、'),
        chapterTitle: currentChapter.value?.title || ''
      }

      const chapterPrompts = prompts.chapters || fallbackPrompts.chapters
      if (currentContent.trim().length > 0) {
        const template = chapterPrompts.regenerate || fallbackPrompts.chapters.regenerate
        prompt = replaceVars(template, { ...baseVars, currentContent })
      } else {
        const template = chapterPrompts.firstTime || fallbackPrompts.chapters.firstTime
        prompt = replaceVars(template, { ...baseVars, previousChapterSection })
      }
    }

    // 添加自定义prompt关键字
    if (modelSettings.promptKeywords) {
      prompt += '\n\n' + modelSettings.promptKeywords
    }

    // 构造代理请求体：前端不再持有 apiKey，URL/Authorization 由后端注入
    const proxyBody = {
      provider: modelSettings.provider,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096
    }

    // 输出调试信息（不再打印 apiKey / Authorization）
    console.log('========== AI 请求调试信息 ==========')
    console.log('当前标签页:', activeTab.value)
    console.log('提供商:', modelSettings.provider)
    console.log('代理后端:', 'http://localhost:3001/api/ai/chat')
    let displayModel = 'gpt-3.5-turbo'
    if (modelSettings.provider === 'ollama') {
      displayModel = modelSettings.ollama.model
    } else if (modelSettings.provider === 'openai') {
      displayModel = modelSettings.openai.model || 'gpt-3.5-turbo'
    }
    console.log('模型:', displayModel)
    console.log('完整提示词:')
    console.log('----------------------------------------')
    console.log(prompt)
    console.log('----------------------------------------')
    console.log('代理请求体:', JSON.stringify(proxyBody, null, 2))
    console.log('========================================')

    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyBody),
      signal: abortController.value.signal
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new Error(`AI生成失败: ${response.status} ${response.statusText}\n${errBody.error || ''}\n${errBody.detail || ''}`)
    }

    // 处理流式输出
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let generatedText = ''
    let isCharactersJson = false
    let characterData = {}
    let done = false

    // 初始化流式输出
    if (activeTab.value === 'settings') {
      aiThinking.value = ''
    } else if (activeTab.value === 'characters') {
      aiThinking.value = '正在生成人物...'
    } else if (activeTab.value === 'plots') {
      aiThinking.value = '正在生成情节...'
    } else if (activeTab.value === 'chapters') {
      aiThinking.value = '正在生成章节内容...'
    }

    while (!done) {
      const { value, done: isDone } = await reader.read()
      done = isDone

      // 解码新字节，并拼接到缓冲区
      const chunk = buffer + decoder.decode(value, { stream: true })
      buffer = '' // 清空，准备接收下一轮
      console.log('[frontend/stream] raw chunk:', chunk.slice(0, 200))

      // 按行分割（SSE 以 \n 分隔）
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.trim() === '') continue

        if (line === 'data: [DONE]') {
          done = true
          break
        }

        if (line.startsWith('data: ')) {
          const payload = line.slice(6) // 去掉 "data: "

          try {
            const data = JSON.parse(payload)
            console.log('[frontend/stream] parsed provider=', modelSettings.provider, 'keys=', Object.keys(data))
            if (modelSettings.provider === 'ollama') {
              // 后端已将 ollama JSON Lines 转为 OpenAI SSE 格式
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta
                if (delta && delta.content) {
                  generatedText += delta.content
                  updateStreamOutput(generatedText)
                  console.log('[frontend/stream] ollama appended:', delta.content.slice(0, 30))
                }
              }
            } else if (modelSettings.provider === 'llama' || modelSettings.provider === 'openai') {
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta
                if (delta && delta.content) {
                  generatedText += delta.content
                  updateStreamOutput(generatedText)
                }
              }
            } else if (modelSettings.provider === 'anthropic') {
              // Anthropic SSE: 文本来自 content_block_delta.delta.text
              // 结束信号为 message_stop
              if (data.type === 'content_block_delta' && data.delta && typeof data.delta.text === 'string') {
                generatedText += data.delta.text
                updateStreamOutput(generatedText)
              } else if (data.type === 'message_stop') {
                done = true
                break
              }
            }
          } catch (err) {
            // 解析失败？说明 JSON 不完整，放回 buffer
            buffer += `data: ${payload}`
          }
        } else if (line.startsWith('event: ')) {
          // Anthropic: 事件行不解析，仅做占位
          continue
        } else {
          // 尝试直接解析 JSON（非标准流式格式）
          try {
            const data = JSON.parse(line)
            if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].message?.content || data.choices[0].text || ''
              if (content) {
                generatedText += content
                updateStreamOutput(generatedText)
              }
            }
          } catch (e) {
            // 解析失败，忽略
          }
        }
      }
    }

    // 更新流输出的函数
    function updateStreamOutput(text) {
      
      if (activeTab.value === 'settings') {
        // 小说简介：直接流式输出文字
        aiThinking.value = text
        // 仅在非续写模式下直接更新到novelData.settings；续写模式下需用户确认后再写入
        if (!showSettingsContinueDialog.value) {
          novelData.value.settings = text
        }
      } else if (activeTab.value === 'characters') {
        // 人物生成：先解析出人物姓名，再流式输出人物简介
        try {
          // 尝试提取name字段（只在未提取时执行）
          if (!characterData.nameExtracted) {
            const nameMatch = text.match(/"name"\s*:\s*"([^"]*)"/)
            if (nameMatch) {
              const name = nameMatch[1]
              characterData.nameExtracted = true
              characterData.name = name
              // 实时更新到人物列表，确保characterHeader同步更新
              // 检查是否已有同名人物
              let targetCharIndex = novelData.value.characters.findIndex(c => c.name === name)
              if (targetCharIndex === -1) {
                // 添加新人物
                targetCharIndex = novelData.value.characters.length
                novelData.value.characters.push({
                  name: name,
                  description: ''
                })
                expandedCharacters.value.push(targetCharIndex)
              } else {
                // 更新已有人物的名字
                novelData.value.characters[targetCharIndex].name = name
              }
              characterData.targetCharIndex = targetCharIndex
            }
          }
          
          // 尝试提取description内容（流式更新）
          if (characterData.name) {
            // 匹配 description 字段的值部分
            const descStartMatch = text.match(/"description"\s*:\s*"/)
            if (descStartMatch) {
              const descStartIndex = descStartMatch.index + descStartMatch[0].length
              let descText = text.substring(descStartIndex)
              
              // 找到description的结束位置
              let endIndex = -1
              let i = 0
              let inEscape = false
              
              while (i < descText.length) {
                const char = descText[i]
                if (inEscape) {
                  inEscape = false
                } else if (char === '\\') {
                  inEscape = true
                } else if (char === '"') {
                  endIndex = i
                  break
                }
                i++
              }
              
              if (endIndex !== -1) {
                // description完整了，取完整内容
                descText = descText.substring(0, endIndex)
              }
              
              // 清理转义字符
              descText = descText.replace(/\\n/g, '\n').replace(/\\"/g, '"')
              
              if (descText && descText !== characterData.lastDescription) {
                characterData.lastDescription = descText
                characterData.description = descText
                // 当遇到description字段时，流式记录description的内容
                console.log('生成的人物描述：', descText)
                // 流式更新人物描述到描述框中
                if (characterData.targetCharIndex !== undefined) {
                  novelData.value.characters[characterData.targetCharIndex].description = descText
                }
                aiThinking.value = `人物：${characterData.name}\n简介：${descText}`
              }
            } else {
              aiThinking.value = `人物：${characterData.name}\n简介：正在生成...`
            }
          } else {
            // 即使没有name字段，也要确保显示正在生成的状态
            aiThinking.value = '正在生成人物姓名...'
          }
        } catch (e) {
          // JSON 还未完全生成，显示正在生成
          if (!characterData.name) {
            aiThinking.value = '正在生成人物姓名...'
          } else {
            aiThinking.value = `人物：${characterData.name}\n简介：正在生成...`
          }
        }
      } else if (activeTab.value === 'plots') {
        // 情节生成：先解析出标题，再流式输出内容
        try {
          // 尝试提取title字段（只在未提取时执行）
          if (!plotData.value.titleExtracted) {
            const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/)
            if (titleMatch) {
              const title = titleMatch[1]
              plotData.value.titleExtracted = true
              plotData.value.title = title
              // 实时更新到情节列表
              // 检查是否已有同名情节
              let targetPlotIndex = novelData.value.plots.findIndex(p => p.title === title)
              if (targetPlotIndex === -1) {
                // 添加新情节
                targetPlotIndex = novelData.value.plots.length
                novelData.value.plots.push({
                  title: title,
                  content: ''
                })
                expandedPlots.value.push(targetPlotIndex)
              } else {
                // 更新已有情节的标题
                novelData.value.plots[targetPlotIndex].title = title
              }
              plotData.value.targetPlotIndex = targetPlotIndex
            }
          }
          
          // 尝试提取content内容（流式更新）
          if (plotData.value.title) {
            // 匹配 content 字段的值部分
            const contentStartMatch = text.match(/"content"\s*:\s*"/)
            if (contentStartMatch) {
              const contentStartIndex = contentStartMatch.index + contentStartMatch[0].length
              let contentText = text.substring(contentStartIndex)
              
              // 找到content的结束位置
              let endIndex = -1
              let i = 0
              let inEscape = false
              
              while (i < contentText.length) {
                const char = contentText[i]
                if (inEscape) {
                  inEscape = false
                } else if (char === '\\') {
                  inEscape = true
                } else if (char === '"') {
                  endIndex = i
                  break
                }
                i++
              }
              
              if (endIndex !== -1) {
                // content完整了，取完整内容
                contentText = contentText.substring(0, endIndex)
              }
              
              // 清理转义字符
              contentText = contentText.replace(/\\n/g, '\n').replace(/\\"/g, '"')
              
              if (contentText && contentText !== plotData.value.lastContent) {
                plotData.value.lastContent = contentText
                plotData.value.content = contentText
                // 当遇到content字段时，流式记录content的内容
                console.log('生成的情节内容：', contentText)
                // 流式更新情节内容
                if (plotData.value.targetPlotIndex !== undefined) {
                  novelData.value.plots[plotData.value.targetPlotIndex].content = contentText
                }
                aiThinking.value = `标题：${plotData.value.title}\n内容：${contentText}`
              }
            } else {
              aiThinking.value = `标题：${plotData.value.title}\n内容：正在生成...`
            }
          } else {
            // 即使没有title字段，也要确保显示正在生成的状态
            aiThinking.value = '正在生成情节标题...'
          }
        } catch (e) {
          // JSON 还未完全生成，显示正在生成
          if (!plotData.value.title) {
            aiThinking.value = '正在生成情节标题...'
          } else {
            aiThinking.value = `标题：${plotData.value.title}\n内容：正在生成...`
          }
        }
      } else if (activeTab.value === 'chapters') {
        // 章节内容：直接流式输出文字
        aiThinking.value = text
        // 更新正在生成的章节内容
        generatingChapterContent.value = text
        // 直接更新novelData中对应章节的内容
        const genChapter = novelData.value.chapters.find(c => c.id === generatingChapterId.value)
        if (genChapter) {
          genChapter.content = text
          genChapter.wordCount = countWords(text)
        }
        // 如果当前选中的是正在生成的章节，也更新显示
        if (currentChapterId.value === generatingChapterId.value) {
          currentChapterContent.value = text
        }
        updateWordCount()
      }

      // 自动滚动到底部
      nextTick(() => {
        if (activeTab.value === 'settings' && showSettingsContinueDialog.value && settingsContinueTextareaRef.value) {
          settingsContinueTextareaRef.value.scrollTop = settingsContinueTextareaRef.value.scrollHeight
        } else if (activeTab.value === 'settings' && settingsTextareaRef.value) {
          settingsTextareaRef.value.scrollTop = settingsTextareaRef.value.scrollHeight
        } else if (activeTab.value === 'characters' && charactersContainerRef.value) {
          // 直接滚动到人物列表容器底部
          charactersContainerRef.value.scrollTop = charactersContainerRef.value.scrollHeight
        } else if (activeTab.value === 'plots' && plotsContainerRef.value) {
          // 直接滚动到情节列表容器底部
          plotsContainerRef.value.scrollTop = plotsContainerRef.value.scrollHeight
        } else if (activeTab.value === 'chapters' && editorRef.value) {
          editorRef.value.scrollTop = editorRef.value.scrollHeight
        }
      })
    }

    if (activeTab.value === 'settings') {
      if (showSettingsContinueDialog.value) {
        // 续写模式：保留弹窗内容，等待用户确认后再写入
      } else {
        novelData.value.settings = generatedText
        aiGeneratedSettings.value = true
        userEditedSettings.value = false
      }
    } else if (activeTab.value === 'characters') {
      try {
        let cleanText = generatedText.replace(/[\x00-\x1F\x7F]/g, '')
        // 去除可能的 markdown 代码块标记
        cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        // 清理可能的额外引号和转义字符
        cleanText = cleanText.trim()
        
        // 清理外层引号
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.substring(1, cleanText.length - 1)
        }
        
        // 清理转义引号
        cleanText = cleanText.replace(/\\"/g, '"')
        
        // 清理可能的"json"前缀
        if (cleanText.startsWith('"json"')) {
          cleanText = cleanText.substring('"json"'.length).trim()
        } else if (cleanText.startsWith('json')) {
          cleanText = cleanText.substring('json'.length).trim()
        }
        
        // 清理可能的开头引号
        cleanText = cleanText.trim()
        if (cleanText.startsWith('"')) {
          cleanText = cleanText.substring(1)
        }
        
        // 清理可能的结尾引号
        cleanText = cleanText.trim()
        if (cleanText.endsWith('"')) {
          cleanText = cleanText.substring(0, cleanText.length - 1)
        }
        
        // 尝试直接解析整个文本
        try {
          const charData = JSON.parse(cleanText)
          if (charData.name) {
            // 检查是否已有同名人物
            const existingCharIndex = novelData.value.characters.findIndex(c => c.name === charData.name)
            if (existingCharIndex === -1) {
              // 添加新人物
              const newIndex = novelData.value.characters.length
              novelData.value.characters.push({
                name: charData.name,
                description: charData.description || ''
              })
              expandedCharacters.value.push(newIndex)
            } else {
              // 更新已有人物
              novelData.value.characters[existingCharIndex].name = charData.name
              novelData.value.characters[existingCharIndex].description = charData.description || ''
            }
            return
          }
        } catch (e) {
          // 如果直接解析失败，尝试使用更精确的正则表达式提取JSON对象
          // 匹配完整的JSON对象，处理嵌套结构
          const jsonMatch = cleanText.match(/\{[^}]*"name"[^}]*\}/)
          if (jsonMatch) {
            try {
              const charData = JSON.parse(jsonMatch[0])
              if (charData.name) {
                // 检查是否已有同名人物
                const existingCharIndex = novelData.value.characters.findIndex(c => c.name === charData.name)
                if (existingCharIndex === -1) {
                  // 添加新人物
                  const newIndex = novelData.value.characters.length
                  novelData.value.characters.push({
                    name: charData.name,
                    description: charData.description || ''
                  })
                  expandedCharacters.value.push(newIndex)
                } else {
                  // 更新已有人物
                  novelData.value.characters[existingCharIndex].name = charData.name
                  novelData.value.characters[existingCharIndex].description = charData.description || ''
                }
                return
              }
            } catch (e) {
            }
          }
          
          // 尝试另一种正则表达式，匹配更复杂的JSON结构
          const complexJsonMatch = cleanText.match(/\{[\s\S]*?"name"[\s\S]*?"description"[\s\S]*?\}/)
          if (complexJsonMatch) {
            try {
              const charData = JSON.parse(complexJsonMatch[0])
              if (charData.name) {
                // 检查是否已有同名人物
                const existingCharIndex = novelData.value.characters.findIndex(c => c.name === charData.name)
                if (existingCharIndex === -1) {
                  // 添加新人物
                  const newIndex = novelData.value.characters.length
                  novelData.value.characters.push({
                    name: charData.name,
                    description: charData.description || ''
                  })
                  expandedCharacters.value.push(newIndex)
                } else {
                  // 更新已有人物
                  novelData.value.characters[existingCharIndex].name = charData.name
                  novelData.value.characters[existingCharIndex].description = charData.description || ''
                }
                return
              }
            } catch (e) {
            }
          }
        }
        showDialogMessage('AI返回格式有误，请重试')
      } catch (e) {
        showDialogMessage('AI返回格式有误，请重试')
      }
    } else if (activeTab.value === 'plots') {
      try {
        // 检查是否已经在流式处理中添加了情节
        if (plotData.value.titleExtracted) {
          return
        }
        
        let cleanText = generatedText.replace(/[\x00-\x1F\x7F]/g, '')
        // 去除可能的 markdown 代码块标记
        cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        // 清理可能的额外引号和转义字符
        cleanText = cleanText.trim()
        
        // 清理外层引号
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.substring(1, cleanText.length - 1)
        }
        
        // 清理转义引号
        cleanText = cleanText.replace(/\\"/g, '"')
        
        // 清理可能的"json"前缀
        if (cleanText.startsWith('"json"')) {
          cleanText = cleanText.substring('"json"'.length).trim()
        } else if (cleanText.startsWith('json')) {
          cleanText = cleanText.substring('json'.length).trim()
        }
        
        // 清理可能的开头引号
        cleanText = cleanText.trim()
        if (cleanText.startsWith('"')) {
          cleanText = cleanText.substring(1)
        }
        
        // 清理可能的结尾引号
        cleanText = cleanText.trim()
        if (cleanText.endsWith('"')) {
          cleanText = cleanText.substring(0, cleanText.length - 1)
        }
        
        // 尝试直接解析整个文本
        try {
          const plotDataJson = JSON.parse(cleanText)
          if (plotDataJson.title) {
            // 检查是否已有同名情节
            const existingPlotIndex = novelData.value.plots.findIndex(p => p.title === plotDataJson.title)
            if (existingPlotIndex === -1) {
              // 添加新情节
              const newIndex = novelData.value.plots.length
              novelData.value.plots.push({
                title: plotDataJson.title,
                content: plotDataJson.content || ''
              })
              expandedPlots.value.push(newIndex)
            }
            return
          }
        } catch (e) {
          // 如果直接解析失败，尝试使用更精确的正则表达式提取JSON对象
          const jsonMatch = cleanText.match(/\{[^}]*"title"[^}]*\}/)
          if (jsonMatch) {
            try {
              const plotDataJson = JSON.parse(jsonMatch[0])
              if (plotDataJson.title) {
                // 检查是否已有同名情节
                const existingPlotIndex = novelData.value.plots.findIndex(p => p.title === plotDataJson.title)
                if (existingPlotIndex === -1) {
                  // 添加新情节
                  const newIndex = novelData.value.plots.length
                  novelData.value.plots.push({
                    title: plotDataJson.title,
                    content: plotDataJson.content || ''
                  })
                  expandedPlots.value.push(newIndex)
                }
                return
              }
            } catch (e) {
            }
          }
          
          // 尝试另一种正则表达式
          const complexJsonMatch = cleanText.match(/\{[\s\S]*?"title"[\s\S]*?"content"[\s\S]*?\}/)
          if (complexJsonMatch) {
            try {
              const plotDataJson = JSON.parse(complexJsonMatch[0])
              if (plotDataJson.title) {
                // 检查是否已有同名情节
                const existingPlotIndex = novelData.value.plots.findIndex(p => p.title === plotDataJson.title)
                if (existingPlotIndex === -1) {
                  // 添加新情节
                  const newIndex = novelData.value.plots.length
                  novelData.value.plots.push({
                    title: plotDataJson.title,
                    content: plotDataJson.content || ''
                  })
                  expandedPlots.value.push(newIndex)
                }
                return
              }
            } catch (e) {
            }
          }
        }
        showDialogMessage('AI返回格式有误，请重试')
      } catch (e) {
        showDialogMessage('AI返回格式有误，请重试')
      }
    } else if (activeTab.value === 'chapters') {
      // 章节内容已经在流式处理中实时更新
      // 如果 AI 返回了 # 开头的标题行，提取并更新章节标题
      if (generatedText && currentChapter.value) {
        const lines = generatedText.split('\n')
        if (lines[0] && lines[0].startsWith('# ')) {
          const newTitle = lines[0].slice(2).trim()
          if (newTitle) {
            currentChapter.value.title = newTitle
            // 从内容中去掉标题行
            const contentWithoutTitle = lines.slice(1).join('\n').trim()
            currentChapter.value.content = contentWithoutTitle
            chapterContentValue.value = contentWithoutTitle
          }
        }
      }
    }

  } catch (err) {
    // 忽略中止错误
    if (!err.name || err.name !== 'AbortError') {
      console.error('========== AI 请求错误详情 ==========')
      console.error('错误名称:', err.name)
      console.error('错误消息:', err.message)
      console.error('错误堆栈:', err.stack)
      console.error('========================================')
      showDialogMessage(`AI生成失败: ${err.message}`)
      // 设置续写失败时关闭弹窗，避免空白弹窗停留
      if (activeTab.value === 'settings' && showSettingsContinueDialog.value) {
        showSettingsContinueDialog.value = false
        aiThinking.value = ''
      }
    }
  } finally {
    isGenerating.value = false
    generatingChapterId.value = ''
    // 不要清空aiThinking，保留已生成的内容
    abortController.value = null
  }
}

// 停止生成函数
function stopGenerating() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isGenerating.value = false
  generatingChapterId.value = ''
  // 不要清空aiThinking，保留已生成的内容
}

// 设置续写弹窗确认与取消
function confirmSettingsContinue() {
  if (aiThinking.value) {
    const separator = novelData.value.settings.endsWith('\n') ? '' : '\n'
    novelData.value.settings += separator + aiThinking.value
  }
  showSettingsContinueDialog.value = false
  aiThinking.value = ''
  aiGeneratedSettings.value = true
  userEditedSettings.value = false
}

function cancelSettingsContinue() {
  if (isGenerating.value) {
    stopGenerating()
  }
  showSettingsContinueDialog.value = false
  aiThinking.value = ''
}

// 切换标签函数
function switchTab(tab) {
  // 如果AI正在生成，自动停止
  if (isGenerating.value) {
    stopGenerating()
  }
  // 离开设置页时关闭续写弹窗并清空临时内容
  if (activeTab.value === 'settings' && showSettingsContinueDialog.value) {
    showSettingsContinueDialog.value = false
    aiThinking.value = ''
  }
  activeTab.value = tab
}


</script>

<style scoped>
.editContainer {
  position: relative;
  width: 1280px;
  height: 720px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #ffffff;
}

.editHeader {
  width: 1280px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #2d2d30;
  border-bottom: 2px solid #3e3e42;
}

.editHeader .rightButtons {
  display: flex;
  align-items: center;
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
}

.backButton:hover {
  background: #5a5a5e;
  border-color: #6a6a6e;
}

.saveButton {
  height: 36px;
  padding: 0 20px;
  background: #0078d4;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #ffffff;
  transition: background 0.2s;
}

.settingsIcon {
  font-size: 22px;
  color: #ffffff;
  font-weight: bold;
}

.saveButton:hover {
  background: #1a86d9;
}

.settingsButton {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3e3e42;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 10px;
}

.settingsButton:hover {
  background: #4a4a4e;
}

.editBody {
  flex: 1;
  display: flex;
}

.editSidebar {
  width: 320px;
  background: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
}

.tabBar {
  flex-shrink: 0;
  display: flex;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.tabItem {
  flex: 1;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2d2d30;
  border: none;
  border-bottom: 2px solid transparent;
  color: #cccccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tabItem:hover {
  background: #3e3e42;
  color: #ffffff;
}

.tabItemActive {
  background: #252526;
  color: #ffffff;
  border-bottom-color: #0078d4;
}

.tabContent {
  flex: 1;
  max-height: 500px;
  padding: 10px;
  min-height: 0;
  overflow-y: hidden;
}

.chapterItem {
  padding: 12px 15px;
  margin-bottom: 8px;
  background: #2d2d30;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapterItem:hover {
  background: #3e3e42;
}

.chapterItemActive {
  background: #0078d4;
}

.chapterItemTitle {
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 0;
  flex: 1;
}

.chapterItemRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapterItemWordCount {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.chapterListContainer {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.chapterMenu {
  position: fixed;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  width: 120px;
  overflow: hidden;
}

.editMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.editorHeader {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3e3e42;
}

.editorTitle {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 8px;
}

.titleInput {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  background: transparent;
  border: none;
  outline: none;
  width: 400px;
  padding: 2px 0;
}

.editorStats {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #888888;
}

.editorArea {
  flex: 1;
  background: #252526;
  border: 1px solid #3e3e42;
  padding: 10px;
  overflow-y: hidden;
}

.editorArea::-webkit-scrollbar {
  width: 8px;
}

.editorArea::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.editorArea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.editorArea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.editorTextarea {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 15px;
  line-height: 1.8;
  resize: none;
  outline: none;
}

.settingContent {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settingSection {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settingSectionTitle {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #3e3e42;
}

.settingTextarea {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 13px;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.settingTextarea:focus {
  border-color: #0078d4;
}

.settingInput {
  width: 100%;
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.settingInput:focus {
  border-color: #0078d4;
}

.settingSelect {
  width: 100%;
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  cursor: pointer;
}

.settingSelect:focus {
  border-color: #0078d4;
}

.characterItem, .plotItem {
  margin-bottom: 8px;
  background: #2d2d30;
  overflow: hidden;
}

.characterHeader, .plotHeader {
  min-height: 46px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

.characterHeader:hover, .plotHeader:hover {
  background: #3d3d40;
}

.characterName, .plotTitle {
  font-size: 14px;
  color: #ffffff;
}

.characterNameInput {
  font-size: 14px;
  color: #ffffff;
  background: #3e3e42;
  border: 1px solid #0078d4;
  border-radius: 3px;
  padding: 2px 6px;
  outline: none;
  width: 120px;
}

.plotTitleInput {
  font-size: 14px;
  color: #ffffff;
  background: #3e3e42;
  border: 1px solid #0078d4;
  border-radius: 3px;
  padding: 2px 6px;
  outline: none;
  width: 120px;
}

.plotMenu {
  position: absolute;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  width: 120px;
  overflow: hidden;
}

.expandIcon {
  font-size: 10px;
  color: #888888;
}

.characterDesc {
  padding: 10px;
  font-size: 12px;
  color: #888888;
  border-top: 1px solid #3e3e42;
}

.plotContent {
  padding: 10px;
  font-size: 12px;
  color: #888888;
  border-top: 1px solid #3e3e42;
  position: relative;
}

/* 人物菜单样式 */
.moreOptionsButton {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #cccccc;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  margin-left: 10px;
}

.moreOptionsButton:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.characterMenu {
  position: absolute;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  width: 120px;
  overflow: hidden;
}

.menuItem {
  padding: 10px 16px;
  font-size: 13px;
  color: #cccccc;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
}

.menuItem:hover {
  background: #3e3e42;
  color: #ffffff;
}

/* 人物描述编辑器样式 */
.characterDescEditor {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #cccccc;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  resize: vertical;
  outline: none;
}

.characterDescEditor:focus {
  border-color: #0078d4;
}

.characterDesc span {
  cursor: pointer;
  transition: color 0.2s;
}

.characterDesc span:hover {
  color: #ffffff;
}

.plotContentEditor {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #cccccc;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  resize: vertical;
  outline: none;
}

.plotContentEditor:focus {
  border-color: #0078d4;
}

.plotContentText {
  cursor: pointer;
  transition: color 0.2s;
  display: block;
  width: 100%;
  min-height: 20px;
}

.plotContentText:hover {
  color: #ffffff;
}

.characterListContainer, .plotListContainer {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.newChapterButton {
  width: 100%;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 10px;
  background: #3e3e42;
  border: none;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.newChapterButton:hover {
  background: #4a4a4e;
}

.aiSection {
  flex-shrink: 0;
  padding: 10px;
  gap:10px;
  border-top: 1px solid #3e3e42;
}

.aiGenerateButton {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.aiGenerateButton:hover:not(:disabled) {
  opacity: 0.9;
}

.aiGenerateButton:disabled {
  background: #555;
  cursor: not-allowed;
}

.dialogOverlay {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1280px;
  height: 720px;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 400px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  padding: 25px;
}

.dialogTitle {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 20px;
}

.dialogMessage {
  font-size: 14px;
  color: #cccccc;
  line-height: 1.5;
  white-space: pre-wrap;
}

.formGroup {
  margin-bottom: 15px;
}

.formLabel {
  display: block;
  font-size: 13px;
  color: #cccccc;
  margin-bottom: 6px;
}

.formInput {
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

.formInput:focus {
  border-color: #0078d4;
}

.formTextarea {
  width: 100%;
  height: 100px;
  max-height: 200px;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}

.formTextarea:focus {
  border-color: #0078d4;
}

.dialogActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
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

.savingToast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.savingSpinner {
  width: 16px;
  height: 16px;
  border: 2px solid #3e3e42;
  border-top-color: #0078d4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* AI 续写弹窗（位于左侧世界设定编辑框区域） */
.continueDialogOverlay {
  position: absolute;
  top: 60px;
  left: 0;
  width: 320px;
  height: calc(720px - 60px);
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.continueDialog {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 400px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.continueDialogHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.continueDialogTitle {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
}

.continueDialogActions {
  display: flex;
  gap: 10px;
  margin: 0;
}

.continueDialogTextarea {
  flex: 1;
  min-height: 120px;
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  overflow-y: auto;
}
</style>
