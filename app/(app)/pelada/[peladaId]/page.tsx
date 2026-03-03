import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Trophy, Calendar, MapPin, Copy } from 'lucide-react'
import { DAY_OF_WEEK_MAP, formatCurrency } from '@/lib/utils/format'

interface Props {
  params: Promise<{ peladaId: string }>
}

export default async function PeladaPage({ params }: Props) {
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
    .select('*')
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

  const { count: membersCount } = await supabase
    .from('pelada_members')
    .select('*', { count: 'exact', head: true })
    .eq('pelada_id', peladaId)
    .eq('status', 'active')

  const { count: champsCount } = await supabase
    .from('championships')
    .select('*', { count: 'exact', head: true })
    .eq('pelada_id', peladaId)
    .eq('status', 'active')

  const { count: pendingRequests } = await supabase
    .from('join_requests')
    .select('*', { count: 'exact', head: true })
    .eq('pelada_id', peladaId)
    .eq('status', 'pending')

  const isAdmin = memberInfo.role === 'owner' || memberInfo.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          {/* Info da pelada */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">{pelada.name}</h1>
                {pelada.description && (
                  <p className="text-muted-foreground text-sm mt-1">{pelada.description}</p>
                )}
              </div>
              <Badge>{memberInfo.role === 'owner' ? 'Dono' : memberInfo.role === 'admin' ? 'Admin' : 'Jogador'}</Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {pelada.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {pelada.location}
                </div>
              )}
              {pelada.day_of_week && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {DAY_OF_WEEK_MAP[pelada.day_of_week]}{pelada.time && ` às ${pelada.time}`}
                </div>
              )}
              {pelada.match_value > 0 && (
                <div>{formatCurrency(pelada.match_value)} por jogo</div>
              )}
            </div>
          </div>

          {/* Código de convite */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Código de convite</p>
                  <p className="text-xl font-mono font-bold tracking-widest">{pelada.code}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href={`/pelada/${peladaId}/players`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{membersCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Membros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/pelada/${peladaId}/championships`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{champsCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Campeonatos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {isAdmin && (pendingRequests ?? 0) > 0 && (
              <Link href={`/pelada/${peladaId}/players`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">{pendingRequests}</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Solicitações</p>
                        <p className="text-xs font-medium text-orange-600">pendentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
