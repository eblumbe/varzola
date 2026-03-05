'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Crown, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface Player {
  id: string
  name: string
  type: 'member' | 'guest'
  user_id?: string
  guest_player_id?: string
}

interface Vote {
  voter_user_id: string
  voted_user_id: string | null
  voted_guest_id: string | null
}

interface MvpVoteProps {
  roundId: string
  roundStatus: string
  players: Player[]
  currentUserId: string
  initialVotes: Vote[]
}

export function MvpVote({ roundId, roundStatus, players, currentUserId, initialVotes }: MvpVoteProps) {
  const [votes, setVotes] = useState<Vote[]>(initialVotes)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const myVote = votes.find((v) => v.voter_user_id === currentUserId)
  const myVotedKey = myVote ? (myVote.voted_user_id ?? myVote.voted_guest_id) : null
  const isCompleted = roundStatus === 'completed'

  const voteCounts = votes.reduce<Record<string, number>>((acc, v) => {
    const key = v.voted_user_id ?? v.voted_guest_id ?? ''
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const maxVotes = Math.max(0, ...Object.values(voteCounts))
  const mvpId = maxVotes > 0
    ? Object.entries(voteCounts).find(([, count]) => count === maxVotes)?.[0]
    : null

  const getKey = (p: Player) => p.user_id ?? p.guest_player_id ?? p.id

  async function handleVote(player: Player) {
    if (isCompleted || loading) return
    const playerKey = getKey(player)
    if (myVotedKey === playerKey) return

    setLoading(true)

    if (myVote) {
      await supabase.from('round_mvp_votes')
        .delete()
        .eq('round_id', roundId)
        .eq('voter_user_id', currentUserId)
    }

    const { error } = await supabase.from('round_mvp_votes').insert({
      round_id: roundId,
      voter_user_id: currentUserId,
      voted_user_id: player.user_id ?? null,
      voted_guest_id: player.guest_player_id ?? null,
    })

    if (error) {
      toast.error('Erro ao registrar voto')
    } else {
      setVotes((prev) => [
        ...prev.filter((v) => v.voter_user_id !== currentUserId),
        {
          voter_user_id: currentUserId,
          voted_user_id: player.user_id ?? null,
          voted_guest_id: player.guest_player_id ?? null,
        },
      ])
      toast.success(`Voto em ${player.name} registrado!`)
    }

    setLoading(false)
  }

  if (players.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Confirme jogadores para habilitar a votação.
      </p>
    )
  }

  const mvpPlayer = mvpId ? players.find((p) => getKey(p) === mvpId) : null

  return (
    <div className="space-y-3">
      {isCompleted && mvpPlayer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">MVP: {mvpPlayer.name}</p>
            <p className="text-xs text-amber-600">
              {maxVotes} voto{maxVotes !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {isCompleted && !mvpPlayer && (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhum voto registrado.</p>
      )}

      {!isCompleted && (
        <p className="text-xs text-muted-foreground">
          {myVotedKey
            ? `Seu voto: ${players.find((p) => getKey(p) === myVotedKey)?.name ?? 'Jogador'} — clique em outro para mudar.`
            : 'Selecione quem foi o melhor jogador desta rodada.'}
        </p>
      )}

      {!isCompleted && (
        <div className="space-y-2">
          {players.map((player) => {
            const key = getKey(player)
            const isVoted = myVotedKey === key
            const initials = player.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <button
                key={player.id}
                onClick={() => handleVote(player)}
                disabled={loading}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                  isVoted
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/30 border-transparent hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {loading && isVoted
                    ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    : null}
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-[#2c5234] text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{player.name}</p>
                    {player.type === 'guest' && (
                      <Badge variant="outline" className="text-xs">Convidado</Badge>
                    )}
                  </div>
                </div>
                {isVoted && (
                  <Badge className="text-xs shrink-0">Seu voto</Badge>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isCompleted && votes.length > 0 && (
        <div className="space-y-2">
          {players
            .filter((p) => (voteCounts[getKey(p)] ?? 0) > 0)
            .sort((a, b) => (voteCounts[getKey(b)] ?? 0) - (voteCounts[getKey(a)] ?? 0))
            .map((player) => {
              const key = getKey(player)
              const voteCount = voteCounts[key] ?? 0
              const isMvp = key === mvpId
              const initials = player.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isMvp ? 'bg-amber-50 border-amber-300' : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-[#2c5234] text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{player.name}</p>
                    {isMvp && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {voteCount} voto{voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
