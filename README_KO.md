# 상대론적 블랙홀 시뮬레이터 (Relativistic Black Hole Simulator) 🕳️

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white)](https://wjgoarxiv.github.io/blackhole-simulator/)

중력 렌즈 효과와 도플러 비밍, 볼류메트릭 강착 원반(Accretion Disk)을 구현한 초현실적 WebGL 블랙홀 시뮬레이션입니다.

## ✨ 주요 기능

- **물리 기반 렌더링**: 일반 상대성 이론에 기반한 실시간 GLSL 레이마칭(Raymarching).
- **시네마틱 비주얼**: fBM 노이즈와 자체 그림자(Self-shadowing)가 적용된 "Ospray 스타일"의 고품질 강착 원반.
- **인터랙티브 컨트롤**: 원반 밝기(Disk Intensity), 배경 시차(Star Drift), 노출(Exposure) 조절 가능.
- **Metric HUD**: 거리($r$), 속도($c$), 좌표 실시간 표시.

## 🎮 조작법

- **이동**: `W`, `A`, `S`, `D` (+ `Space`/`Shift` 상/하 이동)
- **시점**: 방향키 (또는 마우스 드래그)
- **UI**: "[Hide]" 버튼으로 인터페이스 숨기기 가능.

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🛠️ 기술 스택

- **엔진**: Three.js + Custom GLSL Fragment Shader
- **언어**: TypeScript
- **빌드**: Vite
