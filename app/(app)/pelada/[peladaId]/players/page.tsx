import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { MemberList } from '@/components/pelada/member-list'
import { PlayerCard } from '@/components/player/player-card'
import { PlayerForm } from '@/components/player/player-form'
import type { PeladaMember, GuestPlayer } from '@/lib/types'

interface Props {
  params: Promise<{ peladaId: string }>
}

export default async function PlayersPage({ params }: Props) {
  const { peladaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: pelada } = await supabase
    .from('peladas')
    .select('name')
    .eq('id', peladaId)
    .single()

  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members')
    .select('role')
    .eq('pelada_id', peladaId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!memberInfo) redirect('/dashboard')

  const { data: members } = await supabase
    .from('pelada_members')
    .select('*, profile:profiles(*)')
    .eq('pelada_id', peladaId)
    .eq('status', 'active')
    .order('joined_at')

  const { data: guests } = await supabase
    .from('guest_players')
    .select('*')
    .eq('pelada_id', peladaId)
    .eq('status', 'active')
    .order('name')

  const { data: pendingRequests } = await supabase
    .from('join_requests')
    .select('*, profile:profiles(*)')
    .eq('pelada_id', peladaId)
    .eq('status', 'pending')

  const isAdmin = memberInfo.role === 'owner' || memberInfo.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Jogadores</h1>
            {isAdmin && (
              <PlayerForm peladaId={peladaId} onSuccess={() => {}}>
                <Button size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Convidado
                </Button>
              </PlayerForm>
            )}
          </div>

          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">
                Membros ({members?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="guests">
                Convidados ({guests?.length ?? 0})
              </TabsTrigger>
              {isAdmin && (pendingRequests?.length ?? 0) > 0 && (
                <TabsTrigger value="requests">
                  Solicitações ({pendingRequests?.length ?? 0})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <MemberList
                members={(members as unknown as PeladaMember[]) ?? []}
                canManage={isAdmin}
                onUpdate={() => {}}
              />
            </TabsContent>

            <TabsContent value="guests" className="mt-4">
              {(guests?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum jogador convidado ainda.</p>
                  {isAdmin && (
                    <p className="text-sm mt-2">
                      Adicione jogadores que não têm conta no sistema.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {guests?.map((guest) => (
                    <PlayerCard key={guest.id} player={guest as GuestPlayer} />
                  ))}
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="requests" className="mt-4">
                <div className="space-y-2">
                  {pendingRequests?.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {(req as { profile?: { full_name?: string } }).profile?.full_name ?? 'Jogador'}
                        </p>
                        <p className="text-xs text-muted-foreground">Solicitação de entrada</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Rejeitar</Button>
                        <Button size="sm">Aprovar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
