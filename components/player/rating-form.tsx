'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { submitRating } from '@/lib/services/rating-service'
import type { Match } from '@/lib/types'

interface RatingFormProps {
  match: Match
}

interface PlayerToRate {
  id: string
  name: string
  userId?: string
  guestId?: string
}

export function RatingForm({ match }: RatingFormProps) {
  const [ratings, setRatings] = useState<Record<string, {
    technical: number; physical: number; tactical: number; fair_play: number
  }>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())

  const players: PlayerToRate[] = (match.teams ?? []).flatMap((t) =>
    (t.players ?? []).map((p) => ({
      id: p.user_id ?? p.guest_player_id ?? p.id,
      name: p.profile?.full_name ?? p.guest?.name ?? 'Jogador',
      userId: p.user_id ?? undefined,
      guestId: p.guest_player_id ?? undefined,
    }))
  )

  function getRating(playerId: string) {
    return ratings[playerId] ?? { technical: 5, physical: 5, tactical: 5, fair_play: 5 }
  }

  function setRating(playerId: string, key: string, value: number) {
    setRatings((prev) => ({
      ...prev,
      [playerId]: { ...getRating(playerId), [key]: value },
    }))
  }

  async function handleSubmit(player: PlayerToRate) {
    setSubmitting(player.id)
    const r = getRating(player.id)

    const { error } = await submitRating({
      match_id: match.id,
      rated_user_id: player.userId,
      rated_guest_id: player.guestId,
      ...r,
    })

    if (error) toast.error('Erro ao enviar avaliação')
    else {
      toast.success(`Avaliação de ${player.name} enviada!`)
      setSubmitted((prev) => new Set(prev).add(player.id))
    }
    setSubmitting(null)
  }

  if (players.length === 0) {
    return <p className="text-center text-muted-foreground py-4 text-sm">Nenhum jogador para avaliar.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Avalie o desempenho dos jogadores nesta partida (1–10).
      </p>
      {players.map((player) => {
        const r = getRating(player.id)
        const done = submitted.has(player.id)
        return (
          <Card key={player.id} className={done ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{player.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['technical', 'physical', 'tactical', 'fair_play'] as const).map((key) => {
                const labelMap = {
                  technical: 'Técnica',
                  physical: 'Físico',
                  tactical: 'Tática',
                  fair_play: 'Fair Play',
                }
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">{labelMap[key]}</Label>
                      <span className="text-xs font-bold">{r[key]}</span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[r[key]]}
                      onValueChange={([v]) => setRating(player.id, key, v)}
                      disabled={done}
                    />
                  </div>
                )
              })}
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleSubmit(player)}
                disabled={done || submitting === player.id}
              >
                {submitting === player.id && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                {done ? 'Avaliado ✓' : 'Avaliar'}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
