// 第1章：TypeScript がブラウザで動いていることを確かめるだけのコード

const status = document.querySelector<HTMLParagraphElement>("#status");

if (status) {
  const now: Date = new Date();
  status.textContent = `TypeScript から書き換えました（${now.toLocaleString("ja-JP")}）`;
}
