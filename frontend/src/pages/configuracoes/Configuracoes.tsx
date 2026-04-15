import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface Empresa {
  id: string
  nome: string
  email: string
  telefone: string
  cnpj: string
  endereco: string
  logo_url: string
  plano: string
  assinatura_status: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
}

export default function Configuracoes() {
  const { usuario } = useAuth()
  const [empresa, setEmpresa]           = useState<Empresa | null>(null)
  const [usuarios, setUsuarios]         = useState<Usuario[]>([])
  const [aba, setAba]                   = useState<'empresa'|'usuarios'|'conta'>('empresa')
  const [salvando, setSalvando]         = useState(false)
  const [modalUser, setModalUser]       = useState(false)
  const [formUser, setFormUser]         = useState({ nome:'', email:'', senha:'', perfil:'tecnico' })
  const [formEmpresa, setFormEmpresa]   = useState<any>({})
  const [senhaForm, setSenhaForm]       = useState({ atual:'', nova:'', confirmar:'' })

  const carregar = async () => {
    try {
      const [eRes, uRes] = await Promise.all([
        api.get('/configuracoes'),
        api.get('/configuracoes/usuarios')
      ])
      setEmpresa(eRes.data)
      setFormEmpresa({
        nome:     eRes.data.nome || '',
        telefone: eRes.data.telefone || '',
        cnpj:     eRes.data.cnpj || '',
        endereco: eRes.data.endereco || '',
        logo_url: eRes.data.logo_url || '',
      })
      setUsuarios(uRes.data.usuarios)
    } catch { toast.error('Erro ao carregar configuracoes') }
  }

  useEffect(() => { carregar() }, [])

  const salvarEmpresa = async () => {
    if (!formEmpresa.nome) return toast.error('Nome da empresa e obrigatorio')
    setSalvando(true)
    try {
      await api.put('/configuracoes', formEmpresa)
      toast.success('Dados da empresa salvos!')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const criarUsuario = async () => {
    if (!formUser.nome || !formUser.email || !formUser.senha) return toast.error('Preencha todos os campos')
    if (formUser.senha.length < 6) return toast.error('Senha deve ter pelo menos 6 caracteres')
    setSalvando(true)
    try {
      await api.post('/configuracoes/usuarios', formUser)
      toast.success('Usuario criado!')
      setModalUser(false)
      setFormUser({ nome:'', email:'', senha:'', perfil:'tecnico' })
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao criar usuario')
    } finally { setSalvando(false) }
  }

  const toggleUsuario = async (u: Usuario) => {
    try {
      await api.patch('/configuracoes/usuarios/' + u.id + '/ativo', { ativo: !u.ativo })
      toast.success(u.ativo ? 'Usuario desativado' : 'Usuario ativado')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao atualizar')
    }
  }

  const alterarSenha = async () => {
    if (!senhaForm.atual || !senhaForm.nova) return toast.error('Preencha todos os campos')
    if (senhaForm.nova !== senhaForm.confirmar) return toast.error('As senhas nao coincidem')
    if (senhaForm.nova.length < 6) return toast.error('Nova senha deve ter pelo menos 6 caracteres')
    setSalvando(true)
    try {
      await api.put('/auth/senha', { senha_atual: senhaForm.atual, senha_nova: senhaForm.nova })
      toast.success('Senha alterada com sucesso!')
      setSenhaForm({ atual:'', nova:'', confirmar:'' })
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao alterar senha')
    } finally { setSalvando(false) }
  }

  const ABAS = [
    { key:'empresa', label:'Dados da empresa' },
    { key:'usuarios', label:'Usuarios' },
    { key:'conta', label:'Minha conta' },
  ]

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
      <input type={type} value={formEmpresa[key]||''} placeholder={placeholder}
        onChange={e => setFormEmpresa((f: any) => ({ ...f, [key]: e.target.value }))}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:'1.25rem' }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>Configuracoes</h2>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Gerencie os dados da sua empresa e usuarios</p>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', borderBottom:'1px solid #E5E7EB', paddingBottom:0 }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key as any)}
            style={{ padding:'10px 18px', border:'none', background:'transparent', fontSize:14, cursor:'pointer', fontWeight:500,
              color: aba===a.key ? '#185FA5' : '#6B7280',
              borderBottom: aba===a.key ? '2px solid #185FA5' : '2px solid transparent',
              marginBottom:-1 }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA EMPRESA */}
      {aba === 'empresa' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', padding:'1.5rem' }}>
            <h3 style={{ margin:'0 0 1.25rem', fontSize:15, fontWeight:600 }}>Dados da empresa</h3>

            {inp('Nome da empresa *', 'nome', 'text', 'Ex: Grottech Assistencia Tecnica')}
            {inp('CNPJ', 'cnpj', 'text', '00.000.000/0000-00')}
            {inp('Telefone / WhatsApp', 'telefone', 'text', '(00) 00000-0000')}
            {inp('Endereco completo', 'endereco', 'text', 'Rua, numero, bairro, cidade - UF')}
            {inp('URL do logo (link)', 'logo_url', 'text', 'https://...')}

            <button onClick={salvarEmpresa} disabled={salvando}
              style={{ width:'100%', padding:'10px', borderRadius:8, border:'none',
                background: salvando ? '#93C5FD' : '#185FA5',
                color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4 }}>
              {salvando ? 'Salvando...' : 'Salvar dados da empresa'}
            </button>
          </div>

          {/* Preview do documento */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', padding:'1.5rem' }}>
            <h3 style={{ margin:'0 0 1.25rem', fontSize:15, fontWeight:600 }}>Preview nos documentos</h3>
            <div style={{ background:'#0F172A', borderRadius:8, padding:'16px 20px', color:'#fff' }}>
              <h4 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700 }}>{formEmpresa.nome || 'Nome da empresa'}</h4>
              {formEmpresa.cnpj && <p style={{ margin:'2px 0', fontSize:11, color:'#94A3B8' }}>CNPJ: {formEmpresa.cnpj}</p>}
              {formEmpresa.telefone && <p style={{ margin:'2px 0', fontSize:11, color:'#94A3B8' }}>{formEmpresa.telefone}</p>}
              {formEmpresa.endereco && <p style={{ margin:'2px 0', fontSize:11, color:'#94A3B8' }}>{formEmpresa.endereco}</p>}
            </div>
            <p style={{ fontSize:12, color:'#9CA3AF', marginTop:10 }}>
              Assim vai aparecer no cabecalho das OS e certificados de garantia impressos.
            </p>

            {/* Info do plano */}
            <div style={{ marginTop:'1.5rem', background:'#F9FAFB', borderRadius:8, padding:'1rem' }}>
              <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#6B7280' }}>INFORMACOES DA ASSINATURA</p>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:'#6B7280' }}>Plano</span>
                <span style={{ fontWeight:600, textTransform:'capitalize' }}>{empresa?.plano || '—'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:'#6B7280' }}>Status</span>
                <span style={{
                  background: empresa?.assinatura_status === 'ativa' ? '#D1FAE5' : '#FEE2E2',
                  color: empresa?.assinatura_status === 'ativa' ? '#065F46' : '#991B1B',
                  padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:500 }}>
                  {empresa?.assinatura_status || '—'}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'#6B7280' }}>Email da conta</span>
                <span>{empresa?.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA USUARIOS */}
      {aba === 'usuarios' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>{usuarios.length} usuario(s) na equipe</p>
            <button onClick={() => setModalUser(true)}
              style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              + Novo usuario
            </button>
          </div>

          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  {['Nome','Email','Perfil','Status','Acoes'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#1D4ED8' }}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize:14, fontWeight:500 }}>{u.nome}</span>
                        {u.id === usuario?.id && <span style={{ fontSize:11, background:'#EFF6FF', color:'#1D4ED8', padding:'2px 6px', borderRadius:10 }}>Voce</span>}
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'#6B7280' }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{
                        background: u.perfil==='admin'?'#FEF3C7':u.perfil==='tecnico'?'#EFF6FF':'#F3F4F6',
                        color: u.perfil==='admin'?'#92400E':u.perfil==='tecnico'?'#1D4ED8':'#374151',
                        padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500, textTransform:'capitalize' as any }}>
                        {u.perfil}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background: u.ativo?'#D1FAE5':'#FEE2E2', color: u.ativo?'#065F46':'#991B1B', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 }}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      {u.id !== usuario?.id && (
                        <button onClick={() => toggleUsuario(u)}
                          style={{ background:'#F3F4F6', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal novo usuario */}
          {modalUser && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ background:'#fff', borderRadius:12, padding:'2rem', width:'100%', maxWidth:420 }}>
                <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>Novo usuario</h3>
                {[
                  { label:'Nome completo', key:'nome', type:'text', placeholder:'Nome do tecnico' },
                  { label:'Email', key:'email', type:'email', placeholder:'email@exemplo.com' },
                  { label:'Senha', key:'senha', type:'password', placeholder:'Minimo 6 caracteres' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                    <input type={type} value={(formUser as any)[key]} placeholder={placeholder}
                      onChange={e => setFormUser(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
                  </div>
                ))}
                <div style={{ marginBottom:'1.5rem' }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>Perfil</label>
                  <select value={formUser.perfil} onChange={e => setFormUser(f => ({ ...f, perfil: e.target.value }))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', background:'#fff' }}>
                    <option value="tecnico">Tecnico</option>
                    <option value="atendente">Atendente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setModalUser(false)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, cursor:'pointer' }}>Cancelar</button>
                  <button onClick={criarUsuario} disabled={salvando} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background: salvando?'#93C5FD':'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    {salvando ? 'Criando...' : 'Criar usuario'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA MINHA CONTA */}
      {aba === 'conta' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', padding:'1.5rem' }}>
            <h3 style={{ margin:'0 0 1.25rem', fontSize:15, fontWeight:600 }}>Meus dados</h3>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:'1.5rem' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#1D4ED8' }}>
                {usuario?.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin:0, fontSize:16, fontWeight:600 }}>{usuario?.nome}</p>
                <p style={{ margin:'2px 0 0', fontSize:13, color:'#6B7280' }}>{usuario?.email}</p>
                <span style={{ fontSize:12, background:'#FEF3C7', color:'#92400E', padding:'2px 8px', borderRadius:10, fontWeight:500, textTransform:'capitalize' as any }}>{usuario?.perfil}</span>
              </div>
            </div>

            <h4 style={{ margin:'0 0 1rem', fontSize:14, fontWeight:600, color:'#374151' }}>Alterar senha</h4>
            {[
              { label:'Senha atual', key:'atual' },
              { label:'Nova senha', key:'nova' },
              { label:'Confirmar nova senha', key:'confirmar' },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' }}>{label}</label>
                <input type="password" value={(senhaForm as any)[key]}
                  onChange={e => setSenhaForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            ))}
            <button onClick={alterarSenha} disabled={salvando}
              style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background: salvando?'#93C5FD':'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              {salvando ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>

          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', padding:'1.5rem' }}>
            <h3 style={{ margin:'0 0 1rem', fontSize:15, fontWeight:600 }}>Seu plano</h3>
            <div style={{ background: '#0F172A', borderRadius:10, padding:'1.25rem', color:'#fff', marginBottom:'1rem' }}>
              <p style={{ margin:'0 0 4px', fontSize:12, color:'#64748B' }}>PLANO ATUAL</p>
              <p style={{ margin:'0 0 8px', fontSize:24, fontWeight:700, color:'#60A5FA', textTransform:'capitalize' as any }}>{usuario?.plano}</p>
              <p style={{ margin:0, fontSize:12, color:'#94A3B8' }}>Assinatura {usuario?.assinatura}</p>
            </div>
            <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.6 }}>
              Para alterar seu plano ou cancelar a assinatura, entre em contato com o suporte.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
