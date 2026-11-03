# Journal images

個人實拍照片依日誌 slug 分資料夾保存：

```text
assets/images/journals/<journal-slug>/cover.jpg
assets/images/journals/<journal-slug>/01.jpg
assets/images/journals/<journal-slug>/02.jpg
```

規則：

- 檔名只使用小寫英文字母、數字與連字號。
- `cover` 填代表照片；`photos` 可放其餘作品。
- 每張照片都需在 JSON 物件中附上可理解的替代文字；若目前 schema 尚無獨立說明欄，頁面會使用文章標題組成基本 alt。
- 不提交不想公開的原始檔、位置資訊或個人敏感資料。
- 不使用網路照片或生成圖片冒充個人實拍作品。
