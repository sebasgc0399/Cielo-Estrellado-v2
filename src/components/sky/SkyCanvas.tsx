'use client'

import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { SkyEngine } from '@/engine/SkyEngine'
import type { SkyConfig, UserStar } from '@/engine/SkyEngine'
import './SkyCanvas.css'

type SkyCanvasProps = {
  config: SkyConfig
  onFps: (fps: number) => void
  gyroEnabled: boolean
  userStars?: UserStar[]
  onStarClick?: (starId: string) => void
  onCanvasClick?: (x: number, y: number) => void
  pickingActive?: boolean
  touchMode?: 'full' | 'tap-only'
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const SkyCanvas = ({ config, onFps, gyroEnabled, userStars, onStarClick, onCanvasClick, pickingActive, touchMode = 'full' }: SkyCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const farRef = useRef<HTMLCanvasElement | null>(null)
  const midRef = useRef<HTMLCanvasElement | null>(null)
  const nearRef = useRef<HTMLCanvasElement | null>(null)
  const nebulaRef = useRef<HTMLCanvasElement | null>(null)
  const fxRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<SkyEngine | null>(null)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!farRef.current || !midRef.current || !nearRef.current || !nebulaRef.current || !fxRef.current) {
      return
    }
    const engine = new SkyEngine(
      {
        far: farRef.current,
        mid: midRef.current,
        near: nearRef.current,
        nebula: nebulaRef.current,
        fx: fxRef.current,
      },
      { onFps },
    )
    engineRef.current = engine
    engine.start()
    return () => {
      engine.stop()
    }
  }, [onFps])

  useEffect(() => {
    engineRef.current?.setConfig(config)
  }, [config])

  useEffect(() => {
    const element = containerRef.current
    if (!element || !engineRef.current) return
    const handleResize = () => {
      const rect = element.getBoundingClientRect()
      const dprCap = config.quality === 'high' ? 2 : 1.35
      engineRef.current?.resize(rect.width, rect.height, dprCap)
    }
    handleResize()
    const observer = new ResizeObserver(handleResize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [config.quality])

  useEffect(() => {
    if (config.motion !== 'gyro' || !gyroEnabled) return
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0
      const beta = event.beta ?? 0
      const x = clamp(gamma / 25, -1, 1)
      const y = clamp(beta / 35, -1, 1)
      engineRef.current?.setInputTarget(x, y)
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [config.motion, gyroEnabled])

  useEffect(() => {
    if (config.motion === 'mouse') {
      engineRef.current?.setInputTarget(0, 0)
    }
  }, [config.motion])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setUserStars(userStars ?? [])
    }
  }, [userStars])

  const isTouchSuppressed = (event: PointerEvent<HTMLDivElement>) =>
    touchMode === 'tap-only' && event.pointerType === 'touch'

  const updatePointer = (event: PointerEvent<HTMLDivElement>, active: boolean) => {
    const element = containerRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    engineRef.current?.setPointer(x, y, active)
    if (config.motion === 'mouse') {
      const nx = clamp((x - rect.width / 2) / (rect.width / 2), -1, 1)
      const ny = clamp((y - rect.height / 2) / (rect.height / 2), -1, 1)
      engineRef.current?.setInputTarget(nx, ny)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchSuppressed(event)) {
      updatePointer(event, true)
    }
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      pointerDownPos.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchSuppressed(event)) {
      updatePointer(event, false)
    }
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !pointerDownPos.current) return

    const upX = event.clientX - rect.left
    const upY = event.clientY - rect.top
    const dx = upX - pointerDownPos.current.x
    const dy = upY - pointerDownPos.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    pointerDownPos.current = null

    if (dist > 5) return

    if (pickingActive && onCanvasClick) {
      const nx = clamp(upX / rect.width, 0, 1)
      const ny = clamp(upY / rect.height, 0, 1)
      onCanvasClick(nx, ny)
      return
    }

    const hitId = engineRef.current?.hitTest(upX, upY) ?? null
    if (hitId && onStarClick) {
      onStarClick(hitId)
    }
  }

  const handlePointerLeave = () => {
    engineRef.current?.setPointer(0, 0, false)
    if (config.motion === 'mouse') {
      engineRef.current?.setInputTarget(0, 0)
    }
    pointerDownPos.current = null
  }

  return (
    <div
      className="sky-canvas"
      ref={containerRef}
      style={pickingActive ? { cursor: 'crosshair' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => { if (!isTouchSuppressed(event)) updatePointer(event, true) }}
      onPointerUp={handlePointerUp}
      onPointerCancel={(event) => { if (!isTouchSuppressed(event)) updatePointer(event, false); pointerDownPos.current = null }}
      onPointerLeave={handlePointerLeave}
    >
      <canvas ref={nebulaRef} className="sky-layer" data-layer="nebula" aria-hidden="true" />
      <canvas ref={farRef} className="sky-layer" data-layer="far" aria-hidden="true" />
      <canvas ref={midRef} className="sky-layer" data-layer="mid" aria-hidden="true" />
      <canvas ref={nearRef} className="sky-layer" data-layer="near" aria-hidden="true" />
      <canvas ref={fxRef} className="sky-layer" data-layer="fx" aria-hidden="true" />
    </div>
  )
}

export default SkyCanvas
