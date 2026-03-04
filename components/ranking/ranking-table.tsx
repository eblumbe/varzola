import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { RankingEntry } from '@/lib/types'

interface RankingTableProps {
  entries: RankingEntry[]
}

const positionStyle = (index: number) => {
  if (index === 0) return 'bg-amber-500 text-white'
  if (index === 1) return 'bg-gray-400 text-white'
  if (index === 2) return 'bg-amber-700 text-white'
  return 'bg-[#2c5234] text-white'
}

const positionLabel = (index: number) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return String(index + 1)
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

        return (
          <div
            key={`${entry.user_id ?? entry.guest_player_id}`}
            className="flex items-center justify-between bg-[#f5e7c7] p-3 rounded-lg border border-[#e6d5b0]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${positionStyle(index)}`}
              >
                {positionLabel(index)}
              </div>
              <Avatar className="border-2 border-[#2c5234]">
                <AvatarFallback className="bg-[#2c5234] text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold leading-tight">{entry.player_name}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {entry.player_nickname && (
                    <span className="text-xs text-muted-foreground">@{entry.player_nickname}</span>
                  )}
                  {!entry.user_id && (
                    <Badge variant="outline" className="text-xs">Convidado</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {entry.matches_played}J · {entry.wins}V · {entry.total_goals}G
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-[#2c5234]">{entry.total_points}</div>
              <div className="text-xs text-muted-foreground">pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
