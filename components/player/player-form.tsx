'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGuestPlayer } from '@/lib/services/player-service'
import type { PlayerPosition } from '@/lib/types'

const schema = z.object({
  name: z.string().min(2, { message: 'Nome obrigatório' }),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  technical_level: z.number().min(1).max(10),
})

type FormData = z.infer<typeof schema>

interface PlayerFormProps {
  peladaId: string
  onSuccess: () => void
  children: React.ReactNode
}

const positions: { value: PlayerPosition; label: string }[] = [
  { value: 'goleiro', label: 'Goleiro' },
  { value: 'zagueiro', label: 'Zagueiro' },
  { value: 'meia', label: 'Meia' },
  { value: 'atacante', label: 'Atacante' },
]

export function PlayerForm({ peladaId, onSuccess, children }: PlayerFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<PlayerPosition | ''>('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { technical_level: 5 },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await createGuestPlayer({
      pelada_id: peladaId,
      ...data,
      position: position as PlayerPosition || undefined,
    })

    if (error) {
      toast.error('Erro ao adicionar jogador')
      setLoading(false)
      return
    }

    toast.success('Jogador adicionado!')
    reset()
    setPosition('')
    setOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Jogador Convidado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Nome do jogador" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Apelido</Label>
            <Input placeholder="Apelido" {...register('nickname')} />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input placeholder="(00) 00000-0000" {...register('phone')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Posição</Label>
              <Select onValueChange={(v) => setPosition(v as PlayerPosition)} value={position}>
                <SelectTrigger>
                  <SelectValue placeholder="Posição" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível técnico (1-10)</Label>
              <Input type="number" min={1} max={10} {...register('technical_level', { valueAsNumber: true })} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
