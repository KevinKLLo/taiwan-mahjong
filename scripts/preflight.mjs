import { execFileSync } from "node:child_process";

const [currentNodeMajor, currentNodeMinor] = process.versions.node.split(".").map(Number);

console.log("Codex Workshop Preflight");
console.log(`Node.js: ${process.version}`);

const supportedNode = (currentNodeMajor === 22 && currentNodeMinor >= 12)
  || currentNodeMajor === 24 || currentNodeMajor >= 26;
if (!supportedNode) {
  console.error("FAIL: 請使用 Node.js 22.12+、24.x 或 26+；課堂建議 Node.js 24 LTS。23／25 不受 Vitest 5 支援。");
  process.exit(1);
}

try {
  const gitVersion = execFileSync("git", ["--version"], { encoding: "utf8" }).trim();
  console.log(`Git: ${gitVersion}`);
} catch {
  console.error("FAIL: 找不到 Git。請先完成課前安裝。");
  process.exit(1);
}

console.log("PASS: 基礎環境符合課程需求。接著執行 npm test。 ");
