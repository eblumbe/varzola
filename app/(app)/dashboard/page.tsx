import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PeladaCard } from '@/components/pelada/pelada-card'
import type { Pelada, PeladaMember } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberData } = await supabase
    .from('pelada_members')
    .select('role, peladas(*)')
    .eq('user_id', user!.id)
    .eq('status', 'active')

  const peladas = memberData?.map((m) => ({
    pelada: m.peladas as unknown as Pelada,
    role: m.role,
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Peladas</h1>
          <p className="text-muted-foreground text-sm">
            {peladas.length === 0
              ? 'Você ainda não participa de nenhuma pelada'
              : `${peladas.length} pelada${peladas.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/pelada/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova pelada
          </Link>
        </Button>
      </div>

      {peladas.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <div className="flex justify-center mb-4">
            <Image src="/images/icone.png" alt="Varzola" width={64} height={64} className="object-contain" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Nenhuma pelada ainda</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Crie sua primeira pelada ou entre em uma com um código.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/pelada/new">Criar pelada</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/join">Entrar com código</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peladas.map(({ pelada, role }) => (
            <PeladaCard key={pelada.id} pelada={pelada} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}
