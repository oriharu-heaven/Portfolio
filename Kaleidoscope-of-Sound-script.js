// ===================================
// グローバル変数と設定
// ===================================

// DOM要素
const startButton = document.getElementById('startButton');
const uiContainer = document.getElementById('ui-container');
const micStatus = document.getElementById('mic-status');
const canvasContainer = document.getElementById('canvas-container');
const themeDisplay = document.getElementById('theme-display');
const themeNameEl = document.getElementById('theme-name');

// Three.js & Audio API 関連
let scene, camera, renderer, material, mesh;
let audioContext, analyser, microphone;
let time = 0;

// 音声解析の状態管理
const audioState = {
    isInitialized: false,
    amplitude: 0,
    pitch: 0,
    prevPitch: 0,
    deltaPitch: 0,
    timbreComplexity: 0,
    spectralCentroid: 0,
    sibilanceTrigger: 0,
    plosiveTrigger: 0,
    vocalizationTime: 0,
};

// テーマ管理
const themes = [
    { name: '液体', id: 'liquidMetal' },
    { name: '泡', id: 'kaleidoscope' },
];
let currentThemeIndex = 0;
let themeDisplayTimeout;

// ===================================
// メイン処理
// ===================================
function main() {
    initWebGL();
    startButton.addEventListener('click', initAudio);
    canvasContainer.addEventListener('click', switchTheme);
}

// ===================================
// テーマ切り替え機能
// ===================================
function switchTheme() {
    if (!audioState.isInitialized) return;

    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];

    material.fragmentShader = SHADERS[newTheme.id];
    material.needsUpdate = true;

    themeNameEl.textContent = newTheme.name;
    themeDisplay.classList.add('visible');
    
    clearTimeout(themeDisplayTimeout);
    themeDisplayTimeout = setTimeout(() => {
        themeDisplay.classList.remove('visible');
    }, 2000);
}


// ===================================
// WebGL初期化
// ===================================
function initWebGL() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    renderer = new THREE.WebGLRenderer({ antialias: true });

    // ▼▼▼【変更点】ウィンドウサイズではなく、コンテナのサイズを使用する ▼▼▼
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    canvasContainer.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
        u_time: { value: 0.0 },
        // ▼▼▼【変更点】解像度のユニフォームにもコンテナのサイズを渡す ▼▼▼
        u_resolution: { value: new THREE.Vector2(canvasContainer.clientWidth, canvasContainer.clientHeight) },
        u_amplitude: { value: 0.0 },
        u_pitch: { value: 0.0 },
        u_totalRotation: { value: 0.0 },
        u_timbre_complexity: { value: 0.0 },
        u_spectral_centroid: { value: 0.0 },
        u_sibilance_trigger: { value: 0.0 },
        u_plosive_trigger: { value: 0.0 },
        u_vocalization_time: { value: 0.0 },
        u_texture: { value: new THREE.Texture() }
    };

    material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
        fragmentShader: SHADERS[themes[0].id]
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    window.addEventListener('resize', onWindowResize);
}

// ===================================
// 音声関連
// ===================================
async function initAudio() {
    if (audioState.isInitialized) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.2;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        audioState.isInitialized = true;

        startButton.style.display = 'none';

        themeNameEl.textContent = themes[currentThemeIndex].name;
        themeDisplay.classList.add('visible');
        clearTimeout(themeDisplayTimeout);
        themeDisplayTimeout = setTimeout(() => {
            themeDisplay.classList.remove('visible');
        }, 2000);
        animate();
    } catch (err) {
        micStatus.textContent = 'マイクへのアクセスに失敗しました。ブラウザの設定を確認してください。';
        console.error("マイクの初期化に失敗:", err);
    }
}

function analyzeAudio() {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const timeDomainData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeDomainData);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        const sample = (timeDomainData[i] / 128.0) - 1.0;
        sum += sample * sample;
    }
    const rms = Math.sqrt(sum / bufferLength);
    audioState.amplitude = Math.min(rms * 4.0, 1.0);

    if (audioState.amplitude > 0.02) {
        audioState.vocalizationTime += 0.02;
    } else {
        audioState.vocalizationTime = Math.max(0, audioState.vocalizationTime - 0.1);
    }

    if (audioState.amplitude < 0.015) {
        audioState.amplitude = 0;
    }

    const frequencyData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(frequencyData);

    let maxVal = 0, maxIndex = 0;
    for (let i = 0; i < bufferLength; i++) {
        if (frequencyData[i] > maxVal) {
            maxVal = frequencyData[i];
            maxIndex = i;
        }
    }
    const fundamentalFreq = maxIndex * audioContext.sampleRate / analyser.fftSize;
    audioState.pitch = (fundamentalFreq > 80 && fundamentalFreq < 1200) ? fundamentalFreq : 0;
    
    audioState.deltaPitch = audioState.pitch - audioState.prevPitch;
    audioState.prevPitch = audioState.pitch;
    
    let weightedSum = 0, totalSum = 0, complexity = 0;
    for (let i = 0; i < bufferLength; i++) {
        weightedSum += i * frequencyData[i];
        totalSum += frequencyData[i];
        if (frequencyData[i] > 20) complexity++;
    }
    audioState.spectralCentroid = totalSum > 0 ? weightedSum / totalSum : 0;
    audioState.timbreComplexity = Math.min(complexity / (bufferLength * 0.2), 1.0);

    const sibilanceEnergy = frequencyData.slice(Math.floor(4000 / (audioContext.sampleRate / analyser.fftSize)), Math.floor(8000 / (audioContext.sampleRate / analyser.fftSize))).reduce((a, b) => a + b, 0);
    audioState.sibilanceTrigger = (sibilanceEnergy > 2000 && audioState.amplitude > 0.1) ? 1.0 : 0.0;
    
    const plosiveEnergy = frequencyData.slice(0, 5).reduce((a, b) => a + b, 0);
    audioState.plosiveTrigger = (plosiveEnergy > 1000 && audioState.amplitude > 0.3) ? 1.0 : 0.0;
}

// ===================================
// アニメーションループ
// ===================================
function animate() {
    requestAnimationFrame(animate);
    time += 0.016;
    analyzeAudio();
    const m = material.uniforms;
    m.u_time.value = time;
    m.u_amplitude.value += (audioState.amplitude - m.u_amplitude.value) * 0.05;
    m.u_pitch.value += (audioState.pitch - m.u_pitch.value) * 0.2;
    const rotationSpeed = Math.abs(audioState.deltaPitch) * 0.001;
    const rotationDirection = Math.sign(audioState.deltaPitch);
    m.u_totalRotation.value += rotationSpeed * rotationDirection;
    m.u_timbre_complexity.value += (audioState.timbreComplexity - m.u_timbre_complexity.value) * 0.1;
    m.u_spectral_centroid.value += (audioState.spectralCentroid - m.u_spectral_centroid.value) * 0.1;
    m.u_sibilance_trigger.value = Math.max(0, m.u_sibilance_trigger.value * 0.9 + audioState.sibilanceTrigger * 0.1);
    m.u_plosive_trigger.value = Math.max(0, m.u_plosive_trigger.value * 0.85 + audioState.plosiveTrigger * 0.1);
    m.u_vocalization_time.value = audioState.vocalizationTime;
    renderer.render(scene, camera);
}


// ===================================
// ウィンドウリサイズ処理
// ===================================
function onWindowResize() {
    // ▼▼▼【変更点】ウィンドウではなくコンテナのサイズに合わせてリサイズする ▼▼▼
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    material.uniforms.u_resolution.value.set(canvasContainer.clientWidth, canvasContainer.clientHeight);
}

// ===================================
// シェーダーライブラリ
// ===================================
const commonUniforms = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_amplitude;
    uniform float u_pitch;
    uniform float u_totalRotation;
    uniform float u_timbre_complexity;
    uniform float u_spectral_centroid;
    uniform float u_sibilance_trigger;
    uniform float u_plosive_trigger;
    uniform float u_vocalization_time;
`;

const SHADERS = {
    kaleidoscope: `
        ${commonUniforms}
        #define PI 3.14159265359
        vec3 hsb2rgb(vec3 c){ vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0); rgb = rgb*rgb*(3.0-2.0*rgb); return c.z * mix(vec3(1.0), rgb, c.y); }
        float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
        float noise(vec2 st) { vec2 i = floor(st); vec2 f = fract(st); float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x; }
        void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            uv *= 0.7;
            float zoom = 1.0 - u_amplitude * 0.15; 
            uv *= zoom; 
            float pattern_thickness = 0.1 + u_amplitude * 0.4;
            float hue = mix(0.6, 1.0, clamp(u_pitch / 900.0, 0.0, 1.0)); float pattern_density = 5.0 + u_pitch / 80.0;
            float angle = atan(uv.y, uv.x) + u_totalRotation; float radius = length(uv); float slices = 6.0;
            angle = mod(angle, PI * 2.0 / slices); angle = abs(angle - PI / slices);
            vec2 newUv = vec2(cos(angle), sin(angle)) * radius;
            vec2 patternUv = newUv * pattern_density;
            float smooth_pattern = sin(patternUv.x) * cos(patternUv.y); float noisy_pattern = noise(patternUv);
            float base_pattern_value = mix(smooth_pattern, noisy_pattern, u_timbre_complexity * 0.7);
            float edge_sharpness = 0.01 + (1.0 - smoothstep(0.0, 100.0, u_spectral_centroid)) * 0.1;
            float line = smoothstep(pattern_thickness - edge_sharpness, pattern_thickness, abs(sin(base_pattern_value * PI) - radius));
            float brightness = u_amplitude * 1.8; 
            vec3 base_color = hsb2rgb(vec3(hue, 0.8, line * brightness));
            vec3 bloom_color = base_color * smoothstep(0.5, 1.0, brightness) * 0.5; vec3 final_color = base_color + bloom_color;
            if (u_sibilance_trigger > 0.1) { final_color += random(uv + u_time) * u_sibilance_trigger * 0.5; }
            final_color += u_plosive_trigger * 0.8;
            if (u_amplitude < 0.01) { float waiting_pulse = 0.12 * (0.5 + 0.5 * sin(u_time * 2.0)); float residual_sparkle = random(uv + u_time * 0.1) * smoothstep(1.0, 0.0, radius); final_color = vec3(waiting_pulse + residual_sparkle * 0.05); }
            gl_FragColor = vec4(final_color, 1.0);
        }`,
    liquidMetal: `
        ${commonUniforms}
        #define PI 3.14159265359 
        #define N_SLICES 8.0
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v) { const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439); vec2 i  = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx); vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0); vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)); vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h); vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130.0 * dot(m, g); }
        float fbm(vec2 p) { float value = 0.0; float amplitude = 0.5; for(int i = 0; i < 4; i++) { value += amplitude * snoise(p); p *= 2.0; amplitude *= 0.5; } return value; }
        vec3 getNormal(vec2 p, float height) { float eps = 0.001; float dx = height - fbm(p + vec2(eps, 0.0)); float dy = height - fbm(p + vec2(0.0, eps)); return normalize(vec3(dx, dy, eps * 2.0)); }
        void main() { 
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y); 
            float angle = atan(uv.y, uv.x); float radius = length(uv); angle = mod(angle, PI * 2.0 / N_SLICES); angle = abs(angle - PI / N_SLICES); 
            vec2 kaleido_uv = radius * vec2(cos(angle), sin(angle)); 
            float viscosity = clamp(u_pitch / 800.0, 0.0, 1.0); 
            float ripple_strength = u_amplitude * 20.0; 
            vec2 base_uv = kaleido_uv * 2.0; 
            float time_flow = u_time * 0.3; 
            vec2 warp_offset = vec2(fbm(base_uv + time_flow), fbm(base_uv + time_flow + 5.0)); 
            float warp_amount = mix(0.8, 0.1, viscosity); 
            float height = fbm(base_uv + warp_amount * warp_offset); 
            float ripple = sin(radius * ripple_strength - u_time * 5.0) * u_amplitude * 0.2; height += ripple; 
            vec3 normal = getNormal(base_uv, height); 
            vec3 light_dir = normalize(vec3(0.5, 0.5, 1.0)); 
            vec3 view_dir = normalize(vec3(0.0, 0.0, 1.0)); 
            float diffuse = max(0.0, dot(normal, light_dir)) * 0.8 + 0.2; 
            vec3 reflect_dir = reflect(-light_dir, normal); 
            float specular = pow(max(0.0, dot(view_dir, reflect_dir)), 32.0); 
            vec3 base_color = vec3(0.8, 0.85, 0.9); 
            vec3 final_color = base_color * diffuse + vec3(1.0) * specular + base_color * u_amplitude * 0.5; 
            gl_FragColor = vec4(final_color * (0.25 + u_amplitude * 0.75), 1.0); 
        }`
};

// ===================================
// アプリケーションの開始
// ===================================
main();