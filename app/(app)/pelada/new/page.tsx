import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PeladaForm } from '@/components/pelada/pelada-form'

export default function NewPeladaPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Pelada</h1>
        <p className="text-muted-foreground text-sm">Configure sua pelada abaixo.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Pelada</CardTitle>
          <CardDescription>
            Um código único será gerado automaticamente para compartilhar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeladaForm />
        </CardContent>
      </Card>
    </div>
  )
}
