import { createClient } from '@/lib/supabase/client'
import type { Pelada, PeladaMember, JoinRequest } from '@/lib/types'

export async function getMyPeladas(): Promise<Pelada[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('pelada_members')
    .select('pelada_id, peladas(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  return (data?.map((d) => d.peladas).filter(Boolean) as unknown as Pelada[]) ?? []
}

export async function getPeladaById(peladaId: string): Promise<Pelada | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('peladas')
    .select('*')
    .eq('id', peladaId)
    .single()

  return data
}

export async function createPelada(input: {
  name: string
  description?: string
  location?: string
  day_of_week?: string
  time?: string
  match_value?: number
  max_players?: number
}): Promise<{ data: Pelada | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('peladas')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Inserir owner como membro
  await supabase.from('pelada_members').insert({
    pelada_id: data.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  })

  return { data, error: null }
}

export async function updatePelada(
  peladaId: string,
  input: Partial<Pelada>
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('peladas')
    .update(input)
    .eq('id', peladaId)

  return { error: error?.message ?? null }
}

export async function getPeladaMembers(peladaId: string): Promise<PeladaMember[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('pelada_members')
    .select('*, profile:profiles(*)')
    .eq('pelada_id', peladaId)
    .eq('status', 'active')
    .order('joined_at')

  return (data as unknown as PeladaMember[]) ?? []
}

export async function updateMemberRole(
  memberId: string,
  role: 'admin' | 'player'
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('pelada_members')
    .update({ role })
    .eq('id', memberId)

  return { error: error?.message ?? null }
}

export async function removeMember(memberId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('pelada_members')
    .update({ status: 'inactive' })
    .eq('id', memberId)

  return { error: error?.message ?? null }
}

export async function getPeladaByCode(code: string): Promise<Pelada | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('peladas')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  return data
}

export async function requestToJoin(
  peladaId: string,
  requestType: 'new' | 'match_guest' = 'new',
  matchedGuestId?: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('join_requests').insert({
    pelada_id: peladaId,
    user_id: user.id,
    request_type: requestType,
    matched_guest_id: matchedGuestId ?? null,
  })

  return { error: error?.message ?? null }
}

export async function getPendingJoinRequests(peladaId: string): Promise<JoinRequest[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('join_requests')
    .select('*, profile:profiles(*)')
    .eq('pelada_id', peladaId)
    .eq('status', 'pending')
    .order('created_at')

  return (data as unknown as JoinRequest[]) ?? []
}

export async function reviewJoinRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  peladaId: string,
  userId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('join_requests')
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  if (!error && status === 'approved') {
    await supabase.from('pelada_members').insert({
      pelada_id: peladaId,
      user_id: userId,
      role: 'player',
      status: 'active',
    })
  }

  return { error: error?.message ?? null }
}

export async function getMyRole(peladaId: string): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('pelada_members')
    .select('role')
    .eq('pelada_id', peladaId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return data?.role ?? null
}
