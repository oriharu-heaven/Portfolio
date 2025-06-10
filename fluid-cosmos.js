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
    };

    // --- ページ固有ロジックの実行 ---

    // 共通部分の初期化
    setupHeaderControls();
    setupSharedAnimations();

    // fluid-cosmos.html用のロジック
    if (document.getElementById('main-art-canvas')) {
        const canvas = document.getElementById('main-art-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        const MOUSE = { x: undefined, y: undefined };

        const PARTICLE_COUNT = 800;
        const CONNECTION_DISTANCE = 100; 
        const MAX_CONNECTIONS_PER_PARTICLE = 3;
        const CLICK_BURST_COUNT = 50;
        const MAX_SPEED = 1.5;
        const MOUSE_RADIUS = 80;

        let grid = [];
        const GRID_CELL_SIZE = 120;
        let gridCols, gridRows;

        const averageHue = (hue1, hue2) => {
            const d1 = Math.abs(hue1 - hue2);
            const d2 = 360 - d1;
            if (d1 < d2) {
                return (hue1 + hue2) / 2;
            } else {
                let avg = (hue1 + hue2 + 360) / 2;
                return avg > 360 ? avg - 360 : avg;
            }
        };
        
        const setup = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            const rect = canvas.parentElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle());
            }
            gridCols = Math.ceil(width / GRID_CELL_SIZE);
            gridRows = Math.ceil(height / GRID_CELL_SIZE);
            grid = new Array(gridCols * gridRows);
        };

        class Particle {
            constructor(x, y) {
                this.x = x ?? Math.random() * width;
                this.y = y ?? Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.2;
                this.vy = (Math.random() - 0.5) * 0.2;
                this.size = Math.random() * 1.5 + 0.5;
                this.connections = 0;
                this.hue = Math.random() * 360; 
            }
            update(mouse) {
                if(mouse.x !== undefined) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < MOUSE_RADIUS && dist > 0) {
                        const angle = Math.atan2(dy, dx);
                        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                        this.vx += Math.cos(angle) * force * 0.5;
                        this.vy += Math.sin(angle) * force * 0.5;
                    }
                }
                const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
                if (speed > MAX_SPEED) {
                    this.vx = (this.vx / speed) * MAX_SPEED;
                    this.vy = (this.vy / speed) * MAX_SPEED;
                }
                this.vx *= 0.97;
                this.vy *= 0.97;
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0) this.x = width; if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height; if (this.y > height) this.y = 0;
            }
            draw(context) {
                context.fillStyle = `hsla(${this.hue}, 100%, 70%, 0.8)`;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            if (Math.random() < 0.25) {
                particles.push(new Particle());
            }
            while (particles.length > PARTICLE_COUNT) {
                 particles.shift();
            }

            for (let i = 0; i < grid.length; i++) grid[i] = [];
            for (const p of particles) {
                p.update(MOUSE);
                p.draw(ctx);
                p.connections = 0; 
                const gridX = Math.floor(p.x / GRID_CELL_SIZE);
                const gridY = Math.floor(p.y / GRID_CELL_SIZE);
                if (gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows) {
                    grid[gridY * gridCols + gridX].push(p);
                }
            }
            
            ctx.lineWidth = 0.3;
            for (let i = 0; i < grid.length; i++) {
                const cellParticles = grid[i];
                for (const p1 of cellParticles) {
                    if (p1.connections >= MAX_CONNECTIONS_PER_PARTICLE) continue;
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const gridX = (i % gridCols) + dx;
                            const gridY = Math.floor(i / gridCols) + dy;
                            if (gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows) {
                                const searchIndex = gridY * gridCols + gridX;
                                for (const p2 of grid[searchIndex]) {
                                    if (p1 === p2 || p2.connections >= MAX_CONNECTIONS_PER_PARTICLE) continue;
                                    const dist_x = p1.x - p2.x;
                                    const dist_y = p1.y - p2.y;
                                    const dist = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
                                    if (dist < CONNECTION_DISTANCE) {
                                        p1.connections++; p2.connections++;
                                        const blendedHue = averageHue(p1.hue, p2.hue);
                                        ctx.beginPath();
                                        ctx.moveTo(p1.x, p1.y);
                                        ctx.lineTo(p2.x, p2.y);
                                        ctx.strokeStyle = `hsla(${blendedHue}, 100%, 80%, ${1 - (dist / CONNECTION_DISTANCE) * 0.9})`;
                                        ctx.stroke();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            requestAnimationFrame(animate);
        };

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        canvas.addEventListener('mousemove', (e) => { MOUSE.x = getMousePos(e).x; MOUSE.y = getMousePos(e).y; });
        canvas.addEventListener('mouseleave', () => { MOUSE.x = undefined; MOUSE.y = undefined; });
        canvas.addEventListener('click', (e) => {
            const pos = getMousePos(e);
            for (let i = 0; i < CLICK_BURST_COUNT; i++) {
                const p = new Particle(pos.x, pos.y);
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 1;
                p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
                particles.push(p);
            }
        });
        window.addEventListener('resize', setup);
        setup();
        animate();
    }
});
