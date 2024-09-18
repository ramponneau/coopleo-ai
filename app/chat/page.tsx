'use client'

import dynamic from 'next/dynamic'

const TherapyDashboard = dynamic(
  () => import('@/components/therapy-dashboard').then((mod) => mod.TherapyDashboard),
  { 
    ssr: false,
    loading: () => <p>Loading...</p>
  }
)

export default function ChatPage() {
  return <TherapyDashboard />
}