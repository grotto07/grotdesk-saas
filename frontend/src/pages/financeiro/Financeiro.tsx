import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Lancamento {
  id: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  status: string
  vencimento: string
  pago_em: string
  criado_em: string
}

interface Resumo {
  receitas: number
  despesas: number
  a_receber: number
  a_pagar: number
}

const CATEGORIAS_RECEITA = ['Serviço','Venda de peça','Conserto','Formatação','Limpeza','Outro']
const CATEGORIAS_DESPESA = ['Aluguel','Energia','Internet','Peças','Ferramentas','Salário','Imposto','Marketing','Outro']

const vazio = { id:'', tipo:'receita', categoria:'', descricao:'', valor:0, status:'pendente', vencimento:'' }

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [resumo, setResumo]           = useState<Resumo>({ receitas:0, despesas:0, a_receber:0, a_pagar:0 })
  const [total, setTotal]             = useState(0)
  const [filtroTipo, setFiltroTipo]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando]   = useState(true)
  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState<any>(vazio)
  const [salvando, setSalvando]       = useState(false)

  const carregar = async (tipo = filtroTipo, status = filtroStatus) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/financeiro', {
        params: { tipo: tipo||undefined, status: status||undefined, limite: 50 }
      })
      setLancamentos(data.lancamentos)
      setTotal(data.total)
      setResumo(data.resumo)
    } catch { toast.error('Erro ao carregar financeiro') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo  = () => { setForm(vazio); setModal(true) }
  const fechar     = () => { setModal(false); setForm(vazio) }

  const salvar = async () => {
    if (!form.descricao) return toast.error('Descrição é obrigatória')
    if (!form.valor || form.valor <= 0) return toast.error('Valor inválido')
    setSalvando(true)
    try {
      await api.post('/financeiro', form)
      toast.success('Lançamento criado!')
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const pagar = async (id: string) => {
    try {
      await api.patch(`/financeiro/${id}/pagar`)
      toast.success('Marcado como pago!')
      carregar()
    } catch { toast.error('Erro ao atualizar') }
  }

  const deletar = async (id: string) => {
    if (!window.confirm('Remover este lançamento?')) return
    try {
      await api.delete(`/financeiro/${id}`)
      toast.success('Removido!')
      carregar()
    } catch { toast.error('Erro ao remover') }
  }

  const saldo = Number(resumo.receitas) - Number(resumo.despesas)

  const CardResumo = ({ label, valor, cor, sub }: any) => (
    <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', border:'1px solid #E5E7EB', flex:1 }}>
      <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 6px', fontWeight:500 }}>{label}</p>
      <p style={{ fontSize:24, fontWeight:700, color: cor||'#111827', margin:0 }}>R${Number(valor||0).toFixed(2)}</p>
      {sub && <p style={{ fontSize:12, color:'#9CA3AF', margin:'4px 0 0' }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Financeiro</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Resumo do mês atual</p>
        </div>
        <button onClick={abrirNovo} style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Novo lançamento
        </button>
      </div>

      {/* Cards resumo */}
      <div style={{ display:'flex', gap:14, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <CardResumo label="Receitas pagas"  valor={resumo.receitas}  cor="#059669" />
        <CardResumo label="Despesas pagas"  valor={resumo.despesas}  cor="#DC2626" />
        <CardResumo label="Saldo do mês"    valor={saldo}            cor={saldo>=0?'#059669':'#DC2626'} sub={saldo>=0?'positivo':'negativo'} />
        <CardResumo label="A receber"       valor={resumo.a_receber} cor="#F59E0B" sub="pendente" />
        <CardResumo label="A pagar"         valor={resumo.a_pagar}   cor="#EF4444" sub="pendente" />
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); carregar(e.target.value, filtroStatus) }}
          style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
          <option value="">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); carregar(filtroTipo, e.target.value) }}
          style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {carregando ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
        ) : lancamentos.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Nenhum lançamento encontrado.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['Tipo','Descrição','Categoria','Valor','Vencimento','Status','Ações'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l, i) => (
                <tr key={l.id} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{
                      background: l.tipo==='receita' ? '#D1FAE5' : '#FEE2E2',
                      color: l.tipo==='receita' ? '#065F46' : '#991B1B',
                      padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500
                    }}>
                      {l.tipo==='receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500 }}>{l.descricao}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'#6B7280' }}>{l.categoria||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color: l.tipo==='receita'?'#059669':'#DC2626' }}>
                    R${Number(l.valor).toFixed(2)}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'#6B7280' }}>
                    {l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{
                      background: l.status==='pago' ? '#D1FAE5' : '#FEF3C7',
                      color: l.status==='pago' ? '#065F46' : '#92400E',
                      padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500
                    }}>
                      {l.status==='pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {l.status === 'pendente' && (
                      <button onClick={() => pagar(l.id)} style={{ background:'#D1FAE5', color:'#065F46', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>
                        Marcar pago
                      </button>
                    )}
                    <button onClick={() => deletar(l.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer' }}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:460 }}>
            <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>Novo lançamento</h3>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Tipo</label>
              <div style={{ display:'flex', gap:10 }}>
                {['receita','despesa'].map(t => (
                  <button key={t} onClick={() => setForm((f: any) => ({ ...f, tipo: t, categoria: '' }))}
                    style={{ flex:1, padding:'9px', borderRadius:8, border:'2px solid', cursor:'pointer', fontSize:14, fontWeight:500,
                      borderColor: form.tipo===t ? (t==='receita'?'#059669':'#DC2626') : '#E5E7EB',
                      background: form.tipo===t ? (t==='receita'?'#D1FAE5':'#FEE2E2') : '#fff',
                      color: form.tipo===t ? (t==='receita'?'#065F46':'#991B1B') : '#6B7280' }}>
                    {t==='receita' ? 'Receita' : 'Despesa'}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label:'Descrição *', key:'descricao', type:'text', placeholder:'Ex: Formatação notebook cliente João' },
              { label:'Valor (R$) *', key:'valor', type:'number', placeholder:'0.00' },
              { label:'Vencimento', key:'vencimento', type:'date', placeholder:'' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>{label}</label>
                <input type={type} value={form[key]||''} placeholder={placeholder}
                  onChange={e => setForm((f: any) => ({ ...f, [key]: type==='number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            ))}

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Categoria</label>
              <select value={form.categoria} onChange={e => setForm((f: any) => ({ ...f, categoria: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                <option value="">Selecione...</option>
                {(form.tipo==='receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Status</label>
              <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                <option value="pendente">Pendente</option>
                <option value="pago">Já pago/recebido</option>
              </select>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={fechar} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background: salvando?'#93C5FD':'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {salvando ? 'Salvando...' : 'Criar lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
