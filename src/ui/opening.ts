import { PLAYER_IDS, type GameConfig, type PlayerId } from '../contracts/game';
import type { Seating } from '../contracts/match';
import { createOpening, type OpeningStage } from '../mahjong/opening';
import { FLOWER_TILE_CODES, HONOR_TILE_CODES, SUIT_TILE_CODES, tileLabel, type TileCode } from '../mahjong/tiles';
import { tileFace } from './game';

const WIND={east:'東',south:'南',west:'西',north:'北'};
const person=(id:number)=>id===0?'你':`電腦 ${id}`;
const TITLES:Record<OpeningStage,string>={'seat-roll':'擲骰抓位','wind-draw':'抽一張風牌','dealer-roll':'擲骰起莊','wall-roll':'莊家另擲骰開門',ready:'開門完成'};
const modeText=(flowers:boolean)=>`${flowers?'144 張 · 每邊 18 墩':'136 張 · 每邊 17 墩；18 點跨邊繼續數'} · 玩家／骰子逆時針，取牌沿牌牆順時針`;
const galleryGroup=(title:string,codes:readonly TileCode[])=>`<section class="tile-gallery-group"><h3>${title}</h3><div>${codes.map(code=>`<span class="tile gallery-tile" title="${tileLabel(code)}" aria-label="${tileLabel(code)}">${tileFace({id:`gallery-${code}`,code})}</span>`).join('')}</div></section>`;
export function mountOpening(root:HTMLElement,config:Pick<GameConfig,'seed'|'ruleMode'>,start:(config:Omit<GameConfig,'gameId'>,seating:Seating)=>void,seating?:Seating,title?:string) {
  let flow=createOpening(config,seating),started=false,destroyed=false;
  function draw() {
    const v=flow.view(),rolled=v.stage!=='seat-roll';
    const dealerSeat=v.dealer===null?null:PLAYER_IDS.indexOf(v.seats[v.dealer]!);
    const relative=(identity:number)=>v.seats[identity]&&v.seats[0]?(PLAYER_IDS.indexOf(v.seats[identity]!)-PLAYER_IDS.indexOf(v.seats[0]!)+4)%4:identity;
    const roller=v.stage==='dealer-roll'?v.seats.indexOf('east'):v.stage==='wall-roll'?v.dealer:0;
    root.innerHTML=`<main class="opening-shell">
      <header class="opening-header"><span class="eyebrow">一桌麻將 · 開局</span><h1>擲骰，開一桌好牌。</h1><p>抓位 → 起莊 → 莊家另擲開門</p></header>
      <section class="opening-panel" aria-label="骰子開局">
        <div class="opening-options"><label>使用花牌 <input data-flowers type="checkbox" role="switch" ${v.ruleMode==='flowers'?'checked':''} ${rolled?'disabled':''}></label><label>牌局 Seed <input data-seed type="number" min="1" max="4294967295" value="${v.seed}" ${rolled?'disabled':''}></label></div>
        <p class="opening-mode">${modeText(v.ruleMode==='flowers')}</p>
        <details class="tile-gallery" open><summary>牌面圖鑑 · 42 種牌</summary><div class="tile-gallery-grid">${galleryGroup('條',SUIT_TILE_CODES.filter(code=>code.startsWith('B')))}${galleryGroup('萬',SUIT_TILE_CODES.filter(code=>code.startsWith('C')))}${galleryGroup('筒',SUIT_TILE_CODES.filter(code=>code.startsWith('D')))}${galleryGroup('風牌／三元牌',HONOR_TILE_CODES)}${galleryGroup('花牌',FLOWER_TILE_CODES)}</div></details>
        <div class="opening-table" aria-label="抓位座位圖">${v.seats.map((wind,id)=>`<div class="opening-seat opening-position-${relative(id)} ${id===v.dealer?'opening-dealer':''}"><strong>${person(id)}</strong><span>${wind?`抓位 ${WIND[wind]}`:'等待抽風牌'}</span>${dealerSeat!==null?`<span>本局 ${WIND[PLAYER_IDS[(PLAYER_IDS.indexOf(wind!)-dealerSeat+4)%4]]}家${id===v.dealer?' · 莊家':''}</span>`:''}</div>`).join('')}<div class="opening-center">↺<small>下 → 右 → 上 → 左</small></div></div>
        <div class="opening-step" aria-live="polite"><span class="eyebrow">${['seat-roll','wind-draw','dealer-roll','wall-roll','ready'].indexOf(v.stage)+1} / 5</span><h2>${TITLES[v.stage]}</h2>
        <p>${v.stage==='seat-roll'?'由你先擲骰，決定誰先抽風牌。':v.stage==='wind-draw'?`${person(v.firstDraw!)}先抽；電腦依序自動抽牌，現在請選一張剩餘牌背。`:v.stage==='dealer-roll'?`抽到東的${person(roller!)}擲骰，決定首任莊家。`:v.stage==='wall-roll'?`${person(v.dealer!)}是首任莊家，現在另擲三顆骰子決定開門。`:'座位與開門已決定，確認後才會發牌。'}</p></div>
        ${v.stage==='wind-draw'?`<div class="wind-cards">${v.cards.map((card,i)=>`<button class="wind-card" data-wind="${i}" ${card.owner!==null?'disabled':''} aria-label="${card.wind?`${person(card.owner!)}抽到${WIND[card.wind]}`:`抽第 ${i+1} 張風牌`}">${card.wind?WIND[card.wind]:'？'}<small>${card.owner!==null?person(card.owner):'風牌背面'}</small></button>`).join('')}</div>`:''}
        ${v.opening?`<p class="wall-opening-result">從抓位${WIND[PLAYER_IDS[v.opening.wallSeat]]}牆右端數 ${v.rolls.at(-1)!.total} 墩${v.opening.crossed?'，跨到下一邊':''}；從抓位${WIND[PLAYER_IDS[v.opening.startSeat]]}牆第 ${v.opening.skippedStacks+1} 墩開始取牌。</p>`:''}
        <div class="opening-actions">${['seat-roll','dealer-roll','wall-roll'].includes(v.stage)?`<button class="primary" data-roll>${roller===0?'擲骰':`讓${person(roller!)}擲骰`}</button>`:''}${v.stage==='ready'?'<button class="primary" data-deal>開始發牌</button>':''}</div>
        <div class="dice-history" aria-label="擲骰紀錄">${v.rolls.map(roll=>`<section><h3>${TITLES[roll.stage]} · ${person(roll.roller)}</h3><div class="dice-row">${roll.dice.map(d=>`<span class="dice-face" role="img" aria-label="${d} 點">${['','⚀','⚁','⚂','⚃','⚄','⚅'][d]}</span>`).join('')}<strong>合計 ${roll.total}</strong></div></section>`).join('')}</div>
        <p class="opening-error" role="alert"></p><p class="opening-footnote">擲骰者算 1 · 相同 Seed、規則與抽牌選擇可重現開局 · 東風一圈，不計台</p>
      </section></main>`;
    if(title) root.querySelector('.opening-header .eyebrow')!.textContent=title;
    if(seating) {
      root.querySelector('.opening-header h1')!.textContent='新的一局，重新開門。';
      root.querySelector('.opening-header p')!.textContent='保留抓位座位，由當局莊家擲骰開門。';
      root.querySelector('.opening-step .eyebrow')!.textContent=v.stage==='ready'?'2 / 2':'1 / 2';
      if(v.stage==='wall-roll') root.querySelector('.opening-step p')!.textContent=`${person(v.dealer!)}是當局莊家，擲三顆骰子決定本局開門。`;
    }
  }
  function click(event:Event) {
    if(started||destroyed) return;
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if(!button||!root.contains(button)||button.disabled) return;
    try {
      if(button.hasAttribute('data-roll')) {
        if(flow.view().stage==='seat-roll') {
          const seed=Number((root.querySelector('[data-seed]') as HTMLInputElement).value);
          const ruleMode=(root.querySelector('[data-flowers]') as HTMLInputElement).checked?'flowers':'no-flowers';
          flow=createOpening({seed,ruleMode});
        }
        flow.roll();draw();
      } else if(button.hasAttribute('data-wind')) {flow.drawWind(Number(button.dataset.wind));draw();}
      else if(button.hasAttribute('data-deal')) {
        const ready=flow.gameConfig(),v=flow.view();started=true;button.disabled=true;
        start(ready,{seats:v.seats as PlayerId[],dealer:v.dealer!});
      }
    } catch(error) {root.querySelector('.opening-error')!.textContent=error instanceof Error?error.message:'開局失敗';}
    if(!destroyed) root.querySelector<HTMLElement>('[data-roll], [data-wind]:not(:disabled), [data-deal]')?.focus();
  }
  function change(event:Event) {
    const target=event.target as HTMLInputElement;
    if(target.matches('[data-flowers]')&&flow.view().stage==='seat-roll') root.querySelector('.opening-mode')!.textContent=modeText(target.checked);
  }
  root.addEventListener('click',click);root.addEventListener('change',change);draw();
  return {destroy(){destroyed=true;root.removeEventListener('click',click);root.removeEventListener('change',change);root.replaceChildren();}};
}
