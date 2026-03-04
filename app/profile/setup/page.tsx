'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  full_name: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres' }),
  nickname: z.string().optional(),
  favorite_team: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        nickname: data.nickname || null,
        favorite_team: data.favorite_team || null,
        is_first_login: false,
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Erro ao salvar perfil')
      setLoading(false)
      return
    }

    toast.success('Perfil configurado com sucesso!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-principal.png"
            alt="Varzola"
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
          <h1 className="text-2xl font-bold">Bem-vindo ao Varzola!</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configure seu perfil</CardTitle>
            <CardDescription>
              Preencha suas informações para começar a usar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Apelido (opcional)</Label>
                <Input
                  id="nickname"
                  placeholder="Ex: Pelé, Neymar..."
                  {...register('nickname')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favorite_team">Time do coração (opcional)</Label>
                <Input
                  id="favorite_team"
                  placeholder="Ex: Flamengo, Corinthians..."
                  {...register('favorite_team')}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Salvar e começar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
