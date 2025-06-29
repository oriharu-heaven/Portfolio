document.addEventListener('DOMContentLoaded', () => {

    // --- 共有ヘッダーロジック ---
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
        return { themeToggleButton }; // art canvas用にトグルボタンを返す
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
                    if(entry.isIntersecting) {
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

    // --- ページ固有ロジックの実行 ---

    const { themeToggleButton } = setupHeaderControls();
    setupSharedAnimations();

    // グローバルなアニメーション関数を初期化
    let threeTick = () => {};

    // index.html用のメイン3D背景
    if (document.getElementById('webgl-canvas')) {
        if (typeof THREE !== 'undefined' && typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            const canvas = document.getElementById('webgl-canvas');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            camera.position.z = 5;

            const objectGroup = new THREE.Group();
            scene.add(objectGroup);
            const sceneObjects = [];
            const mouse3D = new THREE.Vector2();

            const centerMaterial = new THREE.PointsMaterial({ size: 0.03, sizeAttenuation: true });
            const centerSphereGeom = new THREE.SphereGeometry(1.5, 64, 64);
            const centerSphere = new THREE.Points(centerSphereGeom, centerMaterial);
            centerSphere.userData.hueOffset = Math.random();
            objectGroup.add(centerSphere);
            sceneObjects.push(centerSphere);

            for (let i = 0; i < 40; i++) {
                const radius = Math.random() * 0.7 + 0.1;
                const geom = new THREE.SphereGeometry(radius, 24, 24);
                const pointsMaterial = new THREE.PointsMaterial({ size: 0.03, sizeAttenuation: true });
                const points = new THREE.Points(geom, pointsMaterial);
                
                const centerRadius = 2.0;
                const centerPhi = Math.acos(2 * Math.random() - 1);
                const centerTheta = Math.random() * 2 * Math.PI;
                const centerPos = new THREE.Vector3().setFromSphericalCoords(centerRadius * Math.random(), centerPhi, centerTheta);
                
                const relativePos = new THREE.Vector3().setFromSphericalCoords(Math.pow(Math.random(), 2) * 2.0, Math.acos(2 * Math.random() - 1), Math.random() * 2 * Math.PI);
                
                points.position.copy(centerPos.add(relativePos));
                points.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                points.userData.hueOffset = Math.random();
                objectGroup.add(points);
                sceneObjects.push(points);
            }

            window.addEventListener('mousemove', (event) => {
                mouse3D.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse3D.y = -(event.clientY / window.innerHeight) * 2 + 1;
            });

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            });

            gsap.timeline({
                scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 }
            }).to(objectGroup.rotation, { x: Math.PI, y: Math.PI * 2 }, 0);

            const clock = new THREE.Clock();
            threeTick = () => { // グローバルスコープのthreeTickを更新
                const elapsedTime = clock.getElapsedTime();
                sceneObjects.forEach((object, index) => {
                    const speedFactor = 0.1 * (index % 5 + 1);
                    object.rotation.x += 0.0001 * speedFactor;
                    object.rotation.y += 0.0002 * speedFactor;
                    const scaleValue = Math.sin(elapsedTime * 0.5 + index) * 0.1 + 0.9;
                    object.scale.set(scaleValue, scaleValue, scaleValue);
                    const hue = (elapsedTime * 0.05 + object.userData.hueOffset) % 1;
                    object.material.color.setHSL(hue, 0.7, 0.6);
                });

                const targetRotationX = mouse3D.y * 1.0;
                const targetRotationY = mouse3D.x * 1.0;
                objectGroup.rotation.x += (targetRotationX - objectGroup.rotation.x) * 0.05;
                objectGroup.rotation.y += (targetRotationY - objectGroup.rotation.y) * 0.05;
                
                const targetCameraX = mouse3D.x * 0.2;
                const targetCameraY = mouse3D.y * 0.2;
                camera.position.x += (targetCameraX - camera.position.x) * 0.05;
                camera.position.y += (targetCameraY - camera.position.y) * 0.05;
                camera.lookAt(scene.position);
                
                renderer.render(scene, camera);
            };
        }
    }
    
    // --- 統合アニメーションループのためのセットアップ ---
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

    function unifiedTick() {
        followerText.x += (mousePos.x - followerText.x) * 0.1;
        followerText.y += (mousePos.y - followerText.y) * 0.1;
        followerShape.x += (mousePos.x - followerShape.x) * 0.07;
        followerShape.y += (mousePos.y - followerShape.y) * 0.07;
        followerText.el.style.transform = `translate(${followerText.x}px, ${followerText.y}px)`;
        followerShape.el.style.transform = `translate(${followerShape.x}px, ${followerShape.y}px)`;
        
        const textSpan = followerText.el.firstElementChild;
        const timestamp = Math.floor(Date.now() / 1000).toString();
        textSpan.textContent = isCursorGlitching ? timestamp.split('').map(c => Math.random() > 0.3 ? '!?#<>/+*'[Math.floor(Math.random()*8)] : c).join('') : timestamp;

        threeTick(); // 3Dアニメーションを呼び出し
        requestAnimationFrame(unifiedTick);
    }
    unifiedTick(); // 統合ループを開始

    // ===【差し替え】'#interactive-canvas'用のパーティクルアートロジック ===
    const artCanvas = document.getElementById('interactive-canvas');
    if (artCanvas) {
        const ctx = artCanvas.getContext('2d');
        const canvasWrapper = artCanvas.parentElement;
        let particlesArray;

        const mouse = {
            x: undefined,
            y: undefined,
        };

        function setCanvasSize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            artCanvas.width = canvasWrapper.clientWidth * dpr;
            artCanvas.height = canvasWrapper.clientHeight * dpr;
            ctx.scale(dpr, dpr);
        }

        artCanvas.addEventListener('mousemove', (event) => {
            const rect = artCanvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        });
        
        artCanvas.addEventListener('mouseleave', () => {
            mouse.x = undefined;
            mouse.y = undefined;
        });

        class Particle {
            constructor() {
                this.x = mouse.x;
                this.y = mouse.y;
                this.size = Math.random() * 5 + 1;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
                this.color = `hsl(${Math.random() * 360}, 100%, 70%)`; // 彩度を少し上げて見やすく
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.2) this.size -= 0.1;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            setCanvasSize();
            particlesArray = [];
        }

        function handleParticles() {
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();

                if (particlesArray[i].size <= 0.3) {
                    particlesArray.splice(i, 1);
                    i--;
                }
            }
        }
        
        function createParticleTrail() {
             if (mouse.x !== undefined && mouse.y !== undefined) {
                for (let i = 0; i < 5; i++) { // パーティクルの生成数を調整
                    particlesArray.push(new Particle());
                }
            }
        }

        function animate() {
            // 背景を半透明で塗りつぶし、軌跡を残す
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            const { clientWidth, clientHeight } = canvasWrapper;
            ctx.fillRect(0, 0, clientWidth, clientHeight);
            
            createParticleTrail();
            handleParticles();
            
            requestAnimationFrame(animate);
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(init, 200);
        });

        // テーマ/パレット変更時にCanvasをクリア
        if(themeToggleButton) {
            themeToggleButton.addEventListener('click', init);
        }
        const colorToggleButton = document.getElementById('color-palette-toggle');
        if (colorToggleButton) {
            colorToggleButton.addEventListener('click', init);
        }

        init();
        animate();
    }
});