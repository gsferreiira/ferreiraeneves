import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, BedDouble, Bath, Car, Maximize2, Heart,
  ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Calendar, Phone, User, X, Share2, Check, Images,
} from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useImovel, useCreateAgendamento, useConfiguracoes, useImoveisSimilares } from '@/lib/queries'
import { PropertyCard } from '@/components/PropertyCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatCurrency, TIPO_IMOVEL_LABELS, TIPO_NEGOCIO_LABELS, getYouTubeEmbedUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ImovelDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: imovel, isLoading, error } = useImovel(id!)
  const { data: config } = useConfiguracoes()
  const { data: similares = [] } = useImoveisSimilares(id ?? '', imovel?.tipo_imovel ?? '', imovel?.cidade ?? '')
  const { isFavorite, toggle } = useFavorites()
  const createAgendamento = useCreateAgendamento()
  const [fotoIdx, setFotoIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', data_hora: '' })
  const [honeypot, setHoneypot] = useState('')
  const formOpenAtRef = useRef(Date.now()).current
  const touchStartX = useRef<number | null>(null)
  const { track } = useRecentlyViewed()

  const prev = useCallback((total: number) => setFotoIdx(i => (i - 1 + total) % total), [])
  const next = useCallback((total: number) => setFotoIdx(i => (i + 1) % total), [])

  // Teclado: setas para navegar, Escape para fechar lightbox
  useEffect(() => {
    if (!lightbox) return
    const fotos = imovel?.fotos ?? []
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev(fotos.length)
      if (e.key === 'ArrowRight') next(fotos.length)
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, imovel, prev, next])

  // Impede scroll do body quando lightbox está aberto
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  useDocumentMeta({
    title: imovel?.titulo,
    description: imovel?.descricao?.slice(0, 160) ?? (imovel ? `${imovel.titulo} em ${imovel.cidade}` : undefined),
    image: imovel?.fotos?.[0],
  })

  // Rastreia visualização e injeta Schema.org
  useEffect(() => {
    if (!imovel) return
    track(imovel.id)

    const addr = [imovel.rua, imovel.numero, imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ')
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: imovel.titulo,
      description: imovel.descricao ?? undefined,
      url: window.location.href,
      image: imovel.fotos.length > 0 ? imovel.fotos : undefined,
      ...(imovel.preco_venda ? { price: imovel.preco_venda, priceCurrency: 'BRL' } : {}),
      ...(imovel.quartos > 0 ? { numberOfRooms: imovel.quartos } : {}),
      ...((imovel.area_construida ?? imovel.area_total) ? {
        floorSize: { '@type': 'QuantitativeValue', value: imovel.area_construida ?? imovel.area_total, unitCode: 'MTK' },
      } : {}),
      address: {
        '@type': 'PostalAddress',
        streetAddress: [imovel.rua, imovel.numero].filter(Boolean).join(', ') || undefined,
        addressLocality: imovel.cidade,
        addressRegion: imovel.estado,
        postalCode: imovel.cep ?? undefined,
        addressCountry: 'BR',
      },
      offers: imovel.preco_venda ? {
        '@type': 'Offer',
        price: imovel.preco_venda,
        priceCurrency: 'BRL',
      } : undefined,
      name: imovel.titulo,
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'schema-imovel'
    script.textContent = JSON.stringify(ld)
    document.getElementById('schema-imovel')?.remove()
    document.head.appendChild(script)

    return () => { document.getElementById('schema-imovel')?.remove() }
  }, [imovel, track])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="h-72 sm:h-96 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-8 w-64 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !imovel) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-xl font-semibold text-slate-500 mb-4">Imóvel não encontrado</p>
        <Button asChild><Link to="/imoveis">Ver outros imóveis</Link></Button>
      </div>
    )
  }

  const fotos = imovel.fotos.length > 0 ? imovel.fotos : ['/placeholder-house.jpg']
  const whatsapp = config?.whatsapp?.replace(/\D/g, '') ?? ''
  const waMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel "${imovel.titulo}"${imovel.codigo ? ` (Cód. ${imovel.codigo})` : ''}.`)
  const waUrl = `https://wa.me/55${whatsapp}?text=${waMsg}`

  async function handleShare() {
    const url = window.location.href
    const title = imovel!.titulo
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next(fotos.length) : prev(fotos.length)
    touchStartX.current = null
  }

  async function handleAgendamento(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return
    if (Date.now() - formOpenAtRef < 1500) return
    if (!form.nome || !form.telefone || !form.data_hora) {
      toast.error('Preencha nome, telefone e data/hora')
      return
    }
    try {
      await createAgendamento.mutateAsync({
        imovel_id: imovel!.id,
        nome_cliente: form.nome,
        telefone_cliente: form.telefone,
        email_cliente: form.email || null,
        data_hora: form.data_hora,
        tipo: 'visita',
        status: 'pendente',
        observacoes: null,
      })
      toast.success('Visita agendada! Entraremos em contato para confirmar.')
      setForm({ nome: '', telefone: '', email: '', data_hora: '' })
    } catch {
      toast.error('Erro ao agendar visita. Tente novamente.')
    }
  }

  const specs = [
    { icon: BedDouble, value: imovel.quartos, label: 'Quartos' },
    { icon: Bath, value: imovel.banheiros, label: 'Banheiros' },
    { icon: Car, value: imovel.vagas, label: 'Vagas' },
    { icon: Maximize2, value: imovel.area_construida ?? imovel.area_total, label: 'Área (m²)' },
  ].filter(s => s.value && s.value > 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Fechar */}
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Contador */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full">
            {fotoIdx + 1} / {fotos.length}
          </div>

          {/* Foto */}
          <img
            src={fotos[fotoIdx]}
            alt={imovel.titulo}
            className="max-h-[90vh] max-w-[95vw] object-contain select-none"
            onClick={e => e.stopPropagation()}
            draggable={false}
          />

          {/* Setas */}
          {fotos.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); prev(fotos.length) }}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); next(fotos.length) }}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Miniaturas no lightbox */}
          {fotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-2" onClick={e => e.stopPropagation()}>
              {fotos.map((f, i) => (
                <button key={i} onClick={() => setFotoIdx(i)}
                  className={cn('shrink-0 h-12 w-16 rounded-lg overflow-hidden border-2 transition-all',
                    i === fotoIdx ? 'border-orange-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  )}>
                  <img src={f} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voltar */}
      <Link to="/imoveis" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-5">
        <ArrowLeft className="h-4 w-4" /> Voltar para imóveis
      </Link>

      {/* Galeria principal */}
      <div
        className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-3 bg-slate-100 cursor-zoom-in"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={fotos[fotoIdx]}
          alt={imovel.titulo}
          className="w-full h-full object-cover"
          onClick={() => setLightbox(true)}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-house.jpg' }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {fotos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); prev(fotos.length) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button onClick={e => { e.stopPropagation(); next(fotos.length) }}
              className="absolute right-12 sm:right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {fotos.map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full transition-all', i === fotoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50')} />
              ))}
            </div>
          </>
        )}

        {/* Botão "Ver fotos" — indica que a galeria é clicável */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur transition-colors"
        >
          <Images className="h-3.5 w-3.5" />
          {fotos.length > 1 ? `Ver ${fotos.length} fotos` : 'Ampliar foto'}
        </button>

        {fotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur pointer-events-none">
            {fotoIdx + 1}/{fotos.length}
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={e => { e.stopPropagation(); toggle(imovel.id) }}
            className={cn(
              'h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-all',
              isFavorite(imovel.id) && 'text-red-500'
            )}
            aria-label="Favoritar"
          >
            <Heart className={cn('h-5 w-5', isFavorite(imovel.id) && 'fill-current')} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleShare() }}
            className={cn('h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-all', copied && 'text-green-600')}
            aria-label="Compartilhar"
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {fotos.map((f, i) => (
            <button key={i} onClick={() => { setFotoIdx(i); setLightbox(true) }}
              className={cn('shrink-0 h-14 w-20 sm:h-16 sm:w-24 rounded-xl overflow-hidden border-2 transition-all',
                i === fotoIdx ? 'border-orange-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
              )}>
              <img src={f} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Layout principal: conteúdo + sidebar */}
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">

        {/* ── Sidebar ── */}
        <div className="md:col-span-1 order-first md:order-last space-y-4">

          {/* Corretor */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-orange-500" />
              Fale com um Corretor
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
                {config?.logo_url
                  ? <img src={config.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  : <span className="text-white font-extrabold text-lg font-heading">FN</span>
                }
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{config?.nome_empresa ?? 'Ferreira & Neves'}</p>
                {config?.creci && <p className="text-xs text-slate-400">CRECI {config.creci}</p>}
              </div>
            </div>
            <div className="space-y-2">
              {config?.telefone && (
                <a href={`tel:${config.telefone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  {config.telefone}
                </a>
              )}
              {whatsapp && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5a] transition-colors">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Chamar no WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Agendar visita */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-orange-500" />
              Agendar Visita
            </h2>
            <form onSubmit={handleAgendamento} className="space-y-3">
              <input type="text" tabIndex={-1} autoComplete="off" value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />
              {[
                { id: 'nome', label: 'Nome *', type: 'text', placeholder: 'Seu nome', key: 'nome' as const, required: true },
                { id: 'tel', label: 'Telefone *', type: 'tel', placeholder: '(00) 00000-0000', key: 'telefone' as const, required: true },
                { id: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', key: 'email' as const, required: false },
              ].map(f => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{f.label}</label>
                  <input id={f.id} type={f.type} value={form[f.key]}
                    onChange={e => setForm(a => ({ ...a, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} required={f.required}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                </div>
              ))}
              <div>
                <label htmlFor="data" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Data e Hora *</label>
                <input id="data" type="datetime-local" value={form.data_hora}
                  onChange={e => setForm(a => ({ ...a, data_hora: e.target.value }))} required
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
              </div>
              <button type="submit" disabled={createAgendamento.isPending}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-orange-200 mt-1">
                {createAgendamento.isPending ? 'Aguarde...' : 'Agendar Visita'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        <div className="md:col-span-2 order-last md:order-first space-y-6">

          {/* Badges + título + endereço */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge>{TIPO_NEGOCIO_LABELS[imovel.tipo_negocio]}</Badge>
              <Badge variant="secondary">{TIPO_IMOVEL_LABELS[imovel.tipo_imovel]}</Badge>
              {imovel.destaque && <Badge variant="warning">⭐ Destaque</Badge>}
              {imovel.codigo && <Badge variant="outline">Cód. {imovel.codigo}</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight">
              {imovel.titulo}
            </h1>
            {(imovel.bairro || imovel.cidade) && (
              <p className="flex items-start gap-1.5 text-slate-500 text-sm mt-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                {[imovel.rua, imovel.numero, imovel.complemento, imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Preços */}
          <div className="flex flex-wrap gap-4">
            {!!imovel.preco_venda && (
              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl px-6 py-5 shadow-lg shadow-orange-500/20">
                <p className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-1.5">Valor de Venda</p>
                <p className="text-4xl font-extrabold text-white font-heading tracking-tight leading-none">
                  {formatCurrency(imovel.preco_venda)}
                </p>
              </div>
            )}
            {!!imovel.preco_locacao && (
              <div className="flex-1 min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl px-6 py-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Aluguel / mês</p>
                <p className="text-4xl font-extrabold text-slate-900 font-heading tracking-tight leading-none">
                  {formatCurrency(imovel.preco_locacao)}
                </p>
              </div>
            )}
          </div>

          {/* Características */}
          {specs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {specs.map(s => (
                <div key={s.label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <s.icon className="h-4.5 w-4.5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-heading font-extrabold text-slate-900 text-base leading-none">{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {imovel.suites > 0 && (
            <p className="text-sm text-slate-500 font-medium -mt-2">
              Sendo {imovel.suites} {imovel.suites === 1 ? 'suíte' : 'suítes'}
            </p>
          )}

          {/* Descrição */}
          {imovel.descricao && (
            <div>
              <h2 className="font-heading font-bold text-slate-900 text-lg mb-3">Descrição</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
            </div>
          )}

          {/* Características */}
          {imovel.caracteristicas?.length > 0 && (
            <div>
              <h2 className="font-heading font-bold text-slate-900 text-lg mb-3">Diferenciais</h2>
              <div className="flex flex-wrap gap-2">
                {imovel.caracteristicas.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold">
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mapa */}
          {(imovel.cidade || imovel.bairro) && (() => {
            const addr = [imovel.rua, imovel.numero, imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ')
            const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
            return (
              <div>
                <h2 className="font-heading font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Localização
                </h2>
                <div className="rounded-2xl overflow-hidden border border-slate-100 h-64">
                  <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    title="Localização do imóvel" />
                </div>
              </div>
            )
          })()}

          {/* Vídeo */}
          {imovel.video_url && getYouTubeEmbedUrl(imovel.video_url) && (
            <div>
              <h2 className="font-heading font-bold text-slate-900 text-lg mb-3">Vídeo</h2>
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100">
                <iframe src={getYouTubeEmbedUrl(imovel.video_url) ?? ''} className="w-full h-full"
                  allowFullScreen title="Vídeo do imóvel" />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Similares */}
      {similares.length > 0 && (
        <div className="mt-12 pt-10 border-t border-slate-100">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl tracking-tight mb-6">
            Imóveis <span className="text-orange-600">similares</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similares.map((s, i) => <PropertyCard key={s.id} imovel={s} animDelay={i * 80} />)}
          </div>
        </div>
      )}
    </div>
  )
}
