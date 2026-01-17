# Findings & Decisions

## Requirements
- First-person POV
- Hyper-realistic black-hole simulator (Interstellar style)
- Event horizon well-rendered
- High-res space image (galaxies) background
- WASD + Mouse look navigation

## Technical Decisions
| Decision | Rationale |
| --- | --- |
| PointerLockControls | Standard for FPS-style mouse look. |
| Custom Velocity Logic | Provides smoother movement with acceleration and damping compared to simple position stepping. |
| Uniform Synchronization | Transitioned to `uViewInverse` and `uProjectionInverse` for cleaner ray generation and better alignment with industry standards. |

## Issues Encountered
| Issue | Resolution |
| --- | --- |
| Inverted/Slow Movement | Fixed velocity logic and used `controls.moveForward`/`controls.moveRight` which handle local orientation automatically. |
| Non-responsive click to lock | Added listener to `document.body` to ensure coverage. |
| Shader-Camera Mismatch | Moved to Matrix-based camera setup to eliminate manual basis vector synchronization. |
| Black Render | Identified syntax errors in `BlackHoleShader.ts` (missing brace in `noise`, duplicate `ringDist` variable). Fix applied. |