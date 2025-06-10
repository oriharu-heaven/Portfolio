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
    
    const mouse3D = new THREE.Vector2(); 
    
    if (typeof THREE !== 'undefined' && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const canvas = document.getElementById('webgl-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.position.z = 5;

        const sceneObjects = [];
        const objectGroup = new THREE.Group();
        scene.add(objectGroup);
        
        const centerMaterial = new THREE.PointsMaterial({ size: 0.03, sizeAttenuation: true });
        const centerSphereGeom = new THREE.SphereGeometry(1.5, 64, 64);
        const centerSphere = new THREE.Points(centerSphereGeom, centerMaterial);
        centerSphere.userData.hueOffset = Math.random();
        objectGroup.add(centerSphere);
        sceneObjects.push(centerSphere);

        for (let i = 0; i < 40; i++) {
            const radius = Math.random() * 0.7 + 0.1;
            const segments = radius > 0.5 ? 24 : 16;
            const geom = new THREE.SphereGeometry(radius, segments, segments);
            
            const pointsMaterial = new THREE.PointsMaterial({
                size: 0.03,
                sizeAttenuation: true
            });
            const points = new THREE.Points(geom, pointsMaterial);
            
            const centerRadius = 2.0; 
            const centerPhi = Math.acos(2 * Math.random() - 1);
            const centerTheta = Math.random() * 2 * Math.PI;
            const centerPos = new THREE.Vector3();
            const centerR = centerRadius * Math.random();
            centerPos.x = centerR * Math.sin(centerPhi) * Math.cos(centerTheta);
            centerPos.y = centerR * Math.sin(centerPhi) * Math.sin(centerTheta);
            centerPos.z = centerR * Math.cos(centerPhi);

            const relativeRadiusMax = 2.0;
            const relativeR = Math.pow(Math.random(), 2) * relativeRadiusMax;
            const relativePhi = Math.acos(2 * Math.random() - 1);
            const relativeTheta = Math.random() * 2 * Math.PI;
            const relativePos = new THREE.Vector3();
            relativePos.x = relativeR * Math.sin(relativePhi) * Math.cos(relativeTheta);
            relativePos.y = relativeR * Math.sin(relativePhi) * Math.sin(relativeTheta);
            relativePos.z = relativeR * Math.cos(relativePhi);

            const finalPos = centerPos.add(relativePos);
            points.position.copy(finalPos);
            
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

        const clock = new THREE.Clock();
        var tick = () => {
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
        }
    }

    // =======================================================================
    // --- タイトルのグリッチ（文字化け）エフェクト ---
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

    // =======================================================================
    // --- カーソル追従エフェクト ---
    // ... (この部分は変更なし) ...
    const followerText = createFollower('', ['cursor-follower__text']);
    const followerShape = createFollower('', ['cursor-follower__shape']);

    function createFollower(text, classNames = []) {
        const el = document.createElement('div');
        el.classList.add('cursor-follower', ...classNames);
        el.innerHTML = `<span>${text}</span>`;
        document.body.appendChild(el);
        return {
            el: el,
            x: -200,
            y: -200,
        };
    }

    const mousePos = { x: 0, y: 0 };
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

    let isCursorGlitching = false;
    const cursorGlitchChars = '!?#<>/+*';
    
    setInterval(() => {
        if (Math.random() > 0.5) {
            isCursorGlitching = true;
            setTimeout(() => {
                isCursorGlitching = false;
            }, 300);
        }
    }, 2000); 

    // =======================================================================
    // --- 統合アニメーションループ ---
    // =======================================================================
    const threeTick = (typeof tick === 'function') ? tick : () => {};

    function unifiedTick() {
        // カーソル追従
        followerText.x += (mousePos.x - followerText.x) * 0.1;
        followerText.y += (mousePos.y - followerText.y) * 0.1;
        followerShape.x += (mousePos.x - followerShape.x) * 0.07;
        followerShape.y += (mousePos.y - followerShape.y) * 0.07;
        
        followerText.el.style.transform = `translate(${followerText.x}px, ${followerText.y}px)`;
        followerShape.el.style.transform = `translate(${followerShape.x}px, ${followerShape.y}px)`;

        const textSpan = followerText.el.firstElementChild;
        const timestamp = Math.floor(Date.now() / 1000).toString();

        if (isCursorGlitching) {
            let glitchedText = '';
            for (const char of timestamp) {
                if (Math.random() > 0.3) {
                    glitchedText += cursorGlitchChars[Math.floor(Math.random() * cursorGlitchChars.length)];
                } else {
                    glitchedText += char;
                }
            }
            textSpan.textContent = glitchedText;
        } else {
            textSpan.textContent = timestamp;
        }

        // Three.jsアニメーション
        threeTick();
        
        requestAnimationFrame(unifiedTick);
    }

    unifiedTick();


    // =======================================================================
    // --- Interactive Art Canvas ---
    // =======================================================================
    const artCanvas = document.getElementById('interactive-canvas');
    if (artCanvas) {
        const ctx = artCanvas.getContext('2d');
        const canvasWrapper = artCanvas.parentElement;
        let particlesArray;

        function setCanvasSize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            artCanvas.width = canvasWrapper.clientWidth * dpr;
            artCanvas.height = canvasWrapper.clientHeight * dpr;
            ctx.scale(dpr, dpr);
        }

        const mouse = {
            x: undefined,
            y: undefined,
        };

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
                // ★★★ 変更点: 各パーティクルの色をランダムな色相に設定 ★★★
                this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
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
                for (let i = 0; i < 5; i++) {
                    particlesArray.push(new Particle());
                }
            }
        }

        function animate() {
            ctx.fillStyle = 'rgba(22, 64, 77, 0.1)';
            ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);
            
            createParticleTrail();
            handleParticles();
            
            requestAnimationFrame(animate);
        }

        init();
        animate();

        window.addEventListener('resize', () => {
             init();
        });
        
        // テーマ変更時にCanvasの背景をクリア
        themeToggleButton.addEventListener('click', () => {
             init();
        });
    }

});