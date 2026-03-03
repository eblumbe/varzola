'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  Trophy,
  BarChart2,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Minhas Peladas', icon: Home },
  { href: '/join', label: 'Entrar em Pelada', icon: Users },
]

interface SidebarProps {
  peladaId?: string
}

export function Sidebar({ peladaId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const peladaItems = peladaId
    ? [
        { href: `/pelada/${peladaId}`, label: 'Dashboard', icon: Home },
        { href: `/pelada/${peladaId}/players`, label: 'Jogadores', icon: Users },
        { href: `/pelada/${peladaId}/championships`, label: 'Campeonatos', icon: Trophy },
        { href: `/pelada/${peladaId}/rankings`, label: 'Rankings', icon: BarChart2 },
        { href: `/pelada/${peladaId}/settings`, label: 'Configurações', icon: Settings },
      ]
    : []

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background min-h-screen p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-sm">⚽</span>
        </div>
        <span className="font-bold text-lg">Varzola</span>
      </div>

      <nav className="flex-1 space-y-1">
        {!peladaId && (
          <>
            <Link href="/pelada/new">
              <Button variant="default" size="sm" className="w-full justify-start mb-3">
                <PlusCircle className="w-4 h-4 mr-2" />
                Nova Pelada
              </Button>
            </Link>
            <div className="pb-2">
              <p className="text-xs text-muted-foreground px-2 pb-1 uppercase tracking-wider">Geral</p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}

        {peladaId && (
          <div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-muted-foreground px-2 pb-2 hover:text-foreground"
            >
              ← Todas as peladas
            </Link>
            {peladaItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </aside>
  )
}
