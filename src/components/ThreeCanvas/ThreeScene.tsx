import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ThemeMode, MorphMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface ThreeSceneProps {
  theme: ThemeMode;
  morphMode: MorphMode;
  targetTemp: number;
  currentTemp: number;
  isKombiActive: boolean;
  flameLevelPercent?: number;
  performanceMode: boolean;
  reducedMotion: boolean;
  onSelectComponent?: (name: string, description: string) => void;
  onSetTarget?: (newTarget: number) => void;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  theme,
  morphMode,
  targetTemp,
  currentTemp,
  isKombiActive,
  flameLevelPercent = 50,
  performanceMode,
  reducedMotion,
  onSelectComponent,
  onSetTarget,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    theme,
    morphMode,
    targetTemp,
    currentTemp,
    isKombiActive,
    flameLevelPercent,
    performanceMode,
    reducedMotion,
    onSelectComponent,
    onSetTarget,
  });

  useEffect(() => {
    stateRef.current = {
      theme,
      morphMode,
      targetTemp,
      currentTemp,
      isKombiActive,
      flameLevelPercent,
      performanceMode,
      reducedMotion,
      onSelectComponent,
      onSetTarget,
    };
  }, [theme, morphMode, targetTemp, currentTemp, isKombiActive, flameLevelPercent, performanceMode, reducedMotion, onSelectComponent, onSetTarget]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Clear any leftover canvas before attaching
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;
    const initialAspect = width / height;

    const scene = new THREE.Scene();
    // Responsive camera: closer on tall mobile screens so dial is large and prominent
    const camera = new THREE.PerspectiveCamera(38, initialAspect, 0.1, 100);
    const initialZ = initialAspect < 0.75 ? 5.5 : initialAspect < 1.05 ? 6.1 : 6.9;
    camera.position.set(0, 0, initialZ);
    camera.lookAt(0, 0, 0);

    const isEco = performanceMode;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless && !isEco,
      alpha: true,
      powerPreference: isEco ? 'low-power' : 'high-performance',
    });
    renderer.setSize(width, height);
    // In 60 FPS mode (isEco = false): use sharp high-DPI retina pixel ratio (up to 2.5x)
    // In Eco mode (isEco = true): use 1x for maximum battery saving
    const dpr = isHeadless || isEco ? 1 : Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === 'dark' ? 1.25 : 1.1;

    container.appendChild(renderer.domElement);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // Balanced Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, stateRef.current.theme === 'dark' ? 0.4 : 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    fillLight.position.set(-3, -2, 3);
    scene.add(fillLight);

    // Procedural Dial Canvas Texture (OLED Screen with Authentic Flame Tongue at the Bottom)
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 1024;
    dialCanvas.height = 1024;
    const dialCtx = dialCanvas.getContext('2d')!;

    function renderDialTexture(
      curr: number,
      targ: number,
      isHeating: boolean,
      isDark: boolean,
      animTime: number,
      flamePercent: number = 50
    ) {
      dialCtx.clearRect(0, 0, 1024, 1024);

      const cx = 512;
      const cy = 512;
      const radius = 430;

      // Dark background circular panel
      const grad = dialCtx.createRadialGradient(cx, cy, 60, cx, cy, 480);
      if (isDark) {
        grad.addColorStop(0, '#0a0e17');
        grad.addColorStop(0.65, '#0f172a');
        grad.addColorStop(1, '#020617');
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(0.65, '#0f172a');
        grad.addColorStop(1, '#020617');
      }
      dialCtx.fillStyle = grad;
      dialCtx.beginPath();
      dialCtx.arc(cx, cy, 470, 0, Math.PI * 2);
      dialCtx.fill();

      // Outer dial tick marks (60 ticks)
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 5 === 0;
        const tickLen = isMajor ? 30 : 16;
        const r1 = radius - tickLen;
        const r2 = radius;

        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * r2;
        const y2 = cy + Math.sin(angle) * r2;

        dialCtx.strokeStyle = isMajor
          ? (isHeating ? 'rgba(249, 115, 22, 0.85)' : 'rgba(56, 189, 248, 0.75)')
          : 'rgba(255, 255, 255, 0.2)';
        dialCtx.lineWidth = isMajor ? 5 : 2.5;
        dialCtx.beginPath();
        dialCtx.moveTo(x1, y1);
        dialCtx.lineTo(x2, y2);
        dialCtx.stroke();
      }

      // Progress Arc for Target Temp (10°C to 32°C range)
      const startAngle = Math.PI * 0.75;
      const endAngle = Math.PI * 2.25;
      const pct = Math.max(0, Math.min(1, (targ - 10) / (32 - 10)));
      const currPct = Math.max(0, Math.min(1, (curr - 10) / (32 - 10)));

      // Arc background
      dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      dialCtx.lineWidth = 26;
      dialCtx.lineCap = 'round';
      dialCtx.beginPath();
      dialCtx.arc(cx, cy, 335, startAngle, endAngle);
      dialCtx.stroke();

      // Active Target Arc (Warm vibrant gradient)
      const arcGrad = dialCtx.createLinearGradient(100, 100, 900, 900);
      if (isHeating) {
        arcGrad.addColorStop(0, '#f97316');
        arcGrad.addColorStop(1, '#ef4444');
      } else {
        arcGrad.addColorStop(0, '#06b6d4');
        arcGrad.addColorStop(1, '#3b82f6');
      }
      dialCtx.strokeStyle = arcGrad;
      dialCtx.lineWidth = 26;
      dialCtx.beginPath();
      dialCtx.arc(cx, cy, 335, startAngle, startAngle + pct * (endAngle - startAngle));
      dialCtx.stroke();

      // Target Temperature WHITE KNOB (Interactive circular handle on the orange arc)
      const targetAngle = startAngle + pct * (endAngle - startAngle);
      const tx = cx + Math.cos(targetAngle) * 335;
      const ty = cy + Math.sin(targetAngle) * 335;

      // 1. Ambient pulsating glow halo
      dialCtx.fillStyle = isHeating ? 'rgba(255, 255, 255, 0.45)' : 'rgba(56, 189, 248, 0.4)';
      dialCtx.beginPath();
      dialCtx.arc(tx, ty, 32, 0, Math.PI * 2);
      dialCtx.fill();

      // 2. Pure bright white circular knob body
      dialCtx.fillStyle = '#ffffff';
      dialCtx.beginPath();
      dialCtx.arc(tx, ty, 20, 0, Math.PI * 2);
      dialCtx.fill();

      // 3. Crisp orange/cyan outer border
      dialCtx.strokeStyle = isHeating ? '#f97316' : '#0284c7';
      dialCtx.lineWidth = 5;
      dialCtx.stroke();

      // 4. Center finger grip dot
      dialCtx.fillStyle = isHeating ? '#ea580c' : '#0284c7';
      dialCtx.beginPath();
      dialCtx.arc(tx, ty, 6, 0, Math.PI * 2);
      dialCtx.fill();

      // Current Temp needle point (distinct slim cyan badge)
      const currAngle = startAngle + currPct * (endAngle - startAngle);
      const nx = cx + Math.cos(currAngle) * 335;
      const ny = cy + Math.sin(currAngle) * 335;
      dialCtx.fillStyle = '#38bdf8';
      dialCtx.beginPath();
      dialCtx.arc(nx, ny, 11, 0, Math.PI * 2);
      dialCtx.fill();
      dialCtx.strokeStyle = '#ffffff';
      dialCtx.lineWidth = 3;
      dialCtx.stroke();

      // Upper Header Label: Status & Target
      dialCtx.textAlign = 'center';
      dialCtx.textBaseline = 'middle';

      dialCtx.fillStyle = isHeating ? '#fb923c' : '#94a3b8';
      dialCtx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(isHeating ? '🔥 AKTİF ISITMA' : '❄️ BEKLEMEDE', cx, cy - 210);

      dialCtx.fillStyle = '#94a3b8';
      dialCtx.font = '600 32px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(`HEDEF: ${targ.toFixed(1)}°C`, cx, cy - 155);

      // Large Current Temp Numbers (Centered perfectly)
      dialCtx.fillStyle = '#ffffff';
      dialCtx.font = 'bold 155px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(`${curr.toFixed(1)}°`, cx, cy - 35);

      // ── AUTHENTIC REALISTIC FLAME AT THE BOTTOM INSIDE THE CIRCLE ──
      // Positioned at the bottom center of the circular dial (cy + 130 to cy + 340)
      const flameBaseY = cy + 330;
      const flameBaseX = cx;

      if (isHeating) {
        // Natural flickering wave offsets based on animation time & modulated dynamically from small to large by flameLevelPercent
        const flameRatio = Math.max(0.15, Math.min(1.0, flamePercent / 100));
        const scale = 0.50 + flameRatio * 0.75; // Scales proportionally from compact (0.65 at 22.5°C) up to majestic (1.25 at 32°C)
        const flicker1 = Math.sin(animTime * 12) * (12 * scale);
        const flicker2 = Math.cos(animTime * 15) * (9 * scale);
        const flickerTipX = Math.sin(animTime * 9) * (14 * scale);
        // At max (100% / 32°C), flame reaches ~335px, licking right up beneath the temperature digits
        const baseHeight = 95 + flameRatio * 220;
        const flameHeight = baseHeight + Math.sin(animTime * 10) * (18 * scale);

        // 1. Outer Warm Amber Flame Aura (Proportionally scaled)
        const w1 = 85 * scale;
        const w1b = 110 * scale;
        const w1c = 60 * scale;
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - w1, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - w1b + flicker2,
          flameBaseY - 80 * scale,
          flameBaseX - w1c + flicker1,
          flameBaseY - flameHeight * 0.7,
          flameBaseX + flickerTipX,
          flameBaseY - flameHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + w1c - flicker1,
          flameBaseY - flameHeight * 0.7,
          flameBaseX + w1b - flicker2,
          flameBaseY - 80 * scale,
          flameBaseX + w1,
          flameBaseY
        );
        dialCtx.closePath();

        const outerFlameGrad = dialCtx.createRadialGradient(
          flameBaseX,
          flameBaseY - 50 * scale,
          15 * scale,
          flameBaseX,
          flameBaseY - 100 * scale,
          140 * scale
        );
        outerFlameGrad.addColorStop(0, 'rgba(255, 120, 20, 0.95)');
        outerFlameGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.85)');
        outerFlameGrad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
        dialCtx.fillStyle = outerFlameGrad;
        dialCtx.shadowColor = '#ea580c';
        dialCtx.shadowBlur = Math.round(25 + flameRatio * 25);
        dialCtx.fill();
        dialCtx.restore();

        // 2. Middle Vibrant Yellow-Orange Core Tongue
        const midHeight = flameHeight * 0.78;
        const w2 = 55 * scale;
        const w2b = 70 * scale;
        const w2c = 40 * scale;
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - w2, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - w2b - flicker1 * 0.5,
          flameBaseY - 60 * scale,
          flameBaseX - w2c + flickerTipX * 0.5,
          flameBaseY - midHeight * 0.7,
          flameBaseX + flickerTipX * 0.7,
          flameBaseY - midHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + w2c - flickerTipX * 0.5,
          flameBaseY - midHeight * 0.7,
          flameBaseX + w2b + flicker1 * 0.5,
          flameBaseY - 60 * scale,
          flameBaseX + w2,
          flameBaseY
        );
        dialCtx.closePath();

        const midFlameGrad = dialCtx.createRadialGradient(
          flameBaseX,
          flameBaseY - 40 * scale,
          8 * scale,
          flameBaseX,
          flameBaseY - 70 * scale,
          100 * scale
        );
        midFlameGrad.addColorStop(0, '#fef08a');
        midFlameGrad.addColorStop(0.6, '#facc15');
        midFlameGrad.addColorStop(1, '#f97316');
        dialCtx.fillStyle = midFlameGrad;
        dialCtx.shadowColor = '#f59e0b';
        dialCtx.shadowBlur = Math.round(18 + flameRatio * 15);
        dialCtx.fill();
        dialCtx.restore();

        // 3. Inner White-Hot Blue-Base Pilot Core
        const innerHeight = flameHeight * 0.45;
        const w3 = 30 * scale;
        const w3b = 35 * scale;
        const w3c = 20 * scale;
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - w3, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - w3b,
          flameBaseY - 30 * scale,
          flameBaseX - w3c,
          flameBaseY - innerHeight * 0.8,
          flameBaseX,
          flameBaseY - innerHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + w3c,
          flameBaseY - innerHeight * 0.8,
          flameBaseX + w3b,
          flameBaseY - 30 * scale,
          flameBaseX + w3,
          flameBaseY
        );
        dialCtx.closePath();

        const innerGrad = dialCtx.createLinearGradient(flameBaseX, flameBaseY, flameBaseX, flameBaseY - innerHeight);
        innerGrad.addColorStop(0, '#60a5fa'); // Blue gas root
        innerGrad.addColorStop(0.3, '#ffffff'); // White-hot heart
        innerGrad.addColorStop(1, '#fef08a'); // Yellow tip
        dialCtx.fillStyle = innerGrad;
        dialCtx.shadowColor = '#ffffff';
        dialCtx.shadowBlur = 15;
        dialCtx.fill();
        dialCtx.restore();

        // 4. Dancing Embers floating upward from flame
        for (let e = 0; e < 6; e++) {
          const eSeed = (animTime * 1.5 + e * 0.8) % 1;
          const eY = flameBaseY - 60 - eSeed * 250 * scale;
          const eX = flameBaseX + Math.sin(animTime * 4 + e) * ((26 + e * 8) * scale);
          const eAlpha = Math.sin(eSeed * Math.PI);
          dialCtx.fillStyle = `rgba(254, 240, 138, ${eAlpha})`;
          dialCtx.beginPath();
          dialCtx.arc(eX, eY, (2.5 + (1 - eSeed) * 2) * scale, 0, Math.PI * 2);
          dialCtx.fill();
        }
      } else {
        // Standby Mode: Quiet gentle blue pilot flame resting cleanly at bottom (no text underneath)
        const pilotFlicker = Math.sin(animTime * 8) * 2.5;
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - 22, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - 28 + pilotFlicker * 0.4,
          flameBaseY - 25,
          flameBaseX - 14 + pilotFlicker,
          flameBaseY - 58,
          flameBaseX + pilotFlicker * 0.6,
          flameBaseY - 72
        );
        dialCtx.bezierCurveTo(
          flameBaseX + 14 - pilotFlicker,
          flameBaseY - 58,
          flameBaseX + 28 - pilotFlicker * 0.4,
          flameBaseY - 25,
          flameBaseX + 22,
          flameBaseY
        );
        dialCtx.closePath();

        const pilotGrad = dialCtx.createLinearGradient(flameBaseX, flameBaseY, flameBaseX, flameBaseY - 72);
        pilotGrad.addColorStop(0, '#0284c7');
        pilotGrad.addColorStop(0.5, '#38bdf8');
        pilotGrad.addColorStop(1, '#e0f2fe');
        dialCtx.fillStyle = pilotGrad;
        dialCtx.shadowColor = '#38bdf8';
        dialCtx.shadowBlur = 16;
        dialCtx.fill();
        dialCtx.restore();
      }
    }

    renderDialTexture(
      stateRef.current.currentTemp,
      stateRef.current.targetTemp,
      stateRef.current.isKombiActive,
      stateRef.current.theme === 'dark',
      0
    );

    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    dialTexture.colorSpace = THREE.SRGBColorSpace;
    dialTexture.minFilter = THREE.LinearFilter;
    dialTexture.magFilter = THREE.LinearFilter;
    dialTexture.generateMipmaps = false;
    dialTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // ── Fixed Thermostat Group (Zero rotation, perfectly static) ──
    const thermostatGroup = new THREE.Group();
    thermostatGroup.position.set(0, 0, 0);
    thermostatGroup.rotation.set(0, 0, 0);
    scene.add(thermostatGroup);

    // Part A: Titanium Outer Beveled Chassis
    const chassisGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.45, 64, 1, false);
    chassisGeo.rotateX(Math.PI / 2);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: stateRef.current.theme === 'dark' ? 0x1e2430 : 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.name = 'Chassis';
    thermostatGroup.add(chassisMesh);

    // Part B: Brushed Copper/Rose Heat-sink Ring
    const sinkGeo = new THREE.TorusGeometry(1.95, 0.1, 16, 64);
    const sinkMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.3,
    });
    const sinkMesh = new THREE.Mesh(sinkGeo, sinkMat);
    sinkMesh.name = 'HeatSinkRing';
    thermostatGroup.add(sinkMesh);

    // Part C: OLED Display Face with Dial Texture (Ultra-Sharp, Vivid & Non-blurred)
    const displayGeo = new THREE.CircleGeometry(1.83, 64);
    const displayMat = new THREE.MeshBasicMaterial({
      map: dialTexture,
      toneMapped: false,
    });
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.position.z = 0.24;
    displayMesh.name = 'OledFace';
    thermostatGroup.add(displayMesh);

    // Part D: Subtle Crystal Bevel Specular Sheen (Zero blur on screen, high clarity)
    const glassGeo = new THREE.RingGeometry(1.72, 1.84, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.25;
    glassMesh.name = 'SapphireLens';
    glassMesh.renderOrder = 2;
    thermostatGroup.add(glassMesh);

    // Resize listener with mobile aspect ratio responsiveness
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.position.z = aspect < 0.75 ? 5.5 : aspect < 1.05 ? 6.1 : 6.9;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let lastFlameFrame = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const state = stateRef.current;

      // Update dial canvas flame texture at ~24fps for lively flame flickering
      if (time - lastFlameFrame > 0.04 && !state.reducedMotion) {
        lastFlameFrame = time;
        renderDialTexture(
          state.currentTemp,
          state.targetTemp,
          state.isKombiActive,
          state.theme === 'dark',
          time,
          state.flameLevelPercent ?? 50
        );
        dialTexture.needsUpdate = true;
      }

      // Theme lighting updates
      const isDark = state.theme === 'dark';
      ambientLight.intensity = isDark ? 0.4 : 0.85;
      renderer.toneMappingExposure = isDark ? 1.25 : 1.1;

      // Keep thermostat fixed facing directly front
      thermostatGroup.rotation.x = 0;
      thermostatGroup.rotation.y = 0;

      renderer.render(scene, camera);
    };

    // ── Interactive Circular Target Temp Control via Orange Arc & White Knob ──
    let isDraggingTarget = false;

    const getArcProjection = (clientX: number, clientY: number) => {
      if (!container || !camera) return null;
      const rect = container.getBoundingClientRect();

      // Project dial center (0, 0, 0.24) to container screen pixels
      const center3D = new THREE.Vector3(0, 0, 0.24);
      center3D.project(camera);
      const cx = rect.left + (center3D.x * 0.5 + 0.5) * rect.width;
      const cy = rect.top + (-center3D.y * 0.5 + 0.5) * rect.height;

      // Dial face radius = 1.83. Arc radius on dialCanvas (1024x1024) is 335.
      // Arc 3D radius = 1.83 * (335 / 512) = 1.1974.
      const arcPt3D = new THREE.Vector3(1.1974, 0, 0.24);
      arcPt3D.project(camera);
      const px = rect.left + (arcPt3D.x * 0.5 + 0.5) * rect.width;
      const arcRadiusPx = Math.abs(px - cx);

      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      // Strict bounding: ONLY allow touch within the thermostat's adjustable bar line!
      // In screen pixels, tolerance for touch finger is ±22px or ±22% of arcRadiusPx
      const tolerance = Math.max(18, Math.min(30, arcRadiusPx * 0.22));
      const isWithinBar = dist >= arcRadiusPx - tolerance && dist <= arcRadiusPx + tolerance;

      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;

      // Arc range: 135° (0.75π) to 405° (2.25π).
      // Bottom cutout where no arc exists: ~48° (0.27π) to ~132° (0.73π).
      const isBottomCutout = angle > Math.PI * 0.27 && angle < Math.PI * 0.73;

      return {
        rect,
        cx,
        cy,
        dx,
        dy,
        dist,
        arcRadiusPx,
        isHit: isWithinBar && !isBottomCutout,
        angle,
      };
    };

    const computeTargetFromPointer = (clientX: number, clientY: number) => {
      if (!stateRef.current.onSetTarget || !container) return;
      const proj = getArcProjection(clientX, clientY);
      if (!proj) return;

      const { dx, dy } = proj;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;

      // Arc: startAngle = 135 deg (0.75 * PI), endAngle = 405 deg (2.25 * PI = 45 deg)
      const startAngle = Math.PI * 0.75;
      const endAngle = Math.PI * 2.25;

      let normAngle = angle;
      if (normAngle < Math.PI * 0.6) {
        normAngle += Math.PI * 2;
      }

      // Check if user clicked in the bottom 90 deg cutout
      if (normAngle > endAngle && normAngle < startAngle + Math.PI * 2) {
        if (normAngle < endAngle + Math.PI * 0.25) {
          normAngle = endAngle;
        } else {
          normAngle = startAngle;
        }
      }

      let pct = (normAngle - startAngle) / (endAngle - startAngle);
      pct = Math.max(0, Math.min(1, pct));

      // Range: 10°C to 32°C (step 0.5°C)
      const rawTemp = 10 + pct * (32 - 10);
      const rounded = Math.round(rawTemp * 2) / 2;
      const clamped = Math.max(10, Math.min(32, rounded));
      if (clamped !== stateRef.current.targetTemp) {
        triggerHaptic('light');
        stateRef.current.onSetTarget(clamped);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!stateRef.current.onSetTarget || !container) return;
      const proj = getArcProjection(e.clientX, e.clientY);
      // STRICT REQUIREMENT: Only activate if pointer touches within the thermostat's adjustable arc bar!
      if (!proj || !proj.isHit) {
        return;
      }

      isDraggingTarget = true;
      triggerHaptic('medium');
      try {
        container.setPointerCapture(e.pointerId);
      } catch {}
      container.style.cursor = 'grabbing';
      e.stopPropagation();
      e.preventDefault();
      computeTargetFromPointer(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingTarget) {
        const proj = getArcProjection(e.clientX, e.clientY);
        if (proj?.isHit) {
          container.style.cursor = 'pointer';
        } else {
          container.style.cursor = 'default';
        }
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      computeTargetFromPointer(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDraggingTarget) {
        isDraggingTarget = false;
        container.style.cursor = 'default';
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);

    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);

      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);

      dialTexture.dispose();
      chassisGeo.dispose();
      chassisMat.dispose();
      sinkGeo.dispose();
      sinkMat.dispose();
      displayGeo.dispose();
      displayMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [performanceMode, theme]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[220px] xs:h-[240px] sm:h-[280px] md:h-[300px] max-w-[340px] select-none flex items-center justify-center touch-none"
      data-testid="three-canvas-container"
      title="Hedef sıcaklığı ayarlamak için turuncu bar çizgisine dokunup çevirin"
    />
  );
};
