'use client'

import { useState, useEffect } from 'react'
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
  total_rounds: z.number().min(1).max(100),
})

type FormData = z.infer<typeof schema>

interface ChampionshipFormProps {
  peladaId: string
}

function calcRounds(start: string, end: string, freq: string): number {
  const s = new Date(start)
  const e = new Date(end)
  if (e <= s) return 1
  const days = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
  if (freq === 'weekly') return Math.max(1, Math.round(days / 7) + 1)
  if (freq === 'biweekly') return Math.max(1, Math.round(days / 14) + 1)
  return Math.max(1, Math.round(days / 30) + 1)
}

export function ChampionshipForm({ peladaId }: ChampionshipFormProps) {
  const [loading, setLoading] = useState(false)
  const [frequency, setFrequency] = useState<string>('weekly')
  const router = useRouter()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { total_rounds: 10 },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const hasEndDate = !!endDate && endDate.length > 0

  useEffect(() => {
    if (startDate && endDate && endDate > startDate) {
      setValue('total_rounds', calcRounds(startDate, endDate, frequency))
    }
  }, [startDate, endDate, frequency, setValue])

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
          <Label>Data de fim <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input type="date" {...register('end_date')} />
        </div>
      </div>

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

      {hasEndDate ? (
        <div className="rounded-md bg-muted px-4 py-3 text-sm">
          Rodadas calculadas automaticamente: <strong>{watch('total_rounds')}</strong>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Número de rodadas</Label>
          <Input type="number" min={1} max={100} {...register('total_rounds', { valueAsNumber: true })} />
          {errors.total_rounds && <p className="text-xs text-destructive">{errors.total_rounds.message}</p>}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Criar campeonato
      </Button>
    </form>
  )
}
