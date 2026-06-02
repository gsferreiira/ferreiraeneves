import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Eye, Home, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useImoveisAdmin, useDeleteImovel } from '@/lib/queries'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { formatCurrency, TIPO_IMOVEL_LABELS } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_BADGE: Record<string, 'success' | 'blue' | 'destructive' | 'secondary'> = {
  disponivel: 'success',
  alugado: 'blue',
  vendido: 'destructive',
  inativo: 'secondary',
}

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  vendido: 'Vendido',
  inativo: 'Inativo',
}

export default function AdminImoveisLista() {
  const { data: imoveis = [], isLoading } = useImoveisAdmin()
  const deleteImovel = useDeleteImovel()
  const isAdmin = useIsAdmin()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroNegocio, setFiltroNegocio] = useState('todos')
  const [confirmarDelete, setConfirmarDelete] = useState<{ id: string; titulo: string } | null>(null)

  const filtrados = useMemo(() => imoveis.filter(i => {
    const t = busca.toLowerCase()
    const matchBusca = !t ||
      i.titulo.toLowerCase().includes(t) ||
      (i.cidade ?? '').toLowerCase().includes(t) ||
      (i.bairro ?? '').toLowerCase().includes(t) ||
      (i.codigo ?? '').toLowerCase().includes(t)
    const matchStatus = filtroStatus === 'todos' || i.status === filtroStatus
    const matchTipo = filtroTipo === 'todos' || i.tipo_imovel === filtroTipo
    const matchNegocio = filtroNegocio === 'todos' || i.tipo_negocio === filtroNegocio
    return matchBusca && matchStatus && matchTipo && matchNegocio
  }), [imoveis, busca, filtroStatus, filtroTipo, filtroNegocio])

  const ativos = (filtroStatus !== 'todos' ? 1 : 0) + (filtroTipo !== 'todos' ? 1 : 0) + (filtroNegocio !== 'todos' ? 1 : 0)

  function limparFiltros() {
    setFiltroStatus('todos'); setFiltroTipo('todos'); setFiltroNegocio('todos'); setBusca('')
  }

  async function handleDelete() {
    if (!confirmarDelete) return
    await deleteImovel.mutateAsync(confirmarDelete.id)
    toast.success('Imóvel excluído')
    setConfirmarDelete(null)
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Imóveis</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {imoveis.length} cadastrado(s){ativos > 0 || busca ? ` · ${filtrados.length} filtrado(s)` : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/imoveis/novo"><Plus className="h-4 w-4" />Novo Imóvel</Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por título, bairro, cidade ou código..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="alugado">Alugado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos tipos</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroNegocio} onValueChange={setFiltroNegocio}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos negócios</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(ativos > 0 || busca) && (
          <button onClick={limparFiltros} className="text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-1.5">
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Home className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum imóvel encontrado</p>
          <Button asChild className="mt-4">
            <Link to="/admin/imoveis/novo">Cadastrar primeiro imóvel</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Imóvel</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Preço</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map(imovel => (
                  <tr key={imovel.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                          {imovel.fotos[0] ? (
                            <img src={imovel.fotos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">{imovel.titulo}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {imovel.bairro ? `${imovel.bairro} · ` : ''}{imovel.cidade}, {imovel.estado}
                            {imovel.codigo ? ` · #${imovel.codigo}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-slate-600 font-medium">{TIPO_IMOVEL_LABELS[imovel.tipo_imovel]}</span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="font-bold text-slate-900">
                        {imovel.preco_venda
                          ? formatCurrency(imovel.preco_venda)
                          : imovel.preco_locacao
                          ? `${formatCurrency(imovel.preco_locacao)}/mês`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[imovel.status] ?? 'secondary'}>
                        {STATUS_LABEL[imovel.status] ?? imovel.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-400 hover:text-slate-700">
                          <a href={`/imoveis/${imovel.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-400 hover:text-orange-600">
                          <Link to={`/admin/imoveis/${imovel.id}/editar`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost" size="icon"
                            className={cn('h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50')}
                            onClick={() => setConfirmarDelete({ id: imovel.id, titulo: imovel.titulo })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!confirmarDelete} onOpenChange={open => !open && setConfirmarDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir imóvel</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>"{confirmarDelete?.titulo}"</strong>? Esta ação é irreversível e remove todas as fotos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteImovel.isPending}>
              {deleteImovel.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
