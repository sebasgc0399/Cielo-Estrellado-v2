/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { ref, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from '@/lib/firebase/client'

interface StarImageProps {
  imagePath: string | null
  legacyUrl: string | null
  className?: string
}

export function StarImage({ imagePath, legacyUrl, className }: StarImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imagePath) {
      setResolvedUrl(null)
      return
    }
    let cancelled = false
    getDownloadURL(ref(firebaseStorage, imagePath))
      .then(url => { if (!cancelled) setResolvedUrl(url) })
      .catch(() => { if (!cancelled) setResolvedUrl(null) })
    return () => { cancelled = true }
  }, [imagePath])

  if (imagePath) {
    if (!resolvedUrl) return null
    return (
      <img
        src={resolvedUrl}
        alt=""
        className={className}
        loading="lazy"
      />
    )
  }

  if (legacyUrl) {
    return (
      <img
        src={legacyUrl}
        alt=""
        className={className}
        loading="lazy"
      />
    )
  }

  return null
}
