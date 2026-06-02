import { useState } from 'react'
import { History, Plus, Pencil, Trash2, FileQuestion } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuditLog } from '@/lib/queries'
import { cn } from '@/lib/utils'

const TABELA_LABEL: Record<string, string> = {
  imoveis: 'Imóveis',
  proprietarios: 'Proprietários',
  contratos: 'Contratos',
  agendamentos: 'Agendamentos',
  usuarios: 'Equipe',
  configuracoes: 'Configurações',
}

const ACAO_LABEL: Record<string, { label: string; icon: typeof Plus; cls: string }> = {
  INSERT: { label: 'Criou', icon: Plus, cls: 'bg-emerald-50 text-emerald-700' },
  UPDATE: { label: 'Editou', icon: Pencil, cls: 'bg-blue-50 text-blue-700' },
  DELETE: { label: 'Excluiu', icon: Trash2, cls: 'bg-rose-50 text-rose-700' },
}

export default function Historico() {
  const [tabela, setTabela] = useState('todas')
  const [acao, setAcao] = useState('todas')
  const { data: logs = [], isLoading, error } = useAuditLog({ tabela, acao })

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-orange-500" /> Histórico
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Auditoria de criações, edições e exclusões.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={tabela} onValueChange={setTabela}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as áreas</SelectItem>
            {Object.entries(TABELA_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={acao} onValueChange={setAcao}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as ações</SelectItem>
            <SelectItem value="INSERT">Criações</SelectItem>
            <SelectItem value="UPDATE">Edições</SelectItem>
            <SelectItem value="DELETE">Exclusões</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <p className="font-bold mb-1">Tabela <code>audit_log</code> não encontrada.</p>
          <p className="text-amber-700">Execute <code>supabase-extras.sql</code> no SQL Editor do Supabase para habilitar a auditoria.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <FileQuestion className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const acaoCfg = ACAO_LABEL[log.acao] ?? ACAO_LABEL.UPDATE
            const Icon = acaoCfg.icon
            return (
              <div key={log.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', acaoCfg.cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-bold text-slate-900">{log.usuario_email ?? 'Sistema'}</span>
                    <span className="text-slate-500"> {acaoCfg.label.toLowerCase()} em </span>
                    <span className="font-bold text-slate-900">{TABELA_LABEL[log.tabela] ?? log.tabela}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    {log.registro_id ? ` · #${log.registro_id.slice(0, 8)}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
