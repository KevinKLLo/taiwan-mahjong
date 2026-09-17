// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { mountGame } from '../../src/ui/game';
import { makeFixture } from '../../src/contracts/fixtures';
import { PLAYER_IDS } from '../../src/contracts/game';
import { createGame,getPlayerView } from '../../src/mahjong/game';

it('四種人類門風皆在下方，相對下一家在右，莊家標記只給東',()=>{
  document.head.innerHTML='<style>'+readFileSync('src/styles.css','utf8')+'</style>';
  const root=document.createElement('div');document.body.append(root);
  const ui=mountGame(root,{onAction(){},onNewGame(){}});
  for(const [index,viewer] of PLAYER_IDS.entries()) {
    ui.render(getPlayerView(createGame({seed:1,ruleMode:'no-flowers',gameId:viewer,viewer}),viewer));
    expect(root.querySelector('.own-avatar')!.textContent).toBe(['東','南','西','北'][index]);
    expect(root.querySelector('.own-river .river')!.getAttribute('aria-label')).toBe(['東家牌河','南家牌河','西家牌河','北家牌河'][index]);
    expect(root.querySelectorAll('.dealer')).toHaveLength(1);
    expect(root.querySelector('.player-dock .dealer')!==null).toBe(viewer==='east');
    for(const [offset,column,row] of [[1,'3','2'],[2,'2','1'],[3,'1','2']] as const) {
      const style=getComputedStyle(root.querySelector(`.seat-${PLAYER_IDS[(index+offset)%4]}`)!);
      expect(style.gridColumn).toBe(column);expect(style.gridRow).toBe(row);
    }
  }
  ui.destroy();root.remove();document.head.innerHTML='';
});

it('桌面逆時針輪序的位置為南右、西上、北左',()=>{
  document.head.innerHTML='<style>'+readFileSync('src/styles.css','utf8')+'</style>';
  document.body.innerHTML='<div id="app"></div>';
  const root=document.querySelector<HTMLElement>('#app')!;
  const ui=mountGame(root,{onAction(){},onNewGame(){}});
  ui.render(makeFixture());
  for(const [seat,column,row] of [['south','3','2'],['west','2','1'],['north','1','2']]) {
    const style=getComputedStyle(root.querySelector(`.seat-${seat}`)!);
    expect(style.gridColumn).toBe(column); expect(style.gridRow).toBe(row);
  }
  ui.destroy();document.head.innerHTML='';
});
it('行動提示跟隨實際回應者，不依 DOM 排序猜測下一家',()=>{
  document.body.innerHTML='<div id="app"></div>';
  const root=document.querySelector<HTMLElement>('#app')!,ui=mountGame(root,{onAction(){},onNewGame(){}});
  for(const [i,actor] of (['south','west','north'] as const).entries()) {
    ui.render({...makeFixture(),revision:i,currentPlayer:'east',actingPlayer:actor,phase:'awaiting-meld-response',legalActions:[]});
    expect(root.querySelectorAll('.seat.is-acting')).toHaveLength(1);
    expect(root.querySelector(`.seat-${actor}`)?.classList.contains('is-acting')).toBe(true);
  }
  ui.destroy();
});
