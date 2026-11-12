import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages は https://oriharu-heaven.github.io/Portfolio/ のように
  // サブディレクトリで公開されるので、読み込むファイルのパスを相対にしておく
  base: "./",
});
