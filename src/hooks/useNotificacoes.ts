import { useMemo } from 'react'
import { useAgendamentos, useContratos } from '@/lib/queries'

export interface Notificacao {
  id: string
  tipo: 'agendamento_pendente' | 'agendamento_hoje' | 'contrato_vencendo'
  titulo: string
  descricao: string
  link: string
  data: string
}

const MS_DIA = 1000 * 60 * 60 * 24

export function useNotificacoes() {
  const { data: agendamentos = [] } = useAgendamentos()
  const { data: contratos = [] } = useContratos()

  return useMemo<Notificacao[]>(() => {
    const agora = new Date()
    const hojeStr = agora.toISOString().slice(0, 10)
    const lista: Notificacao[] = []

    for (const a of agendamentos) {
      if (a.status !== 'pendente') continue
      const data = new Date(a.data_hora)
      const isHoje = a.data_hora.slice(0, 10) === hojeStr
      lista.push({
        id: `ag-${a.id}`,
        tipo: isHoje ? 'agendamento_hoje' : 'agendamento_pendente',
        titulo: isHoje ? 'Visita hoje' : 'Agendamento pendente',
        descricao: `${a.nome_cliente} · ${data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`,
        link: '/admin/agendamentos',
        data: a.data_hora,
      })
    }

    for (const c of contratos) {
      if (c.status !== 'ativo' || !c.data_fim) continue
      const fim = new Date(c.data_fim)
      const dias = Math.floor((fim.getTime() - agora.getTime()) / MS_DIA)
      if (dias < 0 || dias > 30) continue
      lista.push({
        id: `ct-${c.id}`,
        tipo: 'contrato_vencendo',
        titulo: dias === 0 ? 'Contrato vence hoje' : `Contrato vence em ${dias} dia${dias === 1 ? '' : 's'}`,
        descricao: `${c.nome_cliente} · ${c.imovel?.titulo ?? '—'}`,
        link: '/admin/contratos',
        data: c.data_fim,
      })
    }

    return lista.sort((a, b) => a.data.localeCompare(b.data))
  }, [agendamentos, contratos])
}
