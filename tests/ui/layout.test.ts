// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { mountGame } from '../../src/ui/game';
import { makeFixture } from '../../src/contracts/fixtures';

it('桌面正常輪序的位置為南左、西上、北右',()=>{
  document.head.innerHTML='<style>'+readFileSync('src/styles.css','utf8')+'</style>';
  document.body.innerHTML='<div id="app"></div>';
  const root=document.querySelector<HTMLElement>('#app')!;
  const ui=mountGame(root,{onAction(){},onNewGame(){}});
  ui.render(makeFixture());
  for(const [seat,column,row] of [['south','1','2'],['west','2','1'],['north','3','2']]) {
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
