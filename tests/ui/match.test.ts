// @vitest-environment happy-dom
import {expect,it,vi} from 'vitest';
import {mountGame} from '../../src/ui/game';
import {makeFixture} from '../../src/contracts/fixtures';
import {createMatch,finishRound,advanceRound,matchView} from '../../src/mahjong/match';

function match(complete=false) {
  let m=createMatch({seed:42,ruleMode:'flowers'},{seats:['east','south','west','north'],dealer:0});
  if(complete) for(let i=0;i<3;i++) m=advanceRound(finishRound(m,`g${i}`,{kind:'self-draw',winner:'west',reason:'胡'}));
  return matchView(finishRound(m,'end',{kind:'self-draw',winner:complete?'west':'east',reason:'胡'}));
}
it('顯示連莊安排，下一局只傳一次目前 gameId，完圈不提供續局',()=>{
  const root=document.createElement('div'),next=vi.fn(),ui=mountGame(root,{onAction:vi.fn(),onNewGame:vi.fn(),onNextRound:next});
  ui.render({...makeFixture('draw'),match:match()});
  expect(root.textContent).toContain('連莊 1');
  const button=root.querySelector<HTMLButtonElement>('[data-next-round]')!;expect(button).not.toBeNull();button.click();button.click();
  expect(next).toHaveBeenCalledExactlyOnceWith('fixture');
  ui.render({...makeFixture('draw'),gameId:'final',match:match(true)});
  expect(root.textContent).toContain('東風一圈完成');expect(root.querySelector('[data-next-round]')).toBeNull();
  expect(root.querySelectorAll('.round-record')).toHaveLength(4);ui.destroy();
});
it('單局結束但圈未完，重開仍需確認，取消保留進度',()=>{
  const root=document.createElement('div'),restart=vi.fn(),ui=mountGame(root,{onAction:vi.fn(),onNewGame:restart,onNextRound:vi.fn()});
  ui.render({...makeFixture('draw'),match:match()});
  const click=(s:string)=>root.querySelector<HTMLButtonElement>(s)!.click();
  click('[data-settings]');click('[data-start]');
  expect(root.querySelector('[role="alertdialog"]')?.textContent).toContain('本圈');
  click('[data-cancel]');expect(restart).not.toHaveBeenCalled();expect(root.textContent).toContain('連莊 1');
  click('[data-settings]');click('[data-start]');click('[data-confirm]');expect(restart).toHaveBeenCalledTimes(1);ui.destroy();
});
