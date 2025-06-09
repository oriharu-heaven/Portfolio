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

});