import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Target, Zap, Users } from 'lucide-react'
import type { RankingEntry } from '@/lib/types'

interface PlayerStatsProps {
  entry: RankingEntry
}

export function PlayerStats({ entry }: PlayerStatsProps) {
  const winRate = entry.matches_played > 0
    ? Math.round((entry.wins / entry.matches_played) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{entry.player_name}</CardTitle>
        {entry.player_nickname && (
          <p className="text-sm text-muted-foreground">@{entry.player_nickname}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pontos</p>
              <p className="font-bold">{entry.total_points}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Partidas</p>
              <p className="font-bold">{entry.matches_played}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Gols</p>
              <p className="font-bold">{entry.total_goals}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Assistências</p>
              <p className="font-bold">{entry.total_assists}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de vitória</span>
            <span className="font-medium">{winRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
