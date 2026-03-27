/**
 * js/common.js
 * 
 * サイト全体で共通して使用されるロジック（テーマ切り替え、スクロール時のアニメーション、
 * カーソル追従エフェクトなど）を管理するスクリプトです。
 * 
 * <初学者向け解説>
 * - DOMContentLoaded: HTMLタグの読み込みが完全に終わったタイミングで処理を実行開始するためのイベントです。
 * - localStorage: ブラウザに小さなデータを保存する機能です。次回アクセス時にもダークモードなどの状態を保てます。
 * - IntersectionObserver: 要素がユーザーの画面（ビューポート）に入ったかどうかを監視する強力なAPIです。スクロールアニメーションに最適です。
 * - requestAnimationFrame: ブラウザが画面を更新するタイミングに合わせて関数を呼び出す仕組みで、滑らかなアニメーションを実現します。
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. 共有ヘッダー制御（カラーパレットとライト/ダークモード）
    // =========================================================
    const setupHeaderControls = () => {
        const body = document.body;
        const colorToggleButton = document.getElementById('color-palette-toggle');
        const themeToggleButton = document.getElementById('theme-toggle');

        // カラーパレットの切り替え機能
        if (colorToggleButton) {
            const palettes = ['palette-1', 'palette-2', 'palette-3'];
            let currentPaletteIndex = 0;

            // 保存済みのパレット設定があれば読み込む
            const savedPalette = localStorage.getItem('palette');
            if (savedPalette && palettes.includes(savedPalette)) {
                body.dataset.palette = savedPalette; // HTMLのdata-palette属性を変更してCSS変数を切り替え
                currentPaletteIndex = palettes.indexOf(savedPalette);
            } else {
                body.dataset.palette = palettes[0];
            }

            colorToggleButton.addEventListener('click', () => {
                currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length;
                const newPalette = palettes[currentPaletteIndex];
                body.dataset.palette = newPalette;
                localStorage.setItem('palette', newPalette); // 設定を保存
            });
        }

        // テーマ（ライトモード用）の切り替え機能
        if (themeToggleButton) {
            if (localStorage.getItem('theme') === 'light') {
                body.classList.add('light-mode');
            }
            themeToggleButton.addEventListener('click', () => {
                body.classList.toggle('light-mode');
                // classに'light-mode'が含まれていれば'light'を保存、なければ'dark'を保存
                localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light' : 'dark');
            });
        }

        // スクロール時のヘッダーの背景変化
        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            window.addEventListener('scroll', () => {
                // スクロール量が50pxを超えたら'scrolled'クラスを付与
                siteHeader.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    };

    // =========================================================
    // 2. 共有アニメーション（文字表示エフェクト、画像フェードインなど）
    // =========================================================
    const setupSharedAnimations = () => {
        // --- 乱数を使った文字出現アニメーション ---
        const textElements = document.querySelectorAll('.anim-char-fadein');
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        if (textElements.length > 0) {
            const textObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateText(entry.target);
                        observer.unobserve(entry.target); // 一度アニメーションしたら監視を終了
                    }
                });
            }, { threshold: 0.2 });

            textElements.forEach(el => {
                // オリジナルのテキストを属性として保存しておき、中身を空にしておく
                if (!el.dataset.originalText) { el.dataset.originalText = el.innerHTML; }
                el.innerHTML = '';
                textObserver.observe(el);
            });

            function animateText(target) {
                const originalHTML = target.dataset.originalText || '';
                // テキストとHTMLタグを分離して配列にする正規表現テクニック
                const parts = originalHTML.match(/<[^>]+>|./g) || [];
                const duration = 1000; // 1秒かけてアニメーション
                let startTime = null;

                target.classList.add('is-visible');

                function animationStep(currentTime) {
                    if (!startTime) startTime = currentTime;
                    // 進捗度（0.0〜1.0）
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const fixedCount = Math.floor(progress * parts.length);
                    let newHTML = '';

                    for (let i = 0; i < parts.length; i++) {
                        if (i < fixedCount) {
                            newHTML += parts[i]; // 確定した文字
                        } else if (parts[i].startsWith('<') || /\s/.test(parts[i])) {
                            newHTML += parts[i]; // タグや空白はランダム化しない
                        } else {
                            newHTML += characters.charAt(Math.floor(Math.random() * characters.length)); // メタ文字
                        }
                    }
                    target.innerHTML = newHTML;

                    if (progress < 1) {
                        requestAnimationFrame(animationStep); // 次のフレームで再度実行
                    } else {
                        target.innerHTML = originalHTML; // アニメーション終了時に元のテキストに戻す
                    }
                }
                requestAnimationFrame(animationStep);
            }
        }

        // --- 画像のスクロールフェードイン ---
        const imageElements = document.querySelectorAll('.anim-scroll-fade');
        if (imageElements.length > 0) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            imageElements.forEach(el => imageObserver.observe(el));
        }

        // --- 見出しのラインアニメーション ---
        const lineTitles = document.querySelectorAll('.section__title');
        if (lineTitles.length > 0) {
            const titleObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            lineTitles.forEach(title => {
                const originalText = title.dataset.originalText || title.textContent;
                // テキストをspanタグで囲むことで、疑似要素による線のアニメーションと分ける
                title.innerHTML = `<span class="title-text">${originalText}</span>`;
                title.classList.add('anim-lines');
                title.dataset.originalText = title.innerHTML;
                titleObserver.observe(title);
            });
        }
    };

    // =========================================================
    // 3. 統合カーソルエフェクト（マウスについてくる）
    // =========================================================
    const setupCursorFollower = () => {
        const followerText = createFollower('', ['cursor-follower__text']);
        const followerShape = createFollower('', ['cursor-follower__shape']);
        const mousePos = { x: 0, y: 0 };
        let isCursorGlitching = false;

        // 追従要素を生成する関数
        function createFollower(text, classNames = []) {
            const el = document.createElement('div');
            el.classList.add('cursor-follower', ...classNames);
            el.innerHTML = `<span>${text}</span>`;
            document.body.appendChild(el);
            return { el, x: -200, y: -200 };
        }

        // マウスの現在地を取得
        window.addEventListener('mousemove', e => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        });

        // 画面外に出たときは隠す
        document.body.addEventListener('mouseleave', () => {
            followerText.el.classList.add('hidden');
            followerShape.el.classList.add('hidden');
        });
        document.body.addEventListener('mouseenter', () => {
            followerText.el.classList.remove('hidden');
            followerShape.el.classList.remove('hidden');
        });

        // 4秒ごとにカーソルの文字がバグるエフェクト
        setInterval(() => {
            isCursorGlitching = true;
            setTimeout(() => { isCursorGlitching = false; }, 300);
        }, 4000);

        // 毎フレーム更新処理（滑らかに追従させるための遅延アニメーション）
        function updateCursor() {
            // (目的地 - 現在地) * 係数 で摩擦（イージング）を表現
            followerText.x += (mousePos.x - followerText.x) * 0.1;
            followerText.y += (mousePos.y - followerText.y) * 0.1;
            followerShape.x += (mousePos.x - followerShape.x) * 0.07;
            followerShape.y += (mousePos.y - followerShape.y) * 0.07;

            followerText.el.style.transform = `translate(${followerText.x}px, ${followerText.y}px)`;
            followerShape.el.style.transform = `translate(${followerShape.x}px, ${followerShape.y}px)`;

            // カーソル横にタイムスタンプらしき数字を表示
            const textSpan = followerText.el.firstElementChild;
            const timestamp = Math.floor(Date.now() / 1000).toString();
            textSpan.textContent = isCursorGlitching
                ? timestamp.split('').map(c => Math.random() > 0.3 ? '!?#<>/+*'[Math.floor(Math.random() * 8)] : c).join('')
                : timestamp;

            // もし window.threeTick がメインスクリプトで定義されていれば呼び出す（WebGLの描画ループ統合のため）
            if (typeof window.threeTick === 'function') {
                window.threeTick();
            }

            requestAnimationFrame(updateCursor);
        }
        updateCursor();
    };

    // =========================================================
    // 4. 動的コピーライト年更新
    // =========================================================
    const setupCopyright = () => {
        const copyEls = document.querySelectorAll('.footer__copy');
        copyEls.forEach(el => {
            const currentYear = new Date().getFullYear();
            el.innerHTML = `&copy; ${currentYear} Haru Orishimo. All Rights Reserved.`;
        });
    };

    // --- 実行 ---
    setupHeaderControls();
    setupSharedAnimations();
    setupCursorFollower();
    setupCopyright();

});
