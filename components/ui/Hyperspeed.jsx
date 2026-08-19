"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

export default function Hyperspeed({
  effectOptions = {},
  onSpeedUp = () => {},
  onSlowDown = () => {},
}) {
  const containerRef = useRef(null);
  const { resolvedTheme } = useTheme();

  // Dark & Light Mode Preset Palettes
  const darkColors = {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xFFFFFF,
    brokenLines: 0xFFFFFF,
    leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
    rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
    sticks: 0x03B3C3,
  };

  const lightColors = {
    roadColor: 0xf1f5f9,
    islandColor: 0xe2e8f0,
    background: 0xffffff,
    shoulderLines: 0x0284c7,
    brokenLines: 0x4f46e5,
    leftCars: [0xdb2777, 0x9333ea, 0xc026d3],
    rightCars: [0x0284c7, 0x2563eb, 0x0d9488],
    sticks: 0x0284c7,
  };

  const currentThemeColors = resolvedTheme === 'light' ? lightColors : darkColors;

  // Exact configuration options as requested
  const options = {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    ...effectOptions,
    colors: {
      ...currentThemeColors,
      ...(effectOptions.colors || {}),
    },
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Fog Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(options.colors.background, 0.0025);
    scene.background = new THREE.Color(options.colors.background);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(options.fov, width / height, 0.1, options.length);
    camera.position.set(0, 3, 10);

    // WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    // 1. Main Road Mesh
    const roadGeo = new THREE.PlaneGeometry(options.roadWidth * 2 + options.islandWidth, options.length, 30, 100);
    const roadMat = new THREE.MeshBasicMaterial({
      color: options.colors.roadColor,
      side: THREE.DoubleSide,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.z = -options.length / 2;
    roadGroup.add(roadMesh);

    // 2. Island Divider (Center)
    const islandGeo = new THREE.PlaneGeometry(options.islandWidth, options.length);
    const islandMat = new THREE.MeshBasicMaterial({
      color: options.colors.islandColor,
      side: THREE.DoubleSide,
    });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.rotation.x = -Math.PI / 2;
    islandMesh.position.y = 0.01;
    islandMesh.position.z = -options.length / 2;
    roadGroup.add(islandMesh);

    // 3. Moving Car Lights Creation
    const createCarLights = (isLeft) => {
      const lightsGroup = new THREE.Group();
      const count = options.lightPairsPerRoadWay;
      const colorsList = isLeft ? options.colors.leftCars : options.colors.rightCars;
      const speedRange = isLeft ? options.movingAwaySpeed : options.movingCloserSpeed;
      const posXOffset = isLeft 
        ? -(options.islandWidth / 2 + options.roadWidth / 2) 
        : (options.islandWidth / 2 + options.roadWidth / 2);

      const items = [];

      for (let i = 0; i < count; i++) {
        const lightColor = colorsList[Math.floor(Math.random() * colorsList.length)];
        const length = THREE.MathUtils.randFloat(options.carLightsLength[0], options.carLightsLength[1]);
        const radius = THREE.MathUtils.randFloat(options.carLightsRadius[0], options.carLightsRadius[1]);

        const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
        geo.rotateX(Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
          color: lightColor,
          transparent: true,
          opacity: options.carLightsFade,
        });

        const mesh = new THREE.Mesh(geo, mat);

        const laneShift = THREE.MathUtils.randFloat(options.carShiftX[0], options.carShiftX[1]) * options.roadWidth * 0.4;
        const x = posXOffset + laneShift;
        const y = THREE.MathUtils.randFloat(options.carFloorSeparation[0], options.carFloorSeparation[1]);
        const z = -Math.random() * options.length;
        const speed = THREE.MathUtils.randFloat(speedRange[0], speedRange[1]);

        mesh.position.set(x, y, z);
        lightsGroup.add(mesh);

        items.push({ mesh, speed, initialZ: z });
      }

      return { group: lightsGroup, items };
    };

    const leftLights = createCarLights(true);
    const rightLights = createCarLights(false);
    roadGroup.add(leftLights.group);
    roadGroup.add(rightLights.group);

    // 4. Side Light Sticks
    const createSideSticks = () => {
      const sticksGroup = new THREE.Group();
      const count = options.totalSideLightSticks;
      const stickMat = new THREE.MeshBasicMaterial({ 
        color: options.colors.sticks, 
        transparent: true, 
        opacity: 0.8 
      });

      for (let i = 0; i < count; i++) {
        const h = THREE.MathUtils.randFloat(options.lightStickHeight[0], options.lightStickHeight[1]);
        const w = THREE.MathUtils.randFloat(options.lightStickWidth[0], options.lightStickWidth[1]);
        const geo = new THREE.BoxGeometry(w, h, w);
        const z = -(i / count) * options.length;

        const leftStick = new THREE.Mesh(geo, stickMat);
        leftStick.position.set(-(options.roadWidth + options.islandWidth / 2 + 1), h / 2, z);
        sticksGroup.add(leftStick);

        const rightStick = new THREE.Mesh(geo, stickMat);
        rightStick.position.set(options.roadWidth + options.islandWidth / 2 + 1, h / 2, z);
        sticksGroup.add(rightStick);
      }
      return sticksGroup;
    };

    roadGroup.add(createSideSticks());

    // Interactive Speed-Up Handlers
    let targetFov = options.fov;
    let currentFov = options.fov;
    let currentSpeedMult = 1;
    let targetSpeedMult = 1;

    const handleMouseDown = () => {
      targetFov = options.fovSpeedUp;
      targetSpeedMult = options.speedUp;
      onSpeedUp();
    };

    const handleMouseUp = () => {
      targetFov = options.fov;
      targetSpeedMult = 1;
      onSlowDown();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchend', handleMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Render Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Smooth FOV interpolation on click & hold
      currentFov += (targetFov - currentFov) * 0.1;
      camera.fov = currentFov;
      camera.updateProjectionMatrix();

      currentSpeedMult += (targetSpeedMult - currentSpeedMult) * 0.1;

      // Animate Left Car Lights
      leftLights.items.forEach(({ mesh, speed }) => {
        mesh.position.z -= speed * delta * currentSpeedMult;
        if (mesh.position.z < -options.length) {
          mesh.position.z = 0;
        }
      });

      // Animate Right Car Lights
      rightLights.items.forEach(({ mesh, speed }) => {
        mesh.position.z -= speed * delta * currentSpeedMult;
        if (mesh.position.z > 0) {
          mesh.position.z = -options.length;
        }
      });

      // Camera Floating Effect
      const time = clock.getElapsedTime();
      camera.position.x = Math.sin(time * 0.5) * 0.5;
      camera.position.y = 3 + Math.cos(time * 0.7) * 0.2;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto z-0"
      style={{ minHeight: '100%' }}
    />
  );
}
