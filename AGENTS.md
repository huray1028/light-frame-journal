# 光影日誌 Light & Frame｜AGENTS.md

本文件同時是本次作業的設計說明與 AI 維護規範。進入專案後，先讀本文件，再讀 `wiki/index.md`、相關 JSON 和共用樣式。完成一次更新的標準是：新內容有依據、讀者找得到、舊文章仍可開啟。

## 一、專案簡介與作業對照

光影日誌是給攝影初學者使用的個人日誌。首頁先展示最近上傳的作品與最新日誌；攝影教學則讓讀者從一篇文章帶走一個可以拍的練習，再把觀察寫回日誌。題材可以是市場色彩、窗邊靜物、街拍或夜景。即使還沒有照片，也能先記錄拍攝計畫。

| 作業要求 | 本專案如何實作與查核 |
| --- | --- |
| 決定自己的小專案 | 以「閱讀 → 練習 → 記錄」串起教學與作品。日誌是主體，教學提供下一次可做的練習。 |
| 建立 AI 可遵循的規則 | 根目錄的本文件規定檔案位置、欄位、來源處理、修改方式，以及何時算完成。 |
| 依規則完成網頁 | 首頁、日誌列表、教學路線、文章頁與關於頁共用一套版型。現有 4 篇示範日誌、7 堂教學；示範計畫不算實拍成果。 |
| 證明可以繼續擴充 | 下文以「窗光下的白杯」示範如何從來源找到課程與日誌。下一篇只需新增或更新資料，不必複製 HTML。 |
| 上傳 GitHub 並公開網站 | Repository：`https://github.com/huray1028/light-frame-journal`；公開網站：`https://huray1028.github.io/light-frame-journal/`。 |

## 二、檔案與頁面規則

| 位置 | 責任 |
| --- | --- |
| `content/journals.json`、`content/lessons.json` | 公開文章的唯一資料來源；首頁、列表與內頁共用，不在 HTML 手寫第二份。 |
| `assets/images/`、`content/featured-photo.json`、`content/practice-work.json` | 分別保存作品圖檔、最近上傳的首頁作品資料、依教學 slug 關聯的練習作品。 |
| `raw/sources/`、`wiki/concepts/` | 前者保留來源紀錄；後者用自己的文字整理可重用的概念。`wiki/index.md` 是入口，`wiki/log.md` 只追加異動紀錄。 |
| `index.html`、`scripts/app.js`、`styles/main.css` | 共用頁面、資料呈現與視覺樣式。文章網址採 `index.html?view=article&type=journal&slug=...`；教學使用 `type=lesson`。 |
| `scripts/serve.mjs`、`scripts/course-editor.mjs`、`scripts/journal-form.js` | 編輯入口與表單。本機預覽可把內容寫入專案檔案；GitHub Pages 以瀏覽器儲存保存首頁照片及日誌，資料只存在該瀏覽器。 |

使用繁體中文（臺灣用語）。保留首頁、全部日誌、攝影教學、關於本站四個入口。沿用深藍灰背景、暖白文字與共用卡片；桌面可多欄，手機單欄。圖片提供替代文字，按鈕支援鍵盤與可見焦點。無照片用漸層或空圖提示，不以外部圖片冒充作品。首頁依**上傳時間**選背景；日誌依**文章日期**由新到舊；教學依**課程順序**排列。

## 三、新增或修改內容時，AI 要做什麼？

**共同規則。** 先搜尋現有標題、slug 與概念，判斷應更新舊頁或新增。slug 只用小寫英文字母、數字與連字號；發布後保留，已下架的也不重用。日期採 YYYY-MM-DD，圖片與站內資源用相對路徑。若必須擴充欄位，先定義舊資料缺少該欄位時的顯示方式，同步更新本文件及驗證規則。

**新增日誌。** 在 journals.json 建立一筆，沿用既有資料型別：

- 識別與摘要：`slug、title、date、location、tags、summary、isSample`。
- 作品與設備：`cover、photos、camera、lens、settings`。settings 保留 focalLength、aperture、shutter、iso。作品放在 `assets/images/journals/<slug>/`，檔名用小寫英文、數字與連字號。
- 正文與關聯：`story、whatILearned、nextTime、relatedLessons`。分別回答「看見或拍了什麼？」「學到什麼？」「下次要試什麼？」。若有對應課程，核對 slug 並維護反向連結。

未提供的器材、參數與地點留空；不猜 EXIF，不替作者編造經歷。尚未實拍的示例或計畫標記 `isSample: true`。日誌可新增、編輯或確認後下架；修改保留原 slug、照片與關聯。公開網站使用瀏覽器儲存，因此換裝置或清除網站資料不會同步；需要成為全站公開內容時，仍由 Agent 寫入 JSON、提交並推送。作者可直接保存原文。只有主動選擇潤飾時才使用本機已登入的 Codex；建議先供比較，採用與否由作者決定，不增加原文沒有的事實。

**新增教學。** 在 lessons.json 建立一筆，保留 `slug、title、updatedAt、order、stage、level、tags、summary、cover、goal、sections、practice、sources、relatedJournals、isSample`。order 是唯一正整數，通常接在最後一課；stage 優先沿用既有階段。sections 以 heading 和 paragraphs 說明情境、操作、觀察重點與常見錯誤；practice 至少有一項可執行的練習，寫明改變什麼、保持什麼、如何比較。relatedJournals 只引用現有日誌。確認下架後標記 archived，保留照片、來源與 slug，公開頁面不再列出。

## 四、把一篇外部文章轉成短課

公開版教學列表底部固定提供「新增教學」表單與 Cambridge in Colour 教學入口。依使用者筆記套用對照練習格式，並不自動讀取網址或呼叫 AI。每堂教學底部提供作業照片與心得表單。瀏覽器新增課程、下架紀錄及縮圖保存在 localStorage，重新整理後讀回；容量不足須報錯，不宣稱成功。這些個人資料不會寫回 GitHub 或 Wiki；正式公開仍需 Agent 完成來源整理與提交。測試必須包含公開環境新增課程、照片上傳及重新整理。

本專案參考 Andrej Karpathy 的 LLM Wiki 方法（見 `raw/karpathy-llm-wiki-source.md`）。來源、知識筆記與公開教學各有用途，不能把「讀到的說法」直接寫成「我的實拍結果」。

1. **讀來源。** Agent 先讀使用者提供的文章或筆記。連結無法讀取時，請使用者貼出相關段落。本機網頁表單則依使用者填寫的閱讀重點與既有練習格式整理課程；只貼網址不代表網站讀過原文。
2. **留依據。** 依 `raw/sources/TEMPLATE.md` 建立 `YYYY-MM-DD-source-slug.md`，記錄標題、作者、網址、加入日期、使用範圍及處理狀態。外部文章保留摘要與必要短引，不搬運全文。課程的 sources 每筆含 title、author、url、rawPath、accessedAt；沒有外部來源不得虛構引用。
3. **決定更新哪裡。** 從 Wiki 索引找既有概念與課程。相同學習目標就補充原課；有不同目標才建新課。標出來源主張、綜合整理、個人實拍驗證或待驗證。有歧見時保留雙方出處與適用條件。
4. **設計練習並連回日誌。** 用自己的話寫短課，附一個能比較差異的任務。讀者可在本機課程頁上傳練習照，再寫日誌記錄觀察。更新來源與概念連結、課程與日誌的雙向關聯、Wiki 索引及紀錄。
5. **查詢與健檢。** 回答問題先從索引回查概念與來源；可重用的新結論寫回 Wiki。檢查孤立頁、重複概念、失效引用、無來源主張，以及 JSON 和 Wiki 是否說法不一致。

**助教可核對的實例：** 打開 `raw/sources/2026-11-04-white-balance.md`，對照 `wiki/concepts/daylight-practice.md`，再看第 7 課「窗光下的白杯：要保留多少暖色？」（white-balance）與「日間攝影練習簿：書脊、水流與白杯」（daylight-reading-plan）。同一題材在來源檔留下依據，在課程成為可操作的比較，在日誌則明確保留為待實拍計畫。

## 五、下一次可以怎麼交代 AI？

> 閱讀 AGENTS.md。我想新增〈雨後的倒影〉，目前只有觀察筆記，還沒有照片或拍攝參數。請建立拍攝計畫，沿用現有版型，回報文章網址與待補資料。

AI 應檢查 slug、在 journals.json 新增一筆示範計畫、讓列表自動帶出文章，再開啟內頁確認缺圖仍可閱讀。若日後補上真實作品，更新同一筆資料即可，原連結不變。

> 閱讀 AGENTS.md。把我附上的文章整理成一堂短課，讓我能比較同一場景的兩種拍法；如果已有相同目標，請更新舊課並保留新來源。

AI 應交付來源紀錄、更新後的概念或課程、具體練習與驗證結果。不得把尚未執行的練習寫成心得。更完整的操作範例見 `docs/ARTICLE_TO_LESSON.md`。

## 六、驗收、部署與繳交

- 在根目錄執行 `node scripts/validate.mjs`，檢查欄位、slug、順序、關聯、來源與圖片路徑。再以 `node scripts/serve.mjs` 啟動本機預覽（預設 8000，可由 PORT 指定）。不要直接雙擊 HTML。
- 實際走一次「首頁 → 列表 → 新文章 → 返回」，重新整理文章網址；檢查窄螢幕、鍵盤焦點、缺圖、無參數與無關聯文章。本機編輯後確認重新整理仍保留資料。回報異動檔案、slug、預覽方式、檢查結果與仍待補的真實資料。
- 公開內容提交至 GitHub 時，不得包含金鑰、密碼或私人資料。Repository 為 `https://github.com/huray1028/light-frame-journal`，並由 main 分支根目錄部署 GitHub Pages。每次推送後需實測公開首頁、文章直連、重新整理與圖片。
- 繳交標題：**學校 學號 系級 姓名 光影日誌**（學校、系級可簡稱）。繳交內容依序為：專案簡介、GitHub Repository 連結、公開網頁連結、本 AGENTS.md，以及「規則如何讓 AI 繼續新增內容」的簡短說明。可使用 `SUBMISSION.md` 草稿；學校、學號、系級與姓名仍由作者自行補上。期限為 11/16 23:59，遲交期限為 11/17 16:00。
