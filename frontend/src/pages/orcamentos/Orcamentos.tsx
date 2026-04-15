import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Item { descricao: string; quantidade: number; valor_unitario: number }
interface Orcamento {
  id: string; numero: number; cliente_nome: string; cliente_telefone: string
  cliente_email: string; status: string; itens: Item[]; subtotal: number
  desconto: number; total: number; validade_dias: number; observacoes: string
  criado_em: string; enviado_em: string
}
interface Cliente { id: string; nome: string; telefone: string }
interface Servico { id: string; nome: string; preco: number; categoria: string; descricao: string }
interface Produto { id: string; nome: string; preco_venda: number; categoria: string; quantidade: number }

const STATUS: any = {
  pendente:  { bg:'#FEF3C7', cor:'#92400E', label:'Pendente' },
  enviado:   { bg:'#DBEAFE', cor:'#1E40AF', label:'Enviado' },
  aprovado:  { bg:'#D1FAE5', cor:'#065F46', label:'Aprovado' },
  recusado:  { bg:'#FEE2E2', cor:'#991B1B', label:'Recusado' },
  expirado:  { bg:'#F3F4F6', cor:'#374151', label:'Expirado' },
}

const itemVazio: Item = { descricao:'', quantidade:1, valor_unitario:0 }

export default function Orcamentos() {
  const [orcamentos, setOrcamentos]   = useState<Orcamento[]>([])
  const [total, setTotal]             = useState(0)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando]   = useState(true)
  const [modal, setModal]             = useState<'form'|'detalhe'|'msg'|null>(null)
  const [orcAtual, setOrcAtual]       = useState<Orcamento|null>(null)
  const [clientes, setClientes]       = useState<Cliente[]>([])
  const [servicos, setServicos]       = useState<Servico[]>([])
  const [produtos, setProdutos]       = useState<Produto[]>([])
  const [form, setForm]               = useState({ cliente_id:'', desconto:0, validade_dias:7, observacoes:'' })
  const [itens, setItens]             = useState<Item[]>([{ ...itemVazio }])
  const [salvando, setSalvando]       = useState(false)
  const [mensagem, setMensagem]       = useState('')
  const [telWhats, setTelWhats]       = useState('')
  const [abaCatalogo, setAbaCatalogo] = useState<'servicos'|'produtos'>('servicos')
  const [buscaCatalogo, setBuscaCatalogo] = useState('')

  const carregar = async (s = filtroStatus) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/orcamentos', { params: { status: s||undefined, limite:50 } })
      setOrcamentos(data.orcamentos); setTotal(data.total)
    } catch { toast.error('Erro ao carregar orcamentos') }
    finally { setCarregando(false) }
  }

  const carregarCatalogos = async () => {
    try {
      const [cRes, sRes, pRes] = await Promise.all([
        api.get('/clientes', { params: { limite:100 } }),
        api.get('/servicos'),
        api.get('/estoque', { params: { limite:100 } }),
      ])
      setClientes(cRes.data.clientes)
      setServicos(sRes.data.servicos.filter((s: Servico & { ativo: boolean }) => s.ativo))
      setProdutos(pRes.data.produtos.filter((p: Produto) => p.quantidade > 0))
    } catch {}
  }

  useEffect(() => { carregar(); carregarCatalogos() }, [])

  const abrirNovo = () => {
    setForm({ cliente_id:'', desconto:0, validade_dias:7, observacoes:'' })
    setItens([{ ...itemVazio }]); setModal('form')
  }
  const abrirDetalhe = (o: Orcamento) => { setOrcAtual(o); setModal('detalhe') }
  const fechar = () => { setModal(null); setOrcAtual(null) }

  // Adicionar serviço ao carrinho
  const addServico = (s: Servico) => {
    const existe = itens.findIndex(i => i.descricao === s.nome)
    if (existe >= 0) {
      setItens(prev => prev.map((it, j) => j === existe ? { ...it, quantidade: it.quantidade + 1 } : it))
    } else {
      setItens(prev => {
        const novo = [...prev]
        if (novo.length === 1 && !novo[0].descricao) novo[0] = { descricao: s.nome, quantidade: 1, valor_unitario: s.preco }
        else novo.push({ descricao: s.nome, quantidade: 1, valor_unitario: s.preco })
        return novo
      })
    }
    toast.success(s.nome + ' adicionado!', { autoClose: 1000 })
  }

  // Adicionar produto ao carrinho
  const addProduto = (p: Produto) => {
    const existe = itens.findIndex(i => i.descricao === p.nome)
    if (existe >= 0) {
      setItens(prev => prev.map((it, j) => j === existe ? { ...it, quantidade: it.quantidade + 1 } : it))
    } else {
      setItens(prev => {
        const novo = [...prev]
        if (novo.length === 1 && !novo[0].descricao) novo[0] = { descricao: p.nome, quantidade: 1, valor_unitario: p.preco_venda }
        else novo.push({ descricao: p.nome, quantidade: 1, valor_unitario: p.preco_venda })
        return novo
      })
    }
    toast.success(p.nome + ' adicionado!', { autoClose: 1000 })
  }

  const addItem    = () => setItens(i => [...i, { ...itemVazio }])
  const remItem    = (idx: number) => setItens(i => i.filter((_,j) => j!==idx))
  const updItem    = (idx: number, key: keyof Item, val: any) =>
    setItens(i => i.map((it,j) => j===idx ? { ...it, [key]: val } : it))

  const subtotal   = itens.reduce((s, i) => s + (i.quantidade * i.valor_unitario), 0)
  const totalFinal = subtotal - (form.desconto||0)

  const salvar = async () => {
    if (!form.cliente_id) return toast.error('Selecione um cliente')
    if (itens.some(i => !i.descricao)) return toast.error('Preencha a descricao de todos os itens')
    setSalvando(true)
    try {
      await api.post('/orcamentos', { ...form, itens })
      toast.success('Orcamento criado!')
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const mudarStatus = async (id: string, status: string) => {
    try {
      await api.patch('/orcamentos/' + id + '/status', { status })
      toast.success('Status atualizado!')
      carregar()
      if (orcAtual?.id === id) setOrcAtual(prev => prev ? { ...prev, status } : null)
    } catch { toast.error('Erro ao atualizar') }
  }

  const gerarMensagem = async (orc: Orcamento) => {
    try {
      const { data } = await api.get('/orcamentos/' + orc.id + '/mensagem')
      setMensagem(data.mensagem)
      setTelWhats(data.telefone?.replace(/\D/g,'') || '')
      setModal('msg')
    } catch { toast.error('Erro ao gerar mensagem') }
  }

  const copiarMsg = () => { navigator.clipboard.writeText(mensagem); toast.success('Mensagem copiada!') }
  const abrirWhats = () => {
    const tel = telWhats.startsWith('55') ? telWhats : '55' + telWhats
    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(mensagem), '_blank')
  }

  const deletar = async (id: string) => {
    if (!window.confirm('Remover este orcamento?')) return
    try { await api.delete('/orcamentos/' + id); toast.success('Removido!'); carregar() }
    catch (err: any) { toast.error(err.response?.data?.erro || 'Erro ao remover') }
  }

  const catalogoFiltrado = abaCatalogo === 'servicos'
    ? servicos.filter(s => !buscaCatalogo || s.nome.toLowerCase().includes(buscaCatalogo.toLowerCase()))
    : produtos.filter(p => !buscaCatalogo || p.nome.toLowerCase().includes(buscaCatalogo.toLowerCase()))

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Orcamentos</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{total} orcamento(s)</p>
        </div>
        <button onClick={abrirNovo} style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Novo orcamento
        </button>
      </div>

      {/* Filtro */}
      <div style={{ marginBottom:'1rem' }}>
        <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); carregar(e.target.value) }}
          style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k,v]: any) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {carregando ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
        ) : orcamentos.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Nenhum orcamento cadastrado ainda.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['No','Cliente','Itens','Total','Validade','Status','Acoes'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o, i) => {
                const st = STATUS[o.status] || STATUS.pendente
                const validade = new Date(o.criado_em)
                validade.setDate(validade.getDate() + o.validade_dias)
                return (
                  <tr key={o.id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color:'#3B82F6' }}>#{o.numero}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{o.cliente_nome}</div>
                      <div style={{ fontSize:12, color:'#9CA3AF' }}>{o.cliente_telefone}</div>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{o.itens?.length || 0} item(s)</td>
                    <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color:'#059669' }}>R${Number(o.total).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6B7280' }}>{validade.toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:st.bg, color:st.cor, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 }}>{st.label}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => abrirDetalhe(o)} style={{ background:'#EFF6FF', color:'#1D4ED8', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>Ver</button>
                      <button onClick={() => gerarMensagem(o)} style={{ background:'#D1FAE5', color:'#065F46', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>WhatsApp</button>
                      <button onClick={() => deletar(o.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer' }}>Remover</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOVO ORÇAMENTO */}
      {modal === 'form' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:900, maxHeight:'94vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header modal */}
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:600 }}>Novo orcamento</h3>
              <button onClick={fechar} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Fechar</button>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* Lado esquerdo: catalogo */}
              <div style={{ width:320, borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', background:'#F9FAFB' }}>
                <div style={{ padding:'12px' }}>
                  <div style={{ display:'flex', marginBottom:8 }}>
                    {(['servicos','produtos'] as const).map(a => (
                      <button key={a} onClick={() => { setAbaCatalogo(a); setBuscaCatalogo('') }}
                        style={{ flex:1, padding:'7px', border:'none', fontSize:12, fontWeight:500, cursor:'pointer',
                          background: abaCatalogo===a ? '#185FA5' : '#fff',
                          color: abaCatalogo===a ? '#fff' : '#6B7280',
                          borderRadius: a==='servicos' ? '6px 0 0 6px' : '0 6px 6px 0',
                          borderTop: '1px solid #D1D5DB', borderBottom: '1px solid #D1D5DB',
                          borderLeft: '1px solid #D1D5DB', borderRight: '1px solid #D1D5DB' }}>
                        {a === 'servicos' ? 'Servicos' : 'Produtos'}
                      </button>
                    ))}
                  </div>
                  <input value={buscaCatalogo} onChange={e => setBuscaCatalogo(e.target.value)}
                    placeholder={'Buscar ' + (abaCatalogo === 'servicos' ? 'servico' : 'produto') + '...'}
                    style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
                </div>

                <div style={{ flex:1, overflowY:'auto', padding:'0 12px 12px' }}>
                  {catalogoFiltrado.length === 0 ? (
                    <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:12, padding:'1rem' }}>Nenhum encontrado</p>
                  ) : (
                    catalogoFiltrado.map((item: any) => (
                      <button key={item.id}
                        onClick={() => abaCatalogo === 'servicos' ? addServico(item) : addProduto(item)}
                        style={{ width:'100%', background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'10px 12px', marginBottom:6, textAlign:'left', cursor:'pointer', transition:'all 0.1s' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <span style={{ fontSize:13, fontWeight:500, color:'#111827' }}>{item.nome}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#059669', marginLeft:8, whiteSpace:'nowrap' as any }}>
                            R${Number(abaCatalogo==='servicos' ? item.preco : item.preco_venda).toFixed(2)}
                          </span>
                        </div>
                        {item.categoria && <span style={{ fontSize:11, color:'#9CA3AF' }}>{item.categoria}</span>}
                        {abaCatalogo === 'produtos' && <span style={{ fontSize:11, color: item.quantidade <= 2 ? '#EF4444' : '#9CA3AF', marginLeft:6 }}>Estoque: {item.quantidade}</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Lado direito: formulário */}
              <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem' }}>

                {/* Cliente */}
                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Cliente *</label>
                  <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                    <option value="">Selecione o cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.telefone ? '- ' + c.telefone : ''}</option>)}
                  </select>
                </div>

                {/* Itens selecionados */}
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={{ fontSize:13, fontWeight:500 }}>Itens do orcamento *</label>
                    <button onClick={addItem} style={{ background:'#EFF6FF', color:'#1D4ED8', border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>+ Item manual</button>
                  </div>

                  <div style={{ background:'#F9FAFB', borderRadius:8, padding:'8px', marginBottom:4 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 100px 32px', gap:6, marginBottom:4 }}>
                      {['Descricao','Qtd','Valor unit.',''].map(h => (
                        <span key={h} style={{ fontSize:11, color:'#9CA3AF', padding:'0 4px' }}>{h}</span>
                      ))}
                    </div>
                    {itens.map((it, idx) => (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 70px 100px 32px', gap:6, marginBottom:6, alignItems:'center' }}>
                        <input value={it.descricao} placeholder="Descricao"
                          onChange={e => updItem(idx, 'descricao', e.target.value)}
                          style={{ padding:'7px 8px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none' }}/>
                        <input type="number" value={it.quantidade} min={1}
                          onChange={e => updItem(idx, 'quantidade', parseInt(e.target.value)||1)}
                          style={{ padding:'7px 8px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none', textAlign:'center' }}/>
                        <input type="number" value={it.valor_unitario}
                          onChange={e => updItem(idx, 'valor_unitario', parseFloat(e.target.value)||0)}
                          style={{ padding:'7px 8px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none' }}/>
                        <button onClick={() => remItem(idx)} disabled={itens.length===1}
                          style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'7px', fontSize:13, cursor:'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totais */}
                <div style={{ background:'#F9FAFB', borderRadius:8, padding:'1rem', marginBottom:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                    <span style={{ color:'#6B7280' }}>Subtotal</span>
                    <span>R${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:6 }}>
                    <span>Desconto (R$)</span>
                    <input type="number" value={form.desconto} min={0}
                      onChange={e => setForm(f => ({ ...f, desconto: parseFloat(e.target.value)||0 }))}
                      style={{ width:80, padding:'4px 8px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none', textAlign:'right' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, borderTop:'1px solid #E5E7EB', paddingTop:8 }}>
                    <span>Total</span>
                    <span style={{ color:'#059669' }}>R${totalFinal.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1rem' }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Validade (dias)</label>
                    <input type="number" value={form.validade_dias}
                      onChange={e => setForm(f => ({ ...f, validade_dias: parseInt(e.target.value)||7 }))}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Observacoes</label>
                    <input value={form.observacoes}
                      onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                      placeholder="Ex: Inclui mao de obra"
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
                  </div>
                </div>

                <button onClick={salvar} disabled={salvando}
                  style={{ width:'100%', padding:'11px', borderRadius:8, border:'none', background: salvando?'#93C5FD':'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  {salvando ? 'Salvando...' : 'Criar orcamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHE */}
      {modal === 'detalhe' && orcAtual && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:600 }}>Orcamento #{orcAtual.numero}</h3>
              <button onClick={fechar} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Fechar</button>
            </div>
            <div style={{ background:'#F9FAFB', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#6B7280', margin:'0 0 8px' }}>ALTERAR STATUS</p>
              <div style={{ display:'flex', flexWrap:'wrap' as any, gap:8 }}>
                {Object.entries(STATUS).map(([k,v]: any) => (
                  <button key={k} onClick={() => mudarStatus(orcAtual.id, k)}
                    style={{ padding:'5px 12px', borderRadius:20, border:'2px solid', fontSize:12, fontWeight:500, cursor:'pointer',
                      borderColor: orcAtual.status===k ? v.cor : 'transparent',
                      background: orcAtual.status===k ? v.bg : '#fff', color: v.cor }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize:13, fontWeight:500, margin:'0 0 4px' }}>{orcAtual.cliente_nome}</p>
            <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 1rem' }}>{orcAtual.cliente_telefone}</p>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'1rem' }}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  {['Descricao','Qtd','Unit.','Total'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(orcAtual.itens||[]).map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding:'8px 10px', fontSize:13 }}>{it.descricao}</td>
                    <td style={{ padding:'8px 10px', fontSize:13, textAlign:'center' }}>{it.quantidade}</td>
                    <td style={{ padding:'8px 10px', fontSize:13 }}>R${Number(it.valor_unitario).toFixed(2)}</td>
                    <td style={{ padding:'8px 10px', fontSize:13, fontWeight:500 }}>R${(it.quantidade*it.valor_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign:'right', fontSize:13, color:'#6B7280', marginBottom:4 }}>Subtotal: R${Number(orcAtual.subtotal).toFixed(2)}</div>
            {Number(orcAtual.desconto) > 0 && <div style={{ textAlign:'right', fontSize:13, color:'#DC2626', marginBottom:4 }}>Desconto: -R${Number(orcAtual.desconto).toFixed(2)}</div>}
            <div style={{ textAlign:'right', fontSize:18, fontWeight:700, color:'#059669', marginBottom:'1.5rem' }}>Total: R${Number(orcAtual.total).toFixed(2)}</div>
            <button onClick={() => gerarMensagem(orcAtual)} style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#25D366', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Enviar pelo WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* MODAL MENSAGEM */}
      {modal === 'msg' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:480 }}>
            <h3 style={{ margin:'0 0 1rem', fontSize:17, fontWeight:600 }}>Mensagem para WhatsApp</h3>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={10}
              style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' as any, fontFamily:'inherit', lineHeight:1.6 }}/>
            <div style={{ display:'flex', gap:10, marginTop:'1rem' }}>
              <button onClick={() => setModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Fechar</button>
              <button onClick={copiarMsg} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Copiar</button>
              <button onClick={abrirWhats} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#25D366', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Abrir WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
