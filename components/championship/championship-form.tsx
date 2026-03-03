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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createChampionship } from '@/lib/services/championship-service'

const schema = z.object({
  name: z.string().min(2, { message: 'Nome obrigatório' }),
  start_date: z.string().min(1, { message: 'Data de início obrigatória' }),
  end_date: z.string().optional(),
  total_rounds: z.number().min(1).max(50),
})

type FormData = z.infer<typeof schema>

interface ChampionshipFormProps {
  peladaId: string
}

export function ChampionshipForm({ peladaId }: ChampionshipFormProps) {
  const [loading, setLoading] = useState(false)
  const [frequency, setFrequency] = useState<string>('weekly')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { total_rounds: 10 },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: champ, error } = await createChampionship({
      pelada_id: peladaId,
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date || undefined,
      frequency,
      total_rounds: data.total_rounds,
    })

    if (error || !champ) {
      toast.error(error ?? 'Erro ao criar campeonato')
      setLoading(false)
      return
    }

    toast.success('Campeonato criado!')
    router.push(`/pelada/${peladaId}/championships/${champ.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do campeonato *</Label>
        <Input placeholder="Ex: Campeonato de Verão 2025" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de início *</Label>
          <Input type="date" {...register('start_date')} />
          {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de fim</Label>
          <Input type="date" {...register('end_date')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequência</Label>
          <Select onValueChange={setFrequency} value={frequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quinzenal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Número de rodadas</Label>
          <Input type="number" min={1} max={50} {...register('total_rounds', { valueAsNumber: true })} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Criar campeonato
      </Button>
    </form>
  )
}
