'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface Item {
  icon: string;
  label: string;
}

const states: Item[] = [
  { icon: '☀️', label: 'Thriving' },
  { icon: '🌥', label: 'Stable' },
  { icon: '🌨', label: 'Struggling' },
  { icon: '⚡️', label: 'Tense' },
  { icon: '🌪', label: 'Turbulent' }
];
const moods: Item[] = [
  { icon: '😊', label: 'Happy' },
  { icon: '😢', label: 'Sad' },
  { icon: '😍', label: 'In Love' },
  { icon: '😡', label: 'Angry' },
  { icon: '🤔', label: 'Thoughtful' }
];
const locations: Item[] = [
  { icon: '🏠', label: 'Home' },
  { icon: '🏢', label: 'Work' },
  { icon: '🌳', label: 'Outdoors' },
  { icon: '🏋️', label: 'Sport' },
  { icon: '🚇', label: 'Transit' }
];
const topics = ['Communication', 'Trust', 'Intimacy', 'Conflict Resolution', 'Quality Time', 'Future Planning'];

export function MoodCoupleCheckin() {
  const [state, setState] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!state || !mood || !location || !topic) {
      alert("Please select all options before proceeding.");
      return;
    }

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
      console.log('Initial context sent, response:', data);

      // Encode the initial context and the response for the URL
      const encodedContext = encodeURIComponent(JSON.stringify({
        initialContext,
        initialResponse: data.response
      }));
      const params = new URLSearchParams({ context: encodedContext }).toString();
      console.log('Navigating to:', `/chat?${params}`);
      router.push(`/chat?${params}`);
    } catch (error) {
      console.error('Error sending initial context:', error);
      alert('An error occurred. Please try again.');
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
                    <h3 className="text-lg font-bold">Relationship Guidance for Couples</h3>
                    <p className="text-sm text-muted-foreground">
                      Coopleo is a 100% digital relationship counselor for couples. We offer a natural and proactive conversation experience that helps couples thrive.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-medium">How it works</h4>
                    <p className="text-sm text-muted-foreground">
                      Select options that best describe your current relationship, and we'll guide you through simple and actionable steps to improve your connection.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-medium">Privacy</h4>
                    <p className="text-sm text-muted-foreground">
                      Your conversations are confidential and secure. We prioritize your privacy at every step.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-8 sm:space-y-10 text-center">
            <div>
              <p className="text-base sm:text-lg mb-4 sm:mb-6">How would you describe the current state of your relationship?</p>
              <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                {states.map((s) => (
                  <IconButton key={s.icon} item={s} selected={state === s.icon} onClick={setState} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-base sm:text-lg mb-4 sm:mb-6">How are you feeling in this moment?</p>
              <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                {moods.map((m) => (
                  <IconButton key={m.icon} item={m} selected={mood === m.icon} onClick={setMood} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-base sm:text-lg mb-4 sm:mb-6">Where are you right now?</p>
              <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                {locations.map((loc) => (
                  <IconButton key={loc.icon} item={loc} selected={location === loc.icon} onClick={setLocation} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-base sm:text-lg mb-4 sm:mb-6">What relationship topic do you want to focus on?</p>
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
              className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 w-full max-w-sm py-4 sm:py-6 text-base sm:text-lg rounded-full"
            >
              Get recommendation
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
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