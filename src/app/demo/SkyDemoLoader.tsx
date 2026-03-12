'use client'

import dynamic from 'next/dynamic'

const SkyDemo = dynamic(() => import('@/components/sky/SkyDemo'), { ssr: false })

export default function SkyDemoLoader() {
  return <SkyDemo />
}
