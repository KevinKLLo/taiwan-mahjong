import "./styles.css";
import { dealInitialHands, validateRound, type RoundState } from "./mahjong/rules";
import { tileLabel, type TileCode } from "./mahjong/tiles";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`頁面缺少必要的 UI 元素：${selector}`);
  }
  return element;
}

const form = requireElement<HTMLFormElement>("#round-form");
const seedInput = requireElement<HTMLInputElement>("#seed");
const table = requireElement<HTMLElement>("#table");
const message = requireElement<HTMLElement>("#message");
const ruleMode = requireElement<HTMLElement>("#rule-mode");
const wallRemaining = requireElement<HTMLElement>("#wall-remaining");
const roundSeed = requireElement<HTMLElement>("#round-seed");
const validationState = requireElement<HTMLElement>("#validation-state");

function renderTiles(codes: readonly TileCode[], flower = false): HTMLElement {
  const container = document.createElement("div");
  container.className = "tiles";

  if (codes.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-state";
    empty.textContent = flower ? "本局起手沒有花牌" : "沒有牌";
    container.appendChild(empty);
    return container;
  }

  for (const code of codes) {
    const tile = document.createElement("span");
    tile.className = flower ? "tile tile-flower" : "tile";
    tile.textContent = tileLabel(code);
    tile.title = code;
    container.appendChild(tile);
  }

  return container;
}

function renderRound(round: RoundState): void {
  const problems = validateRound(round);
  ruleMode.textContent = "花牌規則";
  wallRemaining.textContent = String(round.wallRemaining);
  roundSeed.textContent = String(round.seed);
  validationState.textContent = problems.length === 0 ? "通過" : "需檢查";
  validationState.className = problems.length === 0 ? "success" : "danger";
  message.textContent = problems.length === 0 ? round.notes.join(" ") : problems.join("；");
  message.classList.toggle("message-error", problems.length > 0);
  table.replaceChildren();

  for (const player of round.players) {
    const panel = document.createElement("article");
    panel.className = "player-panel";

    const heading = document.createElement("div");
    heading.className = "player-heading";
    heading.innerHTML = `<h2>${player.label}</h2><span>${player.tiles.length} 張</span>`;
    panel.appendChild(heading);
    panel.appendChild(renderTiles(player.tiles));

    const flowerHeading = document.createElement("h3");
    flowerHeading.textContent = `花牌區 ${player.flowers.length} 張`;
    panel.appendChild(flowerHeading);
    panel.appendChild(renderTiles(player.flowers, true));
    table.appendChild(panel);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const seed = Number.parseInt(seedInput.value, 10);
  if (!Number.isFinite(seed) || seed < 1) {
    message.textContent = "Seed 必須是大於 0 的整數。";
    message.classList.add("message-error");
    return;
  }

  renderRound(dealInitialHands(seed));
});

renderRound(dealInitialHands(20260915));
