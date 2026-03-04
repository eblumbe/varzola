import Image from 'next/image'
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
    <div className="space-y-3">
      <div className="flex justify-center">
        <Badge variant={statusInfo.variant as 'secondary' | 'default' | 'outline' | 'destructive'}>
          {statusInfo.label}
        </Badge>
      </div>

      {teams.length >= 2 ? (
        <div className="bg-[#f5e7c7] rounded-xl border border-[#e6d5b0] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-1 flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full border-4 mb-1"
                style={{ borderColor: teamA?.color ?? '#2c5234' }}
              />
              <p className="font-bold text-sm leading-tight">{teamA?.name ?? 'Time A'}</p>
              <p className="text-5xl font-bold" style={{ color: teamA?.color ?? '#2c5234' }}>
                {teamA?.score ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">{teamA?.players?.length ?? 0} jog.</p>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <Image
                src="/images/logo-principal.png"
                alt="Varzola"
                width={44}
                height={44}
                className="object-contain"
              />
              <span className="text-muted-foreground text-sm font-semibold">×</span>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full border-4 mb-1"
                style={{ borderColor: teamB?.color ?? '#751a1a' }}
              />
              <p className="font-bold text-sm leading-tight">{teamB?.name ?? 'Time B'}</p>
              <p className="text-5xl font-bold" style={{ color: teamB?.color ?? '#751a1a' }}>
                {teamB?.score ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">{teamB?.players?.length ?? 0} jog.</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-4">Times ainda não definidos</p>
      )}
    </div>
  )
}
