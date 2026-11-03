# 光影日誌 Light & Frame

一個以「個人攝影日誌／作品」為首頁主體，並提供循序攝影教學的靜態網站。日誌可以持續加入真實照片、拍攝故事、設定與反思；攝影教學依 `order` 排列，讓讀者從曝光、構圖、穩定拍攝一路練習到光線實戰。

藍調時光是目前的其中一個學習主題，而不是網站的唯一範圍。未來可以加入街拍、人像、風景、建築、商品或其他攝影內容。

專案同時採用 [Andrej Karpathy 的 LLM Wiki 構想](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)：`raw/` 保存來源，`wiki/` 保存持續更新的交叉連結筆記，`AGENTS.md` 規定 AI 如何維護整個知識庫與網站。

## 本機預覽

要更換首頁作品，請使用下方 Node.js 預覽命令，在首頁橫幅展開「上傳首頁照片」，選圖後按「設為首頁背景」。相機、鏡頭及說明可留空。公開時一併提交 `assets/images/featured/` 與 `content/featured-photo.json`。Python 靜態預覽只能瀏覽已儲存的作品。

瀏覽器直接開啟 `index.html` 時，可能因 `file://` 安全限制無法讀取 JSON。若電腦已安裝 Node.js，請在專案根目錄啟動內附的零相依 HTTP server：

```powershell
node scripts/serve.mjs
```

然後開啟 <http://localhost:8000/>。

若偏好 Python，也可使用 `python -m http.server 8000`；兩種方式擇一即可。

修改內容後可執行自動驗證：

```powershell
node scripts/validate.mjs
```

此工具會檢查必要欄位、日期、唯一 slug、唯一課程順序、文章關聯與本機照片路徑。

公開網站也可以上傳首頁照片，以及新增、編輯和刪除日誌。這些操作使用瀏覽器儲存，因此重新整理後仍會保留，但不會跨裝置同步，也不會直接改寫 GitHub Repository。要把內容正式公開給所有訪客，請在本機編輯後提交並推送專案檔案。

## 專案結構

```text
.
├── AGENTS.md
├── README.md
├── index.html
├── styles/main.css
├── scripts/
│   ├── app.js
│   ├── serve.mjs
│   └── validate.mjs
├── assets/images/
├── docs/
│   └── ARTICLE_TO_LESSON.md
├── content/
│   ├── journals.json
│   └── lessons.json
├── raw/
│   ├── README.md
│   ├── sources/
│   └── karpathy-llm-wiki-source.md
└── wiki/
    ├── index.md
    ├── log.md
    └── concepts/
```

## 新增攝影日誌

1. 先讀 `AGENTS.md`、`wiki/index.md` 與既有 `content/journals.json`。
2. 依既有 schema 新增物件，使用唯一且穩定的英文 `slug`。
3. 沒有真實地點、照片或 EXIF 時留空，不可猜測；尚未實拍需設為 `isSample: true`。
4. 個人照片放在 `assets/images/journals/<slug>/`，代表作品填入 `cover`，其他作品填入 `photos`。
5. 只加入確實存在於 `lessons.json` 的 `relatedLessons`。
6. 若產生新的可重用知識，更新 `wiki/`、索引與 log。
7. 啟動本機伺服器，檢查首頁、列表、文章頁、圖片與替代文字。

## 新增攝影教學

1. 先讀規範與相關 wiki 概念頁。
2. 先決定課程的 `order` 與 `stage`；順序不可重複。
3. 在 `content/lessons.json` 新增物件，內容包含學習原因、操作、觀察、常見錯誤與練習任務。
4. `relatedJournals` 只引用已存在的日誌 slug。
5. 更新相關 wiki 頁、`wiki/index.md` 與 `wiki/log.md`。
6. 在桌面與窄螢幕驗證課程順序、文章排版與前後課導覽。

## 把網路文章轉成教程與練習

使用者可提供攝影文章網址或貼上內容，要求 Agent 依 [`docs/ARTICLE_TO_LESSON.md`](docs/ARTICLE_TO_LESSON.md) 處理。Agent 會：

1. 先實際讀取來源，不根據標題猜測。
2. 在 `raw/sources/` 保存作者、網址、摘要、限制與處理狀態。
3. 搜尋 Wiki 與現有課程，優先更新而非建立重複頁面。
4. 將來源轉述為短教程，避免大量照抄。
5. 設計能控制變因、觀察差異並回寫日誌的拍攝練習。
6. 在課程 `sources` 保留引用，更新 Wiki 索引與 log，最後執行驗證。

## 本專案如何回應作業要求

| 作業要求 | 專案中的對應成果 |
| --- | --- |
| 自己的小專案 | 個人攝影日誌、作品展示與循序攝影教學 |
| 清楚的 `AGENTS.md` | 定義目的、架構、資料 schema、命名、照片、教學順序與驗證流程 |
| 可瀏覽網頁 | 純 HTML／CSS／JavaScript，可直接部署 GitHub Pages |
| 能繼續新增內容 | 日誌與教學由 JSON 產生，不需複製整個頁面或修改首頁 HTML |
| 規則與成果對應 | 首頁排序、作品圖片、課程 order、文章關聯都直接實作規範 |
| 重複使用與延伸 | AI 讀完規範後可把使用者提供的新文章持續轉成有來源的短課與實拍練習 |

可直接整理後貼入作業系統的內容草稿，見 [`SUBMISSION.md`](SUBMISSION.md)。

## 部署到 GitHub Pages

1. 建立 GitHub repository，將本專案推送到 `main` 分支。
2. 在 repository 的 **Settings → Pages**，Source 選擇 **Deploy from a branch**。
3. Branch 選擇 `main`，資料夾選擇 `/ (root)`，儲存設定。
4. 等待 GitHub 顯示部署網址後，檢查首頁、文章 query 連結、JSON 與重新整理行為。

本專案已公開於 [GitHub Repository](https://github.com/huray1028/light-frame-journal)，網站由 [GitHub Pages](https://huray1028.github.io/light-frame-journal/) 提供。所有資源使用相對路徑，可在 repository 子路徑正常載入。


