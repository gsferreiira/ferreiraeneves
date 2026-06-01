import { useState } from 'react'
import { Plus, CalendarDays, List, Search, CheckCircle2, XCircle, Clock, Star, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAgendamentos, useCreateAgendamento, useUpdateAgendamento, useDeleteAgendamento, useImoveisAdmin } from '@/lib/queries'
import { formatDateTime } from '@/lib/utils'
import type { Agendamento } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type View = 'calendario' | 'lista'

const STATUS_BADGE: Record<string, 'secondary' | 'success' | 'destructive' | 'outline'> = {
  pendente: 'secondary', confirmado: 'success', cancelado: 'destructive', realizado: 'outline',
}
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado', realizado: 'Realizado',
}
const STATUS_ICON: Record<string, React.ElementType> = {
  pendente: Clock, confirmado: CheckCircle2, cancelado: XCircle, realizado: Star,
}
const STATUS_CAL: Record<string, string> = {
  pendente: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelado: 'bg-rose-100 text-rose-800 border-rose-200',
  realizado: 'bg-slate-100 text-slate-600 border-slate-200',
}

type FormState = Omit<Agendamento, 'id' | 'created_at' | 'imovel'>
const EMPTY_FORM: FormState = {
  imovel_id: '', nome_cliente: '', email_cliente: null, telefone_cliente: '',
  data_hora: '', tipo: 'visita', status: 'pendente', observacoes: null,
}

function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{children}</label>
}
function FI({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all ${className}`} {...props} />
}

export default function AdminAgendamentos() {
  const { data: agendamentos = [], isLoading } = useAgendamentos()
  const { data: imoveis = [] } = useImoveisAdmin()
  const createAgendamento = useCreateAgendamento()
  const updateAgendamento = useUpdateAgendamento()
  const deleteAgendamento = useDeleteAgendamento()

  const [view, setView] = useState<View>('calendario')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Agendamento | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<{ id: string; nome: string } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()

  const nomeMes = new Date(calYear, calMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function abrirNovo() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }
  function abrirEditar(a: Agendamento) {
    setEditando(a)
    setForm({
      imovel_id: a.imovel_id, nome_cliente: a.nome_cliente, email_cliente: a.email_cliente,
      telefone_cliente: a.telefone_cliente, data_hora: a.data_hora.slice(0, 16),
      tipo: a.tipo, status: a.status, observacoes: a.observacoes,
    })
    setDialogOpen(true)
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSalvar() {
    if (!form.nome_cliente.trim() || !form.telefone_cliente.trim() || !form.data_hora) {
      toast.error('Nome, telefone e data são obrigatórios'); return
    }
    const payload = { ...form, imovel_id: form.imovel_id || '' }
    if (editando) {
      await updateAgendamento.mutateAsync({ id: editando.id, ...payload })
      toast.success('Agendamento atualizado')
    } else {
      await createAgendamento.mutateAsync(payload)
      toast.success('Agendamento criado')
    }
    setDialogOpen(false)
  }

  async function handleStatus(ag: Agendamento, status: Agendamento['status']) {
    await updateAgendamento.mutateAsync({ id: ag.id, status })
    toast.success(`${STATUS_LABEL[status]}`)
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    await deleteAgendamento.mutateAsync(confirmarDelete.id)
    toast.success('Agendamento excluído')
    setConfirmarDelete(null)
  }

  const filtrados = agendamentos.filter(a => {
    const matchBusca = a.nome_cliente.toLowerCase().includes(busca.toLowerCase()) || a.telefone_cliente.includes(busca)
    const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus
    return matchBusca && matchStatus
  })

  const pendentes = agendamentos.filter(a => a.status === 'pendente').length
  const isPending = createAgendamento.isPending || updateAgendamento.isPending

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Agenda & Visitas</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {pendentes > 0 ? `${pendentes} pendente(s)` : 'Controle as visitas e reuniões.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle calendário/lista */}
          <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setView('calendario')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                view === 'calendario' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </button>
            <button
              onClick={() => setView('lista')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                view === 'lista' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
          <Button onClick={abrirNovo}><Plus className="h-4 w-4" />Novo</Button>
        </div>
      </div>

      {/* ── CALENDÁRIO ──────────────────────────────────────────────────── */}
      {view === 'calendario' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          {/* Nav do mês */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <h2 className="font-heading font-extrabold text-slate-900 text-lg capitalize">{nomeMes}</h2>
            <button onClick={nextMonth} className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Grade — overflow scroll horizontal no mobile */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1.5 min-w-[560px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase pb-2 tracking-wider">{d}</div>
              ))}

              {/* Células vazias antes do dia 1 */}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

              {/* Dias do mês */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dayAgs = agendamentos.filter(a => {
                  const d = new Date(a.data_hora)
                  return d.getDate() === day && d.getMonth() === calMonth && d.getFullYear() === calYear
                })
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear()

                return (
                  <div
                    key={day}
                    className={cn(
                      'min-h-[80px] sm:min-h-[100px] border rounded-2xl p-2 transition-colors',
                      isToday ? 'bg-orange-50/50 border-orange-200' : 'border-slate-100 bg-white hover:bg-slate-50/50',
                    )}
                  >
                    <span className={cn(
                      'font-bold inline-flex items-center justify-center h-6 w-6 rounded-full text-xs',
                      isToday ? 'bg-orange-500 text-white' : 'text-slate-500',
                    )}>
                      {day}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {dayAgs.map(a => (
                        <div
                          key={a.id}
                          className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate cursor-pointer', STATUS_CAL[a.status])}
                          onClick={() => abrirEditar(a)}
                          title={`${a.nome_cliente} — ${a.tipo}`}
                        >
                          {a.nome_cliente.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className={cn('flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border', STATUS_CAL[key])}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LISTA ───────────────────────────────────────────────────────── */}
      {view === 'lista' && (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Buscar cliente ou telefone..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="confirmado">Confirmados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                  <SelectItem value="realizado">Realizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">Nenhum agendamento encontrado</p>
              <p className="text-slate-400 text-sm mt-1">Os agendamentos do site aparecem aqui automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrados.map(ag => {
                const StatusIcon = STATUS_ICON[ag.status] ?? Clock
                const isPendente = ag.status === 'pendente'
                const isConfirmado = ag.status === 'confirmado'
                return (
                  <div key={ag.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', isPendente ? 'bg-blue-100' : isConfirmado ? 'bg-emerald-100' : 'bg-slate-100')}>
                          <StatusIcon className={cn('h-5 w-5', isPendente ? 'text-blue-600' : isConfirmado ? 'text-emerald-600' : 'text-slate-400')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant={STATUS_BADGE[ag.status] ?? 'secondary'}>{STATUS_LABEL[ag.status]}</Badge>
                            <span className="text-xs text-slate-400 font-medium">{formatDateTime(ag.data_hora)}</span>
                          </div>
                          <p className="font-semibold text-slate-900">{ag.nome_cliente}</p>
                          <p className="text-sm text-slate-500">{ag.telefone_cliente}{ag.email_cliente ? ` · ${ag.email_cliente}` : ''}</p>
                          {ag.imovel && <p className="text-xs text-slate-400 mt-0.5">📍 {ag.imovel.titulo} — {ag.imovel.cidade}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => abrirEditar(ag)} className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-colors">
                          <CalendarDays className="h-3.5 w-3.5" />
                        </button>
                        {isPendente && (
                          <button onClick={() => handleStatus(ag, 'confirmado')} className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isConfirmado && (
                          <button onClick={() => handleStatus(ag, 'realizado')} className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setConfirmarDelete({ id: ag.id, nome: ag.nome_cliente })} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Dialog criar/editar agendamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">{editando ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados do agendamento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>Tipo</FL>
                <Select value={form.tipo} onValueChange={v => set('tipo', v as 'visita' | 'reuniao')}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visita">Visita ao imóvel</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FL>Status</FL>
                <Select value={form.status} onValueChange={v => set('status', v as Agendamento['status'])}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <FL>Data e Hora *</FL>
              <FI type="datetime-local" value={form.data_hora} onChange={e => set('data_hora', e.target.value)} />
            </div>

            <div>
              <FL>Imóvel (opcional)</FL>
              <Select value={form.imovel_id || 'nenhum'} onValueChange={v => set('imovel_id', v === 'nenhum' ? '' : v)}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue placeholder="Selecionar imóvel..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {imoveis.map(i => <SelectItem key={i.id} value={i.id}>{i.titulo} — {i.cidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Dados do Cliente</p>
              <div className="space-y-3">
                <div>
                  <FL>Nome *</FL>
                  <FI value={form.nome_cliente} onChange={e => set('nome_cliente', e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FL>Telefone *</FL>
                    <FI value={form.telefone_cliente} onChange={e => set('telefone_cliente', e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <FL>E-mail</FL>
                    <FI type="email" value={form.email_cliente ?? ''} onChange={e => set('email_cliente', e.target.value || null)} placeholder="email@exemplo.com" />
                  </div>
                </div>
                <div>
                  <FL>Observações</FL>
                  <textarea value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value || null)} rows={2} placeholder="Informações adicionais..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar delete */}
      <Dialog open={!!confirmarDelete} onOpenChange={open => !open && setConfirmarDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">Excluir agendamento</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir o agendamento de <strong>"{confirmarDelete?.nome}"</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAgendamento.isPending}>{deleteAgendamento.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
