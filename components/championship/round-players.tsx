'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Player {
  id: string
  name: string
  nickname?: string | null
  type: 'member' | 'guest'
  user_id?: string
  guest_player_id?: string
  confirmed: boolean
}

interface RoundPlayersProps {
  roundId: string
  maxPlayers: number
  players: Player[]
  canManage: boolean
}

export function RoundPlayers({ roundId, maxPlayers, players: initial, canManage }: RoundPlayersProps) {
  const [players, setPlayers] = useState<Player[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const confirmed = players.filter((p) => p.confirmed)
  const available = players.filter((p) => !p.confirmed)
  const isFull = confirmed.length >= maxPlayers

  async function toggle(player: Player) {
    if (!canManage) return
    if (!player.confirmed && isFull) {
      toast.error(`Limite de ${maxPlayers} jogadores por rodada atingido`)
      return
    }
    setLoading(player.id)

    if (player.confirmed) {
      // Remove
      const query = player.type === 'member'
        ? supabase.from('round_players').delete().eq('round_id', roundId).eq('user_id', player.user_id!)
        : supabase.from('round_players').delete().eq('round_id', roundId).eq('guest_player_id', player.guest_player_id!)
      const { error } = await query
      if (error) toast.error('Erro ao remover jogador')
      else {
        setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, confirmed: false } : p))
        toast.success(`${player.name} removido da rodada`)
      }
    } else {
      // Add
      const { error } = await supabase.from('round_players').insert({
        round_id: roundId,
        user_id: player.type === 'member' ? player.user_id : null,
        guest_player_id: player.type === 'guest' ? player.guest_player_id : null,
      })
      if (error) toast.error('Erro ao confirmar jogador')
      else {
        setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, confirmed: true } : p))
        toast.success(`${player.name} confirmado!`)
      }
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Confirmados: <span className={isFull ? 'text-destructive' : 'text-green-600'}>{confirmed.length}/{maxPlayers}</span>
        </p>
        {isFull && <Badge variant="destructive">Turma completa</Badge>}
      </div>

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Confirmados</p>
          {confirmed.map((player) => (
            <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-green-100">
                  {player.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{player.name}</p>
                {player.nickname && <p className="text-xs text-muted-foreground">@{player.nickname}</p>}
              </div>
              <Badge variant="outline" className="text-xs">{player.type === 'guest' ? 'Convidado' : 'Membro'}</Badge>
              {canManage && (
                <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" disabled={loading === player.id} onClick={() => toggle(player)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disponíveis</p>
          {available.map((player) => (
            <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {player.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{player.name}</p>
                {player.nickname && <p className="text-xs text-muted-foreground">@{player.nickname}</p>}
              </div>
              <Badge variant="secondary" className="text-xs">{player.type === 'guest' ? 'Convidado' : 'Membro'}</Badge>
              {canManage && (
                <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600" disabled={loading === player.id || isFull} onClick={() => toggle(player)}>
                  <UserPlus className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
