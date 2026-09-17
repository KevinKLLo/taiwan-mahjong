## Why

目前玩家固定東家／莊家，沒有抓位、起莊及開門流程。加入實際影響牌局的骰子，並依使用者最新決定將桌面輪序改為逆時針。

## What Changes

- 三顆骰子決定抓位先抽者，抽風牌排座，抽到東者擲骰起莊，首任莊家另擲骰開門。
- 擲骰者算 1，依逆時針數位。玩家固定畫面下方但不固定東家或莊家。
- 開門實際改變牌牆取牌起點；無花牌 17 墩遇到骰子 18，依使用者決定跨下一邊繼續數。
- 既有吃碰槓胡、補花與單局規則不變；不加入連莊、輪莊與計台。

## Capabilities

### New Capabilities

- `dice-opening`: 抓位、起莊、開門、相對座位與可重現的開局流程。

### Modified Capabilities

無（現有桌面 change 尚未 archive 至主規格；本 change 取代其固定東家與順時針的對應需求）。

## Impact

src/mahjong、contracts、session、main、ui、styles 與相應測試；桌面打包新目錄，不覆蓋既有 App，不新增套件。
