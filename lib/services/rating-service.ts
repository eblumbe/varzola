import { createClient } from '@/lib/supabase/client'
import type { PlayerRating } from '@/lib/types'

export async function submitRating(input: {
  match_id: string
  rated_user_id?: string
  rated_guest_id?: string
  technical: number
  physical: number
  tactical: number
  fair_play: number
}): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('player_ratings').upsert({
    ...input,
    rater_id: user.id,
  })

  return { error: error?.message ?? null }
}

export async function getMatchRatings(matchId: string): Promise<PlayerRating[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('player_ratings')
    .select('*')
    .eq('match_id', matchId)

  return data ?? []
}

export async function getPlayerAverageRatings(
  userId: string,
  peladaId: string
): Promise<{
  technical: number
  physical: number
  tactical: number
  fair_play: number
  total: number
} | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('player_ratings')
    .select(`
      technical, physical, tactical, fair_play,
      matches!inner(pelada_id)
    `)
    .eq('rated_user_id', userId)
    .eq('matches.pelada_id', peladaId)

  if (!data || data.length === 0) return null

  const avg = (key: keyof typeof data[0]) =>
    data.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) / data.length

  return {
    technical: avg('technical'),
    physical: avg('physical'),
    tactical: avg('tactical'),
    fair_play: avg('fair_play'),
    total: (avg('technical') + avg('physical') + avg('tactical') + avg('fair_play')) / 4,
  }
}
