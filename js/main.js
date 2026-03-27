/**
 * js/main.js
 * 
 * 主にトップページ（index.html）で使用されるグラフィック系の処理を担当します。
 * 背景の3Dアニメーション（Three.js）と、インタラクティブアート（Canvas API）が含まれます。
 * 
 * <初学者向け解説>
 * - Three.js: ブラウザ上で3Dグラフィックを描画するWebGLを、簡単に扱うためのライブラリです。
 * - GSAP (ScrollTrigger): スクロールに応じたアニメーションを簡単に実装できるライブラリです。
 * - Canvas API: 2Dグラフィックを描画するための標準API。ここではパーティクル（粒子）をたくさん動かすことでアートを表現しています。
 */

document.addEventListener('DOMContentLoaded', () => {

    // WebGL描画ループを common.js のアニメーションループから呼び出せるようにグローバルに関数を公開
    window.threeTick = () => { };

    // =========================================================
    // 1. 背景の3Dアニメーション（Three.js）
    // =========================================================
    const initWebGLBackground = () => {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas) return;
        if (typeof THREE === 'undefined' || typeof gsap === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        // Three.jsの基本セット：シーン(空間)、カメラ(視点)、レンダラー(描画エンジン)
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 高解像度ディスプレイ対応
        camera.position.z = 5;

        // 全オブジェクトをまとめるグループ
        const objectGroup = new THREE.Group();
        scene.add(objectGroup);
        const sceneObjects = [];
        const mouse3D = new THREE.Vector2();

        // 中央の大きな球体（点群で表現）
        const centerMaterial = new THREE.PointsMaterial({ size: 0.01, sizeAttenuation: true });
        const centerSphereGeom = new THREE.SphereGeometry(1.5, 64, 64);
        const centerSphere = new THREE.Points(centerSphereGeom, centerMaterial);
        centerSphere.userData.hueOffset = Math.random();
        objectGroup.add(centerSphere);
        sceneObjects.push(centerSphere);

        // 周りを飛ぶ小さな球体群
        for (let i = 0; i < 40; i++) {
            const radius = Math.random() * 0.7 + 0.3;
            const geom = new THREE.SphereGeometry(radius, 24, 24);
            const pointsMaterial = new THREE.PointsMaterial({ size: 0.01, sizeAttenuation: true });
            const points = new THREE.Points(geom, pointsMaterial);

            // 空間のランダムな位置に配置
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

        // マウスの動きに合わせてカメラを微妙に動かす
        window.addEventListener('mousemove', (event) => {
            // マウス座標を -1 から 1 の範囲に正規化（Three.jsで扱いやすくするため）
            mouse3D.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse3D.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // スクロールに応じた回転アニメーション（GSAPを使用）
        gsap.timeline({
            scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 }
        }).to(objectGroup.rotation, { x: Math.PI, y: Math.PI * 2 }, 0);

        const clock = new THREE.Clock(); // 経過時間をはかるためのタイマー

        // common.js 側のアニメーションループから毎フレーム呼ばれる関数を定義
        window.threeTick = () => {
            const elapsedTime = clock.getElapsedTime();

            sceneObjects.forEach((object, index) => {
                const speedFactor = 0.1 * (index % 5 + 1);
                object.rotation.x += 0.0001 * speedFactor;
                object.rotation.y += 0.0002 * speedFactor;

                // 時間経過でフワフワと拡大縮小させる
                const scaleValue = Math.sin(elapsedTime * 0.5 + index) * 0.1 + 0.9;
                object.scale.set(scaleValue, scaleValue, scaleValue);

                // 色（色相）を時間で変化させるグラデーション
                const hue = (elapsedTime * 0.05 + object.userData.hueOffset) % 1;
                object.material.color.setHSL(hue, 0.7, 0.6);
            });

            // マウス座標に向かって滑らかに回転させる（イージング）
            const targetRotationX = mouse3D.y * 1.0;
            const targetRotationY = mouse3D.x * 1.0;
            objectGroup.rotation.x += (targetRotationX - objectGroup.rotation.x) * 0.05;
            objectGroup.rotation.y += (targetRotationY - objectGroup.rotation.y) * 0.05;

            // カメラ位置も少し追従
            const targetCameraX = mouse3D.x * 0.2;
            const targetCameraY = mouse3D.y * 0.2;
            camera.position.x += (targetCameraX - camera.position.x) * 0.05;
            camera.position.y += (targetCameraY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            // 最終的に画面に描画
            renderer.render(scene, camera);
        };
    };

    // それぞれの機能を実行
    initWebGLBackground();
});
