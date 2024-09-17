'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const TherapyDashboard = dynamic(
  () => import('@/components/therapy-dashboard').then((mod) => mod.TherapyDashboard),
  { ssr: false }
)

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TherapyDashboard />
    </Suspense>
  )
}