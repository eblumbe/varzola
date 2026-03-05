import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { RankingEntry } from '@/lib/types'

interface TopScorersProps {
  entries: RankingEntry[]
}

const positionStyle = (i: number) => {
  if (i === 0) return 'bg-amber-500 text-white'
  if (i === 1) return 'bg-gray-400 text-white'
  if (i === 2) return 'bg-amber-700 text-white'
  return 'bg-[#751a1a] text-white'
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

        return (
          <div
            key={`${entry.user_id ?? entry.guest_player_id}`}
            className="flex items-center justify-between bg-[#f5e7c7] p-3 rounded-lg border border-[#e6d5b0]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${positionStyle(index)}`}>
                {index + 1}
              </div>
              <Avatar className="border-2 border-[#751a1a]">
                <AvatarFallback className="bg-[#751a1a] text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold leading-tight">{entry.player_name}</p>
                <div className="flex items-center gap-1">
                  {entry.player_nickname && (
                    <span className="text-xs text-muted-foreground">@{entry.player_nickname}</span>
                  )}
                  {!entry.user_id && (
                    <Badge variant="outline" className="text-xs">Convidado</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{entry.matches_played} partidas</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-[#751a1a]">{entry.total_goals}</div>
              <div className="text-xs text-muted-foreground">gols</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
