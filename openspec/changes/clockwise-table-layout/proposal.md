## Why
使用者優先要求階段 0：出牌在畫面上呈順時針，並提供更新 App 測試。
## What Changes
- 僅改 UI 座位：東下、南左、西上、北右；維持既有東南西北引擎輪序及吃碰槓桌規。
- 行動框持續跟隨 actingPlayer，含插入回合。小視窗維持相同方位。
## Capabilities
### New Capabilities
- `clockwise-table`: 順時針牌桌配置。
### Modified Capabilities
無。
## Impact
UI 樣式、UI 測試；重新打包至独立 release 目錄，保留舊 App。不加入階段 1–4 規則。
