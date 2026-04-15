import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Produto {
  id: string
  nome: string
  categoria: string
  marca: string
  modelo: string
  codigo: string
  quantidade: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  localizacao: string
}

const vazio = { id:'', nome:'', categoria:'', marca:'', modelo:'', codigo:'', quantidade:0, quantidade_minima:1, preco_custo:0, preco_venda:0, localizacao:'' }

const CATEGORIAS = ['SSD','HD','RAM','Bateria','Tela','Placa','Cabo','Fonte','Ventilador','Pasta térmica','Parafuso','Outro']

export default function Estoque() {
  const [produtos, setProdutos]     = useState<Produto[]>([])
  const [total, setTotal]           = useState(0)
  const [busca, setBusca]           = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal]           = useState<'form'|'mov'|null>(null)
  const [form, setForm]             = useState<any>(vazio)
  const [salvando, setSalvando]     = useState(false)
  const [movForm, setMovForm]       = useState({ tipo:'entrada', quantidade:1, motivo:'' })
  const [prodSel, setProdSel]       = useState<Produto|null>(null)

  const carregar = async (b = busca) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/estoque', { params: { busca: b || undefined, limite: 50 } })
      setProdutos(data.produtos)
      setTotal(data.total)
    } catch { toast.error('Erro ao carregar estoque') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo    = () => { setForm(vazio); setModal('form') }
  const abrirEditar  = (p: Produto) => { setForm(p); setModal('form') }
  const abrirMov     = (p: Produto) => { setProdSel(p); setMovForm({ tipo:'entrada', quantidade:1, motivo:'' }); setModal('mov') }
  const fechar       = () => { setModal(null); setForm(vazio); setProdSel(null) }

  const salvar = async () => {
    if (!form.nome) return toast.error('Nome é obrigatório')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/estoque/${form.id}`, form)
        toast.success('Produto atualizado!')
      } else {
        await api.post('/estoque', form)
        toast.success('Produto cadastrado!')
      }
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const movimentar = async () => {
    if (!movForm.quantidade || movForm.quantidade <= 0) return toast.error('Quantidade inválida')
    setSalvando(true)
    try {
      await api.post(`/estoque/${prodSel!.id}/movimentar`, movForm)
      toast.success(`${movForm.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`)
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao movimentar')
    } finally { setSalvando(false) }
  }

  const deletar = async (id: string) => {
    if (!window.confirm('Remover este produto?')) return
    try {
      await api.delete(`/estoque/${id}`)
      toast.success('Produto removido!')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao remover')
    }
  }

  const estoqueBaixo = produtos.filter(p => p.quantidade <= p.quantidade_minima).length

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Estoque</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{total} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={abrirNovo} style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Novo produto
        </button>
      </div>

      {/* Alerta estoque baixo */}
      {estoqueBaixo > 0 && (
        <div style={{ background:'#FEF3C7', border:'1px solid #F59E0B', borderRadius:8, padding:'10px 14px', marginBottom:'1rem', fontSize:13, color:'#92400E' }}>
          ⚠ {estoqueBaixo} produto(s) com estoque abaixo do mínimo!
        </div>
      )}

      {/* Busca */}
      <div style={{ marginBottom:'1rem' }}>
        <input value={busca} onChange={e => { setBusca(e.target.value); setTimeout(() => carregar(e.target.value), 400) }}
          placeholder="Buscar por nome, código ou marca..."
          style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}
        />
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {carregando ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
        ) : produtos.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Nenhum produto cadastrado ainda.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['Produto','Categoria','Qtd','Mín','Custo','Venda','Local','Ações'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, i) => {
                const baixo = p.quantidade <= p.quantidade_minima
                return (
                  <tr key={p.id} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:14, fontWeight:500 }}>{p.nome}</div>
                      {p.marca && <div style={{ fontSize:12, color:'#9CA3AF' }}>{p.marca} {p.modelo}</div>}
                      {p.codigo && <div style={{ fontSize:11, color:'#D1D5DB' }}>#{p.codigo}</div>}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{p.categoria || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontWeight:700, fontSize:16, color: baixo ? '#EF4444' : '#111827' }}>{p.quantidade}</span>
                      {baixo && <span style={{ fontSize:10, background:'#FEE2E2', color:'#991B1B', padding:'1px 6px', borderRadius:10, marginLeft:6 }}>BAIXO</span>}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13, color:'#6B7280' }}>{p.quantidade_minima}</td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>R${Number(p.preco_custo).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'#059669' }}>R${Number(p.preco_venda).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6B7280' }}>{p.localizacao || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => abrirMov(p)} style={{ background:'#D1FAE5', color:'#065F46', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>Movimentar</button>
                      <button onClick={() => abrirEditar(p)} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>Editar</button>
                      <button onClick={() => deletar(p.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer' }}>Remover</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CADASTRO */}
      {modal === 'form' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:540, maxHeight:'92vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>{form.id ? 'Editar produto' : 'Novo produto'}</h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Nome *', key:'nome', col:'1/-1' },
                { label:'Categoria', key:'categoria', tipo:'select' },
                { label:'Marca', key:'marca' },
                { label:'Modelo', key:'modelo' },
                { label:'Código', key:'codigo' },
                { label:'Localização', key:'localizacao' },
              ].map(({ label, key, col, tipo }) => (
                <div key={key} style={{ gridColumn: col || 'auto', marginBottom:4 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                  {tipo === 'select' ? (
                    <select value={form[key]||''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input value={form[key]||''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
                  )}
                </div>
              ))}

              {[
                { label:'Quantidade inicial', key:'quantidade' },
                { label:'Quantidade mínima', key:'quantidade_minima' },
                { label:'Preço de custo (R$)', key:'preco_custo' },
                { label:'Preço de venda (R$)', key:'preco_venda' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                  <input type="number" value={form[key]||0} onChange={e => setForm((f: any) => ({ ...f, [key]: parseFloat(e.target.value)||0 }))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
              <button onClick={fechar} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background: salvando ? '#93C5FD' : '#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {salvando ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVIMENTAÇÃO */}
      {modal === 'mov' && prodSel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:420 }}>
            <h3 style={{ margin:'0 0 0.5rem', fontSize:17, fontWeight:600 }}>Movimentar estoque</h3>
            <p style={{ margin:'0 0 1.5rem', fontSize:13, color:'#6B7280' }}>{prodSel.nome} — estoque atual: <strong>{prodSel.quantidade}</strong></p>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Tipo</label>
              <div style={{ display:'flex', gap:10 }}>
                {['entrada','saida'].map(t => (
                  <button key={t} onClick={() => setMovForm(f => ({ ...f, tipo: t }))}
                    style={{ flex:1, padding:'9px', borderRadius:8, border:'2px solid', cursor:'pointer', fontSize:14, fontWeight:500,
                      borderColor: movForm.tipo === t ? (t==='entrada'?'#059669':'#DC2626') : '#E5E7EB',
                      background: movForm.tipo === t ? (t==='entrada'?'#D1FAE5':'#FEE2E2') : '#fff',
                      color: movForm.tipo === t ? (t==='entrada'?'#065F46':'#991B1B') : '#6B7280' }}>
                    {t === 'entrada' ? 'Entrada' : 'Saída'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Quantidade</label>
              <input type="number" min={1} value={movForm.quantidade}
                onChange={e => setMovForm(f => ({ ...f, quantidade: parseInt(e.target.value)||1 }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
            </div>

            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5 }}>Motivo</label>
              <input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))}
                placeholder="Ex: Compra, uso em OS #1, ajuste..."
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={fechar} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
              <button onClick={movimentar} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none',
                background: salvando ? '#9CA3AF' : movForm.tipo==='entrada' ? '#059669' : '#DC2626',
                color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {salvando ? 'Salvando...' : `Registrar ${movForm.tipo}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
