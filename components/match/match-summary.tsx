import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Match } from '@/lib/types'
import { formatDateShort } from '@/lib/utils/format'

interface MatchSummaryProps {
  match: Match
}

export function MatchSummary({ match }: MatchSummaryProps) {
  const teams = match.teams ?? []
  const winner = teams.find((t) => t.is_winner)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          {formatDateShort(match.date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teams.map((team) => (
          <div key={team.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-medium text-sm">{team.name}</span>
                {team.is_winner && <Trophy className="w-3 h-3 text-yellow-500" />}
              </div>
              <span className="text-2xl font-bold">{team.score}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {team.players?.map((p) => (
                <Badge key={p.id} variant="secondary" className="text-xs">
                  {p.profile?.full_name ?? p.guest?.name ?? 'Jogador'}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {teams.length > 1 && <Separator />}

        {winner ? (
          <p className="text-sm text-center text-muted-foreground">
            Vencedor: <span className="font-semibold text-foreground">{winner.name}</span>
          </p>
        ) : match.status === 'completed' ? (
          <p className="text-sm text-center text-muted-foreground">Empate</p>
        ) : null}

        {match.notes && (
          <p className="text-xs text-muted-foreground border-t pt-2">{match.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
