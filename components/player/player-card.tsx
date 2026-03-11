import { Shield, Users, Target, User, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { GuestPlayer } from '@/lib/types'
import { POSITION_MAP } from '@/lib/utils/format'

interface PlayerCardProps {
  player: GuestPlayer
}

const positionIcon = (pos?: string) => {
  if (!pos) return User
  if (pos === 'goalkeeper' || pos === 'defender') return Shield
  if (pos === 'midfielder') return Users
  return Target
}

const positionColor = (pos?: string) => {
  if (!pos) return 'bg-muted text-muted-foreground'
  if (pos === 'goalkeeper') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  if (pos === 'defender') return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
  if (pos === 'midfielder') return 'bg-primary/10 text-primary'
  return 'bg-destructive/10 text-destructive'
}

export function PlayerCard({ player }: PlayerCardProps) {
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const Icon = positionIcon(player.position)

  return (
    <Card className="bg-gradient-card border-border/50 shadow-varzola-soft hover:shadow-varzola-medium transition-varzola">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="border-2 border-primary/30 shrink-0">
            <AvatarFallback className="bg-gradient-field text-white text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{player.name}</p>
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

          <div className="flex items-center gap-2 shrink-0">
            {player.position && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${positionColor(player.position)}`}>
                <Icon className="w-3 h-3" />
                {POSITION_MAP[player.position] ?? player.position}
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              Nv.{player.technical_level}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
