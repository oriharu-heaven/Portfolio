# 第1章　Vite + TypeScript の土台と、GitHub Pages への自動公開

この章のゴール：**TypeScript で書いたコードがブラウザで動き、main に push すると自動で公開される** 状態を作る。
見た目はまだ「工事中」の1ページだけです。

## 1.1 なぜビルドが必要なのか

ブラウザが実行できるのは HTML・CSS・JavaScript だけです。TypeScript をそのまま `<script>` で読み込んでも動きません。
そこで **TS → JS に変換する道具** が必要になります。これが Vite です。

Vite がやってくれること：

| 場面 | コマンド | Vite がすること |
| --- | --- | --- |
| 開発中 | `npm run dev` | ローカルサーバーを立て、保存するたびにブラウザを自動更新する。TS はその場で JS に変換する |
| 公開前 | `npm run build` | TS を JS に変換し、ファイルをまとめて小さくし（minify）、`dist/` に出力する |
| 確認 | `npm run preview` | `dist/` を本番と同じ形でローカル表示する |

> **ポイント**：Vite は TS を JS に「変換」するだけで、**型の間違いはチェックしません**（速さのため）。
> 型チェックは TypeScript 本体の `tsc` が担当します。だから `build` スクリプトは `tsc --noEmit && vite build` と2段になっています。
> `--noEmit` は「チェックだけして、JS ファイルは出力しない」という意味です（出力は Vite の仕事）。

## 1.2 ファイルの役割

```
Portfolio/
├── index.html            ← 入口。Vite はここから読み込まれるファイルをたどる
├── src/
│   ├── main.ts           ← TypeScript のコード
│   └── style.css
├── public/
│   └── images/           ← 変換せずそのままコピーされるファイル
├── package.json          ← 使う道具（依存パッケージ）とコマンドの一覧
├── tsconfig.json         ← TypeScript の設定
├── vite.config.ts        ← Vite の設定
├── .github/workflows/
│   └── deploy.yml        ← GitHub Actions：自動公開の手順書
└── docs/textbook/        ← この教科書
```

### index.html

```html
<link rel="stylesheet" href="/src/style.css">
<script type="module" src="/src/main.ts"></script>
```

`.ts` を直接書いているのに動くのは、Vite が間に入って変換しているからです。
ビルド後の `dist/index.html` を開くと、`assets/index-xxxx.js` のような JS ファイルに書き換わっています。
`xxxx` の部分は中身から作られた文字列（ハッシュ）で、中身が変わると名前も変わります。これでブラウザが古いキャッシュを使い続ける問題を防げます。
（作り直し前のサイトでは `style.css?v=2` のように手で番号を付けていましたが、それを自動でやってくれるイメージです）

`type="module"` は「ES モジュールとして読み込む」という指定です。`import` / `export` が使えるようになり、自動的に `defer`（HTML を読み終えてから実行）と同じ動きになります。

### src/main.ts

```ts
const status = document.querySelector<HTMLParagraphElement>("#status");

if (status) {
  status.textContent = "...";
}
```

TS らしい点が2つあります。

1. **`querySelector<HTMLParagraphElement>`**：`< >` で「見つかる要素は `<p>` だ」と型を教えています。書かないと戻り値の型は `Element | null` になり、`<p>` 固有の機能が補完に出ません
2. **`if (status)`**：`querySelector` は見つからなければ `null` を返します。TS は `null` かもしれないものを、確かめずに使うとエラーにします。`if` で確かめると、その中では `null` ではないと TS が理解します（**型の絞り込み**）

### public/

`public/` に置いたファイルは、変換されずそのまま `dist/` にコピーされます。画像のように「加工せず、決まったパスで置きたいもの」をここに置きます。
`public/images/denko.jpg` は、公開後は `images/denko.jpg` で参照できます。

### vite.config.ts

```ts
base: "./",
```

GitHub Pages は `https://oriharu-heaven.github.io/Portfolio/` のように **サブディレクトリ** で公開されます。
Vite の初期設定ではファイルを `/assets/...`（サイトの一番上から）で探すため、`/Portfolio/` の下に置くと見つからなくなります。
`"./"` にすると「今の HTML から見た相対パス」で読むので、どこに置いても動きます。

## 1.3 tsconfig.json の読み方

全部覚える必要はありません。今回の設定で特に意味のあるものだけ説明します。

| 設定 | 意味 |
| --- | --- |
| `"strict": true` | 厳しいチェックをまとめて有効にする。`null` の確認漏れなどを見つけてくれる。**必ず true にする** |
| `"noUncheckedIndexedAccess": true` | 配列 `arr[0]` の型を「要素 または `undefined`」にする。範囲外アクセスの見落としを防ぐ。strict にも含まれない追加の安全策 |
| `"noUnusedLocals"` / `"noUnusedParameters"` | 使っていない変数・引数をエラーにする。消し忘れの掃除 |
| `"lib": ["ES2022", "DOM", ...]` | 使える組み込みの型。`DOM` があるので `document` や `HTMLElement` が使える |
| `"moduleResolution": "bundler"` | `import` の解決方法を Vite のようなバンドラーに合わせる |
| `"moduleDetection": "force"` | すべてのファイルを「モジュール」として扱う（下のコラム参照） |
| `"types": ["vite/client"]` | Vite 固有の型（画像の `import` など）を読み込む |
| `"noEmit": true` | `tsc` は型チェックだけで、JS を出力しない |

### コラム：`status` という名前が使えなかった話

この章のコードを最初に書いたとき、`tsc` が次のエラーを出しました。

```
error TS2451: Cannot redeclare block-scoped variable 'status'.
```

原因は、`import` も `export` もない `.ts` ファイルを、TS は **「グローバルに直接書かれたスクリプト」** とみなすことです。
ブラウザにはもともと `window.status` という古いグローバル変数があるため、「`status` はもう宣言されている」とぶつかりました。

Vite は `type="module"` で読み込むので、実際にはファイルごとに独立したスコープになり、ぶつかりません。
TS にもそう扱わせるのが `"moduleDetection": "force"` です。ファイルに `export {}` と1行書いても同じ効果になります。

## 1.4 package.json

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
},
"devDependencies": {
  "typescript": "7.0.2",
  "vite": "8.3.8"
}
```

- `scripts`：`npm run 名前` で実行できるコマンドの一覧
- `devDependencies`：**開発中だけ** 使う道具。公開されるサイトには含まれない
- バージョンを `^8.3.8` ではなく `8.3.8` と固定しているのは、いつ `npm install` しても同じものが入るようにするため。`package-lock.json` にも細かい依存まで記録されます

## 1.5 自動公開（GitHub Actions）

`.github/workflows/deploy.yml` は「main に push されたら、GitHub のサーバー上で次の手順を実行して」という手順書です。

1. リポジトリを取ってくる（`actions/checkout`）
2. Node.js 22 を用意する（`actions/setup-node`）
3. `npm ci`：`package-lock.json` の通りに依存を入れる（`npm install` より厳密で、CI 向け）
4. `npm run build`：型チェック → ビルド。**型エラーがあればここで止まり、壊れたサイトは公開されない**
5. `dist/` を GitHub Pages に公開する

作り直し前は「main のファイルをそのまま公開」していましたが、これからは「main のファイルを **ビルドした結果** を公開」に変わります。

### ⚠️ 一度だけ必要な設定（あなたの作業）

GitHub のリポジトリページで **Settings → Pages → Build and deployment → Source** を **「GitHub Actions」** に変更してください。
これをしないと、ワークフローが動いても公開されません。

ただし **今は変更しないでください**。新しいサイトの中身がそろう第4章のあと、main にマージするタイミングで切り替えます。
（今切り替えても、ワークフローは main への push でしか動かないので、今のサイトがすぐ壊れることはありません。ただ、切り替えた後に main へ何か push すると、その時点の main がビルドされます）

## 1.6 手元で動かす

```bash
git fetch origin
git switch claude/relaxed-brahmagupta-fletul
npm install       # 初回だけ。node_modules/ に道具が入る
npm run dev       # 表示された http://localhost:5173/ を開く
```

`src/main.ts` を書き換えて保存すると、ブラウザが自動で更新されます。

`node_modules/` と `dist/` は `.gitignore` に入れてあるので、コミットされません（誰でも `npm install` / `npm run build` で作り直せるため）。

## 演習 1

1. **型エラーを体験する**：`src/main.ts` の `if (status) {` と `}` を消して保存し、`npm run typecheck` を実行する。どんなエラーが出るか、なぜ出るかを説明してみる。確認したら元に戻す
2. **型を外してみる**：`querySelector<HTMLParagraphElement>` の `<HTMLParagraphElement>` を消すと、`status` の型は何になるか。VS Code で `status` にカーソルを合わせて確かめる
3. **ビルド結果を見る**：`npm run build` を実行し、`dist/index.html` と `dist/assets/` の中の JS を開く。自分の書いた TS がどう変わったか（型が消えている、空白が詰まっている など）を確認する
4. **考える**：`build` スクリプトから `tsc --noEmit &&` を消したら、何が起きうるか

解答例は次の章の冒頭に載せます。
