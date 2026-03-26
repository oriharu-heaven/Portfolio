/**
 * js/fluid-cosmos.js
 * 
 * "Fluid Cosmos" のインタラクティブアート用スクリプトです。
 * Canvas APIを用いて、つながり合う無数のパーティクル（粒子）を描き出します。
 * 
 * <初学者向け解説>
 * - このスクリプトは粒子同士の距離 (dist) を三平方の定理で計算し、100px以内なら線を引くという処理をしています。
 * - 空間グリッド分割 (grid) というアルゴリズムを使って、総当たり計算の重さを劇的に軽く（パフォーマンス最適化）しています。
 */

document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('main-art-canvas');
    if (!canvas) return; // キャンバスがなければ何もしない（フェイルセーフ）
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // マウスの座標を保存
    const MOUSE = { x: undefined, y: undefined };

    // ===================================
    // 設定値（定数）
    // ===================================
    const PARTICLE_COUNT = 800; // 粒子の最大数
    const CONNECTION_DISTANCE = 100; // このピクセル距離以内なら線を結ぶ
    const MAX_CONNECTIONS_PER_PARTICLE = 3; // 1つの粒子から結ばれる線の最大数
    const CLICK_BURST_COUNT = 50; // クリックで飛び出す粒子の数
    const MAX_SPEED = 1.5; // 移動の最大速度
    const MOUSE_RADIUS = 80; // マウスに近づくと逃げる範囲

    // ===================================
    // 空間グリッド（計算を高速化するための仕組み）
    // ===================================
    let grid = [];
    const GRID_CELL_SIZE = 120; // 1マスのサイズ
    let gridCols, gridRows;

    // 色相（Hue）を正しく計算して平均色を出す関数
    const averageHue = (hue1, hue2) => {
        // 角度から一回ベクトル（X, Y）に変換して平均を取り、再度角度に戻すことで
        // 0度(赤)と350度(赤)の平均が175度(青緑)になるバグを防ぎます
        const d1 = Math.abs(hue1 - hue2);
        const d2 = 360 - d1;
        if (d1 < d2) {
            return (hue1 + hue2) / 2;
        } else {
            let avg = (hue1 + hue2 + 360) / 2;
            return avg > 360 ? avg - 360 : avg;
        }
    };
    
    // ===================================
    // 初期セットアップ
    // ===================================
    const setup = () => {
        const dpr = Math.min(window.devicePixelRatio, 2); // 高解像度ディスプレイでボヤけないようにする
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
        
        // 画面全体をグリッドに分割する
        gridCols = Math.ceil(width / GRID_CELL_SIZE);
        gridRows = Math.ceil(height / GRID_CELL_SIZE);
        grid = new Array(gridCols * gridRows);
    };

    // ===================================
    // 粒子の設計図（クラス）
    // ===================================
    class Particle {
        constructor(x, y) {
            // 位置が決まっていなければランダムに配置
            this.x = x ?? Math.random() * width;
            this.y = y ?? Math.random() * height;
            
            // 初期の速度ベクトル
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            
            this.size = Math.random() * 1.5 + 0.5; // 粒子の大きさ
            this.connections = 0; // 結ばれている線の数
            this.hue = Math.random() * 360; // それぞれ固有の色（色相）を持つ
        }

        update(mouse) {
            // 1. マウスから逃げる力（斥力）
            if(mouse.x !== undefined) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy); // マウスからの距離
                
                if (dist < MOUSE_RADIUS && dist > 0) {
                    const angle = Math.atan2(dy, dx);
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS; // 近いほど強い力
                    this.vx += Math.cos(angle) * force * 0.5;
                    this.vy += Math.sin(angle) * force * 0.5;
                }
            }
            
            // 2. スピード制限
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > MAX_SPEED) {
                this.vx = (this.vx / speed) * MAX_SPEED;
                this.vy = (this.vy / speed) * MAX_SPEED;
            }
            
            // 3. 摩擦力（空気抵抗のように少しずつ遅くなる）
            this.vx *= 0.97;
            this.vy *= 0.97;
            
            // 4. 新しい位置に移動
            this.x += this.vx;
            this.y += this.vy;
            
            // 5. 画面端に行ったら反対側へループ
            if (this.x < 0) this.x = width; 
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height; 
            if (this.y > height) this.y = 0;
        }

        draw(context) {
            context.fillStyle = `hsla(${this.hue}, 100%, 70%, 0.8)`;
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    // ===================================
    // アニメーションループ（毎フレーム呼ばれる）
    // ===================================
    const animate = () => {
        // 背景を薄い黒で塗りつけることで、軌跡（残像）を残す
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // ときどき新しい自然発生
        if (Math.random() < 0.25) particles.push(new Particle());
        // 多すぎたら古いものから消す
        while (particles.length > PARTICLE_COUNT) particles.shift();

        // グリッドを一旦空にして再登録
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
        
        // 近くの粒子同士を線で結ぶ
        ctx.lineWidth = 0.3;
        for (let i = 0; i < grid.length; i++) {
            const cellParticles = grid[i]; // このマスにいる粒子たち
            
            for (const p1 of cellParticles) {
                if (p1.connections >= MAX_CONNECTIONS_PER_PARTICLE) continue;
                
                // 周辺8マス＋自分自身のマス（計9マス）にいる粒子だけと距離を測る
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
                                
                                // 定められた距離より近ければ
                                if (dist < CONNECTION_DISTANCE) {
                                    p1.connections++; 
                                    p2.connections++;
                                    
                                    // 2つの粒子の色を混ぜたグラデーション色で描画
                                    const blendedHue = averageHue(p1.hue, p2.hue);
                                    
                                    ctx.beginPath();
                                    ctx.moveTo(p1.x, p1.y);
                                    ctx.lineTo(p2.x, p2.y);
                                    
                                    // 遠いほど線が透明になる
                                    ctx.strokeStyle = `hsla(${blendedHue}, 100%, 80%, ${1 - (dist / CONNECTION_DISTANCE) * 0.9})`;
                                    ctx.stroke();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        requestAnimationFrame(animate); // 次の描画フレームを予約
    };

    // ===================================
    // イベントリスナー（マウス・クリック・リサイズ）
    // ===================================
    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener('mousemove', (e) => { 
        MOUSE.x = getMousePos(e).x; 
        MOUSE.y = getMousePos(e).y; 
    });
    
    canvas.addEventListener('mouseleave', () => { 
        MOUSE.x = undefined; 
        MOUSE.y = undefined; 
    });
    
    // クリックでパーティクルが爆発
    canvas.addEventListener('click', (e) => {
        const pos = getMousePos(e);
        for (let i = 0; i < CLICK_BURST_COUNT; i++) {
            const p = new Particle(pos.x, pos.y);
            const angle = Math.random() * Math.PI * 2; // 360度ランダムな方向
            const speed = Math.random() * 4 + 1;
            p.vx = Math.cos(angle) * speed; 
            p.vy = Math.sin(angle) * speed;
            particles.push(p);
        }
    });

    window.addEventListener('resize', setup);
    
    // 実行
    setup();
    animate();
});