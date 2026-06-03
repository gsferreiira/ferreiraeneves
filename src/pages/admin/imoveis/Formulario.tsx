import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Globe, Info, MapPin, Camera, Star,
  BedDouble, Bath, Car, Maximize, DollarSign, Loader2, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhotoUploader } from '@/components/PhotoUploader'
import { useImovel, useCreateImovel, useUpdateImovel, useProprietarios, useCorretores } from '@/lib/queries'
import { generateCodigo } from '@/lib/utils'
import { CARACTERISTICAS_OPCOES } from '@/types'
import { toast } from 'sonner'

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

const schema = z.object({
  titulo: z.string().min(3, 'Título muito curto'),
  descricao: z.string().optional(),
  tipo_imovel: z.enum(['casa', 'apartamento', 'terreno', 'comercial']),
  tipo_negocio: z.enum(['venda', 'aluguel', 'ambos']),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório'),
  cep: z.string().optional(),
  area_construida: z.coerce.number().nullable().optional(),
  area_total: z.coerce.number().nullable().optional(),
  quartos: z.coerce.number().default(0),
  suites: z.coerce.number().default(0),
  banheiros: z.coerce.number().default(0),
  vagas: z.coerce.number().default(0),
  preco_venda: z.coerce.number().nullable().optional(),
  preco_locacao: z.coerce.number().nullable().optional(),
  destaque: z.boolean().default(false),
  status: z.enum(['disponivel', 'alugado', 'vendido', 'inativo']).default('disponivel'),
  video_url: z.string().optional(),
  proprietario_id: z.string().nullable().optional(),
  corretor_id: z.string().nullable().optional(),
  fotos: z.array(z.string()).default([]),
  caracteristicas: z.array(z.string()).default([]),
})

type FormData = z.infer<typeof schema>
type FormInput = z.input<typeof schema>
type Tab = 'geral' | 'detalhes' | 'fotos'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
      {children}
    </label>
  )
}

function FieldInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all ${className}`}
      {...props}
    />
  )
}

function FieldTextarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all resize-none ${className}`}
      {...props}
    />
  )
}

function FieldSelect({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

function CounterField({ label, icon: Icon, value, onChange }: { label: string; icon: React.ElementType; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors font-bold text-lg"
        >−</button>
        <span className="font-heading font-extrabold text-slate-900 text-xl w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors font-bold text-lg"
        >+</button>
      </div>
    </div>
  )
}

export default function AdminImoveisFormulario() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { state } = window.history
  const duplicarDe = (state as { usr?: { duplicarDe?: Record<string, unknown> } })?.usr?.duplicarDe
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [formReady, setFormReady] = useState(!isEditing)

  const { data: imovel, isLoading: loadingImovel } = useImovel(id ?? '')
  const { data: proprietarios = [] } = useProprietarios()
  const { data: corretores = [] } = useCorretores()
  const createImovel = useCreateImovel()
  const updateImovel = useUpdateImovel()

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema) as Resolver<FormInput, unknown, FormData>,
    defaultValues: { quartos: 0, suites: 0, banheiros: 0, vagas: 0, destaque: false, status: 'disponivel', fotos: [] },
  })

  // Pré-carrega dados quando duplicando
  useEffect(() => {
    if (!isEditing && duplicarDe) {
      const d = duplicarDe as Record<string, unknown>
      reset({
        titulo: `${d.titulo as string} (cópia)`,
        descricao: (d.descricao as string) ?? undefined,
        tipo_imovel: d.tipo_imovel as FormData['tipo_imovel'],
        tipo_negocio: d.tipo_negocio as FormData['tipo_negocio'],
        rua: (d.rua as string) ?? undefined,
        numero: (d.numero as string) ?? undefined,
        complemento: (d.complemento as string) ?? undefined,
        bairro: (d.bairro as string) ?? undefined,
        cidade: d.cidade as string,
        estado: d.estado as string,
        cep: (d.cep as string) ?? undefined,
        area_construida: (d.area_construida as number) ?? undefined,
        area_total: (d.area_total as number) ?? undefined,
        quartos: (d.quartos as number) ?? 0,
        suites: (d.suites as number) ?? 0,
        banheiros: (d.banheiros as number) ?? 0,
        vagas: (d.vagas as number) ?? 0,
        preco_venda: (d.preco_venda as number) ?? undefined,
        preco_locacao: (d.preco_locacao as number) ?? undefined,
        destaque: false,
        status: 'disponivel',
        video_url: (d.video_url as string) ?? undefined,
        proprietario_id: (d.proprietario_id as string) ?? undefined,
        corretor_id: (d.corretor_id as string) ?? undefined,
        fotos: [],
      })
    }
  }, [isEditing, duplicarDe, reset])

  useEffect(() => {
    if (imovel) {
      reset({
        ...imovel,
        // Explícito para garantir que o RHF sempre receba o valor correto do banco
        status: imovel.status,
        tipo_negocio: imovel.tipo_negocio,
        tipo_imovel: imovel.tipo_imovel,
        destaque: imovel.destaque,
        descricao: imovel.descricao ?? undefined,
        rua: imovel.rua ?? undefined,
        numero: imovel.numero ?? undefined,
        complemento: imovel.complemento ?? undefined,
        bairro: imovel.bairro ?? undefined,
        cep: imovel.cep ?? undefined,
        video_url: imovel.video_url ?? undefined,
        proprietario_id: imovel.proprietario_id ?? undefined,
        corretor_id: imovel.corretor_id ?? undefined,
        area_construida: imovel.area_construida ?? undefined,
        area_total: imovel.area_total ?? undefined,
        preco_venda: imovel.preco_venda ?? undefined,
        preco_locacao: imovel.preco_locacao ?? undefined,
        fotos: imovel.fotos ?? [],
        caracteristicas: imovel.caracteristicas ?? [],
      })
      setFormReady(true)
    }
  }, [imovel, reset])

  const fotos = watch('fotos') ?? []
  const quartos = Number(watch('quartos') ?? 0)

  // ── Busca CEP ──────────────────────────────────────────────────────────
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const cepRef = useRef('')

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8 || digits === cepRef.current) return
    cepRef.current = digits
    setCepStatus('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data: ViaCepResponse = await res.json()
      if (data.erro) { setCepStatus('error'); toast.error('CEP não encontrado'); return }
      setValue('rua', data.logradouro || '')
      setValue('bairro', data.bairro || '')
      setValue('cidade', data.localidade || '')
      setValue('estado', data.uf || '')
      setCepStatus('found')
      toast.success('Endereço preenchido automaticamente!')
    } catch {
      setCepStatus('error')
      toast.error('Erro ao buscar CEP. Verifique sua conexão.')
    }
  }
  // ───────────────────────────────────────────────────────────────────────
  const suites = Number(watch('suites') ?? 0)
  const banheiros = Number(watch('banheiros') ?? 0)
  const vagas = Number(watch('vagas') ?? 0)
  const destaque = watch('destaque')

  async function onSubmit(data: FormData) {
    if (!data.titulo.trim()) { toast.error('Título é obrigatório'); setActiveTab('geral'); return }
    if (!data.bairro?.trim() && !data.cidade) { toast.error('Informe pelo menos a cidade'); setActiveTab('detalhes'); return }

    const payload = {
      ...data,
      codigo: isEditing ? (imovel?.codigo ?? null) : generateCodigo(),
      descricao: data.descricao || null,
      rua: data.rua || null,
      numero: data.numero || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cep: data.cep || null,
      video_url: data.video_url || null,
      proprietario_id: data.proprietario_id || null,
      corretor_id: data.corretor_id || null,
      area_construida: data.area_construida ?? null,
      area_total: data.area_total ?? null,
      preco_venda: data.preco_venda ?? null,
      preco_locacao: data.preco_locacao ?? null,
    }

    try {
      if (isEditing) {
        await updateImovel.mutateAsync({ id: id!, ...payload })
        toast.success('Imóvel atualizado!')
      } else {
        await createImovel.mutateAsync(payload as Parameters<typeof createImovel.mutateAsync>[0])
        toast.success('Imóvel publicado!')
      }
      navigate('/admin/imoveis')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar imóvel')
    }
  }

  if (isEditing && (loadingImovel || !formReady)) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-2xl animate-pulse w-72" />
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const isPending = createImovel.isPending || updateImovel.isPending

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'geral', label: 'Geral', icon: Info },
    { key: 'detalhes', label: 'Detalhes', icon: MapPin },
    { key: 'fotos', label: `Fotos (${fotos.length})`, icon: Camera },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-4xl pb-10 animate-fade-in">

      {/* Header sticky */}
      <div className="sticky top-0 sm:top-4 z-20 flex items-center justify-between bg-white/95 backdrop-blur-md px-3 py-3 sm:p-4 rounded-none sm:rounded-2xl border-b sm:border border-slate-200 shadow-sm -mx-4 sm:mx-0 sm:-mx-0">
        <Button type="button" variant="ghost" asChild className="rounded-xl h-9 px-3">
          <Link to="/admin/imoveis"><ArrowLeft className="h-4 w-4 mr-1.5" /><span className="hidden sm:inline">Voltar</span></Link>
        </Button>
        <div className="text-center">
          <p className="font-heading font-extrabold text-slate-900 text-sm">
            {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
          </p>
          <p className="text-xs text-slate-400 hidden sm:block">{isEditing ? 'Editando imóvel existente' : 'Preencha as informações'}</p>
        </div>
        <Button type="submit" disabled={isPending} className="rounded-xl h-9 px-4 sm:px-7 shadow-md shadow-orange-500/20 text-xs sm:text-sm">
          <Globe className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Publicar'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl max-w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA GERAL ─────────────────────────────────────────────────── */}
      {activeTab === 'geral' && (
        <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          {/* Título */}
          <div>
            <FieldLabel>Título do Anúncio *</FieldLabel>
            <FieldInput
              {...register('titulo')}
              placeholder="Ex: Cobertura Duplex no Batel"
            />
            {errors.titulo && <p className="text-xs text-red-500 mt-1 font-medium">{errors.titulo.message}</p>}
          </div>

          {/* Tipo negócio / tipo imóvel / status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Negócio *</FieldLabel>
              <Controller name="tipo_negocio" control={control} render={({ field }) => (
                <FieldSelect value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="ambos">Venda e Aluguel</SelectItem>
                </FieldSelect>
              )} />
            </div>
            <div>
              <FieldLabel>Tipo *</FieldLabel>
              <Controller name="tipo_imovel" control={control} render={({ field }) => (
                <FieldSelect value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </FieldSelect>
              )} />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <Controller name="status" control={control} render={({ field }) => (
                <FieldSelect value={field.value ?? 'disponivel'} onValueChange={field.onChange}>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </FieldSelect>
              )} />
            </div>
          </div>

          {/* Preços */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preços</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Preço de Venda (R$)</FieldLabel>
                <FieldInput type="number" min={0} step="0.01" placeholder="0" {...register('preco_venda')} />
              </div>
              <div>
                <FieldLabel>Preço de Aluguel (R$/mês)</FieldLabel>
                <FieldInput type="number" min={0} step="0.01" placeholder="0" {...register('preco_locacao')} />
              </div>
            </div>
          </div>

          {/* Proprietário + Corretor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Proprietário</FieldLabel>
              <Controller name="proprietario_id" control={control} render={({ field }) => (
                <FieldSelect value={field.value ?? 'nenhum'} onValueChange={v => field.onChange(v === 'nenhum' ? null : v)}>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {proprietarios.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </FieldSelect>
              )} />
            </div>
            <div>
              <FieldLabel>Corretor responsável</FieldLabel>
              <Controller name="corretor_id" control={control} render={({ field }) => (
                <FieldSelect value={field.value ?? 'nenhum'} onValueChange={v => field.onChange(v === 'nenhum' ? null : v)}>
                  <SelectItem value="nenhum">Equipe Ferreira &amp; Neves</SelectItem>
                  {corretores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </FieldSelect>
              )} />
            </div>
          </div>

          {/* Destaque */}
          <button
            type="button"
            onClick={() => setValue('destaque', !destaque)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all w-full text-left ${destaque ? 'bg-orange-50 border-orange-300' : 'bg-slate-50 border-slate-200 hover:border-orange-200'}`}
          >
            <Star className={`h-5 w-5 ${destaque ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-sm font-bold ${destaque ? 'text-orange-800' : 'text-slate-700'}`}>
                {destaque ? 'Imóvel em Destaque ativo' : 'Destacar na Página Inicial'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Aparece na seção de destaques da home</p>
            </div>
            <div className={`ml-auto h-5 w-5 rounded-full border-2 flex items-center justify-center ${destaque ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
              {destaque && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* Descrição */}
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <FieldTextarea rows={5} placeholder="Descreva o imóvel, diferenciais, acabamentos, localização..." {...register('descricao')} />
          </div>
        </div>
      )}

      {/* ── ABA DETALHES ──────────────────────────────────────────────── */}
      {activeTab === 'detalhes' && (
        <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">

          {/* Endereço */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-slate-900 text-sm">Endereço</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-3">
                <FieldLabel>
                  CEP
                  {cepStatus === 'found' && <span className="ml-1.5 text-emerald-600 normal-case tracking-normal font-normal">✓ encontrado</span>}
                  {cepStatus === 'error' && <span className="ml-1.5 text-red-500 normal-case tracking-normal font-normal">não encontrado</span>}
                </FieldLabel>
                <div className="relative">
                  <FieldInput
                    {...register('cep')}
                    placeholder="00000-000"
                    maxLength={9}
                    className={
                      cepStatus === 'found' ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-200' :
                      cepStatus === 'error' ? 'border-red-300 bg-red-50 focus:ring-red-200' : ''
                    }
                    onChange={e => {
                      register('cep').onChange(e)
                      const val = e.target.value.replace(/\D/g, '')
                      if (val.length === 8) buscarCep(val)
                      else if (val.length < 8) { setCepStatus('idle'); cepRef.current = '' }
                    }}
                  />
                  {cepStatus === 'loading' && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 animate-spin" />
                  )}
                  {cepStatus === 'found' && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
              </div>
              <div className="col-span-12 sm:col-span-7">
                <FieldLabel>Rua / Avenida</FieldLabel>
                <FieldInput {...register('rua')} placeholder="Rua das Flores" />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <FieldLabel>Número</FieldLabel>
                <FieldInput {...register('numero')} placeholder="123" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <FieldLabel>Complemento</FieldLabel>
                <FieldInput {...register('complemento')} placeholder="Apto 4" />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <FieldLabel>Bairro</FieldLabel>
                <FieldInput {...register('bairro')} placeholder="Centro" />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <FieldLabel>Cidade *</FieldLabel>
                <FieldInput {...register('cidade')} placeholder="Curitiba" />
                {errors.cidade && <p className="text-xs text-red-500 mt-1 font-medium">{errors.cidade.message}</p>}
              </div>
              <div className="col-span-12 sm:col-span-1">
                <FieldLabel>UF *</FieldLabel>
                <FieldInput {...register('estado')} placeholder="PR" maxLength={2} className="uppercase text-center" />
              </div>
            </div>
          </div>

          {/* Características - counters */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-slate-900 text-sm">Características</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CounterField label="Quartos" icon={BedDouble} value={quartos} onChange={v => setValue('quartos', v)} />
              <CounterField label="Suítes" icon={BedDouble} value={suites} onChange={v => setValue('suites', v)} />
              <CounterField label="Banheiros" icon={Bath} value={banheiros} onChange={v => setValue('banheiros', v)} />
              <CounterField label="Vagas" icon={Car} value={vagas} onChange={v => setValue('vagas', v)} />
            </div>
          </div>

          {/* Áreas */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Maximize className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-slate-900 text-sm">Áreas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Área Construída (m²)</FieldLabel>
                <FieldInput type="number" min={0} step="0.01" placeholder="0" {...register('area_construida')} />
              </div>
              <div>
                <FieldLabel>Área Total (m²)</FieldLabel>
                <FieldInput type="number" min={0} step="0.01" placeholder="0" {...register('area_total')} />
              </div>
            </div>
          </div>

          {/* Vídeo */}
          <div>
            <FieldLabel>URL do Vídeo (YouTube, opcional)</FieldLabel>
            <FieldInput {...register('video_url')} placeholder="https://youtube.com/watch?v=..." />
          </div>

          {/* Características */}
          <div>
            <FieldLabel>Características e Diferenciais</FieldLabel>
            <Controller
              name="caracteristicas"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1">
                  {CARACTERISTICAS_OPCOES.map(c => {
                    const checked = (field.value ?? []).includes(c)
                    return (
                      <label key={c} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium select-none ${checked ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-200'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const cur = field.value ?? []
                            field.onChange(checked ? cur.filter(x => x !== c) : [...cur, c])
                          }}
                          className="h-4 w-4 accent-orange-500 shrink-0"
                        />
                        {c}
                      </label>
                    )
                  })}
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* ── ABA FOTOS ─────────────────────────────────────────────────── */}
      {activeTab === 'fotos' && (
        <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-4 w-4 text-orange-500" />
            <span className="font-bold text-slate-900 text-sm">Fotos do Imóvel</span>
            <span className="text-xs text-slate-400 font-medium ml-2">{fotos.length} / 10 fotos</span>
          </div>
          <PhotoUploader fotos={fotos} onChange={urls => setValue('fotos', urls)} maxFotos={10} />
          {fotos.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-4">A primeira foto será a capa do imóvel nos cards de listagem.</p>
          )}
        </div>
      )}

      {/* Erros de validação do Zod */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-1">Corrija os erros antes de salvar:</p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {errors.titulo && <li>• {errors.titulo.message}</li>}
            {errors.cidade && <li>• {errors.cidade.message}</li>}
            {errors.estado && <li>• {errors.estado.message}</li>}
            {errors.tipo_imovel && <li>• Tipo do imóvel é obrigatório</li>}
            {errors.tipo_negocio && <li>• Tipo de negócio é obrigatório</li>}
          </ul>
        </div>
      )}
    </form>
  )
}
