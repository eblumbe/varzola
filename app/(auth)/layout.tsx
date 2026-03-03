export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold">Varzola</h1>
          <p className="text-muted-foreground text-sm">Gestão de peladas e campeonatos</p>
        </div>
        {children}
      </div>
    </div>
  )
}
