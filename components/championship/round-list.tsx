import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ChevronRight } from 'lucide-react'
import type { Round } from '@/lib/types'
import { formatDateShort } from '@/lib/utils/format'

interface RoundListProps {
  rounds: Round[]
  peladaId: string
  champId: string
}

const statusLabel = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' }
const statusVariant = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'outline',
} as const

export function RoundList({ rounds, peladaId, champId }: RoundListProps) {
  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma rodada criada ainda.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rounds.map((round) => {
        const matches = round.matches ?? []
        return (
          <Card key={round.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">{round.round_number}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rodada {round.round_number}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {round.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateShort(round.date)}
                        </div>
                      )}
                      <span>{matches.length} partida{matches.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[round.status]}>
                    {statusLabel[round.status]}
                  </Badge>
                  <Link
                    href={`/pelada/${peladaId}/championships/${champId}/match/new?round=${round.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
