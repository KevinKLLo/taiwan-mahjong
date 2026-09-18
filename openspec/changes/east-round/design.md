## Context

引擎每手以 east 為莊家；opening 保存實體玩家 identity 與抓位 wind。session 已有動態 viewer 與 pause。需求見 proposal，四項桌規由使用者以 ok 確認。

## Goals / Non-Goals

將圈進度與單局引擎分離，保留現有單局 API 及測試。非目標：計台、全四圈、存檔、換位及吃碰槓規則更動。

## Decisions

- mahjong/match.ts 為純規則，保存 seats、dealer identity、下莊數、連莊數、實際手數、結果歷史。結果階段保留本局 metadata，next 保存下局安排，按下一局後才套用。
- GameOutcome 的 wind 映射為固定 identity 寫入歷史，避免換莊後把胡牌者誤認為另一人。
- 每手 seed 由初始 seed 與手數確定性衍生，第一手保持原值；圈中不能改規則，重開圈才可改。連莊亦重新洗牌及擲骰，允許點數巧合相同。
- opening 接受可選既有 seating，直接從 wall-roll 起步；其 UI 沿用牌牆跨邊與骰子紀錄，第一局仍完整抓位。
- match-session 包裝既有 session，使用 gameId 與 opening generation 隔離重複續局、過期回呼與舊 AI。UI 只收到公開圈摘要，不取得暗牌或牌牆。
- 結果頁顯示下一局安排與每手紀錄。圈結束保留最終結果；重新開圈沿用設定確認流程，圈進行中單局結束亦需確認。

## Risks / Trade-offs

- 身分與風位混淆 → 規則測試驗證實體下家接莊、四種 viewer 與 UI 相對位置沿用。
- 連莊數與下莊數混淆 → 莊胡後流局、多次連莊、第四任莊家案例。
- 重複點擊造成跳局 → gameId、phase、generation 三層檢查及整合測試。
- Browser 很難自然遇到所有終局 → 使用 tests/browser 下的開發專用 fixture，production dist 不包含測試入口；自然牌局及自動重播另驗證。

## Migration Plan

輸出獨立 release/east-round App，保留前版。更新 README 與驗收紀錄；不自動 commit、sync 或 archive。
