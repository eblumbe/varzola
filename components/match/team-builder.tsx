'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Shuffle, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { balanceTeams } from '@/lib/utils/team-balancer'
import { createMatchTeams, addPlayerToTeam } from '@/lib/services/match-service'
import type { PeladaMember, GuestPlayer, MatchTeam } from '@/lib/types'

interface TeamBuilderProps {
  matchId: string
  members: PeladaMember[]
  guests: GuestPlayer[]
  onTeamsCreated: () => void
}

export function TeamBuilder({ matchId, members, guests, onTeamsCreated }: TeamBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [teamAName, setTeamAName] = useState('Time A')
  const [teamBName, setTeamBName] = useState('Time B')
  const [teamAColor, setTeamAColor] = useState('#ef4444')
  const [teamBColor, setTeamBColor] = useState('#3b82f6')
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([])
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([])

  const allPlayers = [
    ...members.map((m) => ({
      id: `user_${m.user_id}`,
      name: m.profile?.full_name ?? 'Jogador',
      isUser: true,
      technicalLevel: 5,
      userId: m.user_id,
      guestId: undefined as string | undefined,
    })),
    ...guests.map((g) => ({
      id: `guest_${g.id}`,
      name: g.nickname ?? g.name,
      isUser: false,
      technicalLevel: g.technical_level,
      userId: undefined as string | undefined,
      guestId: g.id,
    })),
  ]

  const assignedPlayers = new Set([...teamAPlayers, ...teamBPlayers])
  const availablePlayers = allPlayers.filter((p) => !assignedPlayers.has(p.id))

  function addToTeam(playerId: string, team: 'A' | 'B') {
    if (team === 'A') setTeamAPlayers((prev) => [...prev, playerId])
    else setTeamBPlayers((prev) => [...prev, playerId])
  }

  function removeFromTeam(playerId: string, team: 'A' | 'B') {
    if (team === 'A') setTeamAPlayers((prev) => prev.filter((p) => p !== playerId))
    else setTeamBPlayers((prev) => prev.filter((p) => p !== playerId))
  }

  function handleAutoBalance() {
    const playersForBalance = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      isUser: p.isUser,
      technicalLevel: p.technicalLevel,
    }))
    const [a, b] = balanceTeams(playersForBalance, 2)
    setTeamAPlayers(a.map((p) => p.id))
    setTeamBPlayers(b.map((p) => p.id))
  }

  async function handleSaveTeams() {
    setLoading(true)
    const { data: teams, error } = await createMatchTeams(matchId, [
      { name: teamAName, color: teamAColor },
      { name: teamBName, color: teamBColor },
    ])

    if (error || !teams) {
      toast.error('Erro ao criar times')
      setLoading(false)
      return
    }

    const [tA, tB] = teams as MatchTeam[]

    for (const id of teamAPlayers) {
      const player = allPlayers.find((p) => p.id === id)
      if (player) {
        await addPlayerToTeam({
          match_team_id: tA.id,
          user_id: player.userId,
          guest_player_id: player.guestId,
        })
      }
    }

    for (const id of teamBPlayers) {
      const player = allPlayers.find((p) => p.id === id)
      if (player) {
        await addPlayerToTeam({
          match_team_id: tB.id,
          user_id: player.userId,
          guest_player_id: player.guestId,
        })
      }
    }

    toast.success('Times salvos!')
    onTeamsCreated()
    setLoading(false)
  }

  const getPlayer = (id: string) => allPlayers.find((p) => p.id === id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Montar Times</h3>
        <Button variant="outline" size="sm" onClick={handleAutoBalance}>
          <Shuffle className="w-4 h-4 mr-2" />
          Auto-balancear
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Time A */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={teamAColor}
                onChange={(e) => setTeamAColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <Input
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="h-7 text-sm font-semibold"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 min-h-[80px]">
            {teamAPlayers.map((id) => {
              const p = getPlayer(id)
              return (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p?.name}</span>
                  <button onClick={() => removeFromTeam(id, 'A')}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Time B */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={teamBColor}
                onChange={(e) => setTeamBColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <Input
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="h-7 text-sm font-semibold"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 min-h-[80px]">
            {teamBPlayers.map((id) => {
              const p = getPlayer(id)
              return (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p?.name}</span>
                  <button onClick={() => removeFromTeam(id, 'B')}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Jogadores disponíveis */}
      {availablePlayers.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Jogadores disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">{p.name}</Badge>
                <button
                  onClick={() => addToTeam(p.id, 'A')}
                  className="text-xs text-blue-500 hover:underline"
                  title="Add ao Time A"
                >A</button>
                <span className="text-muted-foreground text-xs">/</span>
                <button
                  onClick={() => addToTeam(p.id, 'B')}
                  className="text-xs text-red-500 hover:underline"
                  title="Add ao Time B"
                >B</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSaveTeams}
        disabled={loading || (teamAPlayers.length === 0 && teamBPlayers.length === 0)}
        className="w-full"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Salvar times
      </Button>
    </div>
  )
}
