import { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Globe, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useArtigos, useCreateArtigo, useUpdateArtigo, useDeleteArtigo } from '@/lib/queries'
import type { Artigo } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type FormState = Omit<Artigo, 'id' | 'created_at'>
const EMPTY: FormState = { titulo: '', slug: '', resumo: '', conteudo: '', imagem_url: '', publicado: false }

function slugify(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{children}</label>
}
function FI({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all ${className}`} {...props} />
}

export default function AdminBlog() {
  const { data: artigos = [], isLoading } = useArtigos(false)
  const createArtigo = useCreateArtigo()
  const updateArtigo = useUpdateArtigo()
  const deleteArtigo = useDeleteArtigo()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Artigo | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<{ id: string; titulo: string } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(f => ({ ...f, [k]: v })) }

  function abrirNovo() { setEditando(null); setForm(EMPTY); setDialogOpen(true) }
  function abrirEditar(a: Artigo) {
    setEditando(a)
    setForm({ titulo: a.titulo, slug: a.slug, resumo: a.resumo ?? '', conteudo: a.conteudo, imagem_url: a.imagem_url ?? '', publicado: a.publicado })
    setDialogOpen(true)
  }

  async function handleSalvar() {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast.error('Título e conteúdo são obrigatórios'); return
    }
    const payload = { ...form, slug: form.slug || slugify(form.titulo), resumo: form.resumo || null, imagem_url: form.imagem_url || null }
    try {
      if (editando) {
        await updateArtigo.mutateAsync({ id: editando.id, ...payload })
        toast.success('Artigo atualizado')
      } else {
        await createArtigo.mutateAsync(payload)
        toast.success('Artigo criado')
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar artigo')
    }
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    try {
      await deleteArtigo.mutateAsync(confirmarDelete.id)
      toast.success('Artigo excluído')
    } catch { toast.error('Erro ao excluir artigo') }
    setConfirmarDelete(null)
  }

  async function togglePublicado(a: Artigo) {
    try {
      await updateArtigo.mutateAsync({ id: a.id, publicado: !a.publicado })
      toast.success(a.publicado ? 'Artigo despublicado' : 'Artigo publicado')
    } catch { toast.error('Erro ao alterar status') }
  }

  const isPending = createArtigo.isPending || updateArtigo.isPending

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Blog</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{artigos.length} artigo(s) · {artigos.filter(a => a.publicado).length} publicado(s)</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="h-4 w-4" />Novo Artigo</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : artigos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum artigo ainda</p>
          <Button className="mt-4" onClick={abrirNovo}>Criar primeiro artigo</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Artigo</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {artigos.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {a.imagem_url
                        ? <img src={a.imagem_url} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0 hidden sm:block" />
                        : <div className="h-10 w-14 rounded-lg bg-slate-100 hidden sm:flex items-center justify-center shrink-0"><BookOpen className="h-4 w-4 text-slate-300" /></div>
                      }
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{a.titulo}</p>
                        {a.resumo && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.resumo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <code className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">/{a.slug}</code>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={a.publicado ? 'success' : 'secondary'}>{a.publicado ? 'Publicado' : 'Rascunho'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {a.publicado && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-400 hover:text-slate-700">
                          <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className={cn('h-8 w-8', a.publicado ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600')} onClick={() => togglePublicado(a)}>
                        {a.publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-600" onClick={() => abrirEditar(a)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmarDelete({ id: a.id, titulo: a.titulo })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">{editando ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <FL>Título *</FL>
              <FI value={form.titulo} onChange={e => { set('titulo', e.target.value); if (!editando) set('slug', slugify(e.target.value)) }} placeholder="Título do artigo" />
            </div>
            <div>
              <FL>Slug (URL)</FL>
              <FI value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="titulo-do-artigo" />
              <p className="text-[10px] text-slate-400 mt-1">Gerado automaticamente. URL: /blog/{form.slug || 'slug'}</p>
            </div>
            <div>
              <FL>Imagem de capa (URL)</FL>
              <FI value={form.imagem_url ?? ''} onChange={e => set('imagem_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <FL>Resumo</FL>
              <textarea value={form.resumo ?? ''} onChange={e => set('resumo', e.target.value)} rows={2} placeholder="Breve descrição do artigo..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" />
            </div>
            <div>
              <FL>Conteúdo (HTML) *</FL>
              <textarea value={form.conteudo} onChange={e => set('conteudo', e.target.value)} rows={12} placeholder="<p>Conteúdo do artigo em HTML...</p>" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-y" />
              <p className="text-[10px] text-slate-400 mt-1">Use tags HTML: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;img&gt;</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input type="checkbox" id="publicado" checked={form.publicado} onChange={e => set('publicado', e.target.checked)} className="h-4 w-4 accent-orange-500" />
              <label htmlFor="publicado" className="text-sm font-semibold text-slate-700 cursor-pointer">Publicar artigo (visível no site)</label>
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
            <DialogTitle>Excluir artigo</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir <strong>"{confirmarDelete?.titulo}"</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteArtigo.isPending}>{deleteArtigo.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
