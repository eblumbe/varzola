import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChampionshipForm } from '@/components/championship/championship-form'

interface Props { params: Promise<{ peladaId: string }> }

export default async function NewChampionshipPage({ params }: Props) {
  const { peladaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()

  if (!memberInfo || memberInfo.role === 'player') redirect(`/pelada/${peladaId}/championships`)

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Novo Campeonato</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Campeonato</CardTitle>
          <CardDescription>Configure as regras e período do campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChampionshipForm peladaId={peladaId} />
        </CardContent>
      </Card>
    </div>
  )
}
