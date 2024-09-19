'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  useEffect(() => {
    const scaleInterval = setInterval(() => {
      setScale((prevScale) => (prevScale === 1 ? 1.2 : 1))
    }, 500) // Faster scale animation (every 500ms)

    const rotateInterval = setInterval(() => {
      setRotate((prevRotate) => (prevRotate + 180) % 360)
    }, 1000) // Faster rotation (every 1000ms)

    return () => {
      clearInterval(scaleInterval)
      clearInterval(rotateInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div 
        className="relative transition-all duration-500 ease-in-out"
        style={{ 
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Bouncy effect
        }}
      >
        <svg
          width="156"
          height="104"
          viewBox="0 0 39 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9.19209 0.334359C4.28604 0.390168 0.248804 4.45283 0.189683 9.39346C0.137159 13.7828 3.21989 17.4476 7.4534 18.1366C7.64828 21.2899 5.03 23.9792 5.0023 24.007C4.78062 24.2369 4.72868 24.5751 4.88284 24.8421C5.01021 25.0611 5.23453 25.1825 5.47401 25.1798C5.52875 25.1792 5.59042 25.1716 5.65225 25.1502C18.1129 21.536 17.9931 9.81791 17.9803 9.17731C18.0256 4.24372 14.0913 0.278628 9.19209 0.334359Z"
            fill="#FFD800"
          />
          <path
            d="M38.5076 8.94391C38.553 4.01032 34.6186 0.0452294 29.7194 0.100961C24.8134 0.15677 20.7761 4.21943 20.717 9.16007C20.6645 13.5494 23.7472 17.2142 27.9807 17.9032C28.1756 21.0565 25.5573 23.7458 25.5296 23.7736C25.308 24.0035 25.256 24.3417 25.4102 24.6087C25.5376 24.8277 25.7619 24.9491 26.0014 24.9464C26.0561 24.9458 26.1178 24.9382 26.1796 24.9168C38.6402 21.3026 38.5205 9.58451 38.5076 8.94391Z"
            fill="#C92C61"
          />
        </svg>
      </div>
      <h1 className="mt-8 text-3xl font-bold text-gray-800">Coopleo</h1>
      <p className="sr-only">Loading Coopleo application</p>
    </div>
  )
}