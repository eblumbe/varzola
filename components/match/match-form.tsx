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
import { Textarea } from '@/components/ui/textarea'
import { createMatch } from '@/lib/services/match-service'

const schema = z.object({
  date: z.string().min(1, { message: 'Data obrigatória' }),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface MatchFormProps {
  peladaId: string
  champId: string
  roundId?: string
}

export function MatchForm({ peladaId, champId, roundId }: MatchFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: match, error } = await createMatch({
      pelada_id: peladaId,
      round_id: roundId,
      date: data.date,
      location: data.location,
      notes: data.notes,
    })

    if (error || !match) {
      toast.error(error ?? 'Erro ao criar partida')
      setLoading(false)
      return
    }

    toast.success('Partida criada!')
    router.push(`/pelada/${peladaId}/championships/${champId}/match/${match.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Data da partida *</Label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Local</Label>
        <Input placeholder="Ex: Campo do Zé" {...register('location')} />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea placeholder="Informações adicionais..." {...register('notes')} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Criar partida
      </Button>
    </form>
  )
}
