import { createClient } from '@/lib/supabase/client'
import type { RankingEntry } from '@/lib/types'

export async function getChampionshipRankings(
  championshipId: string
): Promise<RankingEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('championship_rankings')
    .select('*')
    .eq('championship_id', championshipId)
    .order('total_points', { ascending: false })

  return (data as unknown as RankingEntry[]) ?? []
}

export async function getPeladaRankings(peladaId: string): Promise<RankingEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('pelada_rankings')
    .select('*')
    .eq('pelada_id', peladaId)
    .order('total_points', { ascending: false })

  return (data as unknown as RankingEntry[]) ?? []
}
