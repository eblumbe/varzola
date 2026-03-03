import { Badge } from '@/components/ui/badge'
import type { Match } from '@/lib/types'

const statusMap = {
  scheduled: { label: 'Agendada', variant: 'secondary' },
  in_progress: { label: 'Em andamento', variant: 'default' },
  completed: { label: 'Encerrada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
} as const

interface MatchScoreboardProps {
  match: Match
}

export function MatchScoreboard({ match }: MatchScoreboardProps) {
  const teams = match.teams ?? []
  const [teamA, teamB] = teams

  const statusInfo = statusMap[match.status]

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Badge variant={statusInfo.variant as 'secondary' | 'default' | 'outline' | 'destructive'}>
          {statusInfo.label}
        </Badge>
      </div>

      {teams.length >= 2 ? (
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            <div
              className="w-10 h-10 rounded-full border-4"
              style={{ borderColor: teamA?.color ?? '#333' }}
            />
            <p className="font-semibold">{teamA?.name ?? 'Time A'}</p>
            <p className="text-4xl font-bold">{teamA?.score ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              {teamA?.players?.length ?? 0} jogadores
            </p>
          </div>

          <div className="text-2xl font-bold text-muted-foreground">×</div>

          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            <div
              className="w-10 h-10 rounded-full border-4"
              style={{ borderColor: teamB?.color ?? '#666' }}
            />
            <p className="font-semibold">{teamB?.name ?? 'Time B'}</p>
            <p className="text-4xl font-bold">{teamB?.score ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              {teamB?.players?.length ?? 0} jogadores
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm">Times ainda não definidos</p>
      )}
    </div>
  )
}
