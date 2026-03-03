import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar } from 'lucide-react'
import type { Championship } from '@/lib/types'
import { formatDateShort, FREQUENCY_MAP } from '@/lib/utils/format'

interface ChampionshipCardProps {
  championship: Championship
  peladaId: string
}

const statusLabel = { active: 'Ativo', completed: 'Encerrado', cancelled: 'Cancelado' }
const statusVariant = {
  active: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
} as const

export function ChampionshipCard({ championship, peladaId }: ChampionshipCardProps) {
  const rounds = championship.rounds ?? []
  const completedRounds = rounds.filter((r) => r.status === 'completed').length

  return (
    <Link href={`/pelada/${peladaId}/championships/${championship.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {championship.name}
            </CardTitle>
            <Badge variant={statusVariant[championship.status]}>
              {statusLabel[championship.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDateShort(championship.start_date)}
              {championship.end_date && ` — ${formatDateShort(championship.end_date)}`}
            </span>
          </div>
          <div>{FREQUENCY_MAP[championship.frequency] ?? championship.frequency}</div>
          {rounds.length > 0 && (
            <div>
              {completedRounds}/{rounds.length} rodadas concluídas
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
