'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageCircle,
  Mic,
  Heart,
  User,
  LogOut,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Chat', href: '/chat', icon: <MessageCircle size={20} /> },
  { label: 'Voice Chat', href: '/chat/voice', icon: <Mic size={20} /> },
  { label: 'Daily Check-In', href: '/mood', icon: <Heart size={20} /> },
  { label: 'Profile', href: '/profile', icon: <User size={20} /> },
]

interface SidebarProps {
  userName?: string
}

export default function Sidebar({ userName = 'User' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface border-r border-border fixed left-0 top-0 z-40 transition-colors duration-300">
        {/* Logo */}
        <div className="px-6 h-16 flex items-center justify-between border-b border-border">
          <Link href="/dashboard" className="flex items-center">
            <span className="font-heading font-bold text-xl text-dark">Sane</span>
            <span className="font-heading font-bold text-xl text-primary">Space</span>
          </Link>
          <DarkModeToggle size="sm" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-text hover:bg-primary-light hover:text-primary'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark truncate">{userName}</p>
            </div>
            <button
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                  text-[10px] font-medium transition-all duration-200
                  ${isActive ? 'text-primary' : 'text-gray-400'}
                `}
              >
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label.split(' ')[0]}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
