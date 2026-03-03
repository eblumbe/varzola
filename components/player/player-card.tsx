import { User, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GuestPlayer } from '@/lib/types'
import { POSITION_MAP } from '@/lib/utils/format'

interface PlayerCardProps {
  player: GuestPlayer
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{player.name}</p>
              {player.nickname && (
                <p className="text-xs text-muted-foreground">@{player.nickname}</p>
              )}
              {player.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Phone className="w-3 h-3" />
                  {player.phone}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {player.position && (
              <Badge variant="outline">{POSITION_MAP[player.position] ?? player.position}</Badge>
            )}
            <Badge variant="secondary">
              Nível {player.technical_level}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
