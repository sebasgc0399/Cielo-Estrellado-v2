'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { SkyConfig, UserStar } from '@/engine/SkyEngine'
import styles from './SkyCanvasPreview.module.css'

const SkyCanvas = dynamic(() => import('@/components/sky/SkyCanvas'), { ssr: false })

const noop = () => {}

const previewConfig: SkyConfig = {
  twinkle: true,
  nebula: true,
  shootingStars: false,
  quality: 'low',
  motion: 'mouse',
}

interface SkyCanvasPreviewProps {
  userStars: UserStar[]
  pickingActive: boolean
  selectedPosition: { x: number; y: number } | null
  onStarClick?: (starId: string) => void
  onPick?: (x: number, y: number) => void
  onEmptySpaceClick?: (x: number, y: number) => void
  highlightStarId?: string | null
  draggableStarIds?: Set<string>
  onStarDrop?: (starId: string, nx: number, ny: number) => Promise<boolean>
  onStarDragCancel?: (starId: string) => void
}

export function SkyCanvasPreview({
  userStars,
  pickingActive,
  selectedPosition,
  onStarClick,
  onPick,
  onEmptySpaceClick,
  highlightStarId,
  draggableStarIds,
  onStarDrop,
  onStarDragCancel,
}: SkyCanvasPreviewProps) {
  const effectiveUserStars = useMemo(
    () =>
      userStars.map((us) => ({
        ...us,
        highlighted: us.id === highlightStarId,
      })),
    [userStars, highlightStarId],
  )

  return (
    <div
      className={`${styles.container} ${pickingActive ? styles.pickerActive : ''}`}
      aria-hidden="true"
    >
      <SkyCanvas
        config={previewConfig}
        onFps={noop}
        gyroEnabled={false}
        userStars={effectiveUserStars}
        onStarClick={onStarClick}
        onCanvasClick={pickingActive ? onPick : undefined}
        onEmptySpaceClick={pickingActive ? undefined : onEmptySpaceClick}
        pickingActive={pickingActive}
        touchMode="tap-only"
        draggableStarIds={draggableStarIds}
        onStarDrop={onStarDrop}
        onStarDragCancel={onStarDragCancel}
      />

      {selectedPosition && (
        <div
          className={styles.selectedMarker}
          style={{
            left: `${selectedPosition.x * 100}%`,
            top: `${selectedPosition.y * 100}%`,
          }}
        />
      )}

      {pickingActive && (
        <span className={styles.pickerHint}>
          Toca el cielo o usa las coordenadas del formulario
        </span>
      )}
    </div>
  )
}
