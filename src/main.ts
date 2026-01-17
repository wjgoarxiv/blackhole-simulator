import './style.css'
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { vertexShader, fragmentShader } from './BlackHoleShader';

const app = document.getElementById('app');
if (!app) throw new Error("App container not found");


// Setup Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 5, 40); // Start further away

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
app.appendChild(renderer.domElement);

// Post-Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2, 
    0.5, 
    0.2  
);
composer.addPass(bloomPass);

// --- Controls State ---
// Replaced PointerLock with Keyboard-based Look + WASD Move
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
};

const lookState = {
    yawLeft: false,
    yawRight: false,
    pitchUp: false,
    pitchDown: false
};

// Configurable Settings
let movementSpeed = 25.0; // Base speed
let lookSpeed = 1.5;

// Event Listeners
const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'Space': moveState.up = true; break;
        case 'ShiftLeft': moveState.down = true; break;
        
        // Arrow Keys for Look
        case 'ArrowLeft': lookState.yawLeft = true; break;
        case 'ArrowRight': lookState.yawRight = true; break;
        case 'ArrowUp': lookState.pitchUp = true; break;
        case 'ArrowDown': lookState.pitchDown = true; break;
    }
};

const onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyD': moveState.right = false; break;
        case 'Space': moveState.up = false; break;
        case 'ShiftLeft': moveState.down = false; break;
        
        case 'ArrowLeft': lookState.yawLeft = false; break;
        case 'ArrowRight': lookState.yawRight = false; break;
        case 'ArrowUp': lookState.pitchUp = false; break;
        case 'ArrowDown': lookState.pitchDown = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Texture Loader
const textureLoader = new THREE.TextureLoader();
const galaxyTexture = textureLoader.load('./galaxy.png');
galaxyTexture.wrapS = THREE.RepeatWrapping;
galaxyTexture.wrapT = THREE.MirroredRepeatWrapping;

// Shader Material
const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uViewInverse: { value: new THREE.Matrix4() },
    uProjectionInverse: { value: new THREE.Matrix4() },
    iChannel0: { value: galaxyTexture },
    uExposure: { value: 1.0 },
    uGridMode: { value: 0.0 }, // 0 = Off, 1 = On
    uDiskIntensity: { value: 1.0 },
    uDrift: { value: 0.0 }
};

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
});

// UI Integration
const setupUI = () => {
    // Exposure
    const exposureSlider = document.getElementById('exposureSlider') as HTMLInputElement;
    if(exposureSlider) {
        exposureSlider.addEventListener('input', (e) => {
            uniforms.uExposure.value = parseFloat((e.target as HTMLInputElement).value);
        });
    }

    // Velocity (Speed)
    const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    if(speedSlider) {
        // Range 1 to 100
        speedSlider.addEventListener('input', (e) => {
            movementSpeed = parseFloat((e.target as HTMLInputElement).value);
        });
    }
    
    // Metric Viewer (Grid Toggle)
    const gridToggle = document.getElementById('gridToggle') as HTMLInputElement;
    if(gridToggle) {
        gridToggle.addEventListener('change', (e) => {
            uniforms.uGridMode.value = (e.target as HTMLInputElement).checked ? 1.0 : 0.0;
        });
    }

    // Disk Intensity
    const diskSlider = document.getElementById('diskSlider') as HTMLInputElement;
    if(diskSlider) {
        diskSlider.addEventListener('input', (e) => {
            uniforms.uDiskIntensity.value = parseFloat((e.target as HTMLInputElement).value);
        });
    }

    // Star Drift
    const driftSlider = document.getElementById('driftSlider') as HTMLInputElement;
    if(driftSlider) {
        driftSlider.addEventListener('input', (e) => {
            uniforms.uDrift.value = parseFloat((e.target as HTMLInputElement).value);
        });
    }
};
// Defer UI setup slightly or call immediately if DOM ready (script is module, so effectively deferred)
setupUI();

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
mesh.frustumCulled = false; 
scene.add(mesh);

// Resize Handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    composer.setSize(width, height);
    uniforms.iResolution.value.set(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation Loop
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

// Euler for rotation
const cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1); 
    prevTime = time;

    // --- Look Logic (Arrow Keys) ---
    if (lookState.yawLeft) cameraEuler.y += lookSpeed * delta;
    if (lookState.yawRight) cameraEuler.y -= lookSpeed * delta;
    if (lookState.pitchUp) cameraEuler.x += lookSpeed * delta;
    if (lookState.pitchDown) cameraEuler.x -= lookSpeed * delta;
    
    // Clamp pitch to avoid flipping
    cameraEuler.x = Math.max( - Math.PI / 2, Math.min( Math.PI / 2, cameraEuler.x ) );
    
    camera.quaternion.setFromEuler(cameraEuler);

    // --- Movement Logic ---
    // Friction
    const damping = 5.0;
    velocity.x -= velocity.x * damping * delta;
    velocity.z -= velocity.z * damping * delta;
    velocity.y -= velocity.y * damping * delta;

    // Direction
    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left); // Strafe relative to camera
    direction.y = Number(moveState.up) - Number(moveState.down); // Absolute up/down (world space usually, but here we fly)
    direction.normalize();

    // Acceleration
    const acceleration = movementSpeed * 10.0; // Multiplier
    
    if (moveState.forward || moveState.backward) velocity.z += direction.z * acceleration * delta;
    if (moveState.left || moveState.right) velocity.x += direction.x * acceleration * delta; // Strafe applied to local X later
    if (moveState.up || moveState.down) velocity.y += direction.y * acceleration * delta;

    // Apply Velocity to Position (Relative to Camera Rotation)
    // We need to move "Forward" in camera space
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    // Standard "FPS Fly" Movement
    // velocity.z corresponds to forward/back
    // velocity.x corresponds to strafe left/right
    // velocity.y we'll use for global Up/Down or Camera Up/Down. Let's do Global Up/Down for ease
    
    camera.position.addScaledVector(forwardVector, velocity.z * delta); // Fix: Positive velocity moves along forward vector
    camera.position.addScaledVector(rightVector, velocity.x * delta);
    camera.position.y += velocity.y * delta;

    // Shader Updates
    uniforms.iTime.value = time * 0.001;
    
    // Matrix Updates
    camera.updateMatrixWorld();
    uniforms.uViewInverse.value.copy(camera.matrixWorld);
    uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);

    composer.render();

    // --- Metric HUD Updates ---
    const hud = document.getElementById('metric-hud');
    if (hud) {
        if (uniforms.uGridMode.value > 0.5) {
            hud.style.display = 'block';
            
            const dist = camera.position.length();
            const vel = velocity.length(); // Approximation of speed
            
            const elDist = document.getElementById('hud-dist');
            if (elDist) elDist.innerText = `DISTANCE: ${dist.toFixed(2)} RS`;
            
            const elVel = document.getElementById('hud-vel');
            // Movement speed is just a factor, let's show normalized velocity
            if (elVel) elVel.innerText = `VELOCITY: ${vel.toFixed(2)} c`;
            
            const elPos = document.getElementById('hud-pos');
            if (elPos) elPos.innerText = `POS: [${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}]`;
            
        } else {
            hud.style.display = 'none';
        }
    }
}

animate();