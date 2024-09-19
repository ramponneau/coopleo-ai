import React from 'react';
import Image from 'next/image';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <Image 
        src="/coopleo-logo.svg" 
        alt="Coopleo Logo" 
        width={180} 
        height={45} 
        className="mb-8 animate-pulse"
      />
      <div className="w-16 h-16 border-t-4 border-black border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700">Chargement en cours...</p>
    </div>
  );
}