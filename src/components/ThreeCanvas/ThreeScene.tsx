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
  explodedOffset: number; // 0.0 to 1.0
  activeCameraPreset: 'hero' | 'exploded' | 'face' | 'side';
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
  explodedOffset,
  activeCameraPreset,
  onSelectComponent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable state in ref to avoid re-initializing Three.js on every prop change
  const stateRef = useRef({
    theme,
    morphMode,
    targetTemp,
    currentTemp,
    isKombiActive,
    performanceMode,
    reducedMotion,
    explodedOffset,
    activeCameraPreset,
    onSelectComponent,
  });

  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current = {
      theme,
      morphMode,
      targetTemp,
      currentTemp,
      isKombiActive,
      performanceMode,
      reducedMotion,
      explodedOffset,
      activeCameraPreset,
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
    explodedOffset,
    activeCameraPreset,
    onSelectComponent,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

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
    renderer.shadowMap.enabled = !isHeadless && !stateRef.current.performanceMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, stateRef.current.theme === 'dark' ? 0.35 : 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      stateRef.current.theme === 'dark' ? 0xff8844 : 0xfffaed,
      stateRef.current.theme === 'dark' ? 2.4 : 1.8
    );
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = !isHeadless && !stateRef.current.performanceMode;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.2);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00e5ff, 2.0, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // 4. Procedural Dial Canvas Texture (Razor-sharp anisotropic OLED face)
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 1024;
    dialCanvas.height = 1024;
    const dialCtx = dialCanvas.getContext('2d')!;

    function renderDialTexture(curr: number, targ: number, isHeating: boolean, isDark: boolean) {
      dialCtx.clearRect(0, 0, 1024, 1024);

      const cx = 512;
      const cy = 512;
      const radius = 430;

      // Dark background circular panel
      const grad = dialCtx.createRadialGradient(cx, cy, 50, cx, cy, 480);
      if (isDark) {
        grad.addColorStop(0, '#0a0d14');
        grad.addColorStop(0.7, '#111726');
        grad.addColorStop(1, '#05070a');
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(0.7, '#0f172a');
        grad.addColorStop(1, '#020617');
      }
      dialCtx.fillStyle = grad;
      dialCtx.beginPath();
      dialCtx.arc(cx, cy, 470, 0, Math.PI * 2);
      dialCtx.fill();

      // Outer bezel tick marks (60 ticks)
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 5 === 0;
        const tickLen = isMajor ? 32 : 16;
        const r1 = radius - tickLen;
        const r2 = radius;

        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * r2;
        const y2 = cy + Math.sin(angle) * r2;

        dialCtx.strokeStyle = isMajor
          ? (isHeating ? 'rgba(255, 120, 60, 0.8)' : 'rgba(100, 200, 255, 0.8)')
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
      dialCtx.arc(cx, cy, 330, startAngle, endAngle);
      dialCtx.stroke();

      // Active Target Arc (Gradient)
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
      dialCtx.arc(cx, cy, 330, startAngle, startAngle + pct * (endAngle - startAngle));
      dialCtx.stroke();

      // Current Temp needle point
      const currAngle = startAngle + currPct * (endAngle - startAngle);
      const nx = cx + Math.cos(currAngle) * 330;
      const ny = cy + Math.sin(currAngle) * 330;
      dialCtx.fillStyle = '#ffffff';
      dialCtx.beginPath();
      dialCtx.arc(nx, ny, 16, 0, Math.PI * 2);
      dialCtx.fill();
      dialCtx.strokeStyle = '#0284c7';
      dialCtx.lineWidth = 4;
      dialCtx.stroke();

      // Digital Numbers & Labels
      dialCtx.textAlign = 'center';
      dialCtx.textBaseline = 'middle';

      // Status text
      dialCtx.fillStyle = isHeating ? '#fb923c' : '#94a3b8';
      dialCtx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(isHeating ? '🔥 AKTİF ISITMA' : '❄️ BEKLEMEDE', cx, cy - 170);

      // Current temp big display
      dialCtx.fillStyle = '#ffffff';
      dialCtx.font = 'bold 150px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(`${curr.toFixed(1)}°`, cx, cy - 10);

      // Target temp sub-label
      dialCtx.fillStyle = '#94a3b8';
      dialCtx.font = '500 38px "Plus Jakarta Sans", sans-serif';
      dialCtx.fillText(`HEDEF: ${targ.toFixed(1)}°C`, cx, cy + 130);

      // Brand badge
      dialCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      dialCtx.font = '600 28px "JetBrains Mono", monospace';
      dialCtx.fillText('UNREAL CORE v3.8', cx, cy + 220);
    }

    renderDialTexture(
      stateRef.current.currentTemp,
      stateRef.current.targetTemp,
      stateRef.current.isKombiActive,
      stateRef.current.theme === 'dark'
    );

    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    dialTexture.colorSpace = THREE.SRGBColorSpace;
    dialTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 5. Build Hero 3D Thermostat & Boiler Hub Group
    const thermostatGroup = new THREE.Group();
    scene.add(thermostatGroup);

    // Part A: Titanium Outer Beveled Chassis
    const chassisGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.55, 64, 1, false);
    chassisGeo.rotateX(Math.PI / 2);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: stateRef.current.theme === 'dark' ? 0x1e2430 : 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    chassisMesh.name = 'Chassis';
    thermostatGroup.add(chassisMesh);

    // Part B: Brushed Copper/Rose Heat-sink Ring
    const sinkGeo = new THREE.TorusGeometry(1.95, 0.12, 16, 64);
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
    displayMesh.position.z = 0.29;
    displayMesh.name = 'OledFace';
    thermostatGroup.add(displayMesh);

    // Part D: Convex Sapphire Crystal Glass Lens
    const glassGeo = new THREE.SphereGeometry(2.0, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.35);
    glassGeo.scale(1, 1, 0.25);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1.0,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 0.4,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.29;
    glassMesh.name = 'SapphireLens';
    glassMesh.renderOrder = 2;
    thermostatGroup.add(glassMesh);

    // Part E: Morphing Core Heat Matrix (Procedural polyhedral energy core)
    const coreGeo = new THREE.IcosahedronGeometry(0.72, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.z = -0.4;
    coreMesh.name = 'MorphCore';
    thermostatGroup.add(coreMesh);

    // Part F: Dual Copper Conduction Pipes (Rear)
    const pipeGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.8, 24);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.9,
      roughness: 0.25,
    });
    const pipeLeft = new THREE.Mesh(pipeGeo, pipeMat);
    pipeLeft.position.set(-1.1, -1.6, -0.6);
    const pipeRight = new THREE.Mesh(pipeGeo, pipeMat);
    pipeRight.position.set(1.1, -1.6, -0.6);
    thermostatGroup.add(pipeLeft);
    thermostatGroup.add(pipeRight);

    // Part G: Thermal Particle Shimmer Emitter
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rad = 0.3 + Math.random() * 1.5;
      particlePositions[i * 3] = Math.cos(theta) * rad;
      particlePositions[i * 3 + 1] = Math.sin(theta) * rad;
      particlePositions[i * 3 + 2] = -0.3 + Math.random() * 0.8;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.005;
      particleVelocities[i * 3 + 1] = 0.003 + Math.random() * 0.01;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle sprite using canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    pGrad.addColorStop(0, 'rgba(255, 180, 50, 1)');
    pGrad.addColorStop(0.4, 'rgba(255, 90, 20, 0.6)');
    pGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    thermostatGroup.add(particles);

    // Part H: Soft Ground Contact Shadow Plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const contactShadowGeo = new THREE.PlaneGeometry(6, 6);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.position.set(0, -2.6, 0);
    contactShadow.rotation.x = -Math.PI / 2;
    scene.add(contactShadow);

    // 6. Interactive Pointer Rotation & Dragging
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      targetRotY += deltaX * 0.008;
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX + deltaY * 0.008));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Raycasting for component selection
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onClickCanvas = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(thermostatGroup.children, true);

      if (intersects.length > 0) {
        const top = intersects[0].object;
        const cb = stateRef.current.onSelectComponent;
        if (cb) {
          if (top.name === 'Chassis') {
            cb('Titanyum Şasi', 'Havacılık sınıfı CNC işlenmiş titanyum çerçeve, ultra düşük ısı genleşmesi.');
          } else if (top.name === 'SapphireLens') {
            cb('Safir Kristal Lens', '9H çizilmeye dayanıklı kavisli optik cam ve yansıma önleyici kaplama.');
          } else if (top.name === 'OledFace') {
            cb('OLED Holografik Kadran', 'Yüksek kontrastlı, canlı renkli sıcaklık ve mod gösterge paneli.');
          } else if (top.name === 'MorphCore') {
            cb('Kuantum Isı Çekirdeği', 'Kombinin alev ve termal modülasyon durumuna göre şekil değiştiren aktif çekirdek.');
          } else if (top.name === 'HeatSinkRing') {
            cb('Termal Bakır Halka', 'Pasif soğutma ve eşit ısı dağıtımı sağlayan alaşımlı termal halka.');
          }
        }
      }
    };
    container.addEventListener('click', onClickCanvas);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop with Exponential Damping & Morphing Kinematics
    let animId: number;
    let clock = new THREE.Clock();
    let lastDialUpdate = 0;
    let prevTemp = stateRef.current.currentTemp;
    let prevTarget = stateRef.current.targetTemp;
    let prevActive = stateRef.current.isKombiActive;
    let prevTheme = stateRef.current.theme;

    // Save initial core vertices for mathematical morphing
    const corePosAttr = coreGeo.attributes.position;
    const initialCorePositions = new Float32Array(corePosAttr.array);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      const state = stateRef.current;

      // Check if dial texture needs redraw
      if (
        time - lastDialUpdate > 0.2 &&
        (prevTemp !== state.currentTemp ||
          prevTarget !== state.targetTemp ||
          prevActive !== state.isKombiActive ||
          prevTheme !== state.theme)
      ) {
        prevTemp = state.currentTemp;
        prevTarget = state.targetTemp;
        prevActive = state.isKombiActive;
        prevTheme = state.theme;
        lastDialUpdate = time;
        renderDialTexture(state.currentTemp, state.targetTemp, state.isKombiActive, state.theme === 'dark');
        dialTexture.needsUpdate = true;
      }

      // Smooth camera interpolation based on active preset
      let targetCamPos = new THREE.Vector3(0, 0, 7.2);
      let targetCamLook = new THREE.Vector3(0, 0, 0);

      if (state.activeCameraPreset === 'hero') {
        targetCamPos.set(0, 0.4, 7.0);
      } else if (state.activeCameraPreset === 'exploded') {
        targetCamPos.set(2.4, 1.8, 6.2);
      } else if (state.activeCameraPreset === 'face') {
        targetCamPos.set(0, 0, 6.0);
      } else if (state.activeCameraPreset === 'side') {
        targetCamPos.set(5.5, 0.5, 3.8);
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.x, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.y, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.z, 3.5, delta);
      camera.lookAt(targetCamLook);

      // Smooth rotation damping
      if (!isDragging && !state.reducedMotion) {
        targetRotY += 0.003; // Gentle ambient rotation
      }
      currentRotX = THREE.MathUtils.damp(currentRotX, targetRotX, 8, delta);
      currentRotY = THREE.MathUtils.damp(currentRotY, targetRotY, 8, delta);

      thermostatGroup.rotation.x = currentRotX;
      thermostatGroup.rotation.y = currentRotY;

      // Exploded View kinematics (moves parts along Z)
      const explode = state.explodedOffset;
      chassisMesh.position.z = THREE.MathUtils.damp(chassisMesh.position.z, 0, 6, delta);
      sinkMesh.position.z = THREE.MathUtils.damp(sinkMesh.position.z, 0.4 * explode, 6, delta);
      displayMesh.position.z = THREE.MathUtils.damp(displayMesh.position.z, 0.29 + 1.2 * explode, 6, delta);
      glassMesh.position.z = THREE.MathUtils.damp(glassMesh.position.z, 0.29 + 2.2 * explode, 6, delta);
      coreMesh.position.z = THREE.MathUtils.damp(coreMesh.position.z, -0.4 - 1.5 * explode, 6, delta);
      pipeLeft.position.z = THREE.MathUtils.damp(pipeLeft.position.z, -0.6 - 1.2 * explode, 6, delta);
      pipeRight.position.z = THREE.MathUtils.damp(pipeRight.position.z, -0.6 - 1.2 * explode, 6, delta);

      // Dynamic Morphing of the Heat Core based on morphMode & heating state
      if (!state.performanceMode && !state.reducedMotion) {
        const positions = corePosAttr.array as Float32Array;
        const morphIntensity = state.isKombiActive ? 1.6 : 0.8;
        const speed = state.isKombiActive ? 3.0 : 1.2;

        for (let i = 0; i < positions.length; i += 3) {
          const ix = initialCorePositions[i];
          const iy = initialCorePositions[i + 1];
          const iz = initialCorePositions[i + 2];

          let displacement = 0;
          if (state.morphMode === 'heat' || state.isKombiActive) {
            // Fiery turbulent pulse
            displacement = Math.sin(time * speed + iy * 4) * 0.08 * morphIntensity;
          } else if (state.morphMode === 'eco') {
            // Harmonious smooth wave
            displacement = Math.cos(time * 1.5 + (ix + iy) * 2) * 0.04;
          } else if (state.morphMode === 'boost') {
            // Rapid plasma oscillation
            displacement = Math.sin(time * 5 + iz * 6) * 0.12;
          } else if (state.morphMode === 'night') {
            // Subdued breathing
            displacement = Math.sin(time * 0.8) * 0.02;
          }

          const scale = 1 + displacement;
          positions[i] = ix * scale;
          positions[i + 1] = iy * scale;
          positions[i + 2] = iz * scale;
        }
        corePosAttr.needsUpdate = true;
        coreMesh.rotation.x += 0.01 * speed;
        coreMesh.rotation.y += 0.015 * speed;

        // Core Emissive Color morph
        if (state.isKombiActive || state.morphMode === 'heat') {
          coreMat.color.setHex(0xff3300);
          coreMat.emissive.setHex(0xff2200);
          coreMat.emissiveIntensity = 0.9 + Math.sin(time * 4) * 0.3;
        } else if (state.morphMode === 'eco') {
          coreMat.color.setHex(0x10b981);
          coreMat.emissive.setHex(0x059669);
          coreMat.emissiveIntensity = 0.7 + Math.sin(time * 2) * 0.2;
        } else if (state.morphMode === 'boost') {
          coreMat.color.setHex(0xf59e0b);
          coreMat.emissive.setHex(0xd97706);
          coreMat.emissiveIntensity = 1.3 + Math.sin(time * 6) * 0.4;
        } else {
          coreMat.color.setHex(0x0284c7);
          coreMat.emissive.setHex(0x0369a1);
          coreMat.emissiveIntensity = 0.4;
        }

        // Thermal Particle Flow
        const pArray = particleGeo.attributes.position.array as Float32Array;
        particles.visible = true;
        for (let i = 0; i < particleCount; i++) {
          pArray[i * 3] += particleVelocities[i * 3];
          pArray[i * 3 + 1] += particleVelocities[i * 3 + 1];
          pArray[i * 3 + 2] += particleVelocities[i * 3 + 2];

          // Reset particle if floated away
          if (pArray[i * 3 + 1] > 2.0) {
            const theta = Math.random() * Math.PI * 2;
            const rad = 0.2 + Math.random() * 1.2;
            pArray[i * 3] = Math.cos(theta) * rad;
            pArray[i * 3 + 1] = -1.5;
            pArray[i * 3 + 2] = -0.3 + Math.random() * 0.6;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      } else {
        // In Performance Mode, disable particle rendering to preserve GPU / CPU
        particles.visible = false;
      }

      // Theme lighting updates
      const isDark = state.theme === 'dark';
      ambientLight.intensity = isDark ? 0.35 : 0.85;
      keyLight.color.setHex(isDark ? 0xff8844 : 0xfffaed);
      renderer.toneMappingExposure = isDark ? 1.2 : 1.05;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('click', onClickCanvas);
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
      coreGeo.dispose();
      coreMat.dispose();
      pipeGeo.dispose();
      pipeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      pTexture.dispose();
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
      className="relative w-full h-full min-h-[380px] md:min-h-[460px] cursor-grab active:cursor-grabbing select-none"
      data-testid="three-canvas-container"
      title="3D Termostat Çekirdeği - Çevirmek için sürükleyin, bileşenleri incelemek için tıklayın"
    />
  );
};
