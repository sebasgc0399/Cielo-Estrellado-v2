import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { SkyEngine } from '../engine/SkyEngine'
import type { SkyConfig } from '../engine/SkyEngine'
import './SkyCanvas.css'

type SkyCanvasProps = {
  config: SkyConfig
  onFps: (fps: number) => void
  gyroEnabled: boolean
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const SkyCanvas = ({ config, onFps, gyroEnabled }: SkyCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const farRef = useRef<HTMLCanvasElement | null>(null)
  const midRef = useRef<HTMLCanvasElement | null>(null)
  const nearRef = useRef<HTMLCanvasElement | null>(null)
  const nebulaRef = useRef<HTMLCanvasElement | null>(null)
  const fxRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<SkyEngine | null>(null)

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
    engine.setConfig(config)
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

  const handlePointerLeave = () => {
    engineRef.current?.setPointer(0, 0, false)
    if (config.motion === 'mouse') {
      engineRef.current?.setInputTarget(0, 0)
    }
  }

  return (
    <div
      className="sky-canvas"
      ref={containerRef}
      onPointerDown={(event) => updatePointer(event, true)}
      onPointerMove={(event) => updatePointer(event, true)}
      onPointerUp={(event) => updatePointer(event, false)}
      onPointerCancel={(event) => updatePointer(event, false)}
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
