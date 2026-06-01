import { Link } from 'react-router-dom'
import {
  Building, Home, FileText, CalendarDays, TrendingUp, Users,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useDashboardStats, useImoveisAdmin, useAgendamentos, useContratos } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'

const PIE_COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b']

export default function AdminDashboard() {
  const { data: stats } = useDashboardStats()
  const { data: imoveis = [] } = useImoveisAdmin()
  const { data: agendamentos = [] } = useAgendamentos()
  const { data: contratos = [] } = useContratos()

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const agendamentosMes = agendamentos.filter(a => {
    const d = new Date(a.data_hora)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length

  const kpis = [
    { label: 'Total de imóveis', value: stats?.totalImoveis ?? 0, icon: Building, color: 'text-slate-600', bg: 'bg-slate-100', link: '/admin/imoveis' },
    { label: 'Disponíveis', value: stats?.imoveisDisponiveis ?? 0, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-100', link: '/admin/imoveis' },
    { label: 'Contratos ativos', value: stats?.contratosAtivos ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/contratos' },
    { label: 'Agendamentos/mês', value: agendamentosMes, icon: CalendarDays, color: 'text-orange-600', bg: 'bg-orange-100', link: '/admin/agendamentos' },
    { label: 'Proprietários', value: stats?.totalProprietarios ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-100', link: '/admin/proprietarios' },
    {
      label: 'Receita em contratos',
      value: formatCurrency(stats?.receitaTotal ?? 0),
      icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100',
      link: '/admin/contratos', isText: true,
    },
  ]

  const typeData = ['casa', 'apartamento', 'terreno', 'comercial'].map(t => ({
    name: t === 'apartamento' ? 'Apto' : t.charAt(0).toUpperCase() + t.slice(1),
    value: imoveis.filter(i => i.tipo_imovel === t).length,
  }))

  const statusData = [
    { name: 'Disponível', key: 'disponivel' },
    { name: 'Vendido', key: 'vendido' },
    { name: 'Alugado', key: 'alugado' },
    { name: 'Inativo', key: 'inativo' },
  ]
    .map(s => ({ name: s.name, value: imoveis.filter(i => i.status === s.key).length }))
    .filter(d => d.value > 0)

  const upcoming = agendamentos
    .filter(a => new Date(a.data_hora) >= now && ['pendente', 'confirmado'].includes(a.status))
    .slice(0, 5)

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Visão Geral</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Principais indicadores da imobiliária.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <Link
            key={i}
            to={kpi.link}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${kpi.bg}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-heading font-extrabold text-slate-900 leading-none group-hover:text-orange-600 transition-colors ${kpi.isText ? 'text-base' : 'text-2xl'}`}>
                {kpi.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 truncate">{kpi.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Imóveis por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="value" name="Imóveis" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Status do Portfólio</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm font-medium">Sem dados ainda</div>
          )}
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800">Próximos Agendamentos</h3>
          <Link to="/admin/agendamentos" className="text-xs font-bold text-orange-600 hover:text-orange-700">Ver todos</Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{a.nome_cliente}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    {a.imovel ? ` · ${a.imovel.titulo}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${a.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {a.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum agendamento próximo</p>
          </div>
        )}
      </div>

      {/* Contratos recentes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800">Contratos Recentes</h3>
          <Link to="/admin/contratos" className="text-xs font-bold text-orange-600 hover:text-orange-700">Ver todos</Link>
        </div>
        {contratos.length > 0 ? (
          <div className="space-y-3">
            {contratos.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.nome_cliente}</p>
                  <p className="text-xs text-slate-500">{c.imovel?.titulo ?? '—'} · {formatCurrency(c.valor)}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${c.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : c.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.status === 'ativo' ? 'Ativo' : c.status === 'pendente' ? 'Pendente' : 'Encerrado'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum contrato cadastrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
