'use client'

import { useCallback } from 'react'
import type { StarEntry } from '@/lib/skies/getSkyStars'
import styles from './SkyPreview.module.css'

interface SkyPreviewProps {
  stars: StarEntry[]
  pickingActive?: boolean
  selectedPosition?: { x: number; y: number } | null
  onPick?: (x: number, y: number) => void
  highlightStarId?: string | null
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function SkyPreview({
  stars,
  pickingActive = false,
  selectedPosition,
  onPick,
  highlightStarId,
}: SkyPreviewProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pickingActive || !onPick) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
      const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
      onPick(x, y)
    },
    [pickingActive, onPick],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!pickingActive || !onPick) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onPick(0.5, 0.5)
      }
    },
    [pickingActive, onPick],
  )

  const positionedStars = stars.filter(
    (entry) =>
      entry.star.xNormalized !== null && entry.star.yNormalized !== null,
  )

  return (
    <div
      className={`${styles.previewContainer} ${pickingActive ? styles.pickerActive : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={pickingActive ? 'button' : undefined}
      tabIndex={pickingActive ? 0 : undefined}
      aria-label={pickingActive ? 'Seleccionar posicion en el cielo' : undefined}
    >
      {positionedStars.map((entry) => (
        <div
          key={entry.starId}
          className={`${styles.starDot} ${highlightStarId === entry.starId ? styles.starDotHighlighted : ''}`}
          style={{
            left: `${(entry.star.xNormalized as number) * 100}%`,
            top: `${(entry.star.yNormalized as number) * 100}%`,
          }}
          title={entry.star.title || undefined}
        />
      ))}

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
          Toca para ubicar esta estrella
        </span>
      )}
    </div>
  )
}
