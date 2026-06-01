import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Search, ShieldCheck, Mail, Send,
  Map, Star, FileSearch, Megaphone, PhoneCall, BriefcaseBusiness,
} from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { FadeIn } from '@/components/FadeIn'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useImoveisDestaques, useConfiguracoes } from '@/lib/queries'

const bairrosDestaque = [
  { nome: 'Batel', desc: 'O metro quadrado mais cobiçado.', img: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800' },
  { nome: 'Ecoville', desc: 'Natureza, luxo e tranquilidade.', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800' },
  { nome: 'Água Verde', desc: 'Tradição com infraestrutura completa.', img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800' },
  { nome: 'Cabral', desc: 'Gastronomia e qualidade de vida.', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800' },
]

const depoimentos = [
  {
    nome: 'Ricardo Almeida', perfil: 'Investidor',
    texto: 'A Ferreira & Neves mudou minha visão sobre investimentos imobiliários. A equipe tem acesso a oportunidades off-market exclusivas e a assessoria jurídica é impecável.',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
  },
  {
    nome: 'Luiza Silva', perfil: 'Compradora',
    texto: 'Encontrei o apartamento dos sonhos no primeiro dia de visitas. Os corretores entenderam exatamente o que eu precisava e cuidaram de toda a burocracia.',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  },
  {
    nome: 'Cláudia Mendes', perfil: 'Proprietária',
    texto: 'Confio a administração dos meus imóveis a eles há mais de 5 anos. Aluguéis sempre em dia, vistorias rigorosas e zero dor de cabeça.',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { data: destaques = [] } = useImoveisDestaques()
  const { data: config } = useConfiguracoes()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'venda' | 'aluguel'>('venda')
  const [eNome, setENome] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [eAssunto, setEAssunto] = useState('')
  const [eMensagem, setEMensagem] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const qs = new URLSearchParams({ tipo_negocio: activeTab })
    if (search.trim()) qs.set('busca', search.trim())
    navigate(`/imoveis?${qs.toString()}`)
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setENome(''); setEEmail(''); setEAssunto(''); setEMensagem('')
  }

  const scrollTo = (id: string, assunto?: string) => {
    if (assunto) setEAssunto(assunto)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100dvh-76px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50/30 py-10 lg:py-0 border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">

            {/* Left: texto + search */}
            <div className="flex-1 w-full flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 mt-4 md:mt-0">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-heading font-extrabold text-slate-900 tracking-tighter leading-[1.05] animate-fade-up">
                O imóvel certo
                <br />
                muda a sua{' '}
                <span className="text-orange-600 relative inline-block">
                  história.
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-300 via-orange-500 to-orange-300 rounded-full hidden lg:block" />
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-500 max-w-xl leading-relaxed font-medium animate-fade-up" style={{ animationDelay: '100ms' }}>
                Descubra propriedades exclusivas e realize negócios sólidos com a assessoria da Ferreira & Neves.
              </p>

              {/* Search box */}
              <div className="w-full max-w-xl bg-white p-4 lg:p-5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-slate-100 animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="flex gap-2 mb-4 pb-4 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('venda')}
                    className={`rounded-full px-5 py-2 h-10 font-bold text-sm transition-all ${activeTab === 'venda' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('aluguel')}
                    className={`rounded-full px-5 py-2 h-10 font-bold text-sm transition-all ${activeTab === 'aluguel' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Alugar
                  </button>
                </div>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                    <Search className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="search"
                      placeholder="Bairro, cidade ou código..."
                      className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-400 h-14 text-base"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 px-8 font-bold text-base transition-all shadow-lg shadow-orange-600/25 hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer"
                  >
                    Buscar
                  </button>
                </form>
              </div>
            </div>

            {/* Right: imagem premium */}
            <div className="hidden lg:block flex-1 w-full relative animate-fade-right" style={{ animationDelay: '150ms' }}>
              <div className="relative h-[480px] xl:h-[560px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070"
                  alt="Interior de um imóvel de alto padrão"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              </div>

              {/* Floating card */}
              <div className="absolute bottom-10 -left-10 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-orange-100/60 flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                  <ShieldCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 leading-tight">100% Seguro</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Assessoria jurídica em<br />todas as etapas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESTAQUES ────────────────────────────────────────────────────── */}
      <section id="destaques" className="py-16 lg:py-24 bg-slate-50/70">
        <div className="container mx-auto px-4 max-w-7xl">
          <FadeIn className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-6 h-[2px] bg-orange-500 rounded-full" />
                <span className="text-orange-600 font-bold tracking-[0.2em] uppercase text-[11px]">Portfólio Exclusivo</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">
                Imóveis em <span className="text-orange-600">Destaque</span>
              </h2>
            </div>
            <Link to="/imoveis" className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-bold px-6 h-11 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {destaques.length > 0 ? (
              destaques.map((imovel, i) => (
                <PropertyCard key={imovel.id} imovel={imovel} animDelay={i * 100} />
              ))
            ) : (
              <FadeIn className="col-span-full">
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                  <BriefcaseBusiness className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-600">Nenhum imóvel em destaque no momento.</p>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* ── BAIRROS ──────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="w-10 h-[1.5px] bg-orange-400/60 rounded-full" />
              <span className="text-orange-600 font-bold tracking-[0.2em] uppercase text-[11px] flex items-center gap-1.5">
                <Map className="h-3 w-3" /> Estilo de Vida
              </span>
              <span className="w-10 h-[1.5px] bg-orange-400/60 rounded-full" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">
              Encontre seu lugar <span className="text-orange-600">favorito</span>
            </h2>
            <p className="text-base text-slate-500">Explore os bairros mais desejados de Curitiba.</p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bairrosDestaque.map((bairro, i) => (
              <FadeIn key={i} delay={i * 80}>
                <button
                  type="button"
                  className="group relative h-72 w-full rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                  onClick={() => navigate(`/imoveis?busca=${encodeURIComponent(bairro.nome)}`)}
                >
                  <img src={bairro.img} alt={bairro.nome} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="font-heading font-bold text-2xl mb-1">{bairro.nome}</h3>
                    <p className="text-sm font-medium text-white/80">{bairro.desc}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE ────────────────────────────────────────────────────────── */}
      <section id="sobre" className="py-16 lg:py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 mb-14">
            <FadeIn direction="left" className="flex-1 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-6 h-[2px] bg-orange-500 rounded-full" />
                <span className="text-orange-600 font-bold tracking-[0.2em] uppercase text-[11px]">A Ferreira & Neves</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight">
                Credibilidade construída através de{' '}
                <span className="text-orange-600">resultados.</span>
              </h2>
              <p className="text-base text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
                {config?.sobre_texto ?? 'Fundada com o propósito de elevar o padrão do mercado imobiliário, nossa trajetória é pautada na ética empresarial e transparência absoluta.'}
              </p>
              {config?.creci && <p className="text-sm font-bold text-slate-400 tracking-wider">{config.creci}</p>}
            </FadeIn>

            <FadeIn direction="right" className="hidden lg:block w-full lg:w-2/5 shrink-0">
              <div className="relative">
                <div className="absolute -bottom-3 -right-3 w-full h-full rounded-2xl bg-orange-500/10 border border-orange-200/50 -z-10" />
                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-md">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=800"
                      alt="Equipe Ferreira & Neves"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { target: 12, prefix: '+', label: 'Anos de Tradição' },
              { value: 'Top 10', label: 'Top 10 Curitiba' },
              { target: 100, suffix: '%', label: 'Contratos Auditados' },
              { target: 100, suffix: '%', label: 'Segurança Jurídica' },
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="relative bg-white pt-7 pb-6 px-6 rounded-2xl border border-slate-100 shadow-sm text-center overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-t-2xl" />
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-gradient-to-br from-orange-500 to-orange-700 bg-clip-text text-transparent">
                    {'target' in stat && stat.target !== undefined ? (
                      <AnimatedCounter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs md:text-sm text-slate-500 font-semibold mt-2">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-16 lg:py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="w-10 h-[1.5px] bg-orange-400/60 rounded-full" />
              <span className="text-orange-600 font-bold tracking-[0.2em] uppercase text-[11px] flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-orange-600" /> Casos de Sucesso
              </span>
              <span className="w-10 h-[1.5px] bg-orange-400/60 rounded-full" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">
              O que dizem nossos <span className="text-orange-600">clientes</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {depoimentos.map((dep, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 relative hover:shadow-xl hover:border-orange-100 transition-all duration-300 overflow-hidden flex flex-col h-full">
                  <span className="absolute -top-2 right-5 text-[7rem] font-serif leading-none text-orange-100 select-none pointer-events-none">&ldquo;</span>
                  <div className="flex gap-1 mb-5 relative">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-6 relative text-[15px] flex-1">&ldquo;{dep.texto}&rdquo;</p>
                  <div className="flex items-center gap-3 relative pt-5 border-t border-slate-100">
                    <img src={dep.foto} alt={dep.nome} loading="lazy" className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-orange-200" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{dep.nome}</p>
                      <p className="text-xs text-slate-500 font-medium">{dep.perfil}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA CARDS ────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">Deixe-nos ajudar você</h2>
            <div className="w-16 h-1 bg-orange-500 mx-auto my-5 rounded-full" />
            <p className="text-base text-slate-500 font-medium">Você só precisa clicar em uma das opções abaixo ;)</p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: FileSearch, title: 'O que você procura?', desc: 'Não encontrou seu imóvel? Nós encontramos pra você, conte-nos um pouco do que você precisa.', assunto: 'Comprar um imóvel', label: 'O que você procura?' },
              { icon: Megaphone, title: 'Anuncie seu imóvel', desc: 'Receba uma assessoria completa e especializada em todas as etapas da Venda ou Aluguel do seu imóvel.', assunto: 'Anunciar meu imóvel', label: 'Anuncie seu imóvel' },
              { icon: PhoneCall, title: 'Fale conosco', desc: 'Agende uma visita, avaliação, ou tire suas dúvidas. Envie uma mensagem agora para nossa equipe.', assunto: 'Dúvida geral', label: 'Fale conosco', span: 'sm:col-span-2 md:col-span-1' },
            ].map(({ icon: Icon, title, desc, assunto, label, span }, i) => (
              <FadeIn key={i} delay={i * 100} className={span}>
                <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1 h-full">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Icon className="h-8 w-8 lg:h-9 lg:w-9 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-heading font-extrabold text-slate-900 mb-3">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8 flex-1">{desc}</p>
                  <button
                    type="button"
                    onClick={() => scrollTo('contato', assunto)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer text-sm"
                  >
                    {label}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATO ──────────────────────────────────────────────────────── */}
      <section id="contato" className="py-16 px-4 bg-white border-t border-slate-100">
        <FadeIn className="container mx-auto max-w-6xl">
          <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">

            {/* Lado esquerdo */}
            <div className="p-8 sm:p-10 lg:p-14 flex-1 relative flex flex-col justify-center text-white">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Mail className="h-48 w-48 lg:h-64 lg:w-64" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider border border-slate-700">
                  Assessoria Especializada
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold leading-tight tracking-tight">
                  Vamos falar sobre seu{' '}
                  <span className="text-orange-500">próximo passo.</span>
                </h2>
                <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-md font-medium">
                  Preencha o formulário detalhando sua necessidade e nossa equipe entrará em contato o mais rápido possível.
                </p>
                {config?.email && (
                  <div className="pt-6 border-t border-slate-800 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">E-mail Direto</p>
                      <p className="text-base lg:text-lg font-bold text-white truncate">{config.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-slate-50 p-8 sm:p-10 lg:p-14 w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-slate-200">
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-6">Envie sua mensagem</h3>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Seu Nome</label>
                  <input
                    required
                    value={eNome}
                    onChange={e => setENome(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Seu E-mail</label>
                  <input
                    required
                    type="email"
                    value={eEmail}
                    onChange={e => setEEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Assunto</label>
                  <Select value={eAssunto} onValueChange={setEAssunto}>
                    <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl text-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprar um imóvel">Comprar um imóvel</SelectItem>
                      <SelectItem value="Alugar um imóvel">Alugar um imóvel</SelectItem>
                      <SelectItem value="Anunciar meu imóvel">Anunciar meu imóvel</SelectItem>
                      <SelectItem value="Dúvida geral">Dúvida geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Sua Necessidade</label>
                  <textarea
                    required
                    value={eMensagem}
                    onChange={e => setEMensagem(e.target.value)}
                    placeholder="Descreva brevemente o que você procura..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[120px] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer mt-2"
                >
                  <Send className="h-5 w-5" /> Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}
