// @vitest-environment happy-dom
import { expect,it,vi } from 'vitest';
import { mountOpening } from '../../src/ui/opening';

it('切換模式立即更新說明，非法 seed 保留在抓位前且顯示錯誤',()=>{
  const root=document.createElement('div');const ui=mountOpening(root,{seed:42,ruleMode:'flowers'},vi.fn());
  const mode=root.querySelector<HTMLInputElement>('[data-flowers]')!;
  mode.checked=false;mode.dispatchEvent(new Event('change',{bubbles:true}));
  expect(root.querySelector('.opening-mode')!.textContent).toContain('136 張');
  root.querySelector<HTMLInputElement>('[data-seed]')!.value='0';
  root.querySelector<HTMLButtonElement>('[data-roll]')!.click();
  expect(root.querySelector('.opening-error')!.textContent).toContain('Seed');
  expect(root.querySelectorAll('.dice-face')).toHaveLength(0);
  ui.destroy();
});

it('抓位→選牌→起莊→另擲開門→發牌，不可跳步或重複啟動',()=>{
  const root=document.createElement('div');document.body.append(root);
  const start=vi.fn();const ui=mountOpening(root,{seed:42,ruleMode:'no-flowers'},start);
  const click=(selector:string)=>(root.querySelector(selector) as HTMLButtonElement).click();
  expect(root.textContent).toContain('抓位');expect(root.querySelector('[data-deal]')).toBeNull();
  click('[data-roll]');expect(root.querySelectorAll('.dice-face')).toHaveLength(3);
  expect(root.querySelector('[data-deal]')).toBeNull();
  click('[data-wind]:not(:disabled)');
  expect(root.textContent).toContain('起莊');click('[data-roll]');
  expect(root.textContent).toContain('另擲');expect(start).not.toHaveBeenCalled();
  click('[data-roll]');expect(root.querySelectorAll('.dice-face')).toHaveLength(9);
  click('[data-deal]');expect(start).toHaveBeenCalledTimes(1);
  click('[data-deal]');expect(start).toHaveBeenCalledTimes(1);
  expect(start.mock.calls[0][0]).toHaveProperty('wallStart');
  ui.destroy();root.remove();
});
