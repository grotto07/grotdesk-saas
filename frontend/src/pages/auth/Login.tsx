import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) {
      toast.error('Preencha email e senha')
      return
    }
    setCarregando(true)
    try {
      await login(email, senha)
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao fazer login')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F3F4F6'
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '2.5rem',
        width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#185FA5', margin: 0 }}>
            GrotDesk
          </h1>
          <p style={{ color: '#6B7280', marginTop: 6, fontSize: 14 }}>
            Sistema de gestão para assistência técnica
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%', padding: '11px', borderRadius: 8,
              background: carregando ? '#93C5FD' : '#185FA5',
              color: '#fff', border: 'none', fontSize: 15,
              fontWeight: 600, cursor: carregando ? 'not-allowed' : 'pointer'
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: '#6B7280' }}>
          Não tem conta?{' '}
          <a href="/registro" style={{ color: '#185FA5', textDecoration: 'none', fontWeight: 500 }}>
            Criar conta grátis
          </a>
        </p>
      </div>
    </div>
  )
}
