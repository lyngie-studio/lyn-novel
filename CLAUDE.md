# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lyn Novel** is an AI-assisted novel writing tool. Users create novels, manage characters/plots/chapters, and generate text via a local LLM (Ollama or Llama).

- **Frontend**: Vue 3 + Vite, Vue Router
- **Backend**: Node.js + Express (CommonJS, `.cjs`), data persisted as Markdown files
- **State**: Lightweight reactive store backed by `localStorage`
- **AI**: Streams completions from Ollama (default `http://localhost:11434/api/generate`) or Llama

## Common Commands

```bash
npm install              # install dependencies
npm run server           # start backend Express on http://127.0.0.1:3001
npm run dev              # start Vite dev server on http://localhost:5173
npm run build            # production build to dist/
npm run preview          # preview production build
```

Both `npm run server` and `npm run dev` must be running for the app to work (frontend calls backend REST APIs).

## Project Layout

```
lyn-novel/
├── server/index.cjs        # Express API (CRUD for novels)
├── server/data/            # NOTE: gitignored, not the real data dir
├── src/
│   ├── main.js             # Vue app entry
│   ├── App.vue             # <router-view/> shell
│   ├── style.css           # ONLY CSS file (global styles)
│   ├── router/index.js     # 3 routes: /, /novel/:id, /settings
│   ├── store/novelStore.js # reactive() state + localStorage
│   └── views/
│       ├── Home.vue        # novel list + create dialog
│       ├── NovelEdit.vue   # editor (settings/characters/plots/chapters) + AI
│       └── Settings.vue    # AI provider config
├── check-settings.js       # localStorage debug helper (run via `node`)
├── index.html              # viewport locked to 1280x720
└── vite.config.js          # Vue plugin, port 5173, host true
```

## Architecture

### Data flow
- **Persistence**: Each novel is a single `.md` file at `{OS APPDATA}/LynNovel/data/{id}.md` (Windows) or equivalent Roaming path. NOT in `server/data/`.
- **Backend** (`server/index.cjs`): REST endpoints at `/api/novels` (GET list, POST save, DELETE single/all, GET `:id`). Converts novel objects ↔ markdown via `novelToMarkdown` / `markdownToNovel` in the same file.
- **Frontend store** (`src/store/novelStore.js`): Caches novels in `localStorage` under key `lyn_novel_data`. `useNovelStore()` exposes `saveNovel`, `getNovel`, `deleteNovel`, `getNovels`. Reactive via `reactive()`.
- **AI calls**: Made directly from views to the configured LLM endpoint (bypasses the Express server). Settings are stored in `localStorage` under `lyn_novel_settings`.

### Novel data model
```js
{
  id, name, style,           // style: 玄幻/言情/etc.
  settings,                  // 世界设定 (string)
  characters: [{name, description}],
  plots: [{title, content}],
  chapters: [{id, title, content, wordCount}]
}
```

## Critical Project Rules (from `.trae/rules/`)

These are project-wide constraints, not suggestions:

- **No media queries** anywhere in the codebase.
- **No `vh` / `vw` units** — use fixed resolution layout (1280×720).
- **Only one `.css` file** is allowed (`src/style.css`). Don't add scoped CSS files or new global stylesheets.
- **Camel case naming** for all functions/methods in Vue.
- **No direct DOM elements in `html`/`body`** — everything goes inside Vue components under `#app`.
- **No unused dependencies** — clean up `package.json` when removing features.

## Fixed-Resolution Layout

The app targets exactly **1280×720** (set in `index.html` viewport meta and `#app` in `style.css`). `html, body` use `display: flex; justify-content: center;` to center the app window, with `overflow: hidden`. All positioning uses `px` units, not relative units.

## Conventions

- Backend uses CommonJS (`.cjs`) — `package.json` has `"type": "module"` for the frontend, so the server entry is explicitly `.cjs`.
- API base URL: `http://127.0.0.1:3001` (hardcoded in views; check `Home.vue` / `NovelEdit.vue` fetch calls if changing).
- Chinese UI throughout. New copy should match existing terminology (小说/人物/情节/章节).
