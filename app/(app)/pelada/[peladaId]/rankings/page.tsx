import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RankingTable } from '@/components/ranking/ranking-table'
import type { RankingEntry } from '@/lib/types'

interface Props {
  params: Promise<{ peladaId: string }>
  searchParams: Promise<{ champ?: string }>
}

export default async function RankingsPage({ params, searchParams }: Props) {
  const { peladaId } = await params
  const { champ: champId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: pelada } = await supabase.from('peladas').select('name').eq('id', peladaId).single()
  if (!pelada) notFound()

  const { data: memberInfo } = await supabase
    .from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', user.id).eq('status', 'active').single()
  if (!memberInfo) redirect('/dashboard')

  const [peladaRankings, champRankings] = await Promise.all([
    supabase.from('pelada_rankings').select('*').eq('pelada_id', peladaId).order('total_points', { ascending: false }),
    champId
      ? supabase.from('championship_rankings').select('*').eq('championship_id', champId).order('total_points', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const { data: championships } = await supabase
    .from('championships')
    .select('id, name')
    .eq('pelada_id', peladaId)
    .eq('status', 'active')

  return (
    <div className="flex min-h-screen">
      <Sidebar peladaId={peladaId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} title={pelada.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <h1 className="text-2xl font-bold">Rankings</h1>

          <Tabs defaultValue={champId ? 'championship' : 'general'}>
            <TabsList>
              <TabsTrigger value="general">Geral</TabsTrigger>
              {champId && <TabsTrigger value="championship">Campeonato</TabsTrigger>}
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <RankingTable entries={(peladaRankings.data as unknown as RankingEntry[]) ?? []} />
            </TabsContent>

            {champId && (
              <TabsContent value="championship" className="mt-4">
                <RankingTable entries={(champRankings.data as unknown as RankingEntry[]) ?? []} />
              </TabsContent>
            )}
          </Tabs>
        </main>
        <MobileNav peladaId={peladaId} />
      </div>
    </div>
  )
}
