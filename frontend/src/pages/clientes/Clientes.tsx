import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  endereco: string
  observacoes: string
  total_ordens: number
  criado_em: string
}

const vazio = { id:'', nome:'', email:'', telefone:'', cpf_cnpj:'', endereco:'', observacoes:'' }

export default function Clientes() {
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [total, setTotal]         = useState(0)
  const [busca, setBusca]         = useState('')
  const [pagina, setPagina]       = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(vazio)
  const [salvando, setSalvando]   = useState(false)
  const [deletando, setDeletando] = useState<string|null>(null)

  const carregar = async (p = 1, b = busca) => {
    setCarregando(true)
    try {
      const { data } = await api.get('/clientes', { params: { pagina: p, limite: 15, busca: b || undefined } })
      setClientes(data.clientes)
      setTotal(data.total)
      setPagina(p)
    } catch { toast.error('Erro ao carregar clientes') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const buscarComDelay = (v: string) => {
    setBusca(v)
    setTimeout(() => carregar(1, v), 400)
  }

  const abrirNovo = () => { setForm(vazio); setModal(true) }
  const abrirEditar = (c: Cliente) => { setForm(c); setModal(true) }
  const fechar = () => { setModal(false); setForm(vazio) }

  const salvar = async () => {
    if (!form.nome) return toast.error('Nome é obrigatório')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/clientes/${form.id}`, form)
        toast.success('Cliente atualizado!')
      } else {
        await api.post('/clientes', form)
        toast.success('Cliente cadastrado!')
      }
      fechar(); carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const deletar = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este cliente?')) return
    setDeletando(id)
    try {
      await api.delete(`/clientes/${id}`)
      toast.success('Cliente removido!')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao remover')
    } finally { setDeletando(null) }
  }

  const totalPaginas = Math.ceil(total / 15)

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Clientes</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{total} cliente(s) cadastrado(s)</p>
        </div>
        <button onClick={abrirNovo} style={{
          background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
          padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer'
        }}>
          + Novo cliente
        </button>
      </div>

      {/* Busca */}
      <div style={{ marginBottom:'1rem' }}>
        <input
          value={busca}
          onChange={e => buscarComDelay(e.target.value)}
          placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
          style={{
            width:'100%', padding:'10px 14px', borderRadius:8, boxSizing:'border-box',
            border:'1px solid #D1D5DB', fontSize:14, outline:'none'
          }}
        />
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {carregando ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Carregando...</div>
        ) : clientes.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
            {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                {['Nome','Telefone','Email','CPF/CNPJ','OS','Ações'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={c.id} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding:'12px 16px', fontSize:14, fontWeight:500 }}>{c.nome}</td>
                  <td style={{ padding:'12px 16px', fontSize:13 }}>{c.telefone || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'#6B7280' }}>{c.email || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13 }}>{c.cpf_cnpj || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13 }}>
                    <span style={{ background:'#EFF6FF', color:'#1D4ED8', padding:'2px 8px', borderRadius:12, fontSize:12, fontWeight:500 }}>
                      {c.total_ordens}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={() => abrirEditar(c)} style={{
                      background:'#F3F4F6', border:'none', borderRadius:6,
                      padding:'5px 10px', fontSize:12, cursor:'pointer', marginRight:6
                    }}>Editar</button>
                    <button onClick={() => deletar(c.id)} disabled={deletando === c.id} style={{
                      background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:6,
                      padding:'5px 10px', fontSize:12, cursor:'pointer'
                    }}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:'1rem' }}>
          {Array.from({ length: totalPaginas }, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => carregar(p)} style={{
              padding:'6px 12px', borderRadius:6, border:'1px solid #D1D5DB',
              background: p === pagina ? '#185FA5' : '#fff',
              color: p === pagina ? '#fff' : '#374151',
              cursor:'pointer', fontSize:13
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Modal cadastro/edição */}
      {modal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#fff', borderRadius:12, padding:'2rem',
            width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto'
          }}>
            <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>
              {form.id ? 'Editar cliente' : 'Novo cliente'}
            </h3>

            {[
              { label:'Nome *', key:'nome', type:'text', placeholder:'Nome completo' },
              { label:'Telefone', key:'telefone', type:'text', placeholder:'(00) 00000-0000' },
              { label:'Email', key:'email', type:'email', placeholder:'email@exemplo.com' },
              { label:'CPF / CNPJ', key:'cpf_cnpj', type:'text', placeholder:'000.000.000-00' },
              { label:'Endereço', key:'endereco', type:'text', placeholder:'Rua, número, bairro' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box', outline:'none' }}
                />
              </div>
            ))}

            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Anotações sobre o cliente..."
                rows={3}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, boxSizing:'border-box', outline:'none', resize:'vertical' }}
              />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={fechar} style={{
                flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB',
                background:'#fff', fontSize:14, cursor:'pointer'
              }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{
                flex:2, padding:'10px', borderRadius:8, border:'none',
                background: salvando ? '#93C5FD' : '#185FA5',
                color:'#fff', fontSize:14, fontWeight:600, cursor: salvando ? 'not-allowed' : 'pointer'
              }}>{salvando ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
