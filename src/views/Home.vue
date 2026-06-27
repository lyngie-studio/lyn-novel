<template>
  <div class="appContainer">
    <header class="appHeader">
      <button class="headerLogo" @click="goHome">
        <span class="logoIcon">📖</span>
      </button>
      <h1 class="headerTitle">LynNovel</h1>
      <button class="headerSettings" @click="openSettings">
        <span class="settingsIcon">⚙</span>
      </button>
    </header>
    <main class="mainContent">
      <div v-if="novels.length === 0" class="emptyState">
        <button class="addButton" @click="showDialog = true">
          <span class="addButtonIcon">+</span>
          <span class="addButtonText">新建小说</span>
        </button>
      </div>
      <div v-else class="novelList">
        <div
          v-for="novel in novels"
          :key="novel.id"
          :class="['novelCard', getNovelCardClass(novel.style)]"
          @mouseleave="closeDropdown"
        >
          <div class="novelCardContent" @click="openNovel(novel.id)">
            <span class="novelCardTitle">{{ novel.name }}</span>
            <span class="novelCardStyle">{{ novel.style }}</span>
          </div>
          <div class="novelCardActions">
            <button 
              class="moreButton" 
              @click.stop="toggleDropdown(novel.id)"
            >
              ⋯
            </button>
            <div 
              v-if="dropdownVisible === novel.id" 
              class="dropdownMenu"
            >
              <button 
                class="dropdownItem" 
                @click.stop="exportNovel(novel)"
              >
                导出
              </button>
              <button 
                class="dropdownItem" 
                @click.stop="deleteNovel(novel.id)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <button class="addButton" @click="showDialog = true">
          <span class="addButtonIcon">+</span>
          <span class="addButtonText">新建小说</span>
        </button>
      </div>
    </main>

    <div v-if="showDialog" class="dialogOverlay" @click.self="closeDialog">
      <div class="dialog">
        <h2 class="dialogTitle">新建小说</h2>
        <div class="formGroup">
          <label class="formLabel">小说名称</label>
          <input
            v-model="newNovelName"
            class="formInput"
            type="text"
            placeholder="请输入小说名称"
            @keyup.enter="createNovel"
          />
        </div>
        <div class="formGroup">
          <label class="formLabel">风格类型</label>
          <select v-model="newNovelStyle" class="formSelect">
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
        <div class="dialogActions">
          <button class="btn btnSecondary" @click="closeDialog">取消</button>
          <button class="btn btnPrimary" @click="createNovel">创建</button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '../store/novelStore'

const router = useRouter()
const { getNovels, saveNovel, deleteNovel: deleteNovelStore } = useNovelStore()

const novels = ref([])
const dropdownVisible = ref(null)

async function fetchNovels() {
  try {
    const res = await fetch('http://localhost:3001/api/novels')
    const data = await res.json()
    novels.value = data.novels || []
  } catch (e) {
    novels.value = getNovels()
  }
}

onMounted(() => {
  fetchNovels()
})

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

const showDialog = ref(false)
const newNovelName = ref('')
const newNovelStyle = ref('玄幻')

function goHome() {
  router.push('/')
}

function openSettings() {
  router.push('/settings')
}

function openNovel(id) {
  router.push(`/novel/${id}`)
}

function closeDialog() {
  showDialog.value = false
  newNovelName.value = ''
  newNovelStyle.value = '玄幻'
}

function toggleDropdown(novelId) {
  if (dropdownVisible.value === novelId) {
    dropdownVisible.value = null
  } else {
    dropdownVisible.value = novelId
  }
}

function closeDropdown() {
  dropdownVisible.value = null
}

function exportNovel(novel) {
  // 生成MD文档内容
  let mdContent = `# ${novel.name}\n\n`
  mdContent += `## 风格：${novel.style}\n\n`
  
  if (novel.chapters && novel.chapters.length > 0) {
    mdContent += `## 章节\n\n`
    novel.chapters.forEach(chapter => {
      mdContent += `### ${chapter.title}\n\n`
      mdContent += `${chapter.content || ''}\n\n`
    })
  }
  
  // 创建下载链接
  const blob = new Blob([mdContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${novel.name}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  // 关闭下拉菜单
  dropdownVisible.value = null
}

async function deleteNovel(novelId) {
  if (await showDialogConfirm('确定要删除这本小说吗？')) {
    try {
      await fetch(`http://localhost:3001/api/novels/${novelId}`, {
        method: 'DELETE'
      })
    } catch (e) {
      deleteNovelStore(novelId)
    }
    await fetchNovels()
    dropdownVisible.value = null
  }
}

async function createNovel() {
  if (!newNovelName.value.trim()) return

  const novel = {
    id: Date.now().toString(),
    name: newNovelName.value.trim(),
    style: newNovelStyle.value,
    settings: '',
    characters: [],
    plots: [],
    chapters: [{
      id: '1',
      title: '第一章',
      content: '',
      wordCount: 0
    }]
  }

  try {
    await fetch('http://localhost:3001/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novel)
    })
  } catch (e) {
    saveNovel(novel)
  }

  closeDialog()
  router.push(`/novel/${novel.id}`)
}

function getNovelCardClass(style) {
  const styleMap = {
    '玄幻': 'novelCardFantasy',
    '言情': 'novelCardRomance',
    '科幻': 'novelCardSciFi',
    '悬疑': 'novelCardMystery',
    '恐怖': 'novelCardHorror',
    '剧情': 'novelCardDrama',
    '喜剧': 'novelCardComedy',
    '动作': 'novelCardAction'
  }
  return styleMap[style] || 'novelCardDefault'
}
</script>

<style scoped>
.appContainer {
  width: 1280px;
  height: 720px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #ffffff;
}

.appHeader {
  width: 1280px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #2d2d30;
  border-bottom: 2px solid #3e3e42;
}

.headerLogo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0078d4;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.headerLogo:hover {
  background: #1a86d9;
}

.logoIcon {
  font-size: 20px;
  color: #fff;
}

.headerTitle {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 2px;
}

.headerSettings {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3e3e42;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.headerSettings:hover {
  background: #4a4a4e;
}

.settingsIcon {
  font-size: 18px;
  color: #ffffff;
}

.mainContent {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.novelList {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.novelCard {
  width: 200px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
  position: relative;
}

.novelCard:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.novelCardContent {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.novelCardTitle {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  padding: 10px;
  word-break: break-word;
}

.novelCardStyle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

.novelCardActions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.moreButton {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.novelCard:hover .moreButton {
  opacity: 1;
}

.moreButton:hover {
  background: rgba(0, 0, 0, 0.7);
}

.dropdownMenu {
  position: absolute;
  top: 40px;
  right: 0;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 20;
}

.dropdownItem {
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.dropdownItem:hover {
  background: #3e3e42;
}

.dropdownItem:first-child {
  border-radius: 4px 4px 0 0;
}

.dropdownItem:last-child {
  border-radius: 0 0 4px 4px;
}

.emptyState {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.addButton {
  width: 120px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #2d2d30;
  border: 3px dashed #5a5a5a;
  cursor: pointer;
  transition: all 0.2s;
}

.addButton:hover {
  background: #3e3e42;
  border-color: #0078d4;
}

.addButtonIcon {
  font-size: 48px;
  color: #5a5a5a;
  line-height: 1;
}

.addButtonText {
  font-size: 14px;
  color: #5a5a5a;
  margin-top: 8px;
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

.formSelect {
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

.formSelect:focus {
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

.novelCardFantasy {
  background: #6B4FBB;
}

.novelCardRomance {
  background: #E91E63;
}

.novelCardSciFi {
  background: #00BCD4;
}

.novelCardMystery {
  background: #FF9800;
}

.novelCardHorror {
  background: #4CAF50;
}

.novelCardDrama {
  background: #9C27B0;
}

.novelCardComedy {
  background: #F44336;
}

.novelCardAction {
  background: #795548;
}

.novelCardDefault {
  background: #607D8B;
}
</style>
