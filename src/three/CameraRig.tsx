/**
 * src/three/CameraRig.tsx
 * Ultra-smooth cinematic camera rig with exponential damping and dynamic lookAt targeting.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimStore, CameraPreset } from '@/store/useSim';

export const CAMERA_TARGETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: {
    pos: [0, 32, 40],
    target: [0, 0, 2],
  },
  zone1: {
    pos: [-18, 11, 12],
    target: [-18, 0.5, -4],
  },
  zone2: {
    pos: [4, 12, 10],
    target: [4, 0.5, -6],
  },
  zone3: {
    pos: [19, 11, 16],
    target: [19, 0.5, 4],
  },
  pumphouse: {
    pos: [0, 6, 25],
    target: [0, 1.2, 18],
  },
  cloud: {
    pos: [20, 25, 4],
    target: [20, 18, -20],
  },
  farmer: {
    pos: [-12, 3.5, 25],
    target: [-12, 1.5, 20],
  },
};

export const CameraRig: React.FC = () => {
  const { cameraPreset, isTourActive } = useSimStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const targetPos = useRef(new THREE.Vector3(...CAMERA_TARGETS[cameraPreset].pos));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_TARGETS[cameraPreset].target));
  const isTransitioning = useRef(true);

  useEffect(() => {
    const config = CAMERA_TARGETS[cameraPreset];
    targetPos.current.set(...config.pos);
    targetLook.current.set(...config.target);
    isTransitioning.current = true;
  }, [cameraPreset]);

  useFrame((_, delta) => {
    // Smooth exponential damping factor
    const lambda = isTourActive ? 3.0 : 4.5;
    const factor = 1 - Math.exp(-lambda * delta);

    camera.position.lerp(targetPos.current, factor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, factor);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={4}
      maxDistance={90}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
    />
  );
};
