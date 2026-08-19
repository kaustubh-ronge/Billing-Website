import React from 'react'
import Hyperspeed from '@/components/ui/Hyperspeed';

const authHyperspeedOptions = {
  distortion: "turbulentDistortion",
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
  colors: {
    roadColor: 0x080c14,
    islandColor: 0x0f172a,
    background: 0x020617,
    shoulderLines: 0x38bdf8,
    brokenLines: 0x818cf8,
    leftCars: [0x3b82f6, 0x60a5fa, 0x1d4ed8],
    rightCars: [0x8b5cf6, 0xa855f7, 0x6366f1],
    sticks: 0x06b6d4,
  }
};

const AuthLayout = ({children}) => {
  return (
    <div className='relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-slate-950'>
      <div className="absolute inset-0 z-0 opacity-60">
        <Hyperspeed effectOptions={authHyperspeedOptions} />
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
