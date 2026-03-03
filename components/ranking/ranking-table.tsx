import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import type { RankingEntry } from '@/lib/types'

interface RankingTableProps {
  entries: RankingEntry[]
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
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-center">Partidas</TableHead>
            <TableHead className="text-center">Vitórias</TableHead>
            <TableHead className="text-center">Gols</TableHead>
            <TableHead className="text-center">Assists</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={`${entry.user_id ?? entry.guest_player_id}`}>
              <TableCell>
                <div className="flex items-center justify-center">
                  {index === 0 ? (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  ) : index === 1 ? (
                    <Trophy className="w-4 h-4 text-gray-400" />
                  ) : index === 2 ? (
                    <Trophy className="w-4 h-4 text-amber-600" />
                  ) : (
                    <span className="text-muted-foreground text-sm">{index + 1}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{entry.player_name}</p>
                  {entry.player_nickname && (
                    <p className="text-xs text-muted-foreground">@{entry.player_nickname}</p>
                  )}
                  {!entry.user_id && (
                    <Badge variant="outline" className="text-xs mt-0.5">Convidado</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center text-sm">{entry.matches_played}</TableCell>
              <TableCell className="text-center text-sm">{entry.wins}</TableCell>
              <TableCell className="text-center text-sm">{entry.total_goals}</TableCell>
              <TableCell className="text-center text-sm">{entry.total_assists}</TableCell>
              <TableCell className="text-center">
                <span className="font-bold text-sm">{entry.total_points}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
