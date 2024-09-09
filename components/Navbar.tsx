import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link href="/" className="flex items-center py-4 px-2">
                <Image
                  src="/coopleo-logo.svg"
                  alt="Coopleo Logo"
                  width={120}
                  height={40}
                  priority
                />
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/chat" className="py-4 px-2 text-gray-500 font-semibold hover:text-black transition duration-300">New Conversation</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}