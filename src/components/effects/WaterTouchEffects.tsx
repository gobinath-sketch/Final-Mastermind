'use client'

import { useEffect, useRef } from 'react'

const SOUND_PATH = '/water-drip.mp3'
const POOL_SIZE = 6
const DRAG_THRESHOLD = 18
const TAP_DURATION = 500

const createAudioPool = () => {
  const pool = Array.from({ length: POOL_SIZE }, () => {
    const audio = new Audio(SOUND_PATH)
    audio.preload = 'auto'
    audio.volume = 0.22
    return audio
  })

  return pool
}

const playDroplet = (pool: HTMLAudioElement[], indexRef: { current: number }) => {
  if (!pool.length) return

  const sound = pool[indexRef.current]
  indexRef.current = (indexRef.current + 1) % pool.length

  sound.currentTime = 0
  const playback = sound.play()
  if (playback?.catch) {
    playback.catch(() => {
      // Ignore browsers blocking autoplay until explicit user gesture
    })
  }
}

export const WaterTouchEffects = () => {
  const audioPoolRef = useRef<HTMLAudioElement[]>([])
  const audioIndexRef = useRef(0)
  const pointerActiveRef = useRef(false)
  const isDragRef = useRef(false)
  const startPointRef = useRef({ x: 0, y: 0 })
  const startTimeRef = useRef(0)

  useEffect(() => {
    audioPoolRef.current = createAudioPool()

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      pointerActiveRef.current = true
      isDragRef.current = false
      startPointRef.current = { x: event.clientX, y: event.clientY }
      startTimeRef.current = Date.now()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerActiveRef.current) return
      const dx = event.clientX - startPointRef.current.x
      const dy = event.clientY - startPointRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > DRAG_THRESHOLD) {
        isDragRef.current = true
      }
    }

    const handlePointerEnd = (event: PointerEvent) => {
      if (!pointerActiveRef.current) return
      pointerActiveRef.current = false

      if (event.type === 'pointercancel') {
        isDragRef.current = false
        return
      }

      const duration = Date.now() - startTimeRef.current
      const dx = event.clientX - startPointRef.current.x
      const dy = event.clientY - startPointRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const isTap = !isDragRef.current && distance <= DRAG_THRESHOLD && duration <= TAP_DURATION

      if (isTap) {
        playDroplet(audioPoolRef.current, audioIndexRef)
      }

      isDragRef.current = false
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerEnd, { passive: true })
    window.addEventListener('pointercancel', handlePointerEnd, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)

      audioPoolRef.current.forEach((audio) => {
        audio.pause()
      })
    }
  }, [])

  return null
}

export default WaterTouchEffects

