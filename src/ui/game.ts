import type { GameAction, GameUI, PlayerId, PlayerView, Tile, UIHandlers, VisibleMeld } from '../contracts/game';
import { tileLabel, NORMAL_TILE_CODES, type TileCode } from '../mahjong/tiles';
import { PLAYER_IDS } from '../contracts/game';

const SEATS: Record<PlayerId, string> = { east: '東家', south: '南家', west: '西家', north: '北家' };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
const TILE_ASSETS: Record<TileCode, string> = {
  C1:'01_characters_1wan.svg', C2:'02_characters_2wan.svg', C3:'03_characters_3wan.svg', C4:'04_characters_4wan.svg', C5:'05_characters_5wan.svg', C6:'06_characters_6wan.svg', C7:'07_characters_7wan.svg', C8:'08_characters_8wan.svg', C9:'09_characters_9wan.svg',
  B1:'10_bamboo_1suo.svg', B2:'11_bamboo_2suo.svg', B3:'12_bamboo_3suo.svg', B4:'13_bamboo_4suo.svg', B5:'14_bamboo_5suo.svg', B6:'15_bamboo_6suo.svg', B7:'16_bamboo_7suo.svg', B8:'17_bamboo_8suo.svg', B9:'18_bamboo_9suo.svg',
  D1:'19_dots_1tong.svg', D2:'20_dots_2tong.svg', D3:'21_dots_3tong.svg', D4:'22_dots_4tong.svg', D5:'23_dots_5tong.svg', D6:'24_dots_6tong.svg', D7:'25_dots_7tong.svg', D8:'26_dots_8tong.svg', D9:'27_dots_9tong.svg',
  F5:'28_flower_plum.svg', F6:'29_flower_orchid.svg', F8:'30_flower_chrysanthemum.svg', F7:'31_flower_bamboo.svg', F1:'32_flower_spring.svg', F2:'33_flower_summer.svg', F3:'34_flower_autumn.svg', F4:'35_flower_winter.svg',
  WE:'36_honor_east.svg', WS:'37_honor_south.svg', WW:'38_honor_west.svg', WN:'39_honor_north.svg', DR:'40_honor_red_dragon.svg', DG:'41_honor_green_dragon.svg', DW:'42_honor_white_dragon.svg',
};
export function tileFace(tile: Tile): string {
  return `<img class="tile-svg" src="${import.meta.env.BASE_URL}tiles/${TILE_ASSETS[tile.code]}" alt="" aria-hidden="true">`;
}
function exposed(tiles: Tile[], empty: string): string {
  return tiles.length ? tiles.map(tile => `<span class="tile tile-small" title="${escape(tileLabel(tile.code))}" aria-label="${escape(tileLabel(tile.code))}">${tileFace(tile)}</span>`).join('') : `<span class="empty">${empty}</span>`;
}
const MELD_NAMES = {chi:'吃',pon:'碰','open-kan':'明槓','closed-kan':'暗槓','added-kan':'加槓'};
function melds(groups: VisibleMeld[], seat:PlayerId):string {
  return `<div class="meld-zone" aria-label="${SEATS[seat]}副露">${groups.map(m=>`<div class="meld-group"><span class="zone-label">${MELD_NAMES[m.type]}${m.from?` · ${SEATS[m.from]}`:''}</span><div>${m.tiles?exposed(m.tiles,''):Array.from({length:4},()=>'<span class="tile-back" aria-hidden="true"></span>').join('')}</div></div>`).join('')}</div>`;
}

export function mountGame(root: HTMLElement, handlers: UIHandlers): GameUI {
  let view: PlayerView | null = null;
  let selected: string | null = null;
  let submitted: string | null = null;
  let nextRequested: string | null = null;
  let error = '';
  let dialog: 'settings' | 'confirm' | null = null;
  let draft = { seed: 42, ruleMode: 'flowers' as PlayerView['ruleMode'] };
  let returnFocus: HTMLElement | null = null;
  const revisionKey = () => view ? `${view.gameId}:${view.revision}` : '';
  const available = () => view && view.phase !== 'finished' && view.actingPlayer === view.viewer && submitted !== revisionKey() ? view.legalActions.filter(action => action.playerId === view!.viewer) : [];

  function draw(): void {
    if (!view) return;
    const actions = available();
    const canDiscard = view.actingPlayer === view.viewer && view.phase === 'awaiting-discard' && view.legalActions.some(action => action.type === 'discard');
    const canWin = actions.some(action => action.type === 'win');
    const canPass = actions.some(action => action.type === 'pass');
    const own = view.players.find(player => player.id === view!.viewer)!;
    const orderedHand = [...(own.hand ?? [])].sort((a,b) =>
      Number(a.id === view!.drawnTileId) - Number(b.id === view!.drawnTileId)
      || NORMAL_TILE_CODES.indexOf(a.code) - NORMAL_TILE_CODES.indexOf(b.code));
    const mode = view.ruleMode === 'flowers' ? '有花牌 · 144 張' : '無花牌 · 136 張';
    const selectedTile = own.hand?.find(tile => tile.id === selected);
    const position=(id:PlayerId)=>['bottom','right','top','left'][(PLAYER_IDS.indexOf(id)-PLAYER_IDS.indexOf(view!.viewer)+4)%4];
    root.innerHTML = `<div class="game-shell">
      <header class="app-header"><div class="wordmark"><span class="brand-tile" aria-hidden="true">東</span><div><h1>一桌麻將</h1><span>TAIWANESE MAHJONG</span></div></div><div class="header-actions"><span class="offline-dot">單機練習</span><button class="quiet" data-settings>牌局設定</button></div></header>
      <main class="game-main"><div class="table-heading"><div><span class="eyebrow">十六張 · 單局</span><span class="mode-badge" data-mode>${mode}</span></div><span class="table-note">摸打與胡牌 · 不計台</span></div>
      <section class="felt" aria-label="四方麻將牌桌">
        ${view.players.filter(player => player.id !== view!.viewer).map(player => `<section class="seat seat-${player.id} seat-${position(player.id)} ${view!.actingPlayer === player.id ? 'is-acting' : ''}" aria-label="${SEATS[player.id]}">
          <div class="seat-heading"><span class="seat-avatar">${SEATS[player.id][0]}</span><div><h2>${SEATS[player.id]} <span>電腦</span>${player.id==='east'?'<span class="dealer">莊家</span>':''}</h2><p>${player.handCount} 張手牌${view!.actingPlayer === player.id ? ' · 行動中' : ''}</p></div></div>
          <div class="opponent-hand" aria-label="${player.hand === null ? '暗牌' : '終局手牌'}">${player.hand === null ? Array.from({length: player.handCount}, () => '<span class="tile-back" aria-hidden="true"></span>').join('') : exposed(player.hand, '無手牌')}</div>
          <div class="flower-line"><span class="zone-label">花</span>${exposed(player.flowers, '—')}</div>
          ${melds(player.melds,player.id)}
          <div class="river" aria-label="${SEATS[player.id]}牌河">${exposed(player.discards, '尚未出牌')}</div>
        </section>`).join('')}
        <section class="table-center" aria-label="目前牌局狀態"><div class="compass" aria-hidden="true">東</div><div class="wall-count"><strong>${view.wallRemaining}</strong><span>牌牆剩餘</span></div>${view.lastDiscard ? `<div class="last-discard"><span>${SEATS[view.lastDiscard.playerId]}打出</span><span class="tile">${tileFace(view.lastDiscard.tile)}</span></div>` : '<p class="center-note">一局一會<br>慢慢打，好好玩。</p>'}</section>
        <section class="own-river"><span class="zone-label">你的牌河</span><div class="river" aria-label="${SEATS[own.id]}牌河">${exposed(own.discards, '選一張手牌，開始這一局')}</div><div class="flower-line"><span class="zone-label">你的花牌</span>${exposed(own.flowers, '—')}</div></section>
      </section>
      <section class="player-dock" aria-label="你的手牌與操作"><div class="dock-heading"><div class="seat-heading"><span class="seat-avatar own-avatar">${SEATS[own.id][0]}</span><div><h2>你 · ${SEATS[own.id]} ${own.id==='east'?'<span class="dealer">莊家</span>':''}</h2><p>${own.handCount} 張手牌</p></div></div><p class="turn-status" role="status">${escape(view.phase === 'finished' ? '本局結束' : submitted === revisionKey() ? '處理中…' : view.message)}</p></div>
        ${melds(own.melds,own.id)}
        <div class="hand" aria-label="你的手牌">${orderedHand.map(tile => {
          const allowed = actions.some(action => action.type === 'discard' && action.tileId === tile.id);
          return `<button class="tile hand-tile ${selected === tile.id ? 'selected' : ''} ${view!.drawnTileId === tile.id ? 'drawn' : ''}" data-tile-id="${escape(tile.id)}" aria-label="${escape(tileLabel(tile.code))}${view!.drawnTileId === tile.id ? '，新摸牌' : ''}" aria-pressed="${selected === tile.id}" ${allowed ? '' : 'disabled'}>${tileFace(tile)}${view!.drawnTileId === tile.id ? '<span class="drawn-label">新摸</span>' : ''}</button>`;
        }).join('')}</div>
        <div class="action-row"><p class="action-hint">${canDiscard ? selectedTile ? `已選 ${escape(tileLabel(selectedTile.code))}，確認後打出` : '點選手牌，再確認出牌' : view.phase === 'finished' ? '單局練習 · 不計台、不連莊' : canPass ? '這張牌可以胡。你也可以選擇過。' : `等待${view.actingPlayer ? SEATS[view.actingPlayer] : '牌局'}行動…`}</p><div class="action-buttons">${canPass ? '<button class="secondary" data-action="pass">過</button>' : ''}${canWin ? `<button class="win-button" data-action="win">${view.phase === 'awaiting-win-response' ? '胡牌' : '自摸'}</button>` : ''}${canDiscard ? `<button class="primary" data-action="discard" ${selectedTile && submitted !== revisionKey() ? '' : 'disabled'}>確認出牌 <span aria-hidden="true">↗</span></button>` : ''}${view.phase === 'finished' ? '<button class="primary" data-new-game>再開一局</button>' : ''}</div></div>
      </section>
      ${view.outcome ? `<section class="result" aria-label="本局結果"><span class="eyebrow">ROUND COMPLETE</span><h2>${view.outcome.kind === 'draw' ? '流局' : `${SEATS[view.outcome.winner!]}${view.outcome.kind === 'self-draw' ? '自摸' : '胡牌'}`}</h2><p>${escape(view.outcome.reason)}</p>${view.outcome.from ? `<p>${SEATS[view.outcome.from]}放槍</p>` : ''}</section>` : ''}
      <p class="game-error" role="alert">${escape(error)}</p><footer class="app-footer"><span>一人一桌，隨時開局。</span><span>有花／無花 · 離線遊玩</span></footer></main>
      <div class="modal-host"></div></div>`;
    if(canPass) root.querySelector('.action-hint')!.textContent=canWin?'可胡牌，也可選擇過。':'選擇吃碰槓組合，或選擇過。';
    const extra=actions.map((action,index)=>{
      if(!(action.type in MELD_NAMES)) return '';
      const tiles=action.type==='chi'?(own.hand??[]).filter(t=>action.tileIds.includes(t.id)):'tileId' in action?(own.hand??[]).filter(t=>t.id===action.tileId):[];
      const label=MELD_NAMES[action.type as keyof typeof MELD_NAMES];
      return `<button class="secondary" data-meld-action="${index}">${label}${tiles.length?` · ${tiles.map(t=>escape(tileLabel(t.code))).join('＋')}`:''}</button>`;
    }).join('');
    const actionHost=root.querySelector('.action-buttons')!;
    actionHost.innerHTML=extra+actionHost.innerHTML;
    if(view.pendingKan) root.querySelector('.table-center')!.insertAdjacentHTML('beforeend',`<p class="rob-kan">${SEATS[view.pendingKan.playerId]}加槓 ${escape(tileLabel(view.pendingKan.tile.code))} · 等待搶槓回應</p>`);
    root.querySelector('.table-note')!.textContent='吃碰槓胡 · 不計台';
    root.querySelector('.compass')!.textContent='↺';
    if(view.openingSummary) {
      const summary=document.createElement('p');summary.className='opening-summary';summary.textContent=view.openingSummary;
      root.querySelector('.table-heading')!.after(summary);
    }
    if(view.match) {
      const m=view.match,person=(id:number)=>id===0?'你':`電腦 ${id}`;
      const label=`東${['一','二','三','四'][m.dealerChanges]}局 · 連莊 ${m.continuations} · 第 ${m.roundNumber} 手`;
      root.querySelector('.table-heading .eyebrow')!.textContent='十六張 · 東風一圈';
      const progress=document.createElement('p');progress.className='match-progress';
      progress.textContent=`${label} · 莊家：${person(m.dealer)} · 已下莊 ${m.status==='complete'?4:m.dealerChanges} / 4 次`;
      root.querySelector('.table-heading')!.after(progress);
      if(view.phase==='finished') {
        root.querySelector('.turn-status')!.textContent=m.status==='complete'?'東風一圈完成':'本局結束';
        root.querySelector('.action-hint')!.textContent='東風一圈 · 不計台';
        const restart=root.querySelector<HTMLElement>('[data-new-game]')!;
        restart.textContent='重新開圈';restart.className='secondary';
        if(m.status==='between-rounds'&&handlers.onNextRound) restart.insertAdjacentHTML('beforebegin',`<button class="primary" data-next-round ${nextRequested===view.gameId?'disabled':''}>下一局 · 擲骰開門</button>`);
        const result=root.querySelector('.result');
        if(result) {
          const next=m.next;
          const summary=m.status==='complete'?'四次下莊完成，本圈結束。':next?`${next.dealer===m.dealer?'莊家續莊':'由下家接莊'}：${person(next.dealer)} · 東${['一','二','三','四'][next.dealerChanges]}局 · 連莊 ${next.continuations}`:'';
          result.insertAdjacentHTML('beforeend',`<div class="match-result"><h3>${m.status==='complete'?'東風一圈完成':'下一局安排'}</h3><p>${summary}</p><details ${m.status==='complete'?'open':''}><summary>本圈紀錄（${m.history.length} 手）</summary><ol>${m.history.map(h=>`<li class="round-record">第 ${h.roundNumber} 手 · 東${['一','二','三','四'][h.dealerChanges]}局 · 連莊 ${h.continuations} · 莊家 ${person(h.dealer)}：${h.kind==='draw'?'流局':`${person(h.winner!)}${h.kind==='self-draw'?'自摸':'胡牌'}`}${h.from!==undefined?`，${person(h.from)}放槍`:''}</li>`).join('')}</ol></details></div>`);
        }
      }
    }
    drawDialog();
  }
  function drawDialog(): void {
    const host = root.querySelector('.modal-host');
    if (!host || !dialog) return;
    host.innerHTML = `<div class="modal-overlay"><section class="modal" role="${dialog === 'confirm' ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="dialog-title"><span class="eyebrow">NEW ROUND</span><h2 id="dialog-title">${dialog === 'confirm' ? '放棄目前牌局？' : '開一桌新牌局'}</h2>${dialog === 'confirm' ? '<p>目前牌局的進度將會結束，並使用新的設定重新發牌。</p><div class="modal-actions"><button class="secondary" data-cancel>繼續本局</button><button class="primary" data-confirm>確認重新開局</button></div>' : `<p>你是東家，與三位電腦玩家一起練習。</p><label class="rule-toggle" for="use-flowers"><span>使用花牌<small>春夏秋冬、梅蘭竹菊，遇花自動補牌</small></span><input id="use-flowers" type="checkbox" role="switch" ${draft.ruleMode === 'flowers' ? 'checked' : ''}></label><details><summary>進階設定</summary><label class="seed-label" for="seed">牌局 Seed</label><input id="seed" type="number" min="1" max="4294967295" step="1" value="${draft.seed}"><p class="seed-help">相同規則與 Seed 可重現相同起始牌局。</p></details><p class="settings-error" role="alert"></p><div class="modal-actions"><button class="secondary" data-cancel>取消</button><button class="primary" data-start>開始新牌局</button></div>`}</section></div>`;
    (host.querySelector('[data-cancel]') as HTMLElement)?.focus();
    if(dialog==='settings') {
      host.querySelector('.modal > p')!.textContent='與三位電腦玩家一起抓位、起莊，再擲骰開門。你固定顯示於下方。';
      host.querySelector('.seed-help')!.textContent='相同規則、Seed 與抽牌選擇可重現相同起始牌局。';
    }
    if(view?.match) {
      host.querySelector('#dialog-title')!.textContent=dialog==='confirm'?'放棄本圈進度？':'開一圈新牌局';
      if(dialog==='confirm') {
        host.querySelector('.modal > p')!.textContent='目前本圈的進度與紀錄將會清除，重新抓位與起莊。';
        host.querySelector('[data-confirm]')!.textContent='確認重新開圈';
      }
    }
  }
  function closeDialog(): void {
    dialog = null;
    draw();
    if (returnFocus?.isConnected) returnFocus.focus();
    else (root.querySelector('[data-settings]') as HTMLElement)?.focus();
  }
  function openSettings(target: HTMLElement): void {
    if (!view) return;
    draft = {seed: view.match?.baseSeed??view.seed, ruleMode: view.ruleMode};
    returnFocus = target;
    dialog = 'settings';
    drawDialog();
  }
  function submit(action: GameAction): void {
    if (!view || !available().some(candidate => JSON.stringify(candidate) === JSON.stringify(action))) return;
    const envelope = {gameId: view.gameId, revision: view.revision, action};
    submitted = revisionKey();
    draw();
    handlers.onAction(envelope);
  }
  function onClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target || !root.contains(target) || (target as HTMLButtonElement).disabled || !view) return;
    if(target.hasAttribute('data-next-round')) {
      if(view.phase==='finished'&&view.match?.status==='between-rounds'&&nextRequested!==view.gameId&&handlers.onNextRound) {
        nextRequested=view.gameId;draw();handlers.onNextRound(view.gameId);
      }
      return;
    }
    if (target.hasAttribute('data-settings') || target.hasAttribute('data-new-game')) return openSettings(target);
    if (target.hasAttribute('data-cancel')) return closeDialog();
    if (target.hasAttribute('data-confirm')) { closeDialog(); handlers.onNewGame({...draft}); return; }
    if (target.hasAttribute('data-start')) {
      const seed = Number((root.querySelector('#seed') as HTMLInputElement).value);
      if (!Number.isInteger(seed) || seed < 1 || seed > 4294967295) {
        root.querySelector('.settings-error')!.textContent = '請輸入 1 到 4294967295 的整數 Seed。';
        (root.querySelector('#seed') as HTMLInputElement).focus(); return;
      }
      draft = {seed, ruleMode: (root.querySelector('#use-flowers') as HTMLInputElement).checked ? 'flowers' : 'no-flowers'};
      if (view.phase !== 'finished'||(view.match&&view.match.status!=='complete')) { dialog = 'confirm'; drawDialog(); }
      else { closeDialog(); handlers.onNewGame({...draft}); }
      return;
    }
    if (target.dataset.tileId) {
      selected = target.dataset.tileId;
      if (!dialog) draw();
      Array.from(root.querySelectorAll<HTMLElement>('[data-tile-id]')).find(button => button.dataset.tileId === selected)?.focus();
      return;
    }
    const type = target.dataset.action;
    if(target.dataset.meldAction!==undefined) {
      const action=available()[Number(target.dataset.meldAction)];
      if(action) submit(action);
      return;
    }
    if (type === 'discard' && selected) submit({type, playerId: view.viewer, tileId: selected});
    else if (type === 'win' || type === 'pass') submit({type, playerId: view.viewer});
  }
  function onKey(event: KeyboardEvent): void {
    if (!dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
    if (event.key === 'Tab') {
      const focusable = Array.from(root.querySelectorAll<HTMLElement>('.modal button, .modal input, .modal summary')).filter(element => !element.closest('details:not([open])') || element.tagName === 'SUMMARY');
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  return {
    render(next) {
      const changed = !view || next.gameId !== view.gameId || next.revision !== view.revision;
      if (changed) { selected = null; submitted = null; nextRequested=null; error = ''; }
      if (view && next.gameId !== view.gameId) dialog = null;
      view = next;
      if (!dialog) draw();
    },
    showError(message) { error = message; submitted = null; draw(); },
    destroy() { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); root.replaceChildren(); view = null; },
  };
}
