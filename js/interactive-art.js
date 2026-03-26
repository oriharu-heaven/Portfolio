/**
 * js/interactive-art.js
 * 
 * Playページ等に表示されるインタラクティブアート（Canvas API 2D）の処理を担当します。
 * パーティクルを生成し、マウスの軌跡を描画します。
 */
document.addEventListener('DOMContentLoaded', () => {

    const initInteractiveArt = () => {
        const artCanvas = document.getElementById('interactive-canvas');
        if (!artCanvas) return;

        // ctx (コンテキスト) はCanvasに図形を描くための「筆」のようなものです
        const ctx = artCanvas.getContext('2d');
        const canvasWrapper = artCanvas.parentElement;
        let particlesArray = [];

        const mouse = { x: undefined, y: undefined };

        // キャンバスのサイズを親要素に合わせる
        function setCanvasSize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            artCanvas.width = canvasWrapper.clientWidth * dpr;
            artCanvas.height = canvasWrapper.clientHeight * dpr;
            ctx.scale(dpr, dpr);
        }

        artCanvas.addEventListener('mousemove', (event) => {
            const rect = artCanvas.getBoundingClientRect();
            // 要素内のマウス座標を厳密に取得
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        });
        
        artCanvas.addEventListener('mouseleave', () => {
            mouse.x = undefined;
            mouse.y = undefined;
        });

        // パーティクル（粒子）の設計図となるクラス
        class Particle {
            constructor() {
                this.x = mouse.x;
                this.y = mouse.y;
                // 大きさ・速度・色をランダムに決定
                this.size = Math.random() * 5 + 1;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
                this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
            }
            // 毎フレームの更新（移動と縮小）
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.2) this.size -= 0.1; // だんだん小さくなる
            }
            // 画面に円を描画する
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 初期化処理
        function init() {
            setCanvasSize();
            particlesArray = [];
        }

        function createParticleTrail() {
             if (mouse.x !== undefined && mouse.y !== undefined) {
                // マウス位置から新しくパーティクルを生成
                for (let i = 0; i < 5; i++) {
                    particlesArray.push(new Particle());
                }
            }
        }

        function handleParticles() {
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();

                // 小さくなりすぎたパーティクルは配列から削除してメモリを解放
                if (particlesArray[i].size <= 0.3) {
                    particlesArray.splice(i, 1);
                    i--; // 削除したらインデックスを1つ戻す
                }
            }
        }

        // キャンバスのアニメーションループ
        function animate() {
            // 背景を完全にクリアせず、半透明な黒で塗りつぶすことで「軌跡」を表現
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            const { clientWidth, clientHeight } = canvasWrapper;
            ctx.fillRect(0, 0, clientWidth, clientHeight);
            
            createParticleTrail();
            handleParticles();
            
            requestAnimationFrame(animate); // 次の描画タイミングで再度呼ぶ
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(init, 200); // ウィンドウサイズ変更が終わった瞬間に再設定
        });

        // テーマ切り替え時などにキャンバスを綺麗にする
        const themeToggleButton = document.getElementById('theme-toggle');
        if(themeToggleButton) themeToggleButton.addEventListener('click', init);
        
        const colorToggleButton = document.getElementById('color-palette-toggle');
        if (colorToggleButton) colorToggleButton.addEventListener('click', init);

        init();
        animate();
    };

    initInteractiveArt();
});
