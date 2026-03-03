import Link from 'next/link'
import { MapPin, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Pelada } from '@/lib/types'
import { DAY_OF_WEEK_MAP } from '@/lib/utils/format'

interface PeladaCardProps {
  pelada: Pelada
  role?: string
}

export function PeladaCard({ pelada, role }: PeladaCardProps) {
  return (
    <Link href={`/pelada/${pelada.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{pelada.name}</CardTitle>
            {role && (
              <Badge variant={role === 'owner' ? 'default' : 'secondary'} className="shrink-0">
                {role === 'owner' ? 'Dono' : role === 'admin' ? 'Admin' : 'Jogador'}
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">{pelada.code}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {pelada.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{pelada.location}</span>
            </div>
          )}
          {pelada.day_of_week && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>
                {DAY_OF_WEEK_MAP[pelada.day_of_week] ?? pelada.day_of_week}
                {pelada.time && ` às ${pelada.time}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-3 h-3 shrink-0" />
            <span>Máx. {pelada.max_players} jogadores</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
