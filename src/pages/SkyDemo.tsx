import { useCallback, useState } from 'react'
import DemoControls from '../components/DemoControls'
import type { GyroStatus } from '../components/DemoControls'
import SkyCanvas from '../components/SkyCanvas'
import type { MotionMode, SkyConfig } from '../engine/SkyEngine'
import './SkyDemo.css'

const defaultConfig: SkyConfig = {
  twinkle: true,
  nebula: true,
  shootingStars: true,
  quality: 'high',
  motion: 'mouse',
}

const SkyDemo = () => {
  const [config, setConfig] = useState<SkyConfig>(defaultConfig)
  const [fps, setFps] = useState(0)
  const [gyroStatus, setGyroStatus] = useState<GyroStatus>('idle')

  const updateConfig = useCallback((patch: Partial<SkyConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const requestGyroPermission = useCallback(async () => {
    if (gyroStatus === 'granted') return 'granted'
    if (typeof DeviceOrientationEvent === 'undefined') {
      setGyroStatus('unsupported')
      return 'unsupported'
    }
    const maybeRequestPermission = (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }
    ).requestPermission
    if (typeof maybeRequestPermission === 'function') {
      try {
        const result = await maybeRequestPermission()
        if (result === 'granted') {
          setGyroStatus('granted')
          return 'granted'
        }
        setGyroStatus('denied')
        return 'denied'
      } catch {
        setGyroStatus('denied')
        return 'denied'
      }
    }
    setGyroStatus('granted')
    return 'granted'
  }, [gyroStatus])

  const handleMotionChange = useCallback(
    async (mode: MotionMode) => {
      if (mode === 'gyro') {
        const status = await requestGyroPermission()
        if (status === 'granted') {
          updateConfig({ motion: 'gyro' })
        } else {
          updateConfig({ motion: 'mouse' })
        }
        return
      }
      updateConfig({ motion: 'mouse' })
    },
    [requestGyroPermission, updateConfig],
  )

  return (
    <div className="sky-page">
      <SkyCanvas config={config} onFps={setFps} gyroEnabled={gyroStatus === 'granted'} />
      <DemoControls config={config} fps={fps} gyroStatus={gyroStatus} onConfigChange={updateConfig} onMotionChange={handleMotionChange} />
      <div className="sky-vignette" aria-hidden="true" />
    </div>
  )
}

export default SkyDemo
