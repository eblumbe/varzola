import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Target, Users, TrendingUp, Shield, Zap, BarChart3, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const stats = [
  { icon: Trophy, label: 'Campeonatos', value: 'Completos' },
  { icon: Target, label: 'Gols', value: 'Registrados' },
  { icon: Users, label: 'Times', value: 'Equilibrados' },
  { icon: TrendingUp, label: 'Rankings', value: 'Em tempo real' },
]

const features = [
  {
    icon: Trophy,
    title: 'Campeonatos & Rodadas',
    description: 'Crie campeonatos, organize rodadas e acompanhe cada partida com placar ao vivo.',
  },
  {
    icon: Zap,
    title: 'Times Equilibrados',
    description: 'Gerador automático de times balanceados por habilidade, garantindo jogos competitivos.',
  },
  {
    icon: BarChart3,
    title: 'Rankings Individuais',
    description: 'Sistema Varzola: 2 pontos por vitória + 1 por gol. Transparência total.',
  },
  {
    icon: Star,
    title: 'Avaliações & MVP',
    description: 'Avalie jogadores em Técnica, Físico, Tática e Fair Play. Vote no MVP da rodada.',
  },
  {
    icon: Target,
    title: 'Artilheiros',
    description: 'Ranking de goleadores atualizado automaticamente a cada partida.',
  },
  {
    icon: Shield,
    title: 'Gestão Completa',
    description: 'Jogadores fixos e convidados, confirmação de presença e controle de acesso.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo-compacto.png"
                alt="Varzola"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-xl font-bold text-gradient-hero">VARZOLA</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="bg-gradient-field text-white hover:opacity-90" asChild>
                <Link href="/register">Criar conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-soccer-field.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <Image
              src="/images/logo-principal.png"
              alt="Varzola"
              width={140}
              height={140}
              className="mx-auto mb-6 object-contain drop-shadow-2xl"
              priority
            />
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              VARZOLA
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 font-medium">
              A plataforma definitiva para peladas
            </p>
            <p className="text-base sm:text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Gerencie campeonatos, acompanhe rankings individuais e forme times equilibrados.
              Regra Varzola: <strong className="text-white">2 pontos por vitória + 1 ponto por gol</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Button size="lg" className="bg-gradient-field text-white hover:opacity-90 text-base px-8" asChild>
                <Link href="/register">
                  <Trophy className="w-5 h-5 mr-2" />
                  Começar agora
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8" asChild>
                <Link href="/login">
                  <Users className="w-5 h-5 mr-2" />
                  Já tenho conta
                </Link>
              </Button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                >
                  <Icon className="w-7 h-7 text-amber-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">{value}</div>
                  <div className="text-xs text-white/70">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Tudo que sua pelada precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Do sorteio de times até o ranking final — tudo automatizado.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="bg-gradient-card border-border/50 shadow-varzola-soft hover:shadow-varzola-medium transition-varzola"
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-field flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 bg-gradient-field text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto pra organizar sua pelada?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Crie sua conta em segundos e comece a gerenciar campeonatos, registrar gols e acompanhar quem é o craque da galera.
          </p>
          <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 text-base px-8" asChild>
            <Link href="/register">
              Criar minha pelada
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/images/logo-compacto.png"
            alt="Varzola"
            width={32}
            height={32}
            className="mx-auto mb-2 object-contain"
          />
          <span className="text-sm font-bold text-gradient-hero">VARZOLA</span>
          <p className="text-xs text-muted-foreground mt-1">
            A plataforma definitiva para peladas
          </p>
        </div>
      </footer>
    </div>
  )
}
