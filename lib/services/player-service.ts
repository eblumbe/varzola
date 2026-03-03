import { createClient } from '@/lib/supabase/client'
import type { GuestPlayer, PlayerPosition } from '@/lib/types'

export async function getGuestPlayers(peladaId: string): Promise<GuestPlayer[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('guest_players')
    .select('*')
    .eq('pelada_id', peladaId)
    .eq('status', 'active')
    .order('name')

  return data ?? []
}

export async function createGuestPlayer(input: {
  pelada_id: string
  name: string
  nickname?: string
  phone?: string
  position?: PlayerPosition
  technical_level?: number
}): Promise<{ data: GuestPlayer | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('guest_players')
    .insert({ ...input, created_by: user.id })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function updateGuestPlayer(
  playerId: string,
  input: Partial<GuestPlayer>
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('guest_players')
    .update(input)
    .eq('id', playerId)

  return { error: error?.message ?? null }
}

export async function removeGuestPlayer(playerId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('guest_players')
    .update({ status: 'inactive' })
    .eq('id', playerId)

  return { error: error?.message ?? null }
}
