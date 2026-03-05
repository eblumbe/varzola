'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { submitRating } from '@/lib/services/rating-service'
import type { Match } from '@/lib/types'

const ratingGuide = [
  {
    key: 'technical',
    label: 'Técnica',
    description: 'Qualidade no toque de bola, domínio, passes, dribles e finalizações. Nota alta = jogador com grande controle técnico e precisão nos movimentos.',
    examples: '1–3: Muitos erros básicos · 4–6: Mediano, comete erros · 7–8: Boa técnica, consistente · 9–10: Excepcional, raramente erra',
  },
  {
    key: 'physical',
    label: 'Físico',
    description: 'Resistência, velocidade, força e disposição durante toda a partida. Nota alta = jogador que não cansa, corre muito e mantém o ritmo até o final.',
    examples: '1–3: Cansou rápido, pouco esforço · 4–6: Ritmo regular · 7–8: Muito disposto, forte · 9–10: Inesgotável, acima de todos fisicamente',
  },
  {
    key: 'tactical',
    label: 'Tática',
    description: 'Posicionamento em campo, leitura de jogo, inteligência nas decisões e contribuição coletiva. Nota alta = jogador que "leu" o jogo muito bem.',
    examples: '1–3: Fora de posição, decisões ruins · 4–6: Regular · 7–8: Boa leitura, posicionamento certo · 9–10: Dominou taticamente',
  },
  {
    key: 'fair_play',
    label: 'Fair Play',
    description: 'Respeito com adversários e companheiros, espírito esportivo, reação a lances difíceis e comportamento geral durante a pelada.',
    examples: '1–3: Reclamou muito, desrespeitoso · 4–6: Normal, sem destaque · 7–8: Sempre fair, bom humor · 9–10: Exemplo de esportividade',
  },
]

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Avalie o desempenho dos jogadores nesta partida (1–10).
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
              <HelpCircle className="w-3.5 h-3.5" />
              Como avaliar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Como avaliar cada critério</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {ratingGuide.map((item) => (
                <div key={item.key} className="space-y-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">{item.examples}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
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
