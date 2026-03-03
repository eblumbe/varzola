import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PlayerStats } from '@/components/player/player-stats'
import type { RankingEntry } from '@/lib/types'

interface Props { params: Promise<{ peladaId: string }> }

export default async function StatsPage({ params }: Props) {
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

  const { data: rankings } = await supabase
    .from('pelada_rankings')
    .select('*')
    .eq('pelada_id', peladaId)
    .order('total_goals', { ascending: false })

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <h1 className="text-2xl font-bold">Estatísticas</h1>

          {(rankings?.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>Nenhuma estatística disponível ainda.</p>
              <p className="text-sm mt-2">Conclua partidas para ver as estatísticas dos jogadores.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rankings?.map((entry) => (
                <PlayerStats
                  key={entry.user_id ?? entry.guest_player_id}
                  entry={entry as unknown as RankingEntry}
                />
              ))}
            </div>
          )}
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
