'use client'

import React, { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSearchParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export function TherapyDashboard() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialContextSentRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleSendMessage = useCallback(async (message: string, isInitialContext: boolean = false) => {
    if (isTyping) return
    if (isInitialContext && initialContextSentRef.current) return

    setIsTyping(true)
    setSuggestions([])
    if (!isInitialContext) {
      setMessages(prev => [...prev, { role: 'user', content: message }])
      setInputMessage('')
    }

    try {
      console.log('Sending message:', { message, isInitialContext });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, isInitialContext }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log('Received response:', data);

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` }])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping])

  useEffect(() => {
    const loadInitialContext = async () => {
      if (initialContextSentRef.current) return;

      const contextParam = searchParams.get('context');
      console.log('Context param:', contextParam);

      if (contextParam) {
        try {
          const decodedContext = decodeURIComponent(contextParam);
          const { initialContext, initialResponse } = JSON.parse(decodedContext);
          console.log('Parsed initial context:', initialContext);
          console.log('Initial response:', initialResponse);
          
          initialContextSentRef.current = true;
          if (initialResponse) {
            setMessages([{ role: 'assistant', content: initialResponse }]);
            // Fetch auto-reply suggestions for the initial response
            fetchAutoReplySuggestions(initialResponse);
          } else {
            console.error('Initial response is missing or undefined');
            handleSendMessage(JSON.stringify(initialContext), true);
          }
        } catch (error) {
          console.error('Error parsing context:', error);
        }
      } else {
        console.log('Missing context');
        setMessages([{ role: 'assistant', content: "Hello! I'm Coopleo, your relationship advisor. How can I assist you today?" }]);
      }
    };

    loadInitialContext();
  }, [searchParams, handleSendMessage]);

  const fetchAutoReplySuggestions = async (message: string) => {
    try {
      const response = await fetch('/api/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: message }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      } else {
        console.error('Error fetching auto-reply suggestions:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching auto-reply suggestions:', error);
    }
  };

  const handleDeleteHistory = async () => {
    setMessages([])
    initialContextSentRef.current = false
    try {
      await fetch('/api/chat', { method: 'DELETE' })
      const state = searchParams.get('state')
      const mood = searchParams.get('mood')
      const location = searchParams.get('location')
      const topic = searchParams.get('topic')
      if (state && mood && location && topic) {
        const initialContext = { state, mood, location, topic }
        await handleSendMessage(JSON.stringify(initialContext), true)
      } else {
        setMessages([{ role: 'assistant', content: "Hello! I'm Coopleo, your relationship advisor. How can I assist you today?" }])
      }
    } catch (error) {
      console.error('Error resetting conversation:', error)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim()) handleSendMessage(inputMessage)
    }
  }

  const formatMessage = (content: string | undefined, isAIResponse: boolean) => {
    if (!content) return ''; // Return an empty string if content is undefined
    if (!isAIResponse) {
      return content;
    }
    // Preserve line breaks and ensure bullet points and numbered lists start on new lines
    return content
      .replace(/(?:^|\n)(\d+\.|\-|\•)\s/gm, '\n$1 ')  // Remove extra line break before numbered lists and bullet points
      .replace(/\n{3,}/g, '\n\n')  // Remove excess line breaks
      .trim();  // Remove leading and trailing whitespace
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputMessage(value)

    if (value.length > 10) {  // Only generate suggestions after 10 characters
      fetchAutoReplySuggestions(value);
    } else {
      setSuggestions([])
    }
  }, [])

  const isAskingForName = (message: string | undefined) => {
    if (!message) return false;
    const lowerCaseMessage = message.toLowerCase();
    return lowerCaseMessage.includes("what's your name") || 
           lowerCaseMessage.includes("what is your name") ||
           lowerCaseMessage.includes("may i know your name") ||
           lowerCaseMessage.includes("could you tell me your name");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-white">
        <button onClick={() => window.location.href = '/'} className="flex items-center">
          <Image 
            src="/coopleo-logo.svg" 
            alt="Coopleo Logo" 
            width={120} 
            height={30} 
            className="h-8 sm:h-10 w-auto transition-transform duration-200 ease-in-out transform hover:scale-105"
          />
        </button>
        <Button 
          onClick={handleDeleteHistory} 
          size="icon" 
          variant="ghost"
          className="w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ReloadIcon className="w-5 h-5 text-gray-600" />
          <span className="sr-only">Start New Conversation</span>
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-6">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                <div className={cn(
                  "flex items-center gap-3",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8 overflow-hidden bg-white flex-shrink-0 border border-gray-200 rounded-full">
                      <AvatarImage src="/ai-avatar.svg" alt="Coopleo" className="p-1" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-lg p-3 text-sm shadow-sm max-w-[80%]",
                    msg.role === 'user' ? "bg-black text-white" : "bg-gray-100 text-black"
                  )}>
                    <ReactMarkdown 
                      className="whitespace-pre-wrap leading-tight"
                      components={{
                        strong: ({node, ...props}) => <span className="font-semibold" {...props} />,
                        li: ({node, ...props}) => <li className="ml-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-0" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-0" {...props} />,
                        p: ({node, ...props}) => <p {...props} />
                      }}
                    >
                      {formatMessage(msg.content, msg.role === 'assistant')}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="w-8 h-8 overflow-hidden flex-shrink-0 border border-gray-200 rounded-full">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" className="object-cover" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {msg.role === 'assistant' && index === messages.length - 1 && suggestions.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 ml-11 max-w-[80%]">
                    {suggestions.map((suggestion, sugIndex) => (
                      <button
                        key={sugIndex}
                        onClick={() => handleSendMessage(suggestion)}
                        className="flex items-center justify-between text-left text-sm bg-gray-100 text-black font-semibold py-1 px-3 rounded-full transition-colors duration-200 hover:bg-gray-200 w-full"
                      >
                        <span className="truncate">{suggestion}</span>
                        <ArrowIcon className="h-4 w-4 ml-2 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
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
                  Gathering knowledge...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 bg-white">
        <form onSubmit={(e) => {
          e.preventDefault()
          if (inputMessage.trim()) handleSendMessage(inputMessage)
        }} className="relative">
          <Textarea
            value={inputMessage}
            onChange={handleInputChange}
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

function ReloadIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.5 4.5L21 12M21 12L13.5 19.5M21 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}