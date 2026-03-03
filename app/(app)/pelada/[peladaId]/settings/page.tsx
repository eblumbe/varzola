import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ peladaId: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { peladaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: pelada } = await supabase.from('peladas').select('*').eq('id', peladaId).single()
  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members')
    .select('role')
    .eq('pelada_id', peladaId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!memberInfo || memberInfo.role === 'player') redirect(`/pelada/${peladaId}`)

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6 max-w-2xl">
          <h1 className="text-2xl font-bold">Configurações</h1>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Pelada</CardTitle>
              <CardDescription>Dados básicos da sua pelada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="text-sm font-medium">{pelada.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Código</span>
                <Badge variant="outline" className="font-mono">{pelada.code}</Badge>
              </div>
              {pelada.location && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Local</span>
                  <span className="text-sm">{pelada.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Máx. jogadores</span>
                <span className="text-sm">{pelada.max_players}</span>
              </div>
              {pelada.match_value > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor por jogo</span>
                  <span className="text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pelada.match_value)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
