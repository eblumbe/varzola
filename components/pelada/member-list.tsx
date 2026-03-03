'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Shield, ShieldOff, UserX } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import type { PeladaMember } from '@/lib/types'
import { updateMemberRole, removeMember } from '@/lib/services/pelada-service'

interface MemberListProps {
  members: PeladaMember[]
  canManage: boolean
  onUpdate?: () => void
}

export function MemberList({ members, canManage, onUpdate }: MemberListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  function refresh() {
    if (onUpdate) onUpdate()
    else router.refresh()
  }

  async function handleRoleChange(memberId: string, role: 'admin' | 'player') {
    setLoadingId(memberId)
    const { error } = await updateMemberRole(memberId, role)
    if (error) toast.error('Erro ao atualizar cargo')
    else { toast.success('Cargo atualizado'); refresh() }
    setLoadingId(null)
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remover este membro?')) return
    setLoadingId(memberId)
    const { error } = await removeMember(memberId)
    if (error) toast.error('Erro ao remover membro')
    else { toast.success('Membro removido'); refresh() }
    setLoadingId(null)
  }

  const roleLabel = (role: string) => {
    if (role === 'owner') return 'Dono'
    if (role === 'admin') return 'Admin'
    return 'Jogador'
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="text-xs">
              {member.profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.profile?.full_name ?? 'Jogador'}</p>
            {member.profile?.nickname && (
              <p className="text-xs text-muted-foreground">@{member.profile.nickname}</p>
            )}
          </div>
          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
            {roleLabel(member.role)}
          </Badge>
          {canManage && member.role !== 'owner' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8" disabled={loadingId === member.id}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.role === 'player' ? (
                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                    <Shield className="w-4 h-4 mr-2" />Tornar admin
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'player')}>
                    <ShieldOff className="w-4 h-4 mr-2" />Remover admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-destructive">
                  <UserX className="w-4 h-4 mr-2" />Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  )
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}
