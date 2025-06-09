document.addEventListener('DOMContentLoaded', () => {

    // --- テーマ切り替え機能 (ライト/ダークモード) ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    // 1. ページ読み込み時にlocalStorageを確認し、テーマを適用
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
    }

    // 2. ボタンのクリックイベント
    themeToggleButton.addEventListener('click', () => {
        body.classList.toggle('light-mode');

        // 3. 現在のテーマを判定し、localStorageに保存
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
        }
    });


    // --- 固定ヘッダーのスクロールエフェクト ---
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                siteHeader.classList.add('scrolled');
            } else {
                siteHeader.classList.remove('scrolled');
            }
        });
    }

    // --- 文字化けアニメーション ---
    const textElements = document.querySelectorAll('.anim-char-fadein');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    const textObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                animateText(target);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.2 });

    textElements.forEach(el => {
        if (!el.dataset.originalText) {
            el.dataset.originalText = el.innerHTML;
        }
        el.innerHTML = '';
        textObserver.observe(el);
    });

    function animateText(target) {
        const originalHTML = target.dataset.originalText || '';
        const parts = originalHTML.match(/<[^>]+>|./g) || [];
        const duration = 1000;
        let startTime = null;

        target.classList.add('is-visible');

        function animationStep(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const fixedPartsCount = Math.floor(progress * parts.length);
            
            let newHTML = '';
            for (let i = 0; i < parts.length; i++) {
                if (i < fixedPartsCount) {
                    newHTML += parts[i];
                } else {
                    if (parts[i].startsWith('<') && parts[i].endsWith('>')) {
                        newHTML += parts[i];
                    } else if (parts[i] === ' ' || parts[i] === '\n') {
                        newHTML += parts[i];
                    } else {
                        newHTML += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                }
            }
            target.innerHTML = newHTML;

            if (progress < 1) {
                requestAnimationFrame(animationStep);
            } else {
                target.innerHTML = originalHTML;
            }
        }
        requestAnimationFrame(animationStep);
    }

    // --- 画像のフェードインアニメーション ---
    const imageElements = document.querySelectorAll('.anim-scroll-fade');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    imageElements.forEach(el => imageObserver.observe(el));


    // =======================================================================
    // --- スクロール連動3Dアニメーション (Three.js & GSAP) ---
    // =======================================================================
    
    // ライブラリが存在するか確認
    if (typeof THREE === 'undefined' || typeof gsap === 'undefined') {
        console.error('Three.jsまたはGSAPライブラリが読み込まれていません。');
        return;
    }

    // GSAPにScrollTriggerプラグインを登録
    gsap.registerPlugin(ScrollTrigger);

    // --- Three.jsの基本設定 ---
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // 背景を透過させる
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    // --- 3Dオブジェクト（点群の球体）の作成 ---
    // ジオメトリ（形状）を球体に変更
    const geometry = new THREE.SphereGeometry(2, 64, 64); // 半径2, 横分割64, 縦分割64
    // マテリアル（材質）を点群用に変更
    const material = new THREE.PointsMaterial({
        color: 0xDDA853,      // 点の色
        size: 0.02,           // 点の基本サイズ
        sizeAttenuation: true // 遠くの点が小さく見えるようにする
    });
    // メッシュではなく、Pointsオブジェクトを作成
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- ライトの追加 (PointsMaterialはライトの影響を受けないが念のため) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // --- ウィンドウリサイズへの対応 ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // --- GSAP ScrollTriggerによるアニメーション設定 ---
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: 'body', 
            start: 'top top', 
            end: 'bottom bottom',
            scrub: 1, 
        }
    });

    // スクロールに合わせてオブジェクトを回転させる
    tl.to(points.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 4,
    }, 0); // タイムラインの開始位置からアニメーション開始

    // スクロールに合わせてオブジェクトのスケール（大きさ）を変更する
    // yoyo:true で往復アニメーションになる
    tl.to(points.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        repeat: 1, // 1回繰り返す（つまり往復）
        yoyo: true, // 行って戻る
        ease: 'power1.inOut'
    }, 0);


    // --- アニメーションループ ---
    const clock = new THREE.Clock();
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        
        // マウスカーソルの位置に応じて少しだけオブジェクトを傾ける
        // この部分は実装していませんが、さらなるインタラクティブ性のために追加可能です

        // レンダリング
        renderer.render(scene, camera);
        
        // 次のフレームを要求
        window.requestAnimationFrame(tick);
    }
    
    tick();
});