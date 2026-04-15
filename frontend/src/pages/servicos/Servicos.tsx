import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Servico {
  id: string
  nome: string
  descricao: string
  categoria: string
  preco: number
  duracao_estimada: string
  ativo: boolean
}

const CATEGORIAS = ['Hardware', 'Software', 'Manutencao', 'Rede', 'Consultoria', 'Outro']

const vazio = { id:'', nome:'', descricao:'', categoria:'', preco:0, duracao_estimada:'', ativo:true }

const CATEGORIA_CORES: any = {
  Hardware:    { bg:'#EFF6FF', cor:'#1D4ED8' },
  Software:    { bg:'#F0FDF4', cor:'#166534' },
  Manutencao:  { bg:'#FEF3C7', cor:'#92400E' },
  Rede:        { bg:'#EDE9FE', cor:'#5B21B6' },
  Consultoria: { bg:'#FDF2F8', cor:'#86198F' },
  Outro:       { bg:'#F3F4F6', cor:'#374151' },
}

export default function Servicos() {
  const [servicos, setServicos]     = useState<Servico[]>([])
  const [total, setTotal]           = useState(0)
  const [busca, setBusca]           = useState('')
  const [filtroCat, setFiltroCat]   = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState<any>(vazio)
  const [salvando, setSalvando]     = useState(false)
  const [vista, setVista]           = useState<'grid'|'lista'>('grid')

  const carregar = async (b = busca, c = filtroCat) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/servicos', { params: { busca: b||undefined, categoria: c||undefined } })
      setServicos(data.servicos)
      setTotal(data.total)
    } catch { toast.error('Erro ao carregar servicos') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo   = () => { setForm(vazio); setModal(true) }
  const abrirEditar = (s: Servico) => { setForm(s); setModal(true) }
  const fechar      = () => { setModal(false); setForm(vazio) }

  const salvar = async () => {
    if (!form.nome) return toast.error('Nome e obrigatorio')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put('/servicos/' + form.id, form)
        toast.success('Servico atualizado!')
      } else {
        await api.post('/servicos', form)
        toast.success('Servico cadastrado!')
      }
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const deletar = async (id: string) => {
    if (!window.confirm('Remover este servico?')) return
    try {
      await api.delete('/servicos/' + id)
      toast.success('Servico removido!')
      carregar()
    } catch { toast.error('Erro ao remover') }
  }

  const toggleAtivo = async (s: Servico) => {
    try {
      await api.put('/servicos/' + s.id, { ...s, ativo: !s.ativo })
      carregar()
    } catch { toast.error('Erro ao atualizar') }
  }

  const servicosFiltrados = servicos.filter(s =>
    (!busca || s.nome.toLowerCase().includes(busca.toLowerCase()) || (s.descricao||'').toLowerCase().includes(busca.toLowerCase())) &&
    (!filtroCat || s.categoria === filtroCat)
  )

  const porCategoria = CATEGORIAS.reduce((acc, cat) => {
    const lista = servicosFiltrados.filter(s => s.categoria === cat)
    if (lista.length > 0) acc[cat] = lista
    return acc
  }, {} as any)

  const semCategoria = servicosFiltrados.filter(s => !s.categoria || !CATEGORIAS.includes(s.categoria))

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Catalogo de Servicos</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{total} servico(s) cadastrado(s)</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setVista(v => v==='grid'?'lista':'grid')}
            style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer' }}>
            {vista === 'grid' ? 'Lista' : 'Grid'}
          </button>
          <button onClick={abrirNovo}
            style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            + Novo servico
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' as any }}>
        <input value={busca} onChange={e => { setBusca(e.target.value); carregar(e.target.value, filtroCat) }}
          placeholder="Buscar servico..."
          style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none' }}
        />
        <select value={filtroCat} onChange={e => { setFiltroCat(e.target.value); carregar(busca, e.target.value) }}
          style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {carregando ? (
        <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
      ) : servicosFiltrados.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
          Nenhum servico encontrado.{' '}
          <button onClick={abrirNovo} style={{ color:'#185FA5', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>Cadastrar primeiro servico</button>
        </div>
      ) : vista === 'grid' ? (
        /* VISTA GRID por categoria */
        <div>
          {Object.entries(porCategoria).map(([cat, lista]: any) => {
            const cores = CATEGORIA_CORES[cat] || CATEGORIA_CORES['Outro']
            return (
              <div key={cat} style={{ marginBottom:'1.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ background:cores.bg, color:cores.cor, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600 }}>{cat}</span>
                  <span style={{ fontSize:12, color:'#9CA3AF' }}>{lista.length} servico(s)</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
                  {lista.map((s: Servico) => (
                    <div key={s.id} style={{
                      background:'#fff', border:'1px solid #E5E7EB', borderRadius:10,
                      padding:'16px', opacity: s.ativo ? 1 : 0.5,
                      borderLeft: '4px solid ' + cores.cor
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <h4 style={{ margin:0, fontSize:14, fontWeight:600, color:'#111827' }}>{s.nome}</h4>
                        <span style={{ fontSize:16, fontWeight:700, color:'#059669', whiteSpace:'nowrap' as any, marginLeft:8 }}>
                          R${Number(s.preco).toFixed(2)}
                        </span>
                      </div>
                      {s.descricao && <p style={{ margin:'0 0 8px', fontSize:12, color:'#6B7280', lineHeight:1.5 }}>{s.descricao}</p>}
                      {s.duracao_estimada && (
                        <p style={{ margin:'0 0 10px', fontSize:12, color:'#9CA3AF' }}>Tempo: {s.duracao_estimada}</p>
                      )}
                      <div style={{ display:'flex', gap:6, justifyContent:'space-between', alignItems:'center' }}>
                        <button onClick={() => toggleAtivo(s)}
                          style={{ fontSize:11, padding:'3px 8px', borderRadius:20, border:'none', cursor:'pointer',
                            background: s.ativo ? '#D1FAE5' : '#F3F4F6',
                            color: s.ativo ? '#065F46' : '#9CA3AF' }}>
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => abrirEditar(s)}
                            style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>Editar</button>
                          <button onClick={() => deletar(s.id)}
                            style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {semCategoria.length > 0 && (
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ background:'#F3F4F6', color:'#374151', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600 }}>Sem categoria</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
                {semCategoria.map((s: Servico) => (
                  <div key={s.id} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'16px', opacity: s.ativo ? 1 : 0.5 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <h4 style={{ margin:0, fontSize:14, fontWeight:600 }}>{s.nome}</h4>
                      <span style={{ fontSize:16, fontWeight:700, color:'#059669' }}>R${Number(s.preco).toFixed(2)}</span>
                    </div>
                    {s.descricao && <p style={{ margin:'0 0 10px', fontSize:12, color:'#6B7280' }}>{s.descricao}</p>}
                    <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                      <button onClick={() => abrirEditar(s)} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>Editar</button>
                      <button onClick={() => deletar(s.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA LISTA */
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['Servico','Categoria','Preco','Duracao','Status','Acoes'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicosFiltrados.map((s, i) => {
                const cores = CATEGORIA_CORES[s.categoria] || CATEGORIA_CORES['Outro']
                return (
                  <tr key={s.id} style={{ background: i%2===0?'#fff':'#FAFAFA', opacity: s.ativo ? 1 : 0.5 }}>
                    <td style={{ padding:'11px 14px' }}>
                      <p style={{ margin:0, fontSize:14, fontWeight:500 }}>{s.nome}</p>
                      {s.descricao && <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>{s.descricao.substring(0,60)}{s.descricao.length>60?'...':''}</p>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {s.categoria && <span style={{ background:cores.bg, color:cores.cor, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 }}>{s.categoria}</span>}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:15, fontWeight:700, color:'#059669' }}>R${Number(s.preco).toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, color:'#6B7280' }}>{s.duracao_estimada || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => toggleAtivo(s)} style={{ background: s.ativo?'#D1FAE5':'#F3F4F6', color: s.ativo?'#065F46':'#9CA3AF', border:'none', borderRadius:20, padding:'3px 10px', fontSize:12, cursor:'pointer' }}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => abrirEditar(s)} style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer', marginRight:4 }}>Editar</button>
                      <button onClick={() => deletar(s.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6, padding:'5px 8px', fontSize:11, cursor:'pointer' }}>Remover</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:480 }}>
            <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>{form.id ? 'Editar servico' : 'Novo servico'}</h3>

            {[
              { label:'Nome *', key:'nome', type:'text', placeholder:'Ex: Formatacao Windows' },
              { label:'Preco (R$)', key:'preco', type:'number', placeholder:'0.00' },
              { label:'Duracao estimada', key:'duracao_estimada', type:'text', placeholder:'Ex: 1-2 horas' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                <input type={type} value={form[key]||''} placeholder={placeholder}
                  onChange={e => setForm((f: any) => ({ ...f, [key]: type==='number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            ))}

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Categoria</label>
              <select value={form.categoria||''} onChange={e => setForm((f: any) => ({ ...f, categoria: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Descricao</label>
              <textarea value={form.descricao||''} rows={3} placeholder="Descreva o servico..."
                onChange={e => setForm((f: any) => ({ ...f, descricao: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' as any }}/>
            </div>

            <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:10 }}>
              <input type="checkbox" id="ativo" checked={form.ativo !== false}
                onChange={e => setForm((f: any) => ({ ...f, ativo: e.target.checked }))}/>
              <label htmlFor="ativo" style={{ fontSize:13, color:'#374151', cursor:'pointer' }}>Servico ativo (aparece nos orcamentos)</label>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={fechar} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background: salvando?'#93C5FD':'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {salvando ? 'Salvando...' : form.id ? 'Salvar alteracoes' : 'Cadastrar servico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
