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
    <nav className="bg-white shadow-sm ring-1 ring-gray-900/5">
      <div className="w-full">
        <div className="flex h-20 items-center justify-between pl-6 pr-4 sm:pr-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="text-xl sm:text-2xl font-bold whitespace-nowrap" style={{ color: '#1e3a8a' }}>
              Community Connect Admin
            </Link>
            {community && (
              <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap hidden md:inline">
                ({community})
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href))
              // Cycle through accent colors
              const accentColors = ['#4dd0e1', '#ff8c42', '#ffb300', '#4dd0e1']
              const accentColor = accentColors[index % accentColors.length]
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${accentColor}40`, // 40 = ~25% opacity
                    color: accentColor
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
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition whitespace-nowrap ml-2"
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

