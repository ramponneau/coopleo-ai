'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface NavbarProps {
  onNewConversation: () => void;
  onLogoClick: () => void;
}

export default function Navbar({ onNewConversation, onLogoClick }: NavbarProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    onLogoClick()
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <button onClick={onLogoClick} className="flex items-center py-4 px-2">
              <Image
                src="/coopleo-logo.svg"
                alt="Coopleo Logo"
                width={120}
                height={40}
                priority
              />
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={onNewConversation}
              className="py-2 px-4 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition duration-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Conversation
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}