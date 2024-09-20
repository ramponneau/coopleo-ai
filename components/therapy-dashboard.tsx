'use client'

import React, { useState, useEffect, useCallback, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSearchParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'
import { EmailPrompt } from '@/components/ui/email-prompt'
import { EmailTemplate } from '@/components/ui/email-template';
import { SplashScreen } from './splash-screen';
import { useMediaQuery } from '@/hooks/use-media-query'

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [containsFinalRecommendations, setContainsFinalRecommendations] = useState(false);
  const [asksForEmail, setAsksForEmail] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [context, setContext] = useState<any>(null);
  const [isReasoning, setIsReasoning] = useState(false);
  const [finalRecommendationsResponded, setFinalRecommendationsResponded] = useState(false);
  const [showingFinalRecommendations, setShowingFinalRecommendations] = useState(false);
  const [showFinalRecommendations, setShowFinalRecommendations] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [finalRecommendationReplied, setFinalRecommendationReplied] = useState(false);
  const [showFinalRecommendationButtons, setShowFinalRecommendationButtons] = useState(false);
  const [isFinalRecommendationShown, setIsFinalRecommendationShown] = useState(false);
  const [showFinalOptions, setShowFinalOptions] = useState(false);
  const [finalRecommendations, setFinalRecommendations] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 640px)')

  const handleSendMessage = useCallback(async (message: string, isInvisiblePrompt: boolean = false) => {
    if (isTyping || (isFinalRecommendationShown && !isInvisiblePrompt)) return;
    setIsTyping(true);
    setSuggestions([]);
    if (!isInvisiblePrompt) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      setInputMessage('');
    }

    try {
      console.log('Sending message:', { message, isInvisiblePrompt, context });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          isInitialContext: isInvisiblePrompt, 
          conversation_id: conversationId,
          context: context 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setMessageCount(prev => prev + 1);
      }

      setContainsFinalRecommendations(data.contains_recommendations);
      setAsksForEmail(data.asks_for_email);

      if (data.contains_recommendations) {
        setSuggestions(["Oui, veuillez envoyer ces recommandations par mail", "Non, merci"]);
        setShowFinalOptions(true);
        setFinalRecommendations(data.response); // Store the final recommendations
      } else if (!isInvisiblePrompt) {
        setSuggestions(data.suggestions);
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Désolé, j'ai rencontré une erreur : ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, isFinalRecommendationShown, conversationId, context, setFinalRecommendations]);

  const handleFinalOptionResponse = useCallback((response: string) => {
    if (response.toLowerCase() === 'oui') {
      setShowEmailPrompt(true);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: "Merci pour votre temps et pour notre conversation. J'espère qu'elle vous a été utile. N'hésitez pas à revenir si vous avez d'autres questions à l'avenir. Au revoir et prenez soin de vous !" }]);
    }
    setShowFinalOptions(false);
    setIsFinalRecommendationShown(true);
  }, []);

  const formatMessage = (content: string, isAIResponse: boolean) => {
    if (!isAIResponse) return content;
    return content
      .replace(/^\d+\.\s/gm, '• ') // Replace numbered lists with bullet points
      .replace(/\n/g, '  \n') // Add two spaces before newlines for markdown line breaks
      .trim();
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
        setMessages([{ role: 'assistant', content: "Bonjour ! Je suis **Coopleo**, votre conseiller relationnel. Quel est votre nom ?" }])
      }
    } catch (error) {
      console.error('Error resetting conversation:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim()) handleSendMessage(inputMessage)
    }
  }

  const handleUserResponse = useCallback((response: string) => {
    if (containsFinalRecommendations) {
      if (response.toLowerCase() === 'oui') {
        setShowEmailPrompt(true);
      } else {
        handleSendMessage("D'accord. Merci pour votre temps.");
      }
      setShowFinalOptions(false);
    } else {
      handleSendMessage(response);
    }
  }, [containsFinalRecommendations, handleSendMessage]);

  const handleEmailSubmit = async (email: string) => {
    setShowEmailPrompt(false);
    
    // Find the last message containing final recommendations
    const finalRecommendationsMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant' && msg.content.toLowerCase().includes('final recommendations'));

    let finalRecommendations = '';
    if (finalRecommendationsMessage) {
      // Extract the final recommendations section
      const content = finalRecommendationsMessage.content;
      const startIndex = content.toLowerCase().indexOf('final recommendations');
      if (startIndex !== -1) {
        finalRecommendations = content.slice(startIndex);
      }
    }

    if (!finalRecommendations || !conversationId) {
      console.error('No final recommendations found in the conversation or missing conversation ID');
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je n'ai pas pu trouver les recommandations finales. Voici un message de clôture pour notre conversation." }]);
      return;
    }

    try {
      const emailContent = EmailTemplate({ 
        name: context?.name || 'Cher utilisateur',
        topic: context?.topic || 'votre relation',
        finalRecommendations, 
        conversationId 
      });

      console.log('Email content:', emailContent);

      const response = await fetch('/api/send-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, emailContent, finalRecommendations, conversationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      // Add a closing message without sending another request
      setMessages(prev => [...prev, { role: 'assistant', content: "Merci pour votre temps. Les recommandations ont été envoyées à votre adresse e-mail. J'espère que notre conversation vous a été utile. N'hésitez pas à revenir si vous avez d'autres questions à l'avenir. Au revoir et prenez soin de vous !" }]);
      setIsFinalRecommendationShown(true);
    } catch (error) {
      console.error('Error sending email:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, il y a eu un problème lors de l'envoi de l'e-mail. Cependant, je vous remercie pour notre conversation. N'hésitez pas à revenir si vous avez d'autres questions à l'avenir. Au revoir et prenez soin de vous !" }]);
      setIsFinalRecommendationShown(true);
    }
  };

  useEffect(() => {
    console.log('Suggestions updated:', suggestions);
  }, [suggestions]);

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
          
          setContext(initialContext);
          initialContextSentRef.current = true;
          
          await handleSendMessage(JSON.stringify(initialContext), true);
        } catch (error) {
          console.error('Error parsing context:', error);
          setMessages([{ role: 'assistant', content: "Bonjour ! Je suis Coopleo, votre conseiller relationnel. Quel est votre nom ?" }]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('Missing context');
        setMessages([{ role: 'assistant', content: "Bonjour ! Je suis Coopleo, votre conseiller relationnel. Quel est votre nom ?" }]);
        setIsLoading(false);
      }
    };

    loadInitialContext();
  }, [searchParams, handleSendMessage]);

  const handleEmailPromptClose = useCallback(() => {
    setShowEmailPrompt(false);
    setMessages(prev => [...prev, { role: 'assistant', content: "Merci pour votre temps et pour notre conversation. J'espère qu'elle vous a été utile. **N'hésitez pas à revenir si vous avez d'autres questions à l'avenir**. Au revoir et prenez soin de vous !" }]);
    setIsFinalRecommendationShown(true);
  }, []);

  useEffect(() => {
    const adjustViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    adjustViewportHeight();
    window.addEventListener('resize', adjustViewportHeight);

    return () => window.removeEventListener('resize', adjustViewportHeight);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Adjust this time as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading ? (
        <SplashScreen />
      ) : (
        <div className="flex flex-col h-screen bg-white" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-white">
            <button onClick={() => window.location.href = '/'} className="flex items-center">
              <img 
                src="/coopleo-logo.svg" 
                alt="Coopleo Logo" 
                className="h-8 sm:h-10 w-auto transition-transform duration-200 ease-in-out transform hover:scale-105"
              />
            </button>
            <div className="flex items-center">
              {/* Test button for email prompt */}
              <Button 
                onClick={() => setShowEmailPrompt(true)} 
                size="icon" 
                variant="ghost"
                className="w-8 h-8 rounded-full hover:bg-gray-100 transition-colors mr-2"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="sr-only">Test Email Prompt</span>
              </Button>
              <Button 
                onClick={handleDeleteHistory} 
                size="icon" 
                variant="ghost"
                className="w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ReloadIcon className="w-5 h-5 text-gray-600" />
                <span className="sr-only">Start New Conversation</span>
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-2 sm:px-4 py-4 pb-20">
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
                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                            li: ({node, ...props}) => <li className="ml-4" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-0" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-0" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
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
                    {msg.role === 'assistant' && index === messages.length - 1 && !isFinalRecommendationShown && (
                      <>
                        {showFinalOptions && !msg.content.toLowerCase().includes('au revoir') ? (
                          <div className="flex flex-col gap-2 mt-2 ml-8 sm:ml-11 max-w-[75%] sm:max-w-[80%]">
                            {[
                              { text: "Oui, veuillez envoyer ces recommandations par mail", value: "Oui" },
                              { text: "Non, merci", value: "Non" }
                            ].map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleFinalOptionResponse(option.value)}
                                className="flex items-center justify-between text-left text-xs sm:text-sm bg-gray-100 text-black font-semibold py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
                              >
                                <span className="flex-grow mr-2">{option.text}</span>
                                <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          suggestions.length > 0 && !msg.content.toLowerCase().includes('au revoir') && (
                            <div className="flex flex-col gap-2 mt-2 ml-8 sm:ml-11 max-w-[75%] sm:max-w-[80%]">
                              {suggestions.map((suggestion, sugIndex) => (
                                <button
                                  key={sugIndex}
                                  onClick={() => handleUserResponse(suggestion)}
                                  className="flex items-center justify-between text-left text-xs sm:text-sm bg-gray-100 text-black font-semibold py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
                                >
                                  <span className="flex-grow mr-2">{suggestion}</span>
                                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          )
                        )}
                      </>
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
                      Analyse en cours...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          <div className={`p-2 sm:p-4 bg-white ${isMobile ? 'fixed left-0 right-0 bottom-0' : 'sticky bottom-0'}`}>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (inputMessage.trim() && !isFinalRecommendationShown) handleSendMessage(inputMessage)
            }} className="relative">
              <Textarea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message ici..."
                className={cn(
                  "min-h-[40px] sm:min-h-[48px] w-full rounded-2xl resize-none py-2 sm:py-3 px-3 sm:px-4 pr-14 border border-neutral-400 shadow-sm text-sm",
                  isMobile && "text-base"
                )}
                disabled={isTyping || showEmailPrompt || isFinalRecommendationShown}
                style={{ 
                  maxHeight: isMobile ? '80px' : '120px', 
                  overflowY: 'auto',
                }}
                enterKeyHint="send"
              />
              <Button 
                type="submit" 
                variant="default"
                className={cn(
                  "absolute p-0 flex items-center justify-center bg-black hover:bg-gray-800 rounded-full",
                  "right-2 bottom-2 h-12 w-12"
                )}
                disabled={isTyping || !inputMessage.trim() || showEmailPrompt || isFinalRecommendationShown}
              >
                {isTyping ? (
                  <Loader2 className="animate-spin text-white h-6 w-6" />
                ) : (
                  <ArrowUpIcon className="text-white h-6 w-6" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
          
          {showEmailPrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <EmailPrompt 
                conversationId={conversationId} 
                onClose={handleEmailPromptClose}
                finalRecommendations={finalRecommendations}
              />
            </div>
          )}
        </div>
      )}
    </>
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

function Mail(props: React.SVGProps<SVGSVGElement>) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}