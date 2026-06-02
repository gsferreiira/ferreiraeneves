import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  UserPlus, Pencil, Trash2, Search, Camera, Loader2,
  Shield, ShieldCheck, Mail, Phone, MoreVertical, KeyRound,
  CheckCircle2, XCircle, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, ASSETS_BUCKET } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Corretor {
  id: string
  nome: string
  email: string
  telefone: string | null
  foto_url: string | null
  perfil: string
  status: string
  created_at: string
}

type FormState = {
  nome: string
  email: string
  telefone: string
  foto_url: string
  perfil: string
  status: string
  senha: string
}

const EMPTY_FORM: FormState = {
  nome: '', email: '', telefone: '', foto_url: '', perfil: 'corretor', status: 'ativo', senha: '',
}

function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{children}</label>
}
function FI({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all',
        className,
      )}
      {...props}
    />
  )
}

function CorretorAvatar({ corretor, size = 'md' }: { corretor: Corretor; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-9 w-9 text-sm', md: 'h-11 w-11 text-base', lg: 'h-16 w-16 text-2xl' }
  return (
    <div className={cn('rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-heading font-extrabold text-white overflow-hidden shrink-0', sz[size])}>
      {corretor.foto_url
        ? <img src={corretor.foto_url} alt={corretor.nome} className="w-full h-full object-cover" />
        : corretor.nome.charAt(0).toUpperCase()
      }
    </div>
  )
}

export default function AdminEquipe() {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Corretor | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<Corretor | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    carregarCorretores()
  }, [])

  async function carregarCorretores() {
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome')
    if (!error && data) setCorretores(data as Corretor[])
    setLoading(false)
  }

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function abrirNovo() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function abrirEditar(c: Corretor) {
    setEditando(c)
    setForm({ nome: c.nome, email: c.email, telefone: c.telefone ?? '', foto_url: c.foto_url ?? '', perfil: c.perfil, status: c.status, senha: '' })
    setDialogOpen(true)
    setMenuAberto(null)
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Foto maior que 5MB'); return }
    setUploadingFoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatares/equipe-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(ASSETS_BUCKET).upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path)
      set('foto_url', data.publicUrl)
      toast.success('Foto carregada!')
    } catch {
      toast.error('Erro ao enviar foto. Verifique o bucket "assets".')
    } finally {
      setUploadingFoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.email.trim()) { toast.error('Nome e e-mail são obrigatórios'); return }
    if (!editando && !form.senha) { toast.error('Senha é obrigatória para novo corretor'); return }
    if (form.senha && form.senha.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return }

    setSaving(true)
    try {
      if (!editando) {
        // Cria usuário no Auth sem afetar a sessão atual.
        // O trigger handle_new_user (supabase-extras.sql) replica em `usuarios`.
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: form.email.trim(),
          password: form.senha,
          options: {
            data: { nome: form.nome.trim(), telefone: form.telefone.trim(), foto_url: form.foto_url },
          },
        })
        if (authError) throw authError

        // Ajusta perfil/status caso o trigger tenha aplicado defaults
        if (authData.user) {
          await supabase.from('usuarios').update({
            perfil: form.perfil,
            status: form.status,
            telefone: form.telefone.trim() || null,
            foto_url: form.foto_url || null,
          }).eq('id', authData.user.id)
        }
        toast.success('Corretor cadastrado! Um e-mail de confirmação foi enviado.')
      } else {
        const { error } = await supabase.from('usuarios').update({
          nome: form.nome.trim(),
          telefone: form.telefone.trim() || null,
          foto_url: form.foto_url || null,
          perfil: form.perfil,
          status: form.status,
        }).eq('id', editando.id)
        if (error) throw error
        toast.success('Corretor atualizado!')
      }
      await carregarCorretores()
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar corretor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    const { error } = await supabase.from('usuarios').delete().eq('id', confirmarDelete.id)
    if (error) {
      toast.error('Erro ao excluir corretor')
    } else {
      toast.success('Corretor removido')
      await carregarCorretores()
    }
    setConfirmarDelete(null)
  }

  async function handleResetSenha(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/perfil`,
    })
    if (error) {
      toast.error('Erro ao enviar e-mail de redefinição')
    } else {
      toast.success(`E-mail de redefinição de senha enviado para ${email}`)
    }
    setMenuAberto(null)
  }

  async function handleToggleStatus(c: Corretor) {
    const novoStatus = c.status === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase.from('usuarios').update({ status: novoStatus }).eq('id', c.id)
    if (error) {
      toast.error('Erro ao alterar status')
    } else {
      toast.success(`Corretor ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}`)
      await carregarCorretores()
    }
    setMenuAberto(null)
  }

  const filtrados = corretores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? '').includes(busca)
  )

  const ativos = corretores.filter(c => c.status === 'ativo').length

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Equipe</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {corretores.length} corretor(es) cadastrado(s) · {ativos} ativo(s)
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <UserPlus className="h-4 w-4" /> Novo Corretor
        </Button>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum corretor encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>
            <UserPlus className="h-4 w-4" /> Cadastrar primeiro corretor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(c => {
            const isMe = c.email === user?.email
            return (
              <div
                key={c.id}
                className={cn(
                  'bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md relative',
                  c.status === 'ativo' ? 'border-slate-100' : 'border-dashed border-slate-200 opacity-70',
                )}
              >
                {/* Menu de opções */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setMenuAberto(menuAberto === c.id ? null : c.id)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuAberto === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(null)} />
                      <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-1.5 space-y-0.5">
                          <button onClick={() => abrirEditar(c)} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left">
                            <Pencil className="h-4 w-4 text-slate-400" /> Editar dados
                          </button>
                          <button onClick={() => handleResetSenha(c.email)} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left">
                            <KeyRound className="h-4 w-4 text-slate-400" /> Resetar senha
                          </button>
                          <button onClick={() => handleToggleStatus(c)} className={cn('flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left', c.status === 'ativo' ? 'text-slate-700 hover:bg-amber-50 hover:text-amber-700' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700')}>
                            {c.status === 'ativo'
                              ? <><XCircle className="h-4 w-4 text-slate-400" /> Desativar</>
                              : <><CheckCircle2 className="h-4 w-4 text-slate-400" /> Ativar</>
                            }
                          </button>
                          {!isMe && (
                            <button onClick={() => { setConfirmarDelete(c); setMenuAberto(null) }} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left">
                              <Trash2 className="h-4 w-4" /> Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Conteúdo do card */}
                <div className="flex items-start gap-4 pr-8">
                  <CorretorAvatar corretor={c} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-bold text-slate-900 truncate">{c.nome}</p>
                      {isMe && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md">Você</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{c.email}</p>
                    {c.telefone && (
                      <p className="text-xs text-slate-400 mt-0.5">{c.telefone}</p>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <Badge variant={c.perfil === 'admin' ? 'default' : 'secondary'}>
                    {c.perfil === 'admin'
                      ? <><ShieldCheck className="h-3 w-3" /> Admin</>
                      : <><Shield className="h-3 w-3" /> Corretor</>
                    }
                  </Badge>
                  <Badge variant={c.status === 'ativo' ? 'success' : 'secondary'}>
                    {c.status === 'ativo'
                      ? <><CheckCircle2 className="h-3 w-3" /> Ativo</>
                      : <><XCircle className="h-3 w-3" /> Inativo</>
                    }
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Corretor' : 'Novo Corretor'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Atualize os dados do corretor.' : 'Cadastre um novo membro da equipe. Um e-mail de confirmação será enviado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Foto */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-heading font-extrabold text-white text-2xl overflow-hidden border-2 border-slate-200">
                  {form.foto_url
                    ? <img src={form.foto_url} alt={form.nome} className="w-full h-full object-cover" />
                    : (form.nome.charAt(0).toUpperCase() || <Camera className="h-6 w-6 opacity-60" />)
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFoto}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm hover:bg-orange-600 transition-colors"
                >
                  {uploadingFoto ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : <Camera className="h-3 w-3 text-white" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadFoto} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{form.nome || 'Foto do corretor'}</p>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-orange-600 font-bold hover:text-orange-700 transition-colors">
                  {uploadingFoto ? 'Enviando...' : 'Escolher foto'}
                </button>
                <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG ou WEBP · máx 5MB</p>
              </div>
            </div>

            {/* Dados pessoais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FL>Nome completo *</FL>
                <FI value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div>
                <FL>E-mail *</FL>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <FI
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="corretor@exemplo.com"
                    disabled={!!editando}
                    className={cn('pl-10', editando && 'bg-slate-100 text-slate-400 cursor-not-allowed')}
                  />
                </div>
                {editando && <p className="text-[10px] text-slate-400 mt-1">O e-mail não pode ser alterado após o cadastro.</p>}
              </div>
              <div>
                <FL>Telefone / WhatsApp</FL>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <FI type="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" className="pl-10" />
                </div>
              </div>
            </div>

            {/* Perfil e status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>Perfil de acesso</FL>
                <Select value={form.perfil} onValueChange={v => set('perfil', v)}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretor">
                      <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /> Corretor</div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Admin</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FL>Status</FL>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Senha — só para novo cadastro */}
            {!editando && (
              <div className="border-t border-slate-100 pt-4">
                <FL>Senha de acesso *</FL>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <FI type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="mínimo 6 caracteres" className="pl-10" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  O corretor poderá alterar a própria senha no painel após o primeiro acesso.
                </p>
              </div>
            )}

            {/* Reset senha — só ao editar */}
            {editando && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Redefinição de Senha</p>
                <button
                  type="button"
                  onClick={() => handleResetSenha(editando.email)}
                  className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all text-left"
                >
                  <KeyRound className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p>Enviar e-mail de redefinição</p>
                    <p className="text-[10px] font-normal text-slate-400 mt-0.5">Um link será enviado para {editando.email}</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : editando ? 'Salvar alterações' : 'Cadastrar corretor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!confirmarDelete} onOpenChange={open => !open && setConfirmarDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir corretor</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{confirmarDelete?.nome}</strong> da equipe?
              O acesso ao sistema será revogado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            {confirmarDelete && <CorretorAvatar corretor={confirmarDelete} size="md" />}
            <div>
              <p className="font-bold text-slate-900">{confirmarDelete?.nome}</p>
              <p className="text-sm text-slate-500">{confirmarDelete?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
