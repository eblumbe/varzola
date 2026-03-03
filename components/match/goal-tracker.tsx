'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addGoal, removeGoal } from '@/lib/services/match-service'
import type { Match, Goal } from '@/lib/types'

interface GoalTrackerProps {
  match: Match
  goals: Goal[]
  isAdmin: boolean
  onUpdate: () => void
}

export function GoalTracker({ match, goals, isAdmin, onUpdate }: GoalTrackerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedScorer, setSelectedScorer] = useState<string>('')
  const [minute, setMinute] = useState<string>('')

  const teams = match.teams ?? []

  const playersForTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    return team?.players ?? []
  }

  async function handleAddGoal() {
    if (!selectedTeam || !selectedScorer) return
    setLoading(true)

    const player = playersForTeam(selectedTeam).find(
      (p) => `${p.user_id ?? p.guest_player_id}` === selectedScorer
    )

    const { error } = await addGoal({
      match_id: match.id,
      match_team_id: selectedTeam,
      user_id: player?.user_id ?? undefined,
      guest_player_id: player?.guest_player_id ?? undefined,
      minute: minute ? parseInt(minute) : undefined,
    })

    if (error) toast.error('Erro ao registrar gol')
    else {
      toast.success('Gol registrado!')
      setOpen(false)
      setSelectedTeam('')
      setSelectedScorer('')
      setMinute('')
      onUpdate()
    }
    setLoading(false)
  }

  async function handleRemoveGoal(goalId: string) {
    const { error } = await removeGoal(goalId)
    if (error) toast.error('Erro ao remover gol')
    else {
      toast.success('Gol removido')
      onUpdate()
    }
  }

  const getPlayerName = (goal: Goal) => {
    const team = teams.find((t) => t.id === goal.match_team_id)
    const player = team?.players?.find(
      (p) => p.user_id === goal.user_id || p.guest_player_id === goal.guest_player_id
    )
    return player?.profile?.full_name ?? player?.guest?.name ?? 'Jogador'
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? 'Time'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Gols</h3>
        {isAdmin && match.status === 'in_progress' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Registrar gol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Gol</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select onValueChange={setSelectedTeam} value={selectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o time" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTeam && (
                  <div className="space-y-2">
                    <Label>Marcador</Label>
                    <Select onValueChange={setSelectedScorer} value={selectedScorer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o jogador" />
                      </SelectTrigger>
                      <SelectContent>
                        {playersForTeam(selectedTeam).map((p) => (
                          <SelectItem
                            key={p.id}
                            value={`${p.user_id ?? p.guest_player_id}`}
                          >
                            {p.profile?.full_name ?? p.guest?.name ?? 'Jogador'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Minuto (opcional)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Ex: 25"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAddGoal}
                  disabled={!selectedTeam || !selectedScorer || loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirmar gol
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum gol registrado.</p>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <span>⚽</span>
                <span className="font-medium">{getPlayerName(goal)}</span>
                <Badge variant="outline" className="text-xs">
                  {getTeamName(goal.match_team_id)}
                </Badge>
                {goal.minute && (
                  <span className="text-xs text-muted-foreground">{goal.minute}'</span>
                )}
              </div>
              {isAdmin && match.status === 'in_progress' && (
                <button onClick={() => handleRemoveGoal(goal.id)}>
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
