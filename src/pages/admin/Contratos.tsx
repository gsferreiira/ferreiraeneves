import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useContratos, useCreateContrato, useUpdateContrato, useDeleteContrato, useImoveisAdmin, useProprietarios } from '@/lib/queries'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import type { Contrato } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'secondary'> = { ativo: 'success', pendente: 'warning', encerrado: 'secondary' }
const STATUS_LABEL: Record<string, string> = { ativo: 'Ativo', pendente: 'Pendente', encerrado: 'Encerrado' }

type FormState = Omit<Contrato, 'id' | 'created_at' | 'imovel' | 'proprietario'>
const EMPTY: FormState = { numero: null, tipo: 'aluguel', imovel_id: '', proprietario_id: '', nome_cliente: '', cpf_cliente: null, email_cliente: null, telefone_cliente: null, valor: 0, data_inicio: '', data_fim: null, dia_vencimento: null, status: 'ativo', observacoes: null }

function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{children}</label>
}
function FI({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all ${className}`} {...props} />
}
function FS({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

export default function AdminContratos() {
  const { data: contratos = [], isLoading } = useContratos()
  const { data: imoveis = [] } = useImoveisAdmin()
  const { data: proprietarios = [] } = useProprietarios()
  const createContrato = useCreateContrato()
  const updateContrato = useUpdateContrato()
  const deleteContrato = useDeleteContrato()
  const isAdmin = useIsAdmin()

  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Contrato | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<{ id: string; nome: string } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  const filtrados = contratos.filter(c =>
    c.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
    (c.numero ?? '').includes(busca) ||
    (c.imovel?.titulo ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(f => ({ ...f, [k]: v })) }
  function abrirNovo() { setEditando(null); setForm(EMPTY); setDialogOpen(true) }
  function abrirEditar(c: Contrato) {
    setEditando(c)
    setForm({ numero: c.numero, tipo: c.tipo, imovel_id: c.imovel_id, proprietario_id: c.proprietario_id, nome_cliente: c.nome_cliente, cpf_cliente: c.cpf_cliente, email_cliente: c.email_cliente, telefone_cliente: c.telefone_cliente, valor: c.valor, data_inicio: c.data_inicio, data_fim: c.data_fim, dia_vencimento: c.dia_vencimento, status: c.status, observacoes: c.observacoes })
    setDialogOpen(true)
  }

  async function handleSalvar() {
    if (!form.nome_cliente.trim() || !form.imovel_id || !form.proprietario_id || !form.data_inicio || !form.valor) {
      toast.error('Preencha todos os campos obrigatórios'); return
    }
    if (editando) {
      await updateContrato.mutateAsync({ id: editando.id, ...form })
      toast.success('Contrato atualizado')
    } else {
      await createContrato.mutateAsync(form)
      toast.success('Contrato cadastrado')
    }
    setDialogOpen(false)
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    await deleteContrato.mutateAsync(confirmarDelete.id)
    toast.success('Contrato excluído')
    setConfirmarDelete(null)
  }

  const isPending = createContrato.isPending || updateContrato.isPending

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Contratos</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{contratos.length} contrato(s) · {contratos.filter(c => c.status === 'ativo').length} ativo(s)</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="h-4 w-4" />Novo Contrato</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="search" placeholder="Buscar por cliente, número ou imóvel..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum contrato encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>Criar primeiro contrato</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Imóvel</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Valor</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden lg:table-cell">Início</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{c.nome_cliente}</p>
                      {c.numero && <p className="text-xs text-slate-400 mt-0.5">Nº {c.numero}</p>}
                      {c.proprietario && <p className="text-xs text-slate-400">Prop: {c.proprietario.nome}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-600 text-sm">{c.imovel?.titulo ?? '—'}</td>
                    <td className="px-5 py-4 hidden sm:table-cell"><Badge variant={c.tipo === 'venda' ? 'blue' : 'secondary'}>{c.tipo === 'venda' ? 'Venda' : 'Aluguel'}</Badge></td>
                    <td className="px-5 py-4 hidden sm:table-cell font-bold text-slate-900">{formatCurrency(c.valor)}{c.tipo === 'aluguel' && c.dia_vencimento ? <span className="text-xs font-normal text-slate-400 ml-1">venc. dia {c.dia_vencimento}</span> : ''}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-500">{formatDate(c.data_inicio)}{c.data_fim ? ` → ${formatDate(c.data_fim)}` : ''}</td>
                    <td className="px-5 py-4"><Badge variant={STATUS_BADGE[c.status] ?? 'secondary'}>{STATUS_LABEL[c.status]}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-600" onClick={() => abrirEditar(c)}><Edit2 className="h-4 w-4" /></Button>
                        {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmarDelete({ id: c.id, nome: c.nome_cliente })}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog contrato */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">{editando ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Tipo / Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>Tipo *</FL>
                <FS value={form.tipo} onValueChange={v => set('tipo', v as 'venda' | 'aluguel')}>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                </FS>
              </div>
              <div>
                <FL>Status</FL>
                <FS value={form.status} onValueChange={v => set('status', v as Contrato['status'])}>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </FS>
              </div>
            </div>

            {/* Imóvel / Proprietário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FL>Imóvel *</FL>
                <FS value={form.imovel_id || 'nenhum'} onValueChange={v => set('imovel_id', v === 'nenhum' ? '' : v)}>
                  <SelectItem value="nenhum">Selecione o imóvel</SelectItem>
                  {imoveis.map(i => <SelectItem key={i.id} value={i.id}>{i.titulo} — {i.cidade}</SelectItem>)}
                </FS>
              </div>
              <div>
                <FL>Proprietário *</FL>
                <FS value={form.proprietario_id || 'nenhum'} onValueChange={v => set('proprietario_id', v === 'nenhum' ? '' : v)}>
                  <SelectItem value="nenhum">Selecione o proprietário</SelectItem>
                  {proprietarios.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </FS>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Dados do Cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FL>Nome do Cliente *</FL>
                  <FI value={form.nome_cliente} onChange={e => set('nome_cliente', e.target.value)} placeholder="Nome completo" />
                </div>
                <div>
                  <FL>CPF / CNPJ</FL>
                  <FI value={form.cpf_cliente ?? ''} onChange={e => set('cpf_cliente', e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <FL>Telefone</FL>
                  <FI value={form.telefone_cliente ?? ''} onChange={e => set('telefone_cliente', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="sm:col-span-2">
                  <FL>E-mail</FL>
                  <FI type="email" value={form.email_cliente ?? ''} onChange={e => set('email_cliente', e.target.value)} placeholder="cliente@email.com" />
                </div>
              </div>
            </div>

            {/* Valores e datas */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Valores e Datas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FL>Número do Contrato</FL>
                  <FI value={form.numero ?? ''} onChange={e => set('numero', e.target.value)} placeholder="CTR-2024-001" />
                </div>
                <div>
                  <FL>Valor (R$) *</FL>
                  <FI type="number" min={0} step="0.01" value={form.valor || ''} onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                </div>
                <div>
                  <FL>Data de Início *</FL>
                  <FI type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
                </div>
                <div>
                  <FL>Data de Fim</FL>
                  <FI type="date" value={form.data_fim ?? ''} onChange={e => set('data_fim', e.target.value)} />
                </div>
                {form.tipo === 'aluguel' && (
                  <div>
                    <FL>Dia de Vencimento</FL>
                    <FI type="number" min={1} max={31} value={form.dia_vencimento ?? ''} onChange={e => setForm(f => ({ ...f, dia_vencimento: parseInt(e.target.value) || null }))} placeholder="Ex: 10" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <FL>Observações</FL>
              <textarea value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} rows={3} placeholder="Cláusulas especiais, notas..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all resize-none" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmarDelete} onOpenChange={open => !open && setConfirmarDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">Excluir contrato</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir o contrato de <strong>"{confirmarDelete?.nome}"</strong>? Esta ação é irreversível.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteContrato.isPending}>{deleteContrato.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
