import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusCircle } from 'lucide-react'
import { RoundList } from '@/components/championship/round-list'
import type { Round } from '@/lib/types'

interface Props { params: Promise<{ peladaId: string; champId: string }> }

export default async function ChampionshipPage({ params }: Props) {
  const { peladaId, champId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: pelada } = await supabase.from('peladas').select('name').eq('id', peladaId).single()
  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
  if (!memberInfo) redirect('/dashboard')

  const { data: champ } = await supabase
    .from('championships')
    .select('*, rounds(*, matches(id, status, date))')
    .eq('id', champId)
    .single()
  if (!champ) notFound()

  const statusMap = { active: 'Ativo', completed: 'Encerrado', cancelled: 'Cancelado' }
  const isAdmin = memberInfo.role === 'owner' || memberInfo.role === 'admin'
  const rounds = (champ.rounds as unknown as Round[]) ?? []
  const completedRounds = rounds.filter((r) => r.status === 'completed').length

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{champ.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge>{statusMap[champ.status as keyof typeof statusMap] ?? champ.status}</Badge>
                <span>{completedRounds}/{rounds.length} rodadas</span>
              </div>
            </div>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href={`/pelada/${peladaId}/championships/${champId}/match/new`}>
                  <PlusCircle className="w-4 h-4 mr-2" />Nova partida
                </Link>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">Rodadas</h2>
            <RoundList rounds={rounds} peladaId={peladaId} champId={champId} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/pelada/${peladaId}/rankings?champ=${champId}`}>
                Ver ranking
              </Link>
            </Button>
          </div>
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
