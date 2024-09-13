/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/gq2Z7Lt1MHP
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
'use client'

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSearchParams } from 'next/navigation'

export function TherapyDashboard() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const weather = searchParams.get('weather')
    const mood = searchParams.get('mood')
    const location = searchParams.get('location')
    const aspect = searchParams.get('aspect')

    if (weather && mood && location && aspect) {
      const initialContext = {
        weather,
        mood,
        location,
        aspect
      }
      handleSendMessage(JSON.stringify(initialContext), 'user', true)
    } else {
      handleSendMessage("Hello! I'm Coopleo, your relationship advisor. How can I assist you today?", 'assistant')
    }
  }, [searchParams])

  const handleSendMessage = async (message: string, role: 'user' | 'assistant', isInitialContext: boolean = false) => {
    if (!isInitialContext) {
      setMessages(prevMessages => [...prevMessages, { role, content: message }])
    }

    if (role === 'user') {
      setInputMessage('')
      setIsTyping(true)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, isInitialContext }),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error);
        }
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: data.response }])
      } catch (error: any) {
        console.error('Error sending message:', error)
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` }])
      } finally {
        setIsTyping(false)
      }
    }
  }

  const handleDeleteHistory = async () => {
    setMessages([]);
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      // Reinitiate conversation with a greeting after deleting history
      handleSendMessage("Hello! I'm Coopleo, your relationship advisor. How can I assist you today?", 'assistant')
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  }

  const handleNewConversation = async () => {
    setMessages([]);
    try {
      await fetch('/api/chat', { method: 'DELETE' });
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim()) {
        handleSendMessage(inputMessage, 'user')
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-card">
        <button onClick={() => window.location.href = '/'} className="flex items-center">
          <Image 
            src="/coopleo-logo.svg" 
            alt="Coopleo Logo" 
            width={100} 
            height={25} 
            className="h-8 w-auto transition-transform duration-200 ease-in-out transform hover:scale-105"
          />
        </button>
        <Button onClick={handleDeleteHistory} size="icon" className="rounded-full bg-black w-8 h-8 flex items-center justify-center hover:bg-gray-800 transition-colors">
          <TrashIcon className="w-4 h-4 text-white" />
          <span className="sr-only">Delete Conversation History</span>
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-6">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={cn(
                "flex items-start gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 overflow-hidden bg-white">
                    <AvatarImage src="/ai-avatar.svg" alt="Coopleo" className="p-1" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "rounded-lg p-3 text-sm shadow-sm",
                  msg.role === 'user' ? "bg-primary text-primary-foreground ml-12" : "bg-muted text-muted-foreground mr-12"
                )}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 overflow-hidden">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" className="object-cover" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 overflow-hidden bg-white">
                  <AvatarImage src="/ai-avatar.svg" alt="Coopleo" className="p-1" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground shadow-sm mr-12">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 bg-card">
        <form onSubmit={(e) => {
          e.preventDefault()
          if (inputMessage.trim()) {
            handleSendMessage(inputMessage, 'user')
          }
        }} className="relative">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="min-h-[48px] w-full rounded-2xl resize-none py-3 px-4 pr-12 border border-neutral-400 shadow-sm"
          />
          <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-8 rounded-full">
            <ArrowUpIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}
