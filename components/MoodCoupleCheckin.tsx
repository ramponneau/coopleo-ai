'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Item {
  icon: string;
  label: string;
}

const weathers: Item[] = [
  { icon: '☀️', label: 'Sunny' },
  { icon: '🌥', label: 'Cloudy' },
  { icon: '🌨', label: 'Rainy' },
  { icon: '⚡️', label: 'Tense' },
  { icon: '🌪', label: 'Stormy' }
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
const aspects = ['Communication', 'Trust', 'Intimacy', 'Conflict Resolution', 'Quality Time', 'Future Planning'];

export function MoodCoupleCheckin() {
  const [weather, setWeather] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [aspect, setAspect] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    const data = { 
      weather: weathers.find(w => w.icon === weather)?.label || '',
      mood: moods.find(m => m.icon === mood)?.label || '',
      location: locations.find(l => l.icon === location)?.label || '',
      aspect 
    };
    const params = new URLSearchParams(data).toString();
    router.push(`/chat?${params}`);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black px-8 sm:px-12 md:px-16 py-16 sm:py-20" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="w-full max-w-xl space-y-10 sm:space-y-12 text-center">
        <Image src="/coopleo-logo.svg" alt="Coopleo Logo" width={150} height={38} className="mx-auto mb-8 sm:mb-10 w-1/2 sm:w-auto h-auto" />
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10">Instant Relationship Improvement</h1>
        
        <div className="space-y-8 sm:space-y-10">
          <div>
            <p className="text-base sm:text-lg mb-4 sm:mb-6">What's your relationship forecast today?</p>
            <div className="flex justify-center items-center space-x-4 sm:space-x-6">
              {weathers.map((w) => (
                <IconButton key={w.icon} item={w} selected={weather === w.icon} onClick={setWeather} />
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
            <p className="text-base sm:text-lg mb-4 sm:mb-6">What aspect do you want to focus on?</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {aspects.map((a) => (
                <Button
                  key={a}
                  onClick={() => setAspect(a)}
                  className={`
                    ${aspect === a 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black'}
                    border border-black rounded-full
                    hover:bg-black hover:text-white
                    transition-colors
                    text-sm py-1 px-3
                    flex items-center justify-center
                  `}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="mt-10 sm:mt-12 bg-black text-white hover:bg-gray-800 transition-colors w-full max-w-md mx-auto py-6 sm:py-8 text-base sm:text-xl rounded-full"
        >
          Get recommendation
        </Button>
      </div>
    </div>
  );
}