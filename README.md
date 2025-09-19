# Rewardia Chrome Extension

基於 Vite + React + JavaScript 開發的 Chrome 套件

## 專案結構

```
Rewardia_RV/
├── public/
│   └── manifest.json          # Chrome 套件設定檔
├── src/
│   ├── popup/                 # 彈出視窗
│   │   ├── Popup.jsx
│   │   ├── index.jsx
│   │   └── popup.html
│   ├── content/               # Content Script
│   │   └── content.js
│   ├── background/            # Background Script
│   │   └── background.js
│   └── shared/                # 共用元件和資源
│       ├── components/
│       ├── images/
│       └── *.css
├── dist/                      # 建置輸出目錄
├── vite.config.js
└── package.json
```

## 開發指令

```bash
# 安裝依賴
npm install

# 開發模式（監看檔案變化）
npm run dev

# 建置生產版本
npm run build
```

## 安裝到 Chrome

1. 執行 `npm run build` 建置專案
2. 開啟 Chrome 擴充功能管理頁面 (chrome://extensions/)
3. 開啟「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇 `dist/` 資料夾

## 功能

- Popup 介面：點擊套件圖示顯示 React 應用程式
- Content Script：在網頁中執行的腳本
- Background Script：背景服務程式
- Message Passing：各組件間的通訊機制