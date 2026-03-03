import { createClient } from '@/lib/supabase/client'
import type { Match, MatchTeam, Goal } from '@/lib/types'

export async function createMatch(input: {
  pelada_id: string
  round_id?: string
  date: string
  location?: string
  notes?: string
}): Promise<{ data: Match | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('matches')
    .insert({ ...input, created_by: user.id, status: 'scheduled' })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('matches')
    .select(`
      *,
      teams:match_teams(
        *,
        players:match_team_players(
          *,
          profile:profiles(*),
          guest:guest_players(*)
        )
      )
    `)
    .eq('id', matchId)
    .single()

  return data as unknown as Match
}

export async function updateMatchStatus(
  matchId: string,
  status: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)

  return { error: error?.message ?? null }
}

export async function createMatchTeams(
  matchId: string,
  teams: { name: string; color: string }[]
): Promise<{ data: MatchTeam[] | null; error: string | null }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_teams')
    .insert(teams.map((t) => ({ ...t, match_id: matchId })))
    .select()

  return { data, error: error?.message ?? null }
}

export async function addPlayerToTeam(input: {
  match_team_id: string
  user_id?: string
  guest_player_id?: string
}): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('match_team_players').insert(input)

  return { error: error?.message ?? null }
}

export async function removePlayerFromTeam(playerEntryId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('match_team_players')
    .delete()
    .eq('id', playerEntryId)

  return { error: error?.message ?? null }
}

export async function addGoal(input: {
  match_id: string
  match_team_id: string
  user_id?: string
  guest_player_id?: string
  assist_user_id?: string
  assist_guest_player_id?: string
  minute?: number
  is_own_goal?: boolean
}): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('goals').insert(input)

  return { error: error?.message ?? null }
}

export async function removeGoal(goalId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('goals').delete().eq('id', goalId)

  return { error: error?.message ?? null }
}

export async function getGoals(matchId: string): Promise<Goal[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at')

  return data ?? []
}

export async function finalizeMatch(
  matchId: string,
  winnerTeamId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()

  await supabase
    .from('match_teams')
    .update({ is_winner: false })
    .eq('match_id', matchId)

  await supabase
    .from('match_teams')
    .update({ is_winner: true })
    .eq('id', winnerTeamId)

  const { error } = await supabase
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  return { error: error?.message ?? null }
}
