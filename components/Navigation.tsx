'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MessageSquare, FileText, PlusCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Posts', href: '/posts', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Create Content', href: '/content', icon: PlusCircle },
]

export default function Navigation() {
  const pathname = usePathname()
  const { community, logout } = useAuth()

  return (
    <nav className="bg-transparent">
      <div className="w-full">
        <div className="flex h-20 items-center justify-between pl-6 pr-4 sm:pr-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center mt-4 sm:mt-6">
              <img
                src="/ccadmin-vibrant.svg"
                alt="Community Connect Admin"
                className="h-40 w-auto sm:h-52 md:h-64 lg:h-72 xl:h-80"
                style={{ maxWidth: '800px' }}
              />
            </Link>
            {community && (
              <span className="text-xs sm:text-sm font-medium text-[#001638] whitespace-nowrap hidden md:inline drop-shadow-md">
                ({community})
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition whitespace-nowrap text-[#001638] hover:text-[#001638]/80`}
                  style={isActive ? {
                    backgroundColor: '#001638',
                    color: '#ffffff'
                  } : {}}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {community && logout && (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium text-[#001638] hover:text-[#001638]/80 transition whitespace-nowrap ml-2"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

