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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPelada } from '@/lib/services/pelada-service'

const schema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres' }),
  description: z.string().optional(),
  location: z.string().optional(),
  day_of_week: z.string().optional(),
  time: z.string().optional(),
  max_players: z.number().min(2).max(50),
  match_value: z.number().min(0),
})

type FormData = z.infer<typeof schema>

const days = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

export function PeladaForm() {
  const [loading, setLoading] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState<string>('')
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { max_players: 20, match_value: 0 },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: pelada, error } = await createPelada({
      ...data,
      day_of_week: dayOfWeek || undefined,
    })

    if (error || !pelada) {
      toast.error(error ?? 'Erro ao criar pelada')
      setLoading(false)
      return
    }

    toast.success('Pelada criada com sucesso!')
    router.push(`/pelada/${pelada.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da pelada *</Label>
        <Input id="name" placeholder="Ex: Pelada da Firma" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" placeholder="Descreva sua pelada..." {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Local</Label>
        <Input id="location" placeholder="Ex: Campo do Zé, Rua X" {...register('location')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dia da semana</Label>
          <Select onValueChange={(v) => setDayOfWeek(v)} value={dayOfWeek}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input id="time" type="time" {...register('time')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_players">Máx. por rodada</Label>
          <Input id="max_players" type="number" min={2} max={50} {...register('max_players', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="match_value">Valor (R$)</Label>
          <Input id="match_value" type="number" min={0} step={0.01} {...register('match_value', { valueAsNumber: true })} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Criar pelada
      </Button>
    </form>
  )
}
