'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Play, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MatchScoreboard } from '@/components/match/match-scoreboard'
import { TeamBuilder } from '@/components/match/team-builder'
import { GoalTracker } from '@/components/match/goal-tracker'
import { MatchSummary } from '@/components/match/match-summary'
import { RatingForm } from '@/components/player/rating-form'
import { getMatchById, updateMatchStatus, getGoals, finalizeMatch } from '@/lib/services/match-service'
import { getPeladaMembers } from '@/lib/services/pelada-service'
import { getGuestPlayers } from '@/lib/services/player-service'
import { createClient } from '@/lib/supabase/client'
import type { Match, Goal, PeladaMember, GuestPlayer } from '@/lib/types'

export default function MatchPage() {
  const params = useParams()
  const peladaId = params.peladaId as string
  const champId = params.champId as string
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [members, setMembers] = useState<PeladaMember[]>([])
  const [guests, setGuests] = useState<GuestPlayer[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [winnerTeam, setWinnerTeam] = useState('')

  useEffect(() => {
    loadAll()
  }, [matchId])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [matchData, goalsData, membersData, guestsData] = await Promise.all([
      getMatchById(matchId),
      getGoals(matchId),
      getPeladaMembers(peladaId),
      getGuestPlayers(peladaId),
    ])

    if (user) {
      const { data: memberInfo } = await supabase
        .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
      setIsAdmin(memberInfo?.role === 'owner' || memberInfo?.role === 'admin')
    }

    setMatch(matchData)
    setGoals(goalsData)
    setMembers(membersData)
    setGuests(guestsData)
    setLoading(false)
  }

  async function handleStartMatch() {
    await updateMatchStatus(matchId, 'in_progress')
    toast.success('Partida iniciada!')
    loadAll()
  }

  async function handleFinalizeMatch() {
    const { error } = await finalizeMatch(matchId, winnerTeam || '')
    if (error) {
      toast.error('Erro ao finalizar partida')
      return
    }
    toast.success('Partida finalizada!')
    setFinalizeOpen(false)
    loadAll()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16">Carregando...</div>
  }

  if (!match) return <div className="text-center py-16">Partida não encontrada.</div>

  const teams = match.teams ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">Partida</h1>
        {isAdmin && (
          <div className="flex gap-2">
            {match.status === 'scheduled' && teams.length >= 2 && (
              <Button size="sm" onClick={handleStartMatch}>
                <Play className="w-4 h-4 mr-2" />Iniciar
              </Button>
            )}
            {match.status === 'in_progress' && (
              <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />Finalizar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Finalizar Partida</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm">Selecione o time vencedor (ou deixe em branco para empate):</p>
                      <Select onValueChange={setWinnerTeam} value={winnerTeam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Empate" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleFinalizeMatch} className="w-full">
                      Confirmar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <MatchScoreboard match={match} />
        </CardContent>
      </Card>

      <Tabs defaultValue={match.status === 'completed' ? 'summary' : 'teams'}>
        <TabsList className="w-full">
          <TabsTrigger value="teams" className="flex-1">Times</TabsTrigger>
          <TabsTrigger value="goals" className="flex-1">Gols</TabsTrigger>
          {match.status === 'completed' && (
            <>
              <TabsTrigger value="summary" className="flex-1">Resumo</TabsTrigger>
              <TabsTrigger value="ratings" className="flex-1">Avaliações</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          {teams.length === 0 && isAdmin ? (
            <Card>
              <CardHeader><CardTitle>Montar Times</CardTitle></CardHeader>
              <CardContent>
                <TeamBuilder
                  matchId={matchId}
                  members={members}
                  guests={guests}
                  onTeamsCreated={loadAll}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      {team.name}
                      <span className="ml-auto text-2xl font-bold">{team.score}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {team.players?.map((p) => (
                        <p key={p.id} className="text-sm text-muted-foreground">
                          {p.profile?.full_name ?? p.guest?.name ?? 'Jogador'}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <GoalTracker match={match} goals={goals} isAdmin={isAdmin} onUpdate={loadAll} />
            </CardContent>
          </Card>
        </TabsContent>

        {match.status === 'completed' && (
          <>
            <TabsContent value="summary" className="mt-4">
              <MatchSummary match={match} />
            </TabsContent>
            <TabsContent value="ratings" className="mt-4">
              <RatingForm match={match} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
