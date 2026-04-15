import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const menuItens = [
  { path: '/dashboard',   label: 'Dashboard',         icon: '📊' },
  { path: '/ordens',      label: 'Ordens de Serviço', icon: '🔧' },
  { path: '/clientes',    label: 'Clientes',          icon: '👥' },
  { path: '/orcamentos',  label: 'Orçamentos',        icon: '📋' },
  { path: '/estoque',     label: 'Estoque',           icon: '📦' },
  { path: '/servicos',     label: 'Servicos',         icon: '🔩' },
  { path: '/financeiro',  label: 'Financeiro',        icon: '💰' },
  { path: '/pdv',         label: 'PDV',               icon: '🛒' },
  { path: '/agenda',      label: 'Agenda',            icon: '📅' },
  { path: '/configuracoes', label: 'Configuracoes', icon: '⚙️' },
  { path: '/techscan',    label: 'TechScan',          icon: '💻' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F3F4F6' }}>

      {/* Menu lateral */}
      <aside style={{
        width: 240, background: '#0F172A', display: 'flex',
        flexDirection: 'column', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.25rem', borderBottom: '1px solid #1E293B'
        }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Grottech
          </h1>
          <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0 0' }}>
            {usuario?.nome_empresa}
          </p>
        </div>

        {/* Itens do menu */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {menuItens.map(item => {
            const ativo = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: '10px 1.25rem', border: 'none',
                  background: ativo ? '#1E3A5F' : 'transparent',
                  color: ativo ? '#60A5FA' : '#94A3B8',
                  fontSize: 14, cursor: 'pointer', textAlign: 'left',
                  borderLeft: ativo ? '3px solid #3B82F6' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Usuário logado */}
        <div style={{
          padding: '1rem 1.25rem', borderTop: '1px solid #1E293B'
        }}>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 4px' }}>
            {usuario?.nome}
          </p>
          <p style={{ color: '#475569', fontSize: 11, margin: '0 0 10px' }}>
            {usuario?.perfil} · Plano {usuario?.plano}
          </p>
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1px solid #334155',
              color: '#64748B', padding: '6px 12px', borderRadius: 6,
              fontSize: 12, cursor: 'pointer', width: '100%'
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          background: '#fff', padding: '0 1.5rem', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #E5E7EB', flexShrink: 0
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
            {menuItens.find(m => m.path === location.pathname)?.label || 'Sistema'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: '#EFF6FF', color: '#1D4ED8', fontSize: 12,
              padding: '3px 10px', borderRadius: 20, fontWeight: 500
            }}>
              Plano {usuario?.plano}
            </span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {usuario?.nome}
            </span>
          </div>
        </header>

        {/* Página */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
