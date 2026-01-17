export const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    // Render quad directly in clip space to cover the entire screen
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;


export const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform sampler2D iChannel0; // Background star map

uniform mat4 uViewInverse;
uniform mat4 uProjectionInverse;
uniform float uExposure;
uniform float uGridMode;
uniform float uDiskIntensity;
uniform float uDrift;

varying vec2 vUv;

// Constants
#define MAX_STEPS 600
#define STEP_SIZE 0.05
#define MAX_DIST 10000.0
#define RS 1.0 

// Accretion Disk - GARGANTUA SCALE
#define DISK_INNER 2.5
#define DISK_OUTER 30.0
#define DISK_HEIGHT 0.4

// Math
#define PI 3.14159265359

// Simple pseudo-noise for disk texture
float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

// Fractal Brownian Motion for Ospray-like clouds
float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i=0; i<5; i++) {
        f += amp * noise(p);
        p *= 2.02; // Lacunarity
        amp *= 0.5;
    }
    return f;
}

void main() {
    // 1. Ray Setup using Inverse Matrices
    vec2 ndc = vUv * 2.0 - 1.0;
    
    // Near plane point in view space
    vec4 rayDirView = uProjectionInverse * vec4(ndc, -1.0, 1.0);
    rayDirView /= rayDirView.w;
    
    // Ray direction in world space
    vec3 rayDir = normalize((uViewInverse * vec4(rayDirView.xyz, 0.0)).xyz);
    
    // Camera position in world space
    vec3 rayPos = (uViewInverse * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 camPos = rayPos; // Store initial position for parallax
    
    // Accumulators
    vec3 col = vec3(0.0);
    vec3 glow = vec3(0.0);
    float totalDensity = 0.0;
    
    // Raymarching Loop
    for(int i=0; i<MAX_STEPS; i++) {
        float r = length(rayPos);
        
        // Event Horizon (Black Hole)
        if(r < RS) {
            col = vec3(0.0); 
            break;
        }
        
        // Escape check
        if(r > MAX_DIST) {
            // Sample background (environment map)
            // Spherical mapping:
            float phi = atan(rayDir.z, rayDir.x);
            float theta = asin(rayDir.y);
            vec2 texUV = vec2(0.5 + phi / (2.0 * PI), 0.5 + theta / PI);
            
            // Parallax / Drift
            // Use uDrift to control strength. Simple offset based on camera position.
            if (uDrift > 0.01) {
                texUV += vec2(camPos.z, camPos.y) * 0.0001 * uDrift; 
            }
            
            // Deep Field Brightness Boost
            col += texture2D(iChannel0, texUV).rgb * 1.5; 
            break;
        }
        

        // --- Gravity Bending ---
        float distSq = dot(rayPos, rayPos);
        float h = STEP_SIZE * r; // Adaptive step
        h = max(0.02, h); // Clamp ONLY lower bound. Let it grow!
        
        // Deflect
        float force = 2.5 * RS / (distSq); 
        vec3 toCenter = -normalize(rayPos);
        
        rayDir = normalize(rayDir + toCenter * force * h * 2.0);
        rayPos += rayDir * h;
        
        // --- Accretion Disk Volumetrics ---
        if (r > DISK_INNER && r < DISK_OUTER) {
             float distFromPlane = abs(rayPos.y);
             if (distFromPlane < DISK_HEIGHT * (1.0 + r*0.1)) { // Flared
                 // Rotating noise texture - scaled for larger disk
                 vec3 noiseCoord = vec3(rayPos.x * 0.5, rayPos.y * 5.0, rayPos.z * 0.5);
                 float ang = atan(rayPos.z, rayPos.x);
                 float dist = length(rayPos.xz);
                 
                 // High-Fidelity Spiral details using FBM
                 float spiral = fbm(vec3(dist * 0.8 - iTime * 0.8 + ang * 2.0, distFromPlane * 5.0, 0.0));
                 
                 // Soft fade at edges
                 float radialFade = smoothstep(DISK_INNER, DISK_INNER + 2.0, r) * smoothstep(DISK_OUTER, DISK_OUTER - 5.0, r);
                 float verticalFade = 1.0 - smoothstep(0.0, DISK_HEIGHT * (1.0 + r*0.1), distFromPlane);
                 
                 // Enhanced Density with self-shadowing approximation
                 float density = radialFade * verticalFade * (0.2 + 0.8 * spiral * spiral); // Squaring fbm for sharper contrast
                 // Fake Shadow: deeper inside the volume gets darker
                 density *= smoothstep(0.0, 0.5, verticalFade); 
                 
                 // Doppler Beaming
                 vec3 diskVel = normalize(vec3(-rayPos.z, 0.0, rayPos.x));
                 float doppler = dot(rayDir, diskVel);
                 float shift = 1.0 + doppler * 0.4; // Slightly reduced strength for huge disk
                 
                 // Color temperature
                 vec3 hotColor = vec3(0.7, 0.85, 1.0) * 10.0; // Hotter/Brighter
                 vec3 midColor = vec3(1.0, 0.7, 0.3) * 5.0; 
                 vec3 coldColor = vec3(0.8, 0.2, 0.0) * 2.5; 
                 
                 vec3 localColor = mix(midColor, hotColor, smoothstep(0.0, 1.0, shift - 0.5));
                 localColor = mix(coldColor, localColor, smoothstep(0.5, 1.5, shift));
                 
                 // Accumulate
                 float segDensity = density * 0.08 * step(0.0, density);
                 vec3 segColor = localColor * segDensity;
                 
                 glow += segColor * (1.0 - totalDensity) * uDiskIntensity;
                 totalDensity += segDensity;
                 
                 if(totalDensity > 0.98) break; 
             }
        }
        
        // --- Photon Ring Glow (at ~1.5 RS) ---
        if (r > RS && r < RS * 2.0) {
            float ringDist = abs(r - RS * 1.5);
            // Sharper, brighter photon ring (Cinematic bloom)
            float ringGlow = exp(-ringDist * 30.0); 
            glow += vec3(1.0, 0.9, 0.7) * ringGlow * 0.2 * h; // Boost intensity and slightly warm tint
        }
    }
    
    // Composite
    col += glow;

    // --- Gravitational Blue Shift (Doppler-like effect for Observer) ---
    // Calculate distance from singularity
    float camDist = length((uViewInverse * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
    
    // Shift factor: increases as we get closer to RS
    // Used 1.5 * RS as a safe "strong effect" zone start
    float shiftIntensity = smoothstep(10.0, 1.2 * RS, camDist); 
    
    // Blue tint color (high energy)
    vec3 blueShiftColor = vec3(0.5, 0.8, 1.0);
    
    // Apply shift: boost brightness and tint blue
    // The closer we get, the more "energy" (brightness) and blue color we see
    if (shiftIntensity > 0.0) {
        col = mix(col, col * blueShiftColor * 1.5 + vec3(0.0, 0.1, 0.3) * shiftIntensity, shiftIntensity * 0.8);
    }
    
    // --- Metric Viewer (Distortion Grid) ---
    if (uGridMode > 0.5) {
        // Use the final ray position to draw a 3D grid
        // Since rayPos is curved by gravity, the grid will appear curved!
        float gridSize = 2.0;
        float lineThick = 0.05;
        
        vec3 grid = step(gridSize - lineThick, mod(rayPos, gridSize));
        float isGrid = max(grid.x, max(grid.y, grid.z));
        
        // Only show grid where we didn't hit the black hole (or maybe show it everywhere for debug)
        if (length(rayPos) > RS * 1.01) {
             col = mix(col, vec3(0.0, 1.0, 0.0), isGrid * 0.3); // Green faint grid
        }
    }

    // Tone mapping (ACES) with Exposure Control
    col *= 0.6 * uExposure;
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    col = clamp((col * (a * col + b)) / (col * (c * col + d) + e), 0.0, 1.0);
    
    gl_FragColor = vec4(col, 1.0);
}
`;