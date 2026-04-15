import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import { ImpressaoOS } from '../../components/ImpressaoOS'
import { useAuth } from '../../contexts/AuthContext'
import PainelWhatsApp from '../../components/PainelWhatsApp'

interface Ordem {
  id: string
  numero: number
  cliente_nome: string
  cliente_telefone: string
  equipamento: string
  marca: string
  modelo: string
  problema: string
  diagnostico: string
  solucao: string
  status: string
  prioridade: string
  valor_servico: number
  valor_pecas: number
  valor_total: number
  data_entrada: string
  data_previsao: string
  tecnico_nome: string
  observacoes: string
}

interface Cliente { id: string; nome: string; telefone: string }

const STATUS_CORES: any = {
  aberta:          { bg:'#FEF3C7', cor:'#92400E', label:'Aberta' },
  em_andamento:    { bg:'#DBEAFE', cor:'#1E40AF', label:'Em andamento' },
  aguardando_peca: { bg:'#EDE9FE', cor:'#5B21B6', label:'Aguard. peça' },
  pronta:          { bg:'#D1FAE5', cor:'#065F46', label:'Pronta' },
  entregue:        { bg:'#F3F4F6', cor:'#374151', label:'Entregue' },
  cancelada:       { bg:'#FEE2E2', cor:'#991B1B', label:'Cancelada' },
}

const PRIORIDADE_CORES: any = {
  baixa:   '#6B7280',
  normal:  '#3B82F6',
  alta:    '#F59E0B',
  urgente: '#EF4444',
}

const vazio = {
  id:'', cliente_id:'', equipamento:'', marca:'', modelo:'',
  numero_serie:'', problema:'', diagnostico:'', solucao:'',
  status:'aberta', prioridade:'normal', valor_servico:0,
  valor_pecas:0, data_previsao:'', observacoes:''
}

export default function Ordens() {
  const [imprimindo, setImprimindo] = useState<{id:string, tipo:'os'|'garantia'} | null>(null)
  const { usuario } = useAuth()
  const [whatsapp, setWhatsapp] = useState<any | null>(null)
  const [ordens, setOrdens]       = useState<Ordem[]>([])
  const [total, setTotal]         = useState(0)
  const [busca, setBusca]         = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [pagina, setPagina]       = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal]         = useState<'form'|'detalhe'|null>(null)
  const [form, setForm]           = useState<any>(vazio)
  const [ordemAtual, setOrdemAtual] = useState<Ordem|null>(null)
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [salvando, setSalvando]   = useState(false)

  const carregar = async (p = 1, b = busca, s = filtroStatus) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/ordens', {
        params: { pagina: p, limite: 15, busca: b || undefined, status: s || undefined }
      })
      setOrdens(data.ordens)
      setTotal(data.total)
      setPagina(p)
    } catch { toast.error('Erro ao carregar ordens') }
    finally { setCarregando(false) }
  }

  const carregarClientes = async () => {
    try {
      const { data } = await api.get('/clientes', { params: { limite: 100 } })
      setClientes(data.clientes)
    } catch {}
  }

  useEffect(() => { carregar(); carregarClientes() }, [])

  const abrirNova = () => { setForm(vazio); setModal('form') }
  const abrirEditar = (o: Ordem) => {
    setForm({ ...o, cliente_id: '' })
    setModal('form')
  }
  const abrirDetalhe = (o: Ordem) => { setOrdemAtual(o); setModal('detalhe') }
  const fechar = () => { setModal(null); setForm(vazio); setOrdemAtual(null) }

  const salvar = async () => {
    if (!form.cliente_id && !form.id) return toast.error('Selecione um cliente')
    if (!form.equipamento) return toast.error('Equipamento é obrigatório')
    if (!form.problema) return toast.error('Descreva o problema')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/ordens/${form.id}`, form)
        toast.success('OS atualizada!')
      } else {
        await api.post('/ordens', form)
        toast.success('OS criada!')
      }
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const mudarStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/ordens/${id}/status`, { status })
      toast.success('Status atualizado!')
      carregar()
      if (ordemAtual?.id === id) {
        setOrdemAtual(prev => prev ? { ...prev, status } : null)
      }
    } catch { toast.error('Erro ao atualizar status') }
  }

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
      <input type={type} value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box' as any, outline:'none' }}
      />
    </div>
  )

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Ordens de Serviço</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{total} OS no total</p>
        </div>
        <button onClick={abrirNova} style={{
          background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
          padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer'
        }}>+ Nova OS</button>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:'1rem', flexWrap:'wrap' }}>
        <input value={busca}
          onChange={e => { setBusca(e.target.value); setTimeout(() => carregar(1, e.target.value, filtroStatus), 400) }}
          placeholder="Buscar por cliente, equipamento ou nº OS..."
          style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none' }}
        />
        <select value={filtroStatus}
          onChange={e => { setFiltroStatus(e.target.value); carregar(1, busca, e.target.value) }}
          style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CORES).map(([k, v]: any) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {carregando ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
        ) : ordens.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
            {busca || filtroStatus ? 'Nenhuma OS encontrada.' : 'Nenhuma OS cadastrada ainda.'}
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['OS','Cliente','Equipamento','Prioridade','Status','Valor','Data','Ações'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordens.map((o, i) => {
                const st = STATUS_CORES[o.status] || STATUS_CORES.aberta
                return (
                  <tr key={o.id} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color:'#3B82F6' }}>#{o.numero}</td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>
                      <div style={{ fontWeight:500 }}>{o.cliente_nome}</div>
                      <div style={{ fontSize:12, color:'#9CA3AF' }}>{o.cliente_telefone}</div>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>
                      <div>{o.equipamento}</div>
                      {o.marca && <div style={{ fontSize:12, color:'#9CA3AF' }}>{o.marca} {o.modelo}</div>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:PRIORIDADE_CORES[o.prioridade], display:'inline-block', marginRight:6 }}/>
                      <span style={{ fontSize:12 }}>{o.prioridade}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:st.bg, color:st.cor, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500 }}>
                      R${Number(o.valor_total||0).toFixed(2)}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6B7280' }}>
                      {new Date(o.data_entrada).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => abrirDetalhe(o)} style={{ background:'#EFF6FF', color:'#1D4ED8', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer', marginRight:4 }}>Ver</button>
                      <button onClick={() => abrirEditar(o)} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>Editar</button>
                      <button onClick={() => setImprimindo({id: o.id, tipo:'os'})} style={{ background:'#F0FDF4', color:'#065F46', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginLeft:4 }}>OS</button>
                      <button onClick={() => setImprimindo({id: o.id, tipo:'garantia'})} style={{ background:'#EFF6FF', color:'#1D4ED8', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginLeft:4 }}>Garantia</button>
                      <button onClick={() => setWhatsapp(o)} style={{ background:'#D1FAE5', color:'#065F46', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginLeft:4 }}>WhatsApp</button>                   
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORMULÁRIO */}
      {modal === 'form' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:580, maxHeight:'92vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>
              {form.id ? `Editar OS #${form.numero}` : 'Nova Ordem de Serviço'}
            </h3>

            {!form.id && (
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Cliente *</label>
                <select value={form.cliente_id} onChange={e => setForm((f: any) => ({ ...f, cliente_id: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `- ${c.telefone}` : ''}</option>)}
                </select>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>{inp('Equipamento *','equipamento','text','Notebook, PC, Celular...')}</div>
              {inp('Marca','marca','text','Dell, Samsung...')}
              {inp('Modelo','modelo','text','Inspiron 15...')}
              {inp('Número de série','numero_serie','text','')}
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Prioridade</label>
                <select value={form.prioridade} onChange={e => setForm((f: any) => ({ ...f, prioridade: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              {inp('Previsão de entrega','data_previsao','date','')}
              {inp('Valor serviço (R$)','valor_servico','number','')}
              {inp('Valor peças (R$)','valor_pecas','number','')}
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Problema relatado *</label>
              <textarea value={form.problema} rows={3} placeholder="Descreva o problema relatado pelo cliente..."
                onChange={e => setForm((f: any) => ({ ...f, problema: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box' as any, outline:'none', resize:'vertical' }}/>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Diagnóstico técnico</label>
              <textarea value={form.diagnostico || ''} rows={2} placeholder="Diagnóstico encontrado pelo técnico..."
                onChange={e => setForm((f: any) => ({ ...f, diagnostico: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box' as any, outline:'none', resize:'vertical' }}/>
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Solução aplicada</label>
              <textarea value={form.solucao || ''} rows={2} placeholder="O que foi feito para resolver..."
                onChange={e => setForm((f: any) => ({ ...f, solucao: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box' as any, outline:'none', resize:'vertical' }}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={fechar} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background: salvando ? '#93C5FD' : '#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor: salvando ? 'not-allowed' : 'pointer' }}>
                {salvando ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar OS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHE */}
      {modal === 'detalhe' && ordemAtual && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:600 }}>OS #{ordemAtual.numero}</h3>
              <button onClick={fechar} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Fechar</button>
            </div>

            {/* Status atual + mudar */}
            <div style={{ background:'#F9FAFB', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#6B7280', margin:'0 0 8px' }}>ALTERAR STATUS</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {Object.entries(STATUS_CORES).map(([k, v]: any) => (
                  <button key={k} onClick={() => mudarStatus(ordemAtual.id, k)}
                    style={{ padding:'5px 12px', borderRadius:20, border:'2px solid', fontSize:12, fontWeight:500, cursor:'pointer',
                      borderColor: ordemAtual.status === k ? v.cor : 'transparent',
                      background: ordemAtual.status === k ? v.bg : '#fff',
                      color: v.cor }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados */}
            {[
              ['Cliente', ordemAtual.cliente_nome],
              ['Telefone', ordemAtual.cliente_telefone],
              ['Equipamento', `${ordemAtual.equipamento} ${ordemAtual.marca || ''} ${ordemAtual.modelo || ''}`],
              ['Problema', ordemAtual.problema],
              ['Diagnóstico', ordemAtual.diagnostico || '—'],
              ['Solução', ordemAtual.solucao || '—'],
              ['Valor serviço', `R$${Number(ordemAtual.valor_servico||0).toFixed(2)}`],
              ['Valor peças', `R$${Number(ordemAtual.valor_pecas||0).toFixed(2)}`],
              ['Total', `R$${Number(ordemAtual.valor_total||0).toFixed(2)}`],
              ['Entrada', new Date(ordemAtual.data_entrada).toLocaleDateString('pt-BR')],
              ['Previsão', ordemAtual.data_previsao ? new Date(ordemAtual.data_previsao).toLocaleDateString('pt-BR') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
                <span style={{ color:'#6B7280', fontWeight:500 }}>{k}</span>
                <span style={{ color:'#111827', maxWidth:'60%', textAlign:'right' }}>{v}</span>
              </div>
            ))}

            <button onClick={() => { fechar(); abrirEditar(ordemAtual) }}
              style={{ width:'100%', marginTop:'1.25rem', padding:'10px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Editar OS
            </button>
          </div>
        </div>
      )}
      {imprimindo && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'#fff', overflow:'auto' }}>
          <ImpressaoOS
            ordemId={imprimindo.id}
            tipo={imprimindo.tipo}
            empresa={{ nome: usuario?.nome_empresa || 'Assistencia Tecnica' }}
            onFechar={() => setImprimindo(null)}
          />
        </div>
      )}

      {whatsapp && (
        <PainelWhatsApp
          ordem={whatsapp}
          empresa={usuario?.nome_empresa || 'Assistencia Tecnica'}
          onFechar={() => setWhatsapp(null)}
        />
      )}

    </div>
  )
}

