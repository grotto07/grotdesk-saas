import React, { useState } from 'react'
import { ImpressaoOS } from '../../components/ImpressaoOS'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  ordemId: string
}

export default function Impressao({ ordemId }: Props) {
  const { usuario } = useAuth()
  const [tipo, setTipo] = useState<'os' | 'garantia'>('os')
  const [mostrar, setMostrar] = useState(false)

  const empresa = {
    nome: usuario?.nome_empresa || 'Assistencia Tecnica',
    telefone: '',
    endereco: '',
    cnpj: '',
  }

  if (mostrar) {
    return (
      <ImpressaoOS
        ordemId={ordemId}
        tipo={tipo}
        empresa={empresa}
        onFechar={() => setMostrar(false)}
      />
    )
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ background:'#fff', borderRadius:12, padding:'2rem', border:'1px solid #E5E7EB', width:360, textAlign:'center' }}>
        <h3 style={{ margin:'0 0 1.5rem', fontSize:17, fontWeight:600 }}>Selecione o documento</h3>
        <div style={{ display:'flex', gap:12, marginBottom:'1.5rem' }}>
          {(['os','garantia'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)}
              style={{ flex:1, padding:'14px', borderRadius:10, border:'2px solid',
                borderColor: tipo===t ? '#185FA5' : '#E5E7EB',
                background: tipo===t ? '#EFF6FF' : '#fff',
                color: tipo===t ? '#1D4ED8' : '#6B7280',
                fontWeight: tipo===t ? 600 : 400, cursor:'pointer', fontSize:14 }}>
              {t === 'os' ? 'Ordem de Servico' : 'Certificado de Garantia'}
            </button>
          ))}
        </div>
        <button onClick={() => setMostrar(true)}
          style={{ width:'100%', padding:'11px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          Visualizar documento
        </button>
      </div>
    </div>
  )
}
