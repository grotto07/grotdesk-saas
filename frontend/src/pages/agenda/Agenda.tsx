import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Ordem {
  id: string
  numero: number
  cliente_nome: string
  equipamento: string
  status: string
  prioridade: string
  data_previsao: string
  data_entrada: string
}

const STATUS_CORES: any = {
  aberta:          '#F59E0B',
  em_andamento:    '#3B82F6',
  aguardando_peca: '#8B5CF6',
  pronta:          '#10B981',
  entregue:        '#6B7280',
  cancelada:       '#EF4444',
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function Agenda() {
  const [ordens, setOrdens]         = useState<Ordem[]>([])
  const [hoje]                      = useState(new Date())
  const [mesSel, setMesSel]         = useState(new Date().getMonth())
  const [anoSel, setAnoSel]         = useState(new Date().getFullYear())
  const [diaSel, setDiaSel]         = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [vistaAtual, setVistaAtual] = useState<'mes'|'semana'|'lista'>('mes')

  const carregar = async () => {
    setCarregando(true)
    try {
      const { data } = await api.get('/ordens', { params: { limite: 200 } })
      setOrdens(data.ordens.filter((o: Ordem) => o.data_previsao))
    } catch { toast.error('Erro ao carregar agenda') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  // Dias do mês selecionado
  const primeiroDia = new Date(anoSel, mesSel, 1).getDay()
  const totalDias   = new Date(anoSel, mesSel + 1, 0).getDate()

  const ordensNoDia = (dia: number) => {
    const dataStr = anoSel + '-' + String(mesSel + 1).padStart(2,'0') + '-' + String(dia).padStart(2,'0')
    return ordens.filter(o => o.data_previsao && o.data_previsao.startsWith(dataStr))
  }

  const ordensDiaSel = diaSel ? ordensNoDia(diaSel) : []

  const navMes = (dir: number) => {
    let m = mesSel + dir
    let a = anoSel
    if (m > 11) { m = 0; a++ }
    if (m < 0)  { m = 11; a-- }
    setMesSel(m); setAnoSel(a); setDiaSel(null)
  }

  // Ordens da semana atual
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  const ordensSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(inicioSemana.getDate() + i)
    const str = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
    return { data: d, ordens: ordens.filter(o => o.data_previsao && o.data_previsao.startsWith(str)) }
  })

  // Próximas OS (lista)
  const proximasOS = [...ordens]
    .filter(o => o.status !== 'entregue' && o.status !== 'cancelada')
    .sort((a, b) => new Date(a.data_previsao).getTime() - new Date(b.data_previsao).getTime())

  const CardOS = ({ o }: { o: Ordem }) => (
    <div style={{
      background: STATUS_CORES[o.status] + '18',
      borderLeft: '3px solid ' + STATUS_CORES[o.status],
      borderRadius: '0 6px 6px 0',
      padding: '4px 8px',
      marginBottom: 4,
      cursor: 'pointer'
    }}>
      <p style={{ margin:0, fontSize:11, fontWeight:600, color: STATUS_CORES[o.status] }}>OS #{o.numero}</p>
      <p style={{ margin:0, fontSize:11, color:'#374151', overflow:'hidden', whiteSpace:'nowrap' as any, textOverflow:'ellipsis' }}>{o.cliente_nome}</p>
      <p style={{ margin:0, fontSize:10, color:'#9CA3AF' }}>{o.equipamento}</p>
    </div>
  )

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Agenda</h2>
        <div style={{ display:'flex', gap:8 }}>
          {(['mes','semana','lista'] as const).map(v => (
            <button key={v} onClick={() => setVistaAtual(v)} style={{
              padding:'7px 14px', borderRadius:8, border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
              background: vistaAtual===v ? '#185FA5' : '#F3F4F6',
              color: vistaAtual===v ? '#fff' : '#374151'
            }}>{v === 'mes' ? 'Mes' : v === 'semana' ? 'Semana' : 'Lista'}</button>
          ))}
        </div>
      </div>

      {/* VISTA MES */}
      {vistaAtual === 'mes' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          {/* Nav mês */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.25rem', borderBottom:'1px solid #F3F4F6' }}>
            <button onClick={() => navMes(-1)} style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:16 }}>{'<'}</button>
            <h3 style={{ margin:0, fontSize:16, fontWeight:600 }}>{MESES[mesSel]} {anoSel}</h3>
            <button onClick={() => navMes(1)}  style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:16 }}>{'>'}</button>
          </div>

          {/* Dias da semana */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ padding:'8px', textAlign:'center', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #F3F4F6' }}>{d}</div>
            ))}
          </div>

          {/* Dias */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
            {Array.from({ length: primeiroDia }, (_, i) => (
              <div key={'e'+i} style={{ minHeight:100, padding:4, borderRight:'1px solid #F9FAFB', borderBottom:'1px solid #F9FAFB', background:'#FAFAFA' }}/>
            ))}
            {Array.from({ length: totalDias }, (_, i) => {
              const dia = i + 1
              const ehHoje = dia === hoje.getDate() && mesSel === hoje.getMonth() && anoSel === hoje.getFullYear()
              const selecionado = dia === diaSel
              const ordsDia = ordensNoDia(dia)
              return (
                <div key={dia} onClick={() => setDiaSel(dia === diaSel ? null : dia)}
                  style={{
                    minHeight:100, padding:4, borderRight:'1px solid #F9FAFB', borderBottom:'1px solid #F9FAFB',
                    background: selecionado ? '#EFF6FF' : ehHoje ? '#FEF9EE' : '#fff',
                    cursor:'pointer', transition:'background 0.1s'
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{
                      fontSize:13, fontWeight: ehHoje ? 700 : 500,
                      color: ehHoje ? '#fff' : selecionado ? '#1D4ED8' : '#374151',
                      background: ehHoje ? '#185FA5' : 'transparent',
                      borderRadius:'50%', width:24, height:24,
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>{dia}</span>
                    {ordsDia.length > 0 && (
                      <span style={{ fontSize:10, background:'#185FA5', color:'#fff', borderRadius:10, padding:'1px 6px', fontWeight:600 }}>
                        {ordsDia.length}
                      </span>
                    )}
                  </div>
                  {ordsDia.slice(0,2).map(o => <CardOS key={o.id} o={o} />)}
                  {ordsDia.length > 2 && <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>+{ordsDia.length-2} mais</p>}
                </div>
              )
            })}
          </div>

          {/* Detalhe do dia selecionado */}
          {diaSel && (
            <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #E5E7EB', background:'#F9FAFB' }}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600 }}>
                OS previstas para {String(diaSel).padStart(2,'0')}/{String(mesSel+1).padStart(2,'0')}/{anoSel}
                {ordensDiaSel.length === 0 && ' — Nenhuma OS'}
              </h4>
              {ordensDiaSel.map(o => (
                <div key={o.id} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'10px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:600, color:'#185FA5' }}>OS #{o.numero}</span>
                    <span style={{ fontSize:13, color:'#374151', marginLeft:8 }}>{o.cliente_nome}</span>
                    <span style={{ fontSize:13, color:'#6B7280', marginLeft:8 }}>— {o.equipamento}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, color:STATUS_CORES[o.status], background:STATUS_CORES[o.status]+'20', padding:'3px 10px', borderRadius:20, fontWeight:600 }}>
                      {o.status?.replace('_',' ')}
                    </span>
                    <span style={{ fontSize:11, color: o.prioridade==='urgente'?'#EF4444':o.prioridade==='alta'?'#F59E0B':'#6B7280', fontWeight:500 }}>
                      {o.prioridade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA SEMANA */}
      {vistaAtual === 'semana' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #F3F4F6' }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>Semana atual</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
            {ordensSemana.map(({ data, ordens: ords }, i) => {
              const ehHoje = data.toDateString() === hoje.toDateString()
              return (
                <div key={i} style={{ borderRight: i < 6 ? '1px solid #F3F4F6' : 'none', padding:'12px 8px', minHeight:200 }}>
                  <div style={{ textAlign:'center', marginBottom:10 }}>
                    <p style={{ margin:0, fontSize:11, color:'#9CA3AF', fontWeight:500 }}>{DIAS_SEMANA[i]}</p>
                    <p style={{ margin:'2px 0 0', fontSize:16, fontWeight:700,
                      color: ehHoje ? '#fff' : '#374151',
                      background: ehHoje ? '#185FA5' : 'transparent',
                      borderRadius:'50%', width:28, height:28,
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>{data.getDate()}</p>
                  </div>
                  {ords.length === 0 ? (
                    <p style={{ fontSize:11, color:'#E5E7EB', textAlign:'center' }}>—</p>
                  ) : (
                    ords.map(o => <CardOS key={o.id} o={o} />)
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA LISTA */}
      {vistaAtual === 'lista' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #F3F4F6' }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>Proximas entregas</h3>
          </div>
          {carregando ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
          ) : proximasOS.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Nenhuma OS com previsao de entrega.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  {['OS','Cliente','Equipamento','Status','Prioridade','Previsao'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proximasOS.map((o, i) => {
                  const prev    = new Date(o.data_previsao)
                  const atrasada = prev < hoje && o.status !== 'entregue'
                  return (
                    <tr key={o.id} style={{ background: atrasada ? '#FEF2F2' : i%2===0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color:'#3B82F6' }}>#{o.numero}</td>
                      <td style={{ padding:'11px 14px', fontSize:13 }}>{o.cliente_nome}</td>
                      <td style={{ padding:'11px 14px', fontSize:13 }}>{o.equipamento}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:STATUS_CORES[o.status]+'20', color:STATUS_CORES[o.status], padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 }}>
                          {o.status?.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:13, color: o.prioridade==='urgente'?'#EF4444':o.prioridade==='alta'?'#F59E0B':'#6B7280', fontWeight:500 }}>
                        {o.prioridade}
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:13, fontWeight: atrasada ? 700 : 400, color: atrasada ? '#EF4444' : '#374151' }}>
                        {prev.toLocaleDateString('pt-BR')}
                        {atrasada && <span style={{ fontSize:11, marginLeft:6, color:'#EF4444' }}>ATRASADA</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Legenda */}
      <div style={{ display:'flex', gap:16, marginTop:'1rem', flexWrap:'wrap' as any }}>
        {Object.entries(STATUS_CORES).map(([k, v]: any) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:v }}/>
            <span style={{ fontSize:12, color:'#6B7280' }}>{k.replace('_',' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
