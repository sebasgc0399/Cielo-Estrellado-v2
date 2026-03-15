'use client'

import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { SkyEngine } from '@/engine/SkyEngine'
import type { SkyConfig, UserStar } from '@/engine/SkyEngine'
import './SkyCanvas.css'

type DragState = {
  starId: string
  frozenOffsetX: number
  frozenOffsetY: number
  canvasW: number
  canvasH: number
}

type SkyCanvasProps = {
  config: SkyConfig
  onFps: (fps: number) => void
  gyroEnabled: boolean
  userStars?: UserStar[]
  onStarClick?: (starId: string) => void
  onCanvasClick?: (x: number, y: number) => void
  onEmptySpaceClick?: (nx: number, ny: number) => void
  pickingActive?: boolean
  touchMode?: 'full' | 'tap-only'
  draggableStarIds?: Set<string>
  onStarDrop?: (starId: string, nx: number, ny: number) => Promise<boolean>
  onStarDragCancel?: (starId: string) => void
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const SkyCanvas = ({
  config,
  onFps,
  gyroEnabled,
  userStars,
  onStarClick,
  onCanvasClick,
  onEmptySpaceClick,
  pickingActive,
  touchMode = 'full',
  draggableStarIds,
  onStarDrop,
  onStarDragCancel,
}: SkyCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const farRef = useRef<HTMLCanvasElement | null>(null)
  const midRef = useRef<HTMLCanvasElement | null>(null)
  const nearRef = useRef<HTMLCanvasElement | null>(null)
  const nebulaRef = useRef<HTMLCanvasElement | null>(null)
  const fxRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<SkyEngine | null>(null)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  // Drag refs — no React state to avoid re-renders during drag
  const userStarsRef = useRef<UserStar[]>(userStars ?? [])
  const originalStarsRef = useRef<UserStar[]>([])
  const dropPendingRef = useRef(false)
  const dragStateRef = useRef<DragState | null>(null)
  const isDraggingRef = useRef(false)

  // Keep userStarsRef in sync without causing re-renders
  useEffect(() => {
    userStarsRef.current = userStars ?? []
  }, [userStars])

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

  const clearDragDataAttrs = () => {
    const container = containerRef.current
    if (!container) return
    delete container.dataset.dragging
    delete container.dataset.hoveringStar
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const downX = event.clientX - rect.left
    const downY = event.clientY - rect.top

    // Drag branch: non-touch, not picking, has draggable stars, no drop in flight
    if (!pickingActive && draggableStarIds?.size && event.pointerType !== 'touch' && !dropPendingRef.current) {
      const hitId = engineRef.current?.hitTest(downX, downY) ?? null
      if (hitId && draggableStarIds.has(hitId)) {
        // 1. Capture parallax offset before freezing
        const offset = engineRef.current!.getParallaxOffset()
        // 2. Freeze lerp: inputTarget = inputCurrent → no more drift
        engineRef.current!.syncInputTargetToCurrent()
        // 3. Save snapshot for revert
        originalStarsRef.current = [...userStarsRef.current]
        // 4. Enter DRAG_READY
        dragStateRef.current = {
          starId: hitId,
          frozenOffsetX: offset.x,
          frozenOffsetY: offset.y,
          canvasW: rect.width,
          canvasH: rect.height,
        }
        pointerDownPos.current = { x: downX, y: downY }
        // Do NOT call updatePointer — parallax stays frozen
        return
      }
    }

    // Normal branch
    pointerDownPos.current = { x: downX, y: downY }
    if (!isTouchSuppressed(event)) {
      updatePointer(event, true)
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    const rect = container?.getBoundingClientRect()
    if (!rect) return

    const curX = event.clientX - rect.left
    const curY = event.clientY - rect.top

    // Drag branch: completely isolated — never falls through to updatePointer
    if (dragStateRef.current !== null) {
      const downPos = pointerDownPos.current
      if (!isDraggingRef.current && downPos) {
        const dx = curX - downPos.x
        const dy = curY - downPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 5) {
          isDraggingRef.current = true
          if (container) container.dataset.dragging = 'true'
        }
      }

      if (isDraggingRef.current) {
        const { starId, frozenOffsetX, frozenOffsetY, canvasW, canvasH } = dragStateRef.current
        const nx = clamp((curX - frozenOffsetX) / canvasW, 0, 1)
        const ny = clamp((curY - frozenOffsetY) / canvasH, 0, 1)
        // Optimistic update direct to engine — no React state
        engineRef.current?.setUserStars(
          userStarsRef.current.map(s => s.id === starId ? { ...s, x: nx, y: ny } : s),
        )
      }
      return // Never fall through to hover or updatePointer
    }

    // Idle: hover cursor for draggable stars (not while drop is in flight)
    if (draggableStarIds?.size && container && !isTouchSuppressed(event) && !dropPendingRef.current) {
      const hitId = engineRef.current?.hitTest(curX, curY) ?? null
      if (hitId && draggableStarIds.has(hitId)) {
        container.dataset.hoveringStar = 'true'
      } else {
        delete container.dataset.hoveringStar
      }
    }

    // Normal pointer update (parallax + glow)
    if (!isTouchSuppressed(event)) {
      updatePointer(event, true)
    }
  }

  const handlePointerUp = async (event: PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()

    // --- DRAG COMMIT ---
    if (isDraggingRef.current && dragStateRef.current) {
      if (!rect) {
        // Fallback: cancel gracefully
        engineRef.current?.setUserStars(originalStarsRef.current)
        isDraggingRef.current = false
        dragStateRef.current = null
        pointerDownPos.current = null
        clearDragDataAttrs()
        return
      }

      const { starId, frozenOffsetX, frozenOffsetY, canvasW, canvasH } = dragStateRef.current
      const upX = event.clientX - rect.left
      const upY = event.clientY - rect.top
      const nx = clamp((upX - frozenOffsetX) / canvasW, 0, 1)
      const ny = clamp((upY - frozenOffsetY) / canvasH, 0, 1)

      // 1. Build final stars array
      const updatedStars = userStarsRef.current.map(s =>
        s.id === starId ? { ...s, x: nx, y: ny } : s,
      )

      // 2. Fix final visual position immediately
      engineRef.current?.setUserStars(updatedStars)

      // 3. Clear drag state BEFORE await (no more pointermove can affect drag)
      isDraggingRef.current = false
      dragStateRef.current = null
      pointerDownPos.current = null
      clearDragDataAttrs()

      // 4. Mark drop in flight (local guard against second drag)
      dropPendingRef.current = true

      // 5. Commit to server
      let ok = false
      try {
        ok = (await onStarDrop?.(starId, nx, ny)) ?? true
      } catch {
        ok = false
      }

      // 6. Update or revert local baseline
      if (ok) {
        userStarsRef.current = updatedStars
        originalStarsRef.current = [...updatedStars]
      } else {
        // Immediate visual revert
        engineRef.current?.setUserStars(originalStarsRef.current)
      }

      // 7. Release drop guard
      dropPendingRef.current = false
      return
    }

    // --- DRAG_READY → CLICK (dist ≤ 5) or ABORT ---
    if (dragStateRef.current && pointerDownPos.current && rect) {
      const { starId } = dragStateRef.current
      const upX = event.clientX - rect.left
      const upY = event.clientY - rect.top
      const dx = upX - pointerDownPos.current.x
      const dy = upY - pointerDownPos.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      dragStateRef.current = null
      pointerDownPos.current = null
      clearDragDataAttrs()

      if (dist <= 5 && onStarClick) {
        onStarClick(starId)
      }
      return
    }

    // Clean up any leftover drag state
    if (dragStateRef.current) {
      dragStateRef.current = null
      pointerDownPos.current = null
      clearDragDataAttrs()
      return
    }

    // --- NORMAL CLICK LOGIC ---
    if (!rect || !pointerDownPos.current) {
      if (!isTouchSuppressed(event)) updatePointer(event, false)
      pointerDownPos.current = null
      return
    }

    const upX = event.clientX - rect.left
    const upY = event.clientY - rect.top
    const dx = upX - pointerDownPos.current.x
    const dy = upY - pointerDownPos.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    pointerDownPos.current = null

    if (!isTouchSuppressed(event)) {
      updatePointer(event, false)
    }

    if (dist > 5) return

    if (pickingActive && onCanvasClick) {
      const nx = clamp(upX / rect.width, 0, 1)
      const ny = clamp(upY / rect.height, 0, 1)
      onCanvasClick(nx, ny)
      return
    }

    const nx = clamp(upX / rect.width, 0, 1)
    const ny = clamp(upY / rect.height, 0, 1)
    const hitId = engineRef.current?.hitTest(upX, upY) ?? null
    if (hitId) {
      onStarClick?.(hitId)
      return
    }
    if (!dropPendingRef.current) {
      onEmptySpaceClick?.(nx, ny)
    }
  }

  const handlePointerLeave = () => {
    // Revert drag if active — revert FIRST, then clean up
    if (dragStateRef.current && isDraggingRef.current) {
      engineRef.current?.setUserStars(originalStarsRef.current)
      onStarDragCancel?.(dragStateRef.current.starId)
    }
    dragStateRef.current = null
    isDraggingRef.current = false
    pointerDownPos.current = null
    clearDragDataAttrs()

    // Normal leave behavior
    engineRef.current?.setPointer(0, 0, false)
    if (config.motion === 'mouse') {
      engineRef.current?.setInputTarget(0, 0)
    }
  }

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    // Revert drag if active — revert FIRST, then clean up
    if (dragStateRef.current && isDraggingRef.current) {
      engineRef.current?.setUserStars(originalStarsRef.current)
      onStarDragCancel?.(dragStateRef.current.starId)
    }
    dragStateRef.current = null
    isDraggingRef.current = false
    pointerDownPos.current = null
    clearDragDataAttrs()

    if (!isTouchSuppressed(event)) {
      updatePointer(event, false)
    }
  }

  return (
    <div
      className="sky-canvas"
      ref={containerRef}
      style={pickingActive ? { cursor: 'crosshair' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
