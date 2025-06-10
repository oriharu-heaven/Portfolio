document.addEventListener('DOMContentLoaded', () => {
    // --- 共有ヘッダーロジック ---
    const setupHeaderControls = () => {
        const body = document.body;

        // 1. カラーパレット切り替え
        const colorToggleButton = document.getElementById('color-palette-toggle');
        if (colorToggleButton) {
            const palettes = ['palette-1', 'palette-2', 'palette-3'];
            let currentPaletteIndex = 0;

            const savedPalette = localStorage.getItem('palette');
            if (savedPalette && palettes.includes(savedPalette)) {
                body.dataset.palette = savedPalette;
                currentPaletteIndex = palettes.indexOf(savedPalette);
            } else {
                body.dataset.palette = palettes[0];
            }

            colorToggleButton.addEventListener('click', () => {
                currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length;
                const newPalette = palettes[currentPaletteIndex];
                body.dataset.palette = newPalette;
                localStorage.setItem('palette', newPalette);
            });
        }

        // 2. ライト/ダークテーマ切り替え
        const themeToggleButton = document.getElementById('theme-toggle');
        if (themeToggleButton) {
            if (localStorage.getItem('theme') === 'light') {
                body.classList.add('light-mode');
            }
            themeToggleButton.addEventListener('click', () => {
                body.classList.toggle('light-mode');
                localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light' : 'dark');
            });
        }
        
        // 3. スクロール時のヘッダー表示
        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            window.addEventListener('scroll', () => {
                siteHeader.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    };
    
    // --- 共有アニメーションロジック ---
    const setupSharedAnimations = () => {
        const textElements = document.querySelectorAll('.anim-char-fadein');
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        if (textElements.length > 0) {
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
                if (!el.dataset.originalText) { el.dataset.originalText = el.innerHTML; }
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
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const fixedCount = Math.floor(progress * parts.length);
                    let newHTML = '';
                    for (let i = 0; i < parts.length; i++) {
                        if (i < fixedCount) {
                            newHTML += parts[i];
                        } else if (parts[i].startsWith('<') || /\s/.test(parts[i])) {
                            newHTML += parts[i];
                        } else {
                            newHTML += characters.charAt(Math.floor(Math.random() * characters.length));
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
        }
    };

    // 共通部分の初期化
    setupHeaderControls();
    setupSharedAnimations();
});