import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ThemeMode, MorphMode } from '../../types.ts';

interface ThreeSceneProps {
  theme: ThemeMode;
  morphMode: MorphMode;
  targetTemp: number;
  currentTemp: number;
  isKombiActive: boolean;
  performanceMode: boolean;
  reducedMotion: boolean;
  onSelectComponent?: (name: string, description: string) => void;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  theme,
  morphMode,
  targetTemp,
  currentTemp,
  isKombiActive,
  performanceMode,
  reducedMotion,
  onSelectComponent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    theme,
    morphMode,
    targetTemp,
    currentTemp,
    isKombiActive,
    performanceMode,
    reducedMotion,
    onSelectComponent,
  });

  useEffect(() => {
    stateRef.current = {
      theme,
      morphMode,
      targetTemp,
      currentTemp,
      isKombiActive,
      performanceMode,
      reducedMotion,
      onSelectComponent,
    };
  }, [
    theme,
    morphMode,
    targetTemp,
    currentTemp,
    isKombiActive,
    performanceMode,
    reducedMotion,
    onSelectComponent,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    // Centered front-facing camera - completely fixed
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless && !stateRef.current.performanceMode,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isHeadless || stateRef.current.performanceMode ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = stateRef.current.theme === 'dark' ? 1.25 : 1.1;

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
      animTime: number
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

      // Active Target Arc
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

      // Current Temp needle point
      const currAngle = startAngle + currPct * (endAngle - startAngle);
      const nx = cx + Math.cos(currAngle) * 335;
      const ny = cy + Math.sin(currAngle) * 335;
      dialCtx.fillStyle = '#ffffff';
      dialCtx.beginPath();
      dialCtx.arc(nx, ny, 16, 0, Math.PI * 2);
      dialCtx.fill();
      dialCtx.strokeStyle = '#0284c7';
      dialCtx.lineWidth = 4;
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
        // Natural flickering wave offsets based on animation time
        const flicker1 = Math.sin(animTime * 12) * 12;
        const flicker2 = Math.cos(animTime * 15) * 8;
        const flickerTipX = Math.sin(animTime * 9) * 14;
        const flameHeight = 190 + Math.sin(animTime * 10) * 20;

        // 1. Outer Warm Amber Flame Aura
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - 85, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - 110 + flicker2,
          flameBaseY - 80,
          flameBaseX - 60 + flicker1,
          flameBaseY - flameHeight * 0.7,
          flameBaseX + flickerTipX,
          flameBaseY - flameHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + 60 - flicker1,
          flameBaseY - flameHeight * 0.7,
          flameBaseX + 110 - flicker2,
          flameBaseY - 80,
          flameBaseX + 85,
          flameBaseY
        );
        dialCtx.closePath();

        const outerFlameGrad = dialCtx.createRadialGradient(
          flameBaseX,
          flameBaseY - 50,
          20,
          flameBaseX,
          flameBaseY - 100,
          130
        );
        outerFlameGrad.addColorStop(0, 'rgba(255, 120, 20, 0.95)');
        outerFlameGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.85)');
        outerFlameGrad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
        dialCtx.fillStyle = outerFlameGrad;
        dialCtx.shadowColor = '#ea580c';
        dialCtx.shadowBlur = 40;
        dialCtx.fill();
        dialCtx.restore();

        // 2. Middle Vibrant Yellow-Orange Core Tongue
        dialCtx.save();
        dialCtx.beginPath();
        const midHeight = flameHeight * 0.78;
        dialCtx.moveTo(flameBaseX - 55, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - 70 - flicker1 * 0.5,
          flameBaseY - 60,
          flameBaseX - 40 + flickerTipX * 0.5,
          flameBaseY - midHeight * 0.7,
          flameBaseX + flickerTipX * 0.7,
          flameBaseY - midHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + 40 - flickerTipX * 0.5,
          flameBaseY - midHeight * 0.7,
          flameBaseX + 70 + flicker1 * 0.5,
          flameBaseY - 60,
          flameBaseX + 55,
          flameBaseY
        );
        dialCtx.closePath();

        const midFlameGrad = dialCtx.createRadialGradient(
          flameBaseX,
          flameBaseY - 40,
          10,
          flameBaseX,
          flameBaseY - 70,
          90
        );
        midFlameGrad.addColorStop(0, '#fef08a');
        midFlameGrad.addColorStop(0.6, '#facc15');
        midFlameGrad.addColorStop(1, '#f97316');
        dialCtx.fillStyle = midFlameGrad;
        dialCtx.shadowColor = '#f59e0b';
        dialCtx.shadowBlur = 25;
        dialCtx.fill();
        dialCtx.restore();

        // 3. Inner White-Hot Blue-Base Pilot Core
        dialCtx.save();
        dialCtx.beginPath();
        const innerHeight = flameHeight * 0.45;
        dialCtx.moveTo(flameBaseX - 30, flameBaseY);
        dialCtx.bezierCurveTo(
          flameBaseX - 35,
          flameBaseY - 30,
          flameBaseX - 20,
          flameBaseY - innerHeight * 0.8,
          flameBaseX,
          flameBaseY - innerHeight
        );
        dialCtx.bezierCurveTo(
          flameBaseX + 20,
          flameBaseY - innerHeight * 0.8,
          flameBaseX + 35,
          flameBaseY - 30,
          flameBaseX + 30,
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
          const eY = flameBaseY - 60 - eSeed * 180;
          const eX = flameBaseX + Math.sin(animTime * 4 + e) * (30 + e * 8);
          const eAlpha = Math.sin(eSeed * Math.PI);
          dialCtx.fillStyle = `rgba(254, 240, 138, ${eAlpha})`;
          dialCtx.beginPath();
          dialCtx.arc(eX, eY, 3 + (1 - eSeed) * 2, 0, Math.PI * 2);
          dialCtx.fill();
        }
      } else {
        // Standby Mode: Quiet gentle blue pilot flame resting cleanly at bottom
        dialCtx.save();
        dialCtx.beginPath();
        dialCtx.moveTo(flameBaseX - 24, flameBaseY);
        dialCtx.bezierCurveTo(flameBaseX - 30, flameBaseY - 25, flameBaseX - 15, flameBaseY - 60, flameBaseX, flameBaseY - 75);
        dialCtx.bezierCurveTo(flameBaseX + 15, flameBaseY - 60, flameBaseX + 30, flameBaseY - 25, flameBaseX + 24, flameBaseY);
        dialCtx.closePath();

        const pilotGrad = dialCtx.createLinearGradient(flameBaseX, flameBaseY, flameBaseX, flameBaseY - 75);
        pilotGrad.addColorStop(0, '#0284c7');
        pilotGrad.addColorStop(0.5, '#38bdf8');
        pilotGrad.addColorStop(1, '#e0f2fe');
        dialCtx.fillStyle = pilotGrad;
        dialCtx.shadowColor = '#38bdf8';
        dialCtx.shadowBlur = 15;
        dialCtx.fill();
        dialCtx.restore();

        dialCtx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        dialCtx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        dialCtx.fillText('PİLOT ALEVİ', cx, flameBaseY + 28);
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

    // Part C: OLED Display Face with Dial Texture
    const displayGeo = new THREE.CircleGeometry(1.82, 64);
    const displayMat = new THREE.MeshBasicMaterial({
      map: dialTexture,
      toneMapped: false,
    });
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.position.z = 0.24;
    displayMesh.name = 'OledFace';
    thermostatGroup.add(displayMesh);

    // Part D: Convex Sapphire Crystal Glass Lens (Full circle, no cutoff lines)
    const glassGeo = new THREE.CircleGeometry(1.84, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.98,
      opacity: 0.85,
      transparent: true,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.45,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.25;
    glassMesh.name = 'SapphireLens';
    glassMesh.renderOrder = 2;
    thermostatGroup.add(glassMesh);

    // Part E: Dual Copper Conduction Pipes (Rear)
    const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 24);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.9,
      roughness: 0.25,
    });
    const pipeLeft = new THREE.Mesh(pipeGeo, pipeMat);
    pipeLeft.position.set(-1.0, -1.4, -0.4);
    const pipeRight = new THREE.Mesh(pipeGeo, pipeMat);
    pipeRight.position.set(1.0, -1.4, -0.4);
    thermostatGroup.add(pipeLeft);
    thermostatGroup.add(pipeRight);

    // Part F: Soft Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.12)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const contactShadowGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.position.set(0, -2.4, 0);
    contactShadow.rotation.x = -Math.PI / 2;
    scene.add(contactShadow);

    // Resize listener
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
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
          time
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

    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);

      dialTexture.dispose();
      chassisGeo.dispose();
      chassisMat.dispose();
      sinkGeo.dispose();
      sinkMat.dispose();
      displayGeo.dispose();
      displayMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      pipeGeo.dispose();
      pipeMat.dispose();
      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      shadowTex.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] select-none flex items-center justify-center"
      data-testid="three-canvas-container"
      title="Sabit Akıllı Kombi Termostat Kadranı ve Dinamik Alev"
    />
  );
};
