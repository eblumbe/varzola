import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/images/logo-principal.png"
            alt="Varzola"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
          <p className="text-muted-foreground text-sm">Gestão de peladas e campeonatos</p>
        </div>
        {children}
      </div>
    </div>
  )
}
