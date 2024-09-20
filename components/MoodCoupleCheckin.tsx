'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { SplashScreen } from './splash-screen';

interface Item {
  icon: string;
  label: string;
}

const states: Item[] = [
  { icon: '☀️', label: 'Épanoui' },
  { icon: '🌥', label: 'Stable' },
  { icon: '🌨', label: 'Difficile' },
  { icon: '⚡️', label: 'Tendu' },
  { icon: '🌪', label: 'Turbulent' }
];
const moods: Item[] = [
  { icon: '😊', label: 'Heureux' },
  { icon: '😢', label: 'Triste' },
  { icon: '😍', label: 'Amoureux' },
  { icon: '😡', label: 'En colère' },
  { icon: '🤔', label: 'Pensif' }
];
const locations: Item[] = [
  { icon: '🏠', label: 'Maison' },
  { icon: '🏢', label: 'Travail' },
  { icon: '🌳', label: 'Extérieur' },
  { icon: '🏋️', label: 'Sport' },
  { icon: '🚇', label: 'Transport' }
];
const topics = ['Communication', 'Confiance', 'Intimité', 'Résolution de conflits', 'Moments de qualité', "Projets d'avenir"];

export function MoodCoupleCheckin() {
  const [state, setState] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!state || !mood || !location || !topic) {
      alert("Merci de sélectionner toutes les options.");
      return;
    }

    setShowSplashScreen(true); // Show splash screen immediately

    const initialContext = {
      state: states.find(s => s.icon === state)?.label || '',
      mood: moods.find(m => m.icon === mood)?.label || '',
      location: locations.find(l => l.icon === location)?.label || '',
      topic
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: JSON.stringify(initialContext), isInitialContext: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const encodedContext = encodeURIComponent(JSON.stringify({
        initialContext,
        initialResponse: data.response
      }));
      const params = new URLSearchParams({ context: encodedContext }).toString();
      router.push(`/chat?${params}`);
    } catch (error) {
      console.error('Error sending initial context:', error);
      alert('An error occurred. Please try again.');
      setShowSplashScreen(false);
    }
  };

  const IconButton = ({ item, selected, onClick }: { item: Item; selected: boolean; onClick: (icon: string) => void }) => (
    <div className="relative">
      {selected && (
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
          {item.label}
        </div>
      )}
      <button
        onClick={() => onClick(item.icon)}
        className={`text-3xl sm:text-4xl md:text-5xl hover:opacity-80 ${selected ? 'border-b-4 border-black pb-1' : ''}`}
      >
        {item.icon}
      </button>
    </div>
  );

  return (
    <>
      {showSplashScreen && <SplashScreen />}
      <TooltipProvider>
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black px-8 sm:px-12 md:px-16 py-16 sm:py-20" style={{ fontFamily: 'Arial, sans-serif' }}>
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-10 sm:mb-12">
              <Image src="/coopleo-logo.svg" alt="Coopleo Logo" width={180} height={45} className="w-2/5 sm:w-1/3 h-auto" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <InfoIcon className="w-5 h-5" />
                    <span className="sr-only">More info</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-[500px] p-4 rounded-md shadow-lg bg-background border">
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Coopleo IA</h3>
                      <p className="text-sm text-muted-foreground">
                        Coopleo aide les couples à anticiper et résoudre les problèmes avant qu'ils ne s'aggravent. Nous vous proposons une expérience de conversation naturelle et proactive pour gérer au quotidien les défis de votre relation.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-medium">Comment ça marche</h4>
                      <p className="text-sm text-muted-foreground">
                        Choisissez les options qui décrivent le mieux votre relation actuelle, et nous vous guiderons à travers des étapes simples et concrètes pour améliorer votre relation de couple.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-medium">Confidentialité</h4>
                      <p className="text-sm text-muted-foreground">
                        Vos conversations sont confidentielles et sécurisées. Nous priorisons votre vie privée à chaque étape.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-8 sm:space-y-10 text-center">
              <div>
                <p className="text-base sm:text-lg mb-4 sm:mb-6">Comment va votre couple aujourd'hui ?</p>
                <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                  {states.map((s) => (
                    <IconButton key={s.icon} item={s} selected={state === s.icon} onClick={setState} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-base sm:text-lg mb-4 sm:mb-6">Comment vous sentez-vous en ce moment ?</p>
                <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                  {moods.map((m) => (
                    <IconButton key={m.icon} item={m} selected={mood === m.icon} onClick={setMood} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-base sm:text-lg mb-4 sm:mb-6">Que faites-vous actuellement ?</p>
                <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                  {locations.map((loc) => (
                    <IconButton key={loc.icon} item={loc} selected={location === loc.icon} onClick={setLocation} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-base sm:text-lg mb-4 sm:mb-6">Quel sujet souhaitez-vous traiter ?</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {topics.map((t) => (
                    <Button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`
                        ${topic === t 
                          ? 'bg-black text-white' 
                          : 'bg-white text-black'}
                        border border-black rounded-full
                        hover:bg-black hover:text-white
                        transition-colors
                        text-sm py-1 px-3
                        flex items-center justify-center
                      `}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-10 sm:mt-12">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`
                  bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 
                  w-full max-w-sm py-4 sm:py-6 text-base sm:text-lg rounded-full
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoaderIcon className="animate-spin mr-2" />
                    Démarrer le parcours
                  </div>
                ) : (
                  'Démarrer le parcours'
                )}
              </Button>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}