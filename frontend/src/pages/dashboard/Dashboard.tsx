import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

interface Metricas {
  total_ordens: number
  ordens_abertas: number
  ordens_hoje: number
  total_clientes: number
  receita_mes: number
  ticket_medio: number
  estoque_baixo: number
  orcamentos_pendentes: number
}

const CardMetrica = ({ label, valor, cor, sub }: any) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '1.25rem',
    border: '1px solid #E5E7EB', flex: 1, minWidth: 160
  }}>
    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px', fontWeight: 500 }}>
      {label}
    </p>
    <p style={{ fontSize: 28, fontWeight: 700, color: cor || '#111827', margin: 0 }}>
      {valor}
    </p>
    {sub && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{sub}</p>}
  </div>
)

export default function Dashboard() {
  const { usuario } = useAuth()
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const [mRes, oRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/ordens?limite=5')
        ])
        setMetricas(mRes.data)
        setOrdens(oRes.data.ordens || [])
      } catch {
        // usa dados zerados se API ainda não tiver rota de dashboard
        setMetricas({
          total_ordens: 0, ordens_abertas: 0, ordens_hoje: 0,
          total_clientes: 0, receita_mes: 0, ticket_medio: 0,
          estoque_baixo: 0, orcamentos_pendentes: 0
        })
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const statusCor: any = {
    aberta: '#F59E0B', em_andamento: '#3B82F6', aguardando_peca: '#8B5CF6',
    pronta: '#10B981', entregue: '#6B7280', cancelada: '#EF4444'
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: '#6B7280' }}>
      Carregando...
    </div>
  )

  return (
    <div>
      {/* Boas vindas */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>
          Olá, {usuario?.nome?.split(' ')[0]}!
        </h2>
        <p style={{ color: '#6B7280', margin: '4px 0 0', fontSize: 14 }}>
          Aqui está o resumo de hoje
        </p>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <CardMetrica label="OS abertas"        valor={metricas?.ordens_abertas}    cor="#F59E0B" sub="em andamento" />
        <CardMetrica label="OS hoje"           valor={metricas?.ordens_hoje}       cor="#3B82F6" sub="novas hoje" />
        <CardMetrica label="Total clientes"    valor={metricas?.total_clientes}    cor="#111827" />
        <CardMetrica label="Receita do mês"    valor={`R$${(metricas?.receita_mes || 0).toFixed(0)}`} cor="#10B981" />
        <CardMetrica label="Orç. pendentes"    valor={metricas?.orcamentos_pendentes} cor="#8B5CF6" />
        <CardMetrica label="Estoque baixo"     valor={metricas?.estoque_baixo}     cor="#EF4444" sub="itens abaixo do mínimo" />
      </div>

      {/* Últimas ordens */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Últimas ordens de serviço</h3>
          <a href="/ordens" style={{ fontSize: 13, color: '#3B82F6', textDecoration: 'none' }}>
            Ver todas →
          </a>
        </div>

        {ordens.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Nenhuma ordem cadastrada ainda.{' '}
            <a href="/ordens/nova" style={{ color: '#3B82F6' }}>Criar primeira OS</a>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['OS', 'Cliente', 'Equipamento', 'Status', 'Valor', 'Data'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordens.map((os, i) => (
                <tr key={os.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>
                    #{os.numero}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{os.cliente_nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{os.equipamento}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: statusCor[os.status] + '20',
                      color: statusCor[os.status],
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500
                    }}>
                      {os.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                    R${Number(os.valor_total || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>
                    {new Date(os.data_entrada).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
