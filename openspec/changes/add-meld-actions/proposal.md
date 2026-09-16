## Why

使用者要求補齊基本吃碰槓，並確認吃僅限上家、碰可對三家、明槓不可槓上家；明槓補牌仍可自摸。此次實作授權取代舊 MVP 不含吃碰槓的範圍限制。

## What Changes

- 加入吃、碰、明槓、暗槓、加槓，以及加槓搶胡與補牌。
- 回應依胡、碰／明槓、吃排序；不設過水，保留最近下家優先胡牌。
- 五面子一將包含副露；UI 顯示組合、來源與合法操作，AI 支援所有新動作。

## Capabilities

### New Capabilities
- `meld-actions`: 吃碰槓回合、優先權、資訊隔離及操作。

### Modified Capabilities
無已同步主 spec；本 change 明確取代 desktop-playable-mvp 中「不提供吃碰槓」的限制，其餘桌規保留。合併主 specs 時須一併調整，不自動 archive。

## Impact

修改 contracts、Core、AI、UI、測試與 README。不新增依賴，不做計台、連線、存檔。舊桌面原生驗收與 main 合併仍待完成，不把既有 .app 誤當新版。
