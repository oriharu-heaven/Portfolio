document.addEventListener('DOMContentLoaded', () => {

    // --- テーマ切り替え機能 (ライト/ダークモード) ---
    // ... (この部分は変更なし) ...
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-mode');
    }
    themeToggleButton.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light' : '');
    });

    // --- 固定ヘッダーのスクロールエフェクト ---
    // ... (この部分は変更なし) ...
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        window.addEventListener('scroll', () => {
            siteHeader.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // --- 文字化けアニメーション (初期表示) ---
    // ... (この部分は変更なし) ...
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
                    } else if (/\s/.test(parts[i])) {
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
    // ... (この部分は変更なし) ...
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
    
    if (typeof THREE !== 'undefined' && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const canvas = document.getElementById('webgl-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.position.z = 5;

        // --- 3Dオブジェクト群の作成 ---
        // ... (この部分は変更なし) ...
        const sceneObjects = [];
        const objectGroup = new THREE.Group();
        scene.add(objectGroup);
        const material = new THREE.PointsMaterial({ size: 0.03, sizeAttenuation: true });
        const centerSphereGeom = new THREE.SphereGeometry(1.5, 64, 64);
        const centerSphere = new THREE.Points(centerSphereGeom, material);
        centerSphere.userData.hueOffset = Math.random();
        objectGroup.add(centerSphere);
        sceneObjects.push(centerSphere);
        for (let i = 0; i < 20; i++) {
            const radius = Math.random() * 0.7 + 0.1;
            const segments = radius > 0.5 ? 24 : 16;
            const geom = new THREE.SphereGeometry(radius, segments, segments);
            const points = new THREE.Points(geom, material);
            points.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
            points.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            points.userData.hueOffset = Math.random();
            objectGroup.add(points);
            sceneObjects.push(points);
        }

        // --- マウス座標のトラッキング ---
        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
            // マウス座標を-1から1の範囲に正規化
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // --- ウィンドウリサイズへの対応 ---
        // ... (この部分は変更なし) ...
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // --- GSAP ScrollTriggerでグループ全体を回転 ---
        // ... (この部分は変更なし) ...
        gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
            }
        }).to(objectGroup.rotation, {
            x: Math.PI,
            y: Math.PI * 2,
        }, 0);

        // --- アニメーションループ ---
        const clock = new THREE.Clock();
        const tick = () => {
            const elapsedTime = clock.getElapsedTime();

            // オブジェクト個別の自律アニメーション
            sceneObjects.forEach((object, index) => {
                const speedFactor = 0.1 * (index % 5 + 1);
                object.rotation.x += 0.0001 * speedFactor;
                object.rotation.y += 0.0002 * speedFactor;
                const scaleValue = Math.sin(elapsedTime * 0.5 + index) * 0.1 + 0.9;
                object.scale.set(scaleValue, scaleValue, scaleValue);
                const hue = (elapsedTime * 0.05 + object.userData.hueOffset) % 1;
                object.material.color.setHSL(hue, 0.7, 0.6);
            });

            // ★★★ マウスに連動したカメラのパララックスエフェクト ★★★
            // 目標とするカメラのX,Y座標をマウスの位置から設定
            const targetCameraX = mouse.x * 0.5;
            const targetCameraY = mouse.y * 0.5;
            // 現在のカメラ位置から目標位置へ滑らかに（0.05の速さで）移動させる
            camera.position.x += (targetCameraX - camera.position.x) * 0.05;
            camera.position.y += (targetCameraY - camera.position.y) * 0.05;
            // 常にシーンの中心（原点）を見続けるようにする
            camera.lookAt(scene.position);
            
            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        }
        tick();
    }


    // =======================================================================
    // --- タイトルのグリッチ（文字化け）エフェクト ---
    // =======================================================================
    // ... (この部分は変更なし) ...
    const heroTitle = document.querySelector('.hero__title');
    let isGlitching = false;
    
    function glitchTitle() {
        if (isGlitching || !heroTitle.dataset.originalText) return;
        isGlitching = true;
        const originalHTML = heroTitle.dataset.originalText;
        const parts = originalHTML.match(/<[^>]+>|./g) || [];
        const glitchChars = '!<>-_\\/[]{}—=+*^?#________';
        const duration = 400;
        let glitchInterval;
        glitchInterval = setInterval(() => {
            let newHTML = '';
            for (const part of parts) {
                if (part.startsWith('<') && part.endsWith('>')) {
                    newHTML += part;
                } else if (/\s/.test(part)) {
                    newHTML += part;
                } else {
                    newHTML += Math.random() > 0.5 ? glitchChars.charAt(Math.floor(Math.random() * glitchChars.length)) : part;
                }
            }
            heroTitle.innerHTML = newHTML;
        }, 20);
        setTimeout(() => {
            clearInterval(glitchInterval);
            heroTitle.innerHTML = originalHTML;
            isGlitching = false;
        }, duration);
    }
    setInterval(() => {
        if (Math.random() < 0.3) {
            glitchTitle();
        }
    }, Math.random() * 5000 + 3000);
});