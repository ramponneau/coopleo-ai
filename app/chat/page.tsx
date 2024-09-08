import AITherapistChat from '@/components/ui/AITherapistChat'

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">AI Therapist Chat</h1>
      <AITherapistChat />
    </main>
  )
}