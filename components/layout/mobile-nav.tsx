'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Trophy, BarChart2 } from 'lucide-react'

interface MobileNavProps {
  peladaId?: string
}

export function MobileNav({ peladaId }: MobileNavProps) {
  const pathname = usePathname()

  const items = peladaId
    ? [
        { href: `/pelada/${peladaId}`, label: 'Dashboard', icon: Home },
        { href: `/pelada/${peladaId}/players`, label: 'Jogadores', icon: Users },
        { href: `/pelada/${peladaId}/championships`, label: 'Campeonatos', icon: Trophy },
        { href: `/pelada/${peladaId}/rankings`, label: 'Rankings', icon: BarChart2 },
      ]
    : [
        { href: '/dashboard', label: 'Início', icon: Home },
        { href: '/join', label: 'Entrar', icon: Users },
      ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
