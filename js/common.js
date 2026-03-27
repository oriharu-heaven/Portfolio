document.addEventListener('DOMContentLoaded', () => {

    
    
    
    const setupHeaderControls = () => {
        const body = document.body;
        const colorToggleButton = document.getElementById('color-palette-toggle');
        const themeToggleButton = document.getElementById('theme-toggle');

        
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

        
        if (themeToggleButton) {
            if (localStorage.getItem('theme') === 'light') {
                body.classList.add('light-mode');
            }
            themeToggleButton.addEventListener('click', () => {
                body.classList.toggle('light-mode');
                
                localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light' : 'dark');
            });
        }

        
        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            window.addEventListener('scroll', () => {
                
                siteHeader.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    };

    
    
    
    const setupSharedAnimations = () => {
        
        const textElements = document.querySelectorAll('.anim-char-fadein');
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        if (textElements.length > 0) {
            const textObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateText(entry.target);
                        observer.unobserve(entry.target); 
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
                
                title.innerHTML = `<span class="title-text">${originalText}</span>`;
                title.classList.add('anim-lines');
                title.dataset.originalText = title.innerHTML;
                titleObserver.observe(title);
            });
        }
    };

    
    
    
    const setupCursorFollower = () => {
        const followerText = createFollower('', ['cursor-follower__text']);
        const followerShape = createFollower('', ['cursor-follower__shape']);
        const mousePos = { x: 0, y: 0 };
        let isCursorGlitching = false;

        
        function createFollower(text, classNames = []) {
            const el = document.createElement('div');
            el.classList.add('cursor-follower', ...classNames);
            el.innerHTML = `<span>${text}</span>`;
            document.body.appendChild(el);
            return { el, x: -200, y: -200 };
        }

        
        window.addEventListener('mousemove', e => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        });

        
        document.body.addEventListener('mouseleave', () => {
            followerText.el.classList.add('hidden');
            followerShape.el.classList.add('hidden');
        });
        document.body.addEventListener('mouseenter', () => {
            followerText.el.classList.remove('hidden');
            followerShape.el.classList.remove('hidden');
        });

        
        setInterval(() => {
            isCursorGlitching = true;
            setTimeout(() => { isCursorGlitching = false; }, 300);
        }, 4000);

        
        function updateCursor() {
            
            followerText.x += (mousePos.x - followerText.x) * 0.1;
            followerText.y += (mousePos.y - followerText.y) * 0.1;
            followerShape.x += (mousePos.x - followerShape.x) * 0.07;
            followerShape.y += (mousePos.y - followerShape.y) * 0.07;

            followerText.el.style.transform = `translate(${followerText.x}px, ${followerText.y}px)`;
            followerShape.el.style.transform = `translate(${followerShape.x}px, ${followerShape.y}px)`;

            
            const textSpan = followerText.el.firstElementChild;
            const timestamp = Math.floor(Date.now() / 1000).toString();
            textSpan.textContent = isCursorGlitching
                ? timestamp.split('').map(c => Math.random() > 0.3 ? '!?#<>/+*'[Math.floor(Math.random() * 8)] : c).join('')
                : timestamp;

            
            if (typeof window.threeTick === 'function') {
                window.threeTick();
            }

            requestAnimationFrame(updateCursor);
        }
        updateCursor();
    };

    
    
    
    const setupCopyright = () => {
        const copyEls = document.querySelectorAll('.footer__copy');
        copyEls.forEach(el => {
            const currentYear = new Date().getFullYear();
            el.innerHTML = `&copy; ${currentYear} Haru Orishimo. All Rights Reserved.`;
        });
    };

    
    
    
    const setupWorkModals = () => {
        const modal = document.getElementById('work-modal');
        if (!modal) return;
        
        const overlay = document.getElementById('work-modal-overlay');
        const closeBtn = document.getElementById('work-modal-close');
        const modalBody = document.getElementById('work-modal-body');
        const triggers = document.querySelectorAll('.work-modal-trigger');
        
        const openModal = (workId) => {
            const dataEl = document.getElementById(`data-${workId}`);
            if (dataEl) {
                modalBody.innerHTML = dataEl.innerHTML;
                modal.classList.add('is-open');
                document.body.style.overflow = 'hidden'; 
            }
        };

        const closeModal = () => {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => {
                modalBody.innerHTML = ''; 
            }, 400); 
        };

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const workId = trigger.getAttribute('data-work');
                if (workId) {
                    openModal(workId);
                }
            });
        });

        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });
    };

    
    setupHeaderControls();
    setupSharedAnimations();
    setupCursorFollower();
    setupCopyright();
    setupWorkModals();

});
