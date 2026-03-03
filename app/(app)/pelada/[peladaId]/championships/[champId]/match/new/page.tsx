import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchForm } from '@/components/match/match-form'

interface Props {
  params: Promise<{ peladaId: string; champId: string }>
  searchParams: Promise<{ round?: string }>
}

export default async function NewMatchPage({ params, searchParams }: Props) {
  const { peladaId, champId } = await params
  const { round: roundId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
  if (!memberInfo || memberInfo.role === 'player') redirect(`/pelada/${peladaId}/championships/${champId}`)

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Partida</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Partida</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchForm peladaId={peladaId} champId={champId} roundId={roundId} />
        </CardContent>
      </Card>
    </div>
  )
}
