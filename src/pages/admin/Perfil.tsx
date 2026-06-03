import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Camera, UserCircle, Mail, Key, Phone, Loader2, LogOut,
  Save, CheckCircle2, Eye, EyeOff, Shield, ShieldCheck, Globe,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUsuarioAtual } from '@/lib/queries'
import { supabase, ASSETS_BUCKET } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function FL({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
      {children}
    </label>
  )
}

function FI({ icon: Icon, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />}
      <input
        className={cn(
          'w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all',
          'placeholder:text-slate-400',
          Icon ? 'pl-10 pr-4' : 'px-4',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export default function AdminPerfil() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: usuario } = useUsuarioAtual()
  const meta = user?.user_metadata ?? {}
  const isAdmin = usuario?.perfil === 'admin'

  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [touched, setTouched] = useState(false)

  const [form, setForm] = useState({
    nome: (meta.nome as string) ?? '',
    telefone: (meta.telefone as string) ?? '',
    foto_url: (meta.foto_url as string) ?? '',
    novaSenha: '',
    confirmarSenha: '',
  })

  // Quando os dados da tabela `usuarios` chegam, preenche o formulário
  // (fonte de verdade), desde que o usuário ainda não tenha digitado nada.
  useEffect(() => {
    if (!usuario || touched) return
    setForm(f => ({
      ...f,
      nome: usuario.nome ?? f.nome,
      telefone: usuario.telefone ?? f.telefone,
      foto_url: usuario.foto_url ?? f.foto_url,
    }))
  }, [usuario, touched])

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setTouched(true)
    setSaved(false)
  }

  const senhasNaoCoincidem = !!form.confirmarSenha && form.novaSenha !== form.confirmarSenha
  const primeiraLetra = (form.nome || user?.email || 'A').charAt(0).toUpperCase()

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Foto muito grande. Máximo ${maxMB}MB.`)
      return
    }

    setUploadingFoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatares/${user?.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(ASSETS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path)
      set('foto_url', data.publicUrl)
      toast.success('Foto carregada! Clique em "Salvar" para confirmar.')
    } catch {
      toast.error('Erro ao enviar foto. Verifique se o bucket "assets" existe no Supabase.')
    } finally {
      setUploadingFoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSalvar() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (form.novaSenha && form.novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres'); return
    }
    if (senhasNaoCoincidem) { toast.error('As senhas não coincidem'); return }

    setSaving(true)
    try {
      const dados = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        foto_url: form.foto_url || null,
      }

      // 1. Atualiza Auth (metadados + senha, quando informada)
      const updates: Parameters<typeof supabase.auth.updateUser>[0] = { data: dados }
      if (form.novaSenha) updates.password = form.novaSenha
      const { error: authError } = await supabase.auth.updateUser(updates)
      if (authError) throw authError

      // 2. Atualiza a tabela `usuarios` — fonte de verdade da Equipe e do
      //    card de corretor no site (não depende do trigger de sincronia).
      if (user?.id) {
        const { error: dbError } = await supabase.from('usuarios').update(dados).eq('id', user.id)
        if (dbError) throw dbError
      }

      // Atualiza dados exibidos no painel e no site sem recarregar
      queryClient.invalidateQueries({ queryKey: ['usuario-atual'] })
      queryClient.invalidateQueries({ queryKey: ['corretores'] })
      queryClient.invalidateQueries({ queryKey: ['corretor-publico'] })

      setSaved(true)
      setTouched(false)
      setForm(f => ({ ...f, novaSenha: '', confirmarSenha: '' }))
      toast.success('Perfil atualizado com sucesso!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await signOut()
    toast.info('Até logo!')
    navigate('/admin/login')
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in max-w-2xl">

      {/* Título */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
          Meu Perfil
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Edite suas informações pessoais e configurações de acesso.
        </p>
      </div>

      {/* Card avatar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Badge de papel (Admin/Corretor) — canto superior direito */}
        <div className={cn(
          'absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-sm',
          isAdmin ? 'bg-orange-500/90 border-orange-400' : 'bg-white/90 border-slate-200',
        )}>
          {isAdmin
            ? <ShieldCheck className="h-3.5 w-3.5 text-white" />
            : <Shield className="h-3.5 w-3.5 text-slate-500" />
          }
          <span className={cn('text-xs font-bold uppercase tracking-wide', isAdmin ? 'text-white' : 'text-slate-600')}>
            {isAdmin ? 'Admin' : 'Corretor'}
          </span>
        </div>

        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #f97316 0%, transparent 60%)' }} />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
            {/* Avatar clicável */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-heading font-extrabold text-white text-3xl overflow-hidden border-4 border-white shadow-lg cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {form.foto_url ? (
                  <img src={form.foto_url} className="w-full h-full object-cover" alt={form.nome} />
                ) : primeiraLetra}
              </div>

              {/* Botão câmera — sempre visível (mobile-friendly) */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-xl bg-orange-500 border-2 border-white flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
                aria-label="Alterar foto"
              >
                {uploadingFoto
                  ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  : <Camera className="h-3.5 w-3.5 text-white" />
                }
              </button>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadFoto} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-heading font-extrabold text-slate-900 truncate">
                {form.nome || user?.email?.split('@')[0] || 'Usuário'}
              </h2>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-orange-600 font-bold mt-1 hover:text-orange-700 transition-colors"
              >
                {uploadingFoto ? 'Enviando...' : 'Trocar foto de perfil'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card dados pessoais */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <UserCircle className="h-4 w-4 text-orange-500" />
          <h3 className="font-heading font-bold text-slate-900 text-sm">Dados Pessoais</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FL>Nome completo *</FL>
            <FI
              icon={UserCircle}
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <FL>WhatsApp / Telefone</FL>
            <FI
              icon={Phone}
              value={form.telefone}
              onChange={e => set('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div>
          <FL>E-mail de acesso</FL>
          <FI
            icon={Mail}
            value={user?.email ?? ''}
            disabled
            className="text-slate-400 cursor-not-allowed bg-slate-100"
          />
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            O e-mail é gerenciado pelo Supabase e não pode ser alterado aqui.
          </p>
        </div>
      </div>

      {/* Card senha */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Key className="h-4 w-4 text-orange-500" />
          <h3 className="font-heading font-bold text-slate-900 text-sm">Segurança — Alterar Senha</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-3">Deixe em branco para manter a senha atual.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FL>Nova Senha</FL>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showSenha ? 'text' : 'password'}
                value={form.novaSenha}
                onChange={e => set('novaSenha', e.target.value)}
                placeholder="mínimo 6 caracteres"
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.novaSenha && form.novaSenha.length < 6 && (
              <p className="text-xs text-amber-500 mt-1 font-medium">Mínimo de 6 caracteres</p>
            )}
          </div>

          <div>
            <FL>Confirmar Nova Senha</FL>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={form.confirmarSenha}
                onChange={e => set('confirmarSenha', e.target.value)}
                placeholder="repita a nova senha"
                className={cn(
                  'w-full h-12 bg-slate-50 border rounded-xl pl-10 pr-10 text-sm font-medium',
                  'focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400',
                  senhasNaoCoincidem
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : form.confirmarSenha && form.novaSenha === form.confirmarSenha
                    ? 'border-emerald-300 focus:ring-emerald-200'
                    : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400',
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {senhasNaoCoincidem && (
              <p className="text-xs text-red-500 mt-1 font-medium">As senhas não coincidem</p>
            )}
            {form.confirmarSenha && !senhasNaoCoincidem && form.novaSenha.length >= 6 && (
              <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Senhas conferem
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSalvar}
          disabled={saving || senhasNaoCoincidem}
          className={cn(
            'flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md',
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20',
            (saving || senhasNaoCoincidem) && 'opacity-60 cursor-not-allowed',
          )}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" /> Salvo com sucesso!</>
          ) : (
            <><Save className="h-4 w-4" /> Salvar Alterações</>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="h-12 px-6 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="h-4 w-4" /> Sair do sistema
        </button>
      </div>
    </div>
  )
}
