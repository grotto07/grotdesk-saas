import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface ItemCarrinho {
  produto_id: string | null
  descricao: string
  quantidade: number
  preco_unitario: number
}

interface Produto {
  id: string
  nome: string
  preco_venda: number
  quantidade: number
  categoria: string
}

interface Cliente { id: string; nome: string; telefone: string }

interface Venda {
  id: string
  cliente_nome: string
  total: number
  forma_pagamento: string
  criado_em: string
  itens: any[]
}

const FORMAS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto']
const FORMAS_LABEL: any = {
  dinheiro: 'Dinheiro', pix: 'PIX',
  cartao_credito: 'Cartao credito', cartao_debito: 'Cartao debito', boleto: 'Boleto'
}

export default function PDV() {
  const [carrinho, setCarrinho]         = useState<ItemCarrinho[]>([])
  const [produtos, setProdutos]         = useState<Produto[]>([])
  const [clientes, setClientes]         = useState<Cliente[]>([])
  const [vendas, setVendas]             = useState<Venda[]>([])
  const [resumo, setResumo]             = useState<any>({})
  const [clienteId, setClienteId]       = useState('')
  const [desconto, setDesconto]         = useState(0)
  const [formaPag, setFormaPag]         = useState('dinheiro')
  const [buscaProd, setBuscaProd]       = useState('')
  const [finalizando, setFinalizando]   = useState(false)
  const [aba, setAba]                   = useState<'pdv'|'historico'>('pdv')
  const [itemManual, setItemManual]     = useState({ descricao:'', quantidade:1, preco_unitario:0 })

  const carregar = async () => {
    try {
      const [pRes, cRes, vRes] = await Promise.all([
        api.get('/estoque', { params: { limite:100 } }),
        api.get('/clientes', { params: { limite:100 } }),
        api.get('/pdv', { params: { limite:10 } })
      ])
      setProdutos(pRes.data.produtos)
      setClientes(cRes.data.clientes)
      setVendas(vRes.data.vendas)
      setResumo(vRes.data.resumo)
    } catch { toast.error('Erro ao carregar dados') }
  }

  useEffect(() => { carregar() }, [])

  const addProduto = (p: Produto) => {
    setCarrinho(c => {
      const idx = c.findIndex(i => i.produto_id === p.id)
      if (idx >= 0) {
        return c.map((i, j) => j === idx ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...c, { produto_id: p.id, descricao: p.nome, quantidade: 1, preco_unitario: p.preco_venda }]
    })
  }

  const addManual = () => {
    if (!itemManual.descricao) return toast.error('Informe a descricao do item')
    if (itemManual.preco_unitario <= 0) return toast.error('Informe o valor do item')
    setCarrinho(c => [...c, { produto_id: null, ...itemManual }])
    setItemManual({ descricao:'', quantidade:1, preco_unitario:0 })
  }

  const updQtd = (idx: number, qtd: number) => {
    if (qtd <= 0) return remItem(idx)
    setCarrinho(c => c.map((i, j) => j === idx ? { ...i, quantidade: qtd } : i))
  }

  const remItem = (idx: number) => setCarrinho(c => c.filter((_, j) => j !== idx))

  const subtotal   = carrinho.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)
  const totalFinal = subtotal - desconto

  const finalizar = async () => {
    if (carrinho.length === 0) return toast.error('Adicione itens ao carrinho')
    if (totalFinal < 0) return toast.error('Desconto maior que o total')
    setFinalizando(true)
    try {
      await api.post('/pdv', { cliente_id: clienteId || null, itens: carrinho, desconto, forma_pagamento: formaPag })
      toast.success('Venda finalizada!')
      setCarrinho([]); setDesconto(0); setClienteId(''); setFormaPag('dinheiro')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao finalizar')
    } finally { setFinalizando(false) }
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(buscaProd.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(buscaProd.toLowerCase())
  )

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>PDV — Ponto de Venda</h2>
        <div style={{ display:'flex', gap:8 }}>
          {['pdv','historico'].map(a => (
            <button key={a} onClick={() => setAba(a as any)} style={{
              padding:'8px 16px', borderRadius:8, border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
              background: aba===a ? '#185FA5' : '#F3F4F6',
              color: aba===a ? '#fff' : '#374151'
            }}>{a === 'pdv' ? 'Caixa' : 'Historico'}</button>
          ))}
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display:'flex', gap:14, marginBottom:'1.5rem' }}>
        {[
          { label:'Vendas hoje', valor:'R$' + Number(resumo.vendas_hoje||0).toFixed(2), cor:'#059669' },
          { label:'Vendas do mes', valor:'R$' + Number(resumo.vendas_mes||0).toFixed(2), cor:'#185FA5' },
          { label:'Qtd. hoje', valor: resumo.qtd_hoje || 0, cor:'#111827' },
        ].map(c => (
          <div key={c.label} style={{ background:'#fff', borderRadius:12, padding:'1rem 1.25rem', border:'1px solid #E5E7EB', flex:1 }}>
            <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 6px', fontWeight:500 }}>{c.label}</p>
            <p style={{ fontSize:22, fontWeight:700, color:c.cor, margin:0 }}>{c.valor}</p>
          </div>
        ))}
      </div>

      {aba === 'pdv' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16 }}>

          {/* Lado esquerdo: produtos */}
          <div>
            {/* Busca produtos */}
            <input value={buscaProd} onChange={e => setBuscaProd(e.target.value)}
              placeholder="Buscar produto no estoque..."
              style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any, marginBottom:12 }}
            />

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10, marginBottom:16 }}>
              {produtosFiltrados.map(p => (
                <button key={p.id} onClick={() => addProduto(p)}
                  disabled={p.quantidade <= 0}
                  style={{
                    background: p.quantidade <= 0 ? '#F9FAFB' : '#fff',
                    border:'1px solid #E5E7EB', borderRadius:10, padding:'12px',
                    cursor: p.quantidade <= 0 ? 'not-allowed' : 'pointer',
                    textAlign:'left', opacity: p.quantidade <= 0 ? 0.5 : 1,
                    transition:'all 0.1s'
                  }}>
                  <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:600, color:'#111827' }}>{p.nome}</p>
                  <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280' }}>{p.categoria}</p>
                  <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:'#059669' }}>R${Number(p.preco_venda).toFixed(2)}</p>
                  <p style={{ margin:0, fontSize:11, color: p.quantidade <= 0 ? '#EF4444' : '#9CA3AF' }}>
                    Estoque: {p.quantidade}
                  </p>
                </button>
              ))}
            </div>

            {/* Item manual */}
            <div style={{ background:'#fff', borderRadius:10, border:'1px solid #E5E7EB', padding:'1rem' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#374151', margin:'0 0 10px' }}>Adicionar item manual</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px auto', gap:8, alignItems:'center' }}>
                <input value={itemManual.descricao} placeholder="Descricao do servico/item"
                  onChange={e => setItemManual(f => ({ ...f, descricao: e.target.value }))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none' }}/>
                <input type="number" value={itemManual.quantidade} min={1}
                  onChange={e => setItemManual(f => ({ ...f, quantidade: parseInt(e.target.value)||1 }))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none', textAlign:'center' }}/>
                <input type="number" value={itemManual.preco_unitario} placeholder="R$"
                  onChange={e => setItemManual(f => ({ ...f, preco_unitario: parseFloat(e.target.value)||0 }))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none' }}/>
                <button onClick={addManual} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as any }}>
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Lado direito: carrinho */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', display:'flex', flexDirection:'column', height:'fit-content' }}>
            <div style={{ padding:'1rem', borderBottom:'1px solid #F3F4F6' }}>
              <p style={{ margin:0, fontSize:15, fontWeight:600 }}>Carrinho</p>
            </div>

            {/* Itens carrinho */}
            <div style={{ padding:'0.75rem', flex:1, minHeight:120 }}>
              {carrinho.length === 0 ? (
                <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'1rem' }}>Nenhum item adicionado</p>
              ) : (
                carrinho.map((item, idx) => (
                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:500 }}>{item.descricao}</p>
                      <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>R${Number(item.preco_unitario).toFixed(2)} cada</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button onClick={() => updQtd(idx, item.quantidade - 1)}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #E5E7EB', background:'#F3F4F6', cursor:'pointer', fontSize:14, lineHeight:1 }}>-</button>
                      <span style={{ fontSize:13, fontWeight:600, minWidth:20, textAlign:'center' }}>{item.quantidade}</span>
                      <button onClick={() => updQtd(idx, item.quantidade + 1)}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #E5E7EB', background:'#F3F4F6', cursor:'pointer', fontSize:14, lineHeight:1 }}>+</button>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, minWidth:60, textAlign:'right' }}>
                      R${(item.quantidade * item.preco_unitario).toFixed(2)}
                    </span>
                    <button onClick={() => remItem(idx)}
                      style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', fontSize:14, lineHeight:1 }}>x</button>
                  </div>
                ))
              )}
            </div>

            {/* Totais e pagamento */}
            <div style={{ padding:'1rem', borderTop:'1px solid #F3F4F6' }}>
              <div style={{ marginBottom:'0.75rem' }}>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6B7280', marginBottom:4 }}>Cliente (opcional)</label>
                <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none', background:'#fff' }}>
                  <option value="">Sem cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:'0.75rem' }}>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6B7280', marginBottom:4 }}>Forma de pagamento</label>
                <div style={{ display:'flex', flexWrap:'wrap' as any, gap:6 }}>
                  {FORMAS.map(f => (
                    <button key={f} onClick={() => setFormaPag(f)}
                      style={{ padding:'5px 10px', borderRadius:6, border:'1px solid', fontSize:12, cursor:'pointer',
                        borderColor: formaPag===f ? '#185FA5' : '#E5E7EB',
                        background: formaPag===f ? '#EFF6FF' : '#fff',
                        color: formaPag===f ? '#1D4ED8' : '#6B7280',
                        fontWeight: formaPag===f ? 600 : 400 }}>
                      {FORMAS_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'#6B7280' }}>Subtotal</span>
                <span style={{ fontSize:13 }}>R${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:13, color:'#6B7280' }}>Desconto (R$)</span>
                <input type="number" value={desconto} min={0}
                  onChange={e => setDesconto(parseFloat(e.target.value)||0)}
                  style={{ width:70, padding:'4px 8px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:13, outline:'none', textAlign:'right' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderTop:'2px solid #E5E7EB', marginBottom:12 }}>
                <span style={{ fontSize:16, fontWeight:700 }}>Total</span>
                <span style={{ fontSize:20, fontWeight:700, color:'#059669' }}>R${totalFinal.toFixed(2)}</span>
              </div>

              <button onClick={finalizar} disabled={finalizando || carrinho.length === 0}
                style={{ width:'100%', padding:'12px', borderRadius:8, border:'none',
                  background: finalizando || carrinho.length===0 ? '#9CA3AF' : '#059669',
                  color:'#fff', fontSize:15, fontWeight:700, cursor: carrinho.length===0 ? 'not-allowed' : 'pointer' }}>
                {finalizando ? 'Finalizando...' : 'Finalizar venda'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Histórico de vendas */
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          {vendas.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Nenhuma venda realizada ainda.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  {['Cliente','Itens','Forma pag.','Total','Data'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map((v, i) => (
                  <tr key={v.id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{v.cliente_nome || 'Sem cliente'}</td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{v.itens?.length || 0} item(s)</td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{FORMAS_LABEL[v.forma_pagamento] || v.forma_pagamento}</td>
                    <td style={{ padding:'11px 14px', fontSize:14, fontWeight:600, color:'#059669' }}>R${Number(v.total).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6B7280' }}>
                      {new Date(v.criado_em).toLocaleDateString('pt-BR')} {new Date(v.criado_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
