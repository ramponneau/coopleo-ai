'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail } from 'lucide-react'
import { EmailTemplate } from './email-template'

interface EmailPromptProps {
  conversationId: string | null;
  onClose: () => void;
}

export function EmailPrompt({ conversationId, onClose }: EmailPromptProps) {
  const [email, setEmail] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null);
    if (isValidEmail(email)) {
      setIsSending(true)
      try {
        const response = await fetch('/api/send-transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, conversationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send email');
        }

        console.log('Email sent successfully:', data);
        onClose();
      } catch (error: any) {
        console.error('Error sending transcript:', error);
        setError(`Failed to send email. Please try again.`);
      } finally {
        setIsSending(false)
      }
    } else {
      setIsValid(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setIsValid(true)
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto" ref={cardRef}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Receive Relationship Plan</CardTitle>
        <CardDescription>Please enter your email address to receive your personalized relationship plan</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  className={`pl-10 ${!isValid ? 'border-red-500' : ''}`}
                />
              </div>
              {!isValid && (
                <p className="text-sm text-red-500">Please enter a valid email address</p>
              )}
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? 'Sending...' : 'Email My Results'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}