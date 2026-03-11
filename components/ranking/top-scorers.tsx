import { Target } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { RankingEntry } from '@/lib/types'

interface TopScorersProps {
  entries: RankingEntry[]
}

export function TopScorers({ entries }: TopScorersProps) {
  const sorted = [...entries]
    .sort((a, b) => b.total_goals - a.total_goals)
    .filter((e) => e.total_goals > 0)

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhum gol registrado ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((entry, index) => {
        const initials = entry.player_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        const isTop3 = index < 3

        return (
          <div
            key={`${entry.user_id ?? entry.guest_player_id}`}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-varzola hover:shadow-varzola-soft ${
              index === 0
                ? 'bg-linear-to-r from-amber-50 to-amber-50/30 border-amber-200 dark:from-amber-500/10 dark:to-transparent dark:border-amber-500/20'
                : 'bg-gradient-card border-border/50'
            }`}
          >
            {/* Position */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              index === 0 ? 'bg-amber-500 text-white'
              : index === 1 ? 'bg-gray-400 text-white'
              : index === 2 ? 'bg-amber-700 text-white'
              : 'bg-primary/80 text-white'
            }`}>
              {index + 1}
            </div>

            {/* Avatar */}
            <Avatar className="border-2 border-destructive/30 shrink-0">
              <AvatarFallback className="bg-destructive/80 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold truncate">{entry.player_name}</p>
                {index === 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 text-xs shrink-0">
                    Artilheiro
                  </Badge>
                )}
                {!entry.user_id && (
                  <Badge variant="outline" className="text-xs shrink-0">Convidado</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{entry.matches_played} partidas</span>
            </div>

            {/* Goals */}
            <div className="flex items-center gap-2 shrink-0">
              <Target className={`w-4 h-4 ${isTop3 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <div className="text-right">
                <div className={`text-2xl font-bold ${isTop3 ? 'text-destructive' : 'text-foreground'}`}>
                  {entry.total_goals}
                </div>
                <div className="text-xs text-muted-foreground">gols</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
