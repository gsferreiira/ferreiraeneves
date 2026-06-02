import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useProprietarios, useCreateProprietario, useUpdateProprietario, useDeleteProprietario } from '@/lib/queries'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import type { Proprietario } from '@/types'
import { toast } from 'sonner'

type FormState = Omit<Proprietario, 'id' | 'created_at'>
const EMPTY: FormState = {
  nome: '', telefone: '', cpf_cnpj: null, email: null,
  endereco: null, banco: null, agencia: null, conta: null, observacoes: null,
}

function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{children}</label>
}
function FI({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all ${className}`} {...props} />
}
function FTA({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all resize-none ${className}`} {...props} />
}
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
    </div>
  )
}

export default function AdminProprietarios() {
  const { data: proprietarios = [], isLoading } = useProprietarios()
  const createProprietario = useCreateProprietario()
  const updateProprietario = useUpdateProprietario()
  const deleteProprietario = useDeleteProprietario()
  const isAdmin = useIsAdmin()

  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Proprietario | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<{ id: string; nome: string } | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  const filtrados = proprietarios.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.telefone.includes(busca) ||
    (p.cpf_cnpj ?? '').includes(busca)
  )

  function set<K extends keyof FormState>(field: K, value: string) {
    const requiredStr = field === 'nome' || field === 'telefone'
    setForm(f => ({ ...f, [field]: (requiredStr ? value : value || null) as FormState[K] }))
  }
  function abrirNovo() { setEditando(null); setForm(EMPTY); setDialogOpen(true) }
  function abrirEditar(p: Proprietario) {
    setEditando(p)
    setForm({ nome: p.nome, telefone: p.telefone, cpf_cnpj: p.cpf_cnpj, email: p.email, endereco: p.endereco, banco: p.banco, agencia: p.agencia, conta: p.conta, observacoes: p.observacoes })
    setDialogOpen(true)
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.telefone.trim()) { toast.error('Nome e telefone são obrigatórios'); return }
    try {
      if (editando) {
        await updateProprietario.mutateAsync({ id: editando.id, ...form })
        toast.success('Proprietário atualizado')
      } else {
        await createProprietario.mutateAsync(form)
        toast.success('Proprietário cadastrado')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao salvar proprietário. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    try {
      await deleteProprietario.mutateAsync(confirmarDelete.id)
      toast.success('Proprietário excluído')
    } catch {
      toast.error('Não é possível excluir: há contratos vinculados.')
    }
    setConfirmarDelete(null)
  }

  const isPending = createProprietario.isPending || updateProprietario.isPending

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Proprietários</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{proprietarios.length} cadastrado(s)</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="h-4 w-4" />Novo Proprietário</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="search" placeholder="Buscar por nome, telefone ou CPF/CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum proprietário encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>Cadastrar primeiro proprietário</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 font-heading font-extrabold text-white text-lg shadow-sm shadow-orange-500/20">
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{p.nome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.telefone}{p.cpf_cnpj ? ` · ${p.cpf_cnpj}` : ''}{p.email ? ` · ${p.email}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.banco && <Badge variant="secondary" className="hidden sm:flex">🏦 {p.banco}</Badge>}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-600" onClick={e => { e.stopPropagation(); abrirEditar(p) }}><Edit2 className="h-4 w-4" /></Button>
                  {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={e => { e.stopPropagation(); setConfirmarDelete({ id: p.id, nome: p.nome }) }}><Trash2 className="h-4 w-4" /></Button>}
                  {expandido === p.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>
              {expandido === p.id && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoRow label="E-mail" value={p.email} />
                    <InfoRow label="CPF/CNPJ" value={p.cpf_cnpj} />
                    <InfoRow label="Endereço" value={p.endereco} />
                    <InfoRow label="Banco" value={p.banco} />
                    <InfoRow label="Agência" value={p.agencia} />
                    <InfoRow label="Conta" value={p.conta} />
                    {p.observacoes && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{p.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">{editando ? 'Editar Proprietário' : 'Novo Proprietário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <FL>Nome *</FL>
              <FI value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>Telefone *</FL>
                <FI value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <FL>CPF / CNPJ</FL>
                <FI value={form.cpf_cnpj ?? ''} onChange={e => set('cpf_cnpj', e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>E-mail</FL>
                <FI type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <FL>Endereço</FL>
                <FI value={form.endereco ?? ''} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, cidade" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Dados Bancários</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FL>Banco</FL>
                  <FI value={form.banco ?? ''} onChange={e => set('banco', e.target.value)} placeholder="Ex: Bradesco" />
                </div>
                <div>
                  <FL>Agência</FL>
                  <FI value={form.agencia ?? ''} onChange={e => set('agencia', e.target.value)} placeholder="0001" />
                </div>
                <div>
                  <FL>Conta</FL>
                  <FI value={form.conta ?? ''} onChange={e => set('conta', e.target.value)} placeholder="12345-6" />
                </div>
              </div>
            </div>

            <div>
              <FL>Observações</FL>
              <FTA value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} rows={3} placeholder="Informações adicionais..." />
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
            <DialogTitle className="font-heading font-extrabold">Excluir proprietário</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir <strong>"{confirmarDelete?.nome}"</strong>? Só é possível excluir se não houver contratos vinculados.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProprietario.isPending}>{deleteProprietario.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
