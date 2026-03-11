import { Trophy, Medal } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { RankingEntry } from '@/lib/types'

interface RankingTableProps {
  entries: RankingEntry[]
}

export function RankingTable({ entries }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhum dado de ranking ainda. Conclua partidas para ver o ranking.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const initials = entry.player_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        const isLeader = index === 0
        const isTop3 = index < 3

        return (
          <div
            key={`${entry.user_id ?? entry.guest_player_id}`}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-varzola hover:shadow-varzola-soft ${
              isLeader
                ? 'bg-linear-to-r from-amber-50 to-amber-50/30 border-amber-200 dark:from-amber-500/10 dark:to-transparent dark:border-amber-500/20'
                : 'bg-gradient-card border-border/50 hover:bg-muted/50'
            }`}
          >
            {/* Position */}
            <div className="flex items-center justify-center w-8 h-8 shrink-0">
              {index === 0 ? (
                <Trophy className="w-6 h-6 text-amber-500" />
              ) : isTop3 ? (
                <Medal className="w-6 h-6 text-muted-foreground" />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="border-2 border-primary/30 shrink-0">
              <AvatarFallback className="bg-gradient-field text-white text-xs">{initials}</AvatarFallback>
            </Avatar>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold truncate">{entry.player_name}</p>
                {isLeader && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 text-xs shrink-0">
                    Líder
                  </Badge>
                )}
                {!entry.user_id && (
                  <Badge variant="outline" className="text-xs shrink-0">Convidado</Badge>
                )}
              </div>
              {entry.player_nickname && (
                <span className="text-xs text-muted-foreground">@{entry.player_nickname}</span>
              )}
            </div>

            {/* Stats */}
            <div className="hidden sm:grid grid-cols-4 gap-4 text-center shrink-0">
              <div>
                <div className="text-lg font-bold text-primary">{entry.total_points}</div>
                <div className="text-xs text-muted-foreground">Pontos</div>
              </div>
              <div>
                <div className="text-lg font-bold">{entry.total_goals}</div>
                <div className="text-xs text-muted-foreground">Gols</div>
              </div>
              <div>
                <div className="text-lg font-bold">{entry.wins}</div>
                <div className="text-xs text-muted-foreground">Vitórias</div>
              </div>
              <div>
                <div className="text-lg font-bold">{entry.matches_played}</div>
                <div className="text-xs text-muted-foreground">Jogos</div>
              </div>
            </div>

            {/* Mobile: just points */}
            <div className="sm:hidden text-right shrink-0">
              <div className="text-2xl font-bold text-primary">{entry.total_points}</div>
              <div className="text-xs text-muted-foreground">pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
