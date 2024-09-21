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
  finalRecommendations: string;
}

export function EmailPrompt({ conversationId, onClose, finalRecommendations }: EmailPromptProps) {
  const [email, setEmail] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
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
    setStatus('idle');
    if (isValidEmail(email)) {
      setIsSending(true)
      try {
        const response = await fetch('/api/send-transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            conversationId, 
            finalRecommendations
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Échec de l\'envoi de l\'e-mail');
        }

        console.log('E-mail envoyé avec succès:', data);
        setStatus('success');
      } catch (error: any) {
        console.error('Erreur lors de l\'envoi du parcours:', error);
        setStatus('error');
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
    setStatus('idle');
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <Card className="w-full max-w-[90%] sm:max-w-md mx-auto" ref={cardRef}>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl sm:text-2xl font-bold">Recevoir mon parcours personnalisé</CardTitle>
        <CardDescription className="text-sm sm:text-base">
        Suite à notre échange personnalisé sur votre relation, vous recevrez par mail vos recommandations concrètes adaptées à votre situation de couple. Ces conseils vous aideront à mettre en place des actions positives pour renforcer votre couple.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email" className="text-sm sm:text-base">Adresse mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="email"
                  placeholder="votre@adressemail.com"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  className={`pl-10 ${!isValid ? 'border-red-500' : ''} text-sm sm:text-base`}
                />
              </div>
              {!isValid && (
                <p className="text-xs sm:text-sm text-red-500">Veuillez entrer une adresse e-mail valide</p>
              )}
              {status === 'error' && (
                <p className="text-xs sm:text-sm text-red-500 mt-2">Échec de l'envoi de l'e-mail. Veuillez réessayer.</p>
              )}
              {status === 'success' && (
                <p className="text-xs sm:text-sm text-green-500 mt-2">E-mail envoyé avec succès !</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full text-sm sm:text-base" 
            disabled={isSending}
            onClick={() => {
              if (status === 'success') {
                onClose();
              }
            }}
          >
            {isSending ? 'Envoi en cours...' : status === 'success' ? 'Fermer' : 'Recevoir mon parcours'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}