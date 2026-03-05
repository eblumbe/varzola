import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Calendar } from 'lucide-react'
import { RoundPlayers } from '@/components/championship/round-players'
import { MvpVote } from '@/components/championship/mvp-vote'
import { formatDateShort } from '@/lib/utils/format'

interface Props {
  params: Promise<{ peladaId: string; champId: string; roundId: string }>
}

const statusLabel = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' }

export default async function RoundPage({ params }: Props) {
  const { peladaId, champId, roundId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: pelada } = await supabase.from('peladas').select('name, max_players').eq('id', peladaId).single()
  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
  if (!memberInfo) redirect('/dashboard')

  const { data: round } = await supabase
    .from('rounds')
    .select('*, matches(id, status, date)')
    .eq('id', roundId)
    .single()
  if (!round) notFound()

  const isAdmin = memberInfo.role === 'owner' || memberInfo.role === 'admin'

  const [{ data: members }, { data: guests }, { data: roundPlayers }, { data: mvpVotes }] = await Promise.all([
    supabase.from('pelada_members').select('id, user_id, profile:profiles(full_name, nickname)').eq('pelada_id', peladaId).eq('status', 'active'),
    supabase.from('guest_players').select('id, name, nickname').eq('pelada_id', peladaId).eq('status', 'active'),
    supabase.from('round_players').select('user_id, guest_player_id').eq('round_id', roundId),
    supabase.from('round_mvp_votes').select('voter_user_id, voted_user_id, voted_guest_id').eq('round_id', roundId),
  ])

  const confirmedUserIds = new Set(roundPlayers?.filter((rp) => rp.user_id).map((rp) => rp.user_id) ?? [])
  const confirmedGuestIds = new Set(roundPlayers?.filter((rp) => rp.guest_player_id).map((rp) => rp.guest_player_id) ?? [])

  const players = [
    ...(members ?? []).map((m) => ({
      id: `member-${m.id}`,
      name: (m as { profile?: { full_name?: string } }).profile?.full_name ?? 'Membro',
      nickname: (m as { profile?: { nickname?: string | null } }).profile?.nickname,
      type: 'member' as const,
      user_id: m.user_id,
      confirmed: confirmedUserIds.has(m.user_id),
    })),
    ...(guests ?? []).map((g) => ({
      id: `guest-${g.id}`,
      name: g.name,
      nickname: g.nickname,
      type: 'guest' as const,
      guest_player_id: g.id,
      confirmed: confirmedGuestIds.has(g.id),
    })),
  ]

  const confirmedPlayers = players
    .filter((p) => p.confirmed)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      user_id: 'user_id' in p ? p.user_id : undefined,
      guest_player_id: 'guest_player_id' in p ? p.guest_player_id : undefined,
    }))

  const votes = (mvpVotes ?? []).map((v) => ({
    voter_user_id: v.voter_user_id,
    voted_user_id: v.voted_user_id ?? null,
    voted_guest_id: v.voted_guest_id ?? null,
  }))

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Rodada {round.round_number}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge>{statusLabel[round.status as keyof typeof statusLabel]}</Badge>
                {round.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDateShort(round.date)}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href={`/pelada/${peladaId}/championships/${champId}/match/new?round=${roundId}`}>
                  <PlusCircle className="w-4 h-4 mr-2" />Nova partida
                </Link>
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jogadores desta rodada</CardTitle>
            </CardHeader>
            <CardContent>
              <RoundPlayers
                roundId={roundId}
                maxPlayers={pelada.max_players ?? 20}
                players={players}
                canManage={isAdmin}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">MVP da Rodada</CardTitle>
            </CardHeader>
            <CardContent>
              <MvpVote
                roundId={roundId}
                roundStatus={round.status}
                players={confirmedPlayers}
                currentUserId={user.id}
                initialVotes={votes}
              />
            </CardContent>
          </Card>

          {(round.matches as { id: string }[])?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Partidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(round.matches as { id: string; status: string; date: string }[]).map((match) => (
                  <Link
                    key={match.id}
                    href={`/pelada/${peladaId}/championships/${champId}/match/${match.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{formatDateShort(match.date)}</span>
                    <Badge variant="outline">{match.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
