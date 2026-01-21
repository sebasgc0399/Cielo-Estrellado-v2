import './DemoControls.css'
import type { MotionMode, QualityLevel, SkyConfig } from '../engine/SkyEngine'

export type GyroStatus = 'idle' | 'granted' | 'denied' | 'unsupported'

type DemoControlsProps = {
  config: SkyConfig
  fps: number
  gyroStatus: GyroStatus
  onConfigChange: (patch: Partial<SkyConfig>) => void
  onMotionChange: (mode: MotionMode) => void
}

const motionStatusText = (status: GyroStatus, motion: MotionMode) => {
  if (motion === 'mouse' && status === 'idle') return 'Mouse activo'
  if (status === 'granted') return 'Gyro activo'
  if (status === 'denied') return 'Gyro bloqueado'
  if (status === 'unsupported') return 'Gyro no disponible'
  return 'Gyro requiere permiso'
}

const DemoControls = ({ config, fps, gyroStatus, onConfigChange, onMotionChange }: DemoControlsProps) => {
  const handleToggle = (key: 'twinkle' | 'nebula' | 'shootingStars') => {
    onConfigChange({ [key]: !config[key] } as Partial<SkyConfig>)
  }

  const handleQuality = (quality: QualityLevel) => {
    if (quality !== config.quality) {
      onConfigChange({ quality })
    }
  }

  const handleMotion = (mode: MotionMode) => {
    onMotionChange(mode)
  }

  return (
    <div className="demo-controls">
      <div className="controls-header">
        <span className="controls-title">Sky Demo</span>
        <span className="controls-fps">FPS {Math.max(0, Math.round(fps))}</span>
      </div>

      <div className="controls-row">
        <span className="controls-label">Twinkle</span>
        <button
          className="controls-chip"
          data-active={config.twinkle}
          onClick={() => handleToggle('twinkle')}
          aria-pressed={config.twinkle}
        >
          {config.twinkle ? 'On' : 'Off'}
        </button>
      </div>

      <div className="controls-row">
        <span className="controls-label">Nebula</span>
        <button
          className="controls-chip"
          data-active={config.nebula}
          onClick={() => handleToggle('nebula')}
          aria-pressed={config.nebula}
        >
          {config.nebula ? 'On' : 'Off'}
        </button>
      </div>

      <div className="controls-row">
        <span className="controls-label">Shooting</span>
        <button
          className="controls-chip"
          data-active={config.shootingStars}
          onClick={() => handleToggle('shootingStars')}
          aria-pressed={config.shootingStars}
        >
          {config.shootingStars ? 'On' : 'Off'}
        </button>
      </div>

      <div className="controls-row">
        <span className="controls-label">Quality</span>
        <div className="controls-segment">
          <button
            className="controls-chip"
            data-active={config.quality === 'high'}
            onClick={() => handleQuality('high')}
            aria-pressed={config.quality === 'high'}
          >
            High
          </button>
          <button
            className="controls-chip"
            data-active={config.quality === 'low'}
            onClick={() => handleQuality('low')}
            aria-pressed={config.quality === 'low'}
          >
            Low
          </button>
        </div>
      </div>

      <div className="controls-row">
        <span className="controls-label">Motion</span>
        <div className="controls-segment">
          <button
            className="controls-chip"
            data-active={config.motion === 'mouse'}
            onClick={() => handleMotion('mouse')}
            aria-pressed={config.motion === 'mouse'}
          >
            Mouse
          </button>
          <button
            className="controls-chip"
            data-active={config.motion === 'gyro'}
            onClick={() => handleMotion('gyro')}
            aria-pressed={config.motion === 'gyro'}
          >
            Gyro
          </button>
        </div>
      </div>

      <div className="controls-note">{motionStatusText(gyroStatus, config.motion)}</div>
    </div>
  )
}

export default DemoControls
