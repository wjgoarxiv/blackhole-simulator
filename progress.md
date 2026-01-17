# Progress Log

## Session: 2026-01-18

### Phase 3: Scene & Engine Setup (Refined)
- **Status:** complete
- Actions taken:
  - Fixed `PointerLockControls` activation by attaching click listener to `document.body`.
  - Implemented WASD movement with velocity-based acceleration and damping (friction).
  - Added vertical movement with Space (Up) and Shift (Down).
  - Capped frame delta to prevent physics glitches on stutter.

### Phase 4: Shader Architecture Update
- **Status:** complete
- Actions taken:
  - Updated `BlackHoleShader.ts` to use `uViewInverse` and `uProjectionInverse` for ray generation.
  - Refactored `main.ts` to compute and pass inverse matrices every frame.
  - Removed deprecated `iCameraPos`, `iCameraDir`, and `iCameraUp` uniforms.
  - Verified uniform name consistency with `Graphics_Core` expectations.
  - **Fixed critical GLSL syntax errors** in `BlackHoleShader.ts` (missing brace, duplicate variable) that were causing a black screen.