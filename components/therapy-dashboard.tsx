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
import { Loader2 } from 'lucide-react'

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-chevron-right"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

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
    if (isTyping) return;
    if (isInitialContext && initialContextSentRef.current) return;

    setIsTyping(true);
    setSuggestions([]);
    if (!isInitialContext) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      setInputMessage('');
    }

    try {
      console.log('Sending message:', { message, isInitialContext });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, isInitialContext }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  useEffect(() => {
    const loadInitialContext = async () => {
      if (initialContextSentRef.current) return;

      const contextParam = searchParams.get('context');
      console.log('Context param:', contextParam);

      if (contextParam) {
        try {
          const decodedContext = decodeURIComponent(contextParam);
          const { initialContext } = JSON.parse(decodedContext);
          console.log('Parsed initial context:', initialContext);
          
          initialContextSentRef.current = true;
          
          // Send the initial context to the backend
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: JSON.stringify(initialContext), isInitialContext: true }),
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const data = await response.json();
          setMessages([{ role: 'assistant', content: data.response }]);
          if (data.suggestions) {
            setSuggestions(data.suggestions);
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
  }, [searchParams]);

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
    const value = e.target.value;
    setInputMessage(value);
  }, []);

  const handleDeleteHistory = async () => {
    setMessages([])
    setSuggestions([])
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
        <ScrollArea className="h-full px-2 sm:px-4 py-4">
          <div className="space-y-4 max-w-full">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2 max-w-full">
                <div className={cn(
                  "flex items-start gap-2",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {msg.role === 'assistant' && (
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 overflow-hidden bg-white flex-shrink-0 border border-gray-200 rounded-full">
                      <AvatarImage src="/ai-avatar.svg" alt="Coopleo" className="p-1" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-lg p-2 sm:p-3 text-sm shadow-sm",
                    msg.role === 'user' ? "bg-black text-white" : "bg-gray-100 text-black",
                    "max-w-[75%] sm:max-w-[80%] break-words"
                  )}>
                    <ReactMarkdown 
                      className="whitespace-pre-wrap leading-tight text-xs sm:text-sm"
                      components={{
                        strong: ({node, ...props}) => <span className="font-semibold" {...props} />,
                        li: ({node, ...props}) => <li className="ml-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-0" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-0" {...props} />,
                        p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />
                      }}
                    >
                      {formatMessage(msg.content, msg.role === 'assistant')}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 overflow-hidden flex-shrink-0 border border-gray-200 rounded-full">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" className="object-cover" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {msg.role === 'assistant' && index === messages.length - 1 && suggestions.length > 0 && (
                  <div className="flex flex-col gap-1 sm:gap-2 mt-2 ml-8 sm:ml-11 max-w-[75%] sm:max-w-[80%]">
                    {suggestions.map((suggestion, sugIndex) => (
                      <button
                        key={sugIndex}
                        onClick={() => handleSendMessage(suggestion)}
                        className="flex items-center justify-between text-left text-xs sm:text-sm bg-gray-100 text-black font-semibold py-1 px-2 sm:px-3 rounded-lg transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
                      >
                        <span className="flex-grow mr-1 sm:mr-2">{suggestion}</span>
                        <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 overflow-hidden bg-white">
                  <AvatarImage src="/ai-avatar.svg" alt="Coopleo" className="p-1" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground shadow-sm mr-12">
                  Gathering knowledge...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="p-2 sm:p-4 bg-white">
        <form onSubmit={(e) => {
          e.preventDefault()
          if (inputMessage.trim()) handleSendMessage(inputMessage)
        }} className="relative">
          <Textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="min-h-[40px] sm:min-h-[48px] w-full rounded-2xl resize-none py-2 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 border border-neutral-400 shadow-sm text-sm"
            disabled={isTyping}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 sm:right-2 bottom-1 sm:bottom-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full"
            disabled={isTyping || !inputMessage.trim()}
          >
            {isTyping ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <ArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
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