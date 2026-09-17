## Context

引擎以 east/south/west/north 代表當局門風。session 及 UI 另有固定玩家為 east 的假設。保留引擎輪序與吃碰槓判定，改變人類 viewer 與相對桌面映射。

## Goals / Non-Goals

實作 proposal 範圍；不改舊 createGame 未傳開門設定時的重播結果。不提供實體手動砌牌動畫、計台或下一局輪莊。

## Decisions

- 開局為獨立狀態機：seat-roll → wind-draw → dealer-roll → wall-roll → ready。首次抓位以玩家為臨時擲骰者（介面入口）；依骰數安排抽取順序，AI 自動抽，人類選剩餘牌背。
- 獨立 seeded random stream 產生骰子及風牌，不因 UI 重畫消耗亂數。UI 僅拿已公開的風牌與已擲骰。
- 玩家 identity 使用 0..3，抽風座位存 wind，起莊後依新莊家換算當局 PlayerId。引擎仍由 east 開始，session 改為可配置 viewer。
- 牌牆陣列按抓位後東、北、西、南的順時針取牆方向排列。先定位開門牆，再跳過骰子總和乘 2 張；以總牌數取模處理跨邊。新流程每次各取 4 張、四輪後莊家多 1 張，補花沿用既有尾補。
- UI 保留絕對 seat-id 供語意查詢，新增相對 left/top/right class 決定位置。人類頭像、牌河與莊家標記依 viewer 產生。
- 重開先 pause session，取消 timer 並變更 generation，完整開門後才 newGame。所有開局點擊透過狀態檢查避免跳步或重複啟動。

## Risks / Trade-offs

- 換座造成控制權或資訊洩漏 → 四種 viewer 測試與 AI 莊家情境。
- 墩／張 off-by-one → 17/18 墩邊界、跨邊及發牌結果斷言。
- 原有回放變動 → 保留未指定開門設定的 API 相容路徑。
- 本階段沿用自動補花，不模擬實體補花儀式。

## Migration Plan

驗證後輸出 release/dice-opening 下的獨立未簽章 App；保留先前 App 供回復。未經指示不 commit、sync 或 archive。
