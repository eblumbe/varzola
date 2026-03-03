import { createClient } from '@/lib/supabase/client'
import type { Championship, Round } from '@/lib/types'

export async function getChampionships(peladaId: string): Promise<Championship[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('championships')
    .select('*, rounds(*, matches(*))')
    .eq('pelada_id', peladaId)
    .order('created_at', { ascending: false })

  return (data as unknown as Championship[]) ?? []
}

export async function getChampionshipById(champId: string): Promise<Championship | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('championships')
    .select('*, rounds(*, matches(*))')
    .eq('id', champId)
    .single()

  return data as unknown as Championship
}

export async function createChampionship(input: {
  pelada_id: string
  name: string
  start_date: string
  end_date?: string
  frequency: string
  scoring_rules?: { win: number; draw: number; goal: number }
  total_rounds?: number
}): Promise<{ data: Championship | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  const { total_rounds, ...championshipData } = input

  const { data, error } = await supabase
    .from('championships')
    .insert({
      ...championshipData,
      scoring_rules: input.scoring_rules ?? { win: 2, draw: 1, goal: 1 },
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Criar rodadas automaticamente
  if (total_rounds && total_rounds > 0) {
    const rounds = Array.from({ length: total_rounds }, (_, i) => ({
      championship_id: data.id,
      round_number: i + 1,
      status: 'pending',
    }))
    await supabase.from('rounds').insert(rounds)
  }

  return { data: data as Championship, error: null }
}

export async function updateChampionship(
  champId: string,
  input: Partial<Championship>
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('championships')
    .update(input)
    .eq('id', champId)

  return { error: error?.message ?? null }
}

export async function getRounds(championshipId: string): Promise<Round[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('rounds')
    .select('*, matches(*)')
    .eq('championship_id', championshipId)
    .order('round_number')

  return (data as unknown as Round[]) ?? []
}

export async function updateRoundStatus(
  roundId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('rounds')
    .update({ status })
    .eq('id', roundId)

  return { error: error?.message ?? null }
}
