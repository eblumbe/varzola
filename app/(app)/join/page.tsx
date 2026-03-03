'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getPeladaByCode, requestToJoin } from '@/lib/services/pelada-service'
import type { Pelada } from '@/lib/types'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [pelada, setPelada] = useState<Pelada | null>(null)
  const [searching, setSearching] = useState(false)
  const [joining, setJoining] = useState(false)
  const router = useRouter()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setSearching(true)
    const found = await getPeladaByCode(code.trim())
    if (!found) {
      toast.error('Pelada não encontrada com este código')
      setPelada(null)
    } else {
      setPelada(found)
    }
    setSearching(false)
  }

  async function handleJoin() {
    if (!pelada) return
    setJoining(true)
    const { error } = await requestToJoin(pelada.id)
    if (error) {
      toast.error(error.includes('duplicate') ? 'Você já solicitou entrada nessa pelada' : error)
      setJoining(false)
      return
    }
    toast.success('Solicitação enviada! Aguarde a aprovação do administrador.')
    router.push('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entrar em Pelada</h1>
        <p className="text-muted-foreground text-sm">
          Insira o código da pelada para solicitar entrada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar por código</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label>Código da pelada</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VARZ-XXXX"
                className="font-mono uppercase"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={searching}>
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {pelada && (
        <Card>
          <CardHeader>
            <CardTitle>{pelada.name}</CardTitle>
            <CardDescription>Pelada encontrada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código</span>
                <span className="font-mono">{pelada.code}</span>
              </div>
              {pelada.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Local</span>
                  <span>{pelada.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máx. jogadores</span>
                <span>{pelada.max_players}</span>
              </div>
            </div>
            <Button onClick={handleJoin} className="w-full" disabled={joining}>
              {joining && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Solicitar entrada
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
