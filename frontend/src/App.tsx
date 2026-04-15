import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Clientes from './pages/clientes/Clientes'
import Ordens from './pages/ordens/Ordens'
import Estoque from './pages/estoque/Estoque'
import Financeiro from './pages/financeiro/Financeiro'
import Orcamentos from './pages/orcamentos/Orcamentos'
import PDV from './pages/pdv/PDV'
import Agenda from './pages/agenda/Agenda'
import Servicos from './pages/servicos/Servicos'
import Configuracoes from './pages/configuracoes/Configuracoes'

function RotaProtegida({ children }: { children: React.ReactElement }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      Carregando...
    </div>
  )
  return usuario ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

const EmConstrucao = ({ nome }: { nome: string }) => (
  <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
    <h2>{nome}</h2>
    <p>Módulo em desenvolvimento</p>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard"  element={<RotaProtegida><Dashboard /></RotaProtegida>} />
          <Route path="/ordens" element={<RotaProtegida><Ordens /></RotaProtegida>} />
          <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
          <Route path="/orcamentos" element={<RotaProtegida><Orcamentos /></RotaProtegida>} />
          <Route path="/estoque" element={<RotaProtegida><Estoque /></RotaProtegida>} />
          <Route path="/servicos" element={<RotaProtegida><Servicos /></RotaProtegida>} />
          <Route path="/financeiro" element={<RotaProtegida><Financeiro /></RotaProtegida>} />
          <Route path="/pdv" element={<RotaProtegida><PDV /></RotaProtegida>} />
          <Route path="/agenda" element={<RotaProtegida><Agenda /></RotaProtegida>} />
          <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
          <Route path="/techscan"   element={<RotaProtegida><EmConstrucao nome="TechScan" /></RotaProtegida>} />
          <Route path="/"           element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  )
}

export default App
