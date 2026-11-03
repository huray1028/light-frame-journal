# Source records

此資料夾保存使用者交給 Agent 的外部文章、影片逐字稿、PDF 或個人筆記之來源紀錄。

## 命名

`YYYY-MM-DD-source-slug.md`

例如：`2026-11-03-example-composition-article.md`

## 保存原則

- 外部文章：保存作者、標題、網址、存取日期、精簡摘要與必要短引文，不複製整篇。
- 使用者自己的筆記：可以完整保存，但仍需標示來源類型。
- 無法存取的文章：記錄為 `blocked`，不可根據標題自行生成教程。
- 已處理來源：在 `derived_lessons` 與 `related_concepts` 填入對應連結。
- 與其他來源矛盾時，保留雙方資訊與適用條件。

新增來源時請複製 [`TEMPLATE.md`](TEMPLATE.md)，完成後同步更新 `wiki/index.md` 與 `wiki/log.md`。

