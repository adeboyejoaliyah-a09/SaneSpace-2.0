'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageCircle,
  Mic,
  Heart,
  User,
  LogOut,
  BookOpenText,
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
  { label: 'Journal', href: '/journal', icon: <BookOpenText size={20} /> },
  { label: 'Voice Chat', href: '/chat/voice', icon: <Mic size={20} /> },
  { label: 'Daily Check-In', href: '/mood', icon: <Heart size={20} /> },
  { label: 'Profile', href: '/profile', icon: <User size={20} /> },
]

interface SidebarProps {
  userName?: string
}

export default function Sidebar({ userName = 'User' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/sign-in')
    router.refresh()
  }

  return (
    <>
      <aside className="hidden md:flex h-screen w-72 flex-col fixed left-0 top-0 z-40 border-r border-border bg-[#0D0D12]">
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
              <img src="/favicon_io/favicon-32x32.png" alt="SaneSpace logo" className="h-6 w-6" />
            </div>
            <div className="leading-none">
              <div className="text-lg font-black tracking-[-0.05em] text-[#F5F5F7]">Sane</div>
              <div className="text-lg font-black tracking-[-0.05em] text-violet-300">Space</div>
            </div>
          </Link>
          <DarkModeToggle size="sm" />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.25)]'
                    : 'text-[#A7A7B3] hover:bg-[#111118] hover:text-[#F5F5F7]',
                ].join(' ')}
              >
                <span className={isActive ? 'text-white' : 'text-[#A7A7B3]'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-[#111118] px-3 py-3">
            <Avatar name={userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#F5F5F7]">{userName}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#A7A7B3]">online</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-xl p-2 text-[#A7A7B3] transition hover:bg-[#17171F] hover:text-red-400"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[#0D0D12]/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200',
                  isActive ? 'text-violet-300' : 'text-[#A7A7B3]',
                ].join(' ')}
              >
                <span className={isActive ? 'text-violet-300' : 'text-[#A7A7B3]'}>{item.icon}</span>
                {item.label.split(' ')[0]}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
