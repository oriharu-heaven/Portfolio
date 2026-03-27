document.addEventListener('DOMContentLoaded', () => {

    
    window.threeTick = () => { };

    
    
    
    const initWebGLBackground = () => {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas) return;
        if (typeof THREE === 'undefined' || typeof gsap === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        
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

        
        const centerMaterial = new THREE.PointsMaterial({ size: 0.01, sizeAttenuation: true });
        const centerSphereGeom = new THREE.SphereGeometry(1.5, 64, 64);
        const centerSphere = new THREE.Points(centerSphereGeom, centerMaterial);
        centerSphere.userData.hueOffset = Math.random();
        objectGroup.add(centerSphere);
        sceneObjects.push(centerSphere);

        
        for (let i = 0; i < 40; i++) {
            const radius = Math.random() * 0.7 + 0.3;
            const geom = new THREE.SphereGeometry(radius, 24, 24);
            const pointsMaterial = new THREE.PointsMaterial({ size: 0.01, sizeAttenuation: true });
            const points = new THREE.Points(geom, pointsMaterial);

            
            const centerRadius = 2.0;
            const centerPhi = Math.acos(2 * Math.random() - 1);
            const centerTheta = Math.random() * 4 * Math.PI;
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

        
        window.threeTick = () => {
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
    };

    
    initWebGLBackground();
});
