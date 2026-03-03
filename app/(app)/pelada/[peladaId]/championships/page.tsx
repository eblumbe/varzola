import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { ChampionshipCard } from '@/components/championship/championship-card'
import type { Championship } from '@/lib/types'

interface Props { params: Promise<{ peladaId: string }> }

export default async function ChampionshipsPage({ params }: Props) {
  const { peladaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: pelada } = await supabase.from('peladas').select('name').eq('id', peladaId).single()
  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
  if (!memberInfo) redirect('/dashboard')

  const { data: championships } = await supabase
    .from('championships')
    .select('*, rounds(*, matches(*))')
    .eq('pelada_id', peladaId)
    .order('created_at', { ascending: false })

  const isAdmin = memberInfo.role === 'owner' || memberInfo.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Campeonatos</h1>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href={`/pelada/${peladaId}/championships/new`}>
                  <PlusCircle className="w-4 h-4 mr-2" />Novo
                </Link>
              </Button>
            )}
          </div>

          {(championships?.length ?? 0) === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/30">
              <p className="text-4xl mb-4">🏆</p>
              <h2 className="text-lg font-semibold mb-2">Nenhum campeonato ainda</h2>
              {isAdmin && (
                <Button asChild className="mt-4">
                  <Link href={`/pelada/${peladaId}/championships/new`}>Criar campeonato</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {championships?.map((c) => (
                <ChampionshipCard key={c.id} championship={c as unknown as Championship} peladaId={peladaId} />
              ))}
            </div>
          )}
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
