import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { abrirWhatsApp, copiarMensagem, msgOSPronta, msgOSEntregue, msgCobranca } from '../utils/whatsapp'

interface Props {
  ordem: {
    id: string
    numero: number
    cliente_nome: string
    cliente_telefone: string
    equipamento: string
    valor_total: number
    status: string
  }
  empresa: string
  endereco?: string
  onFechar: () => void
}

export default function PainelWhatsApp({ ordem, empresa, endereco, onFechar }: Props) {
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo]         = useState<string | null>(null)

  const templates = [
    {
      key: 'pronta',
      label: 'OS Pronta para retirada',
      cor: '#059669',
      bg: '#D1FAE5',
      icone: '✅',
      gerar: () => msgOSPronta({
        cliente:     ordem.cliente_nome,
        empresa,
        numero:      ordem.numero,
        equipamento: ordem.equipamento,
        valor_total: ordem.valor_total,
        endereco,
      })
    },
    {
      key: 'entregue',
      label: 'Agradecimento pos-entrega',
      cor: '#185FA5',
      bg: '#EFF6FF',
      icone: '🎉',
      gerar: () => msgOSEntregue({
        cliente:     ordem.cliente_nome,
        empresa,
        numero:      ordem.numero,
        equipamento: ordem.equipamento,
      })
    },
    {
      key: 'cobranca',
      label: 'Lembrete de pagamento',
      cor: '#D97706',
      bg: '#FEF3C7',
      icone: '💰',
      gerar: () => msgCobranca({
        cliente:    ordem.cliente_nome,
        empresa,
        numero:     ordem.numero,
        valor:      ordem.valor_total,
        vencimento: new Date().toLocaleDateString('pt-BR'),
      })
    },
    {
      key: 'custom',
      label: 'Mensagem personalizada',
      cor: '#6B7280',
      bg: '#F3F4F6',
      icone: '✏️',
      gerar: () => 'Ola, ' + ordem.cliente_nome + '!\n\n'
    },
  ]

  const selecionar = (t: typeof templates[0]) => {
    setTipo(t.key)
    setMensagem(t.gerar())
  }

  const enviar = () => {
    if (!mensagem.trim()) return toast.error('Digite uma mensagem')
    if (!ordem.cliente_telefone) return toast.error('Cliente sem telefone cadastrado')
    abrirWhatsApp(ordem.cliente_telefone, mensagem)
  }

  const copiar = () => {
    copiarMensagem(mensagem, () => toast.success('Mensagem copiada!'))
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:560, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#25D366' }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:600, color:'#fff' }}>Enviar WhatsApp</h3>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'rgba(255,255,255,0.8)' }}>
              OS #{ordem.numero} — {ordem.cliente_nome} — {ordem.cliente_telefone || 'Sem telefone'}
            </p>
          </div>
          <button onClick={onFechar} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:13, color:'#fff' }}>Fechar</button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'1.25rem' }}>

          {/* Templates */}
          <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:600, color:'#374151' }}>Escolha um modelo:</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'1.25rem' }}>
            {templates.map(t => (
              <button key={t.key} onClick={() => selecionar(t)}
                style={{ padding:'10px 12px', borderRadius:8, border:'2px solid',
                  borderColor: tipo===t.key ? t.cor : '#E5E7EB',
                  background: tipo===t.key ? t.bg : '#fff',
                  color: tipo===t.key ? t.cor : '#6B7280',
                  cursor:'pointer', textAlign:'left', fontSize:13, fontWeight: tipo===t.key ? 600 : 400 }}>
                <span style={{ marginRight:6 }}>{t.icone}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Editor de mensagem */}
          {tipo && (
            <>
              <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:600, color:'#374151' }}>
                Mensagem {tipo === 'custom' ? '(personalize)' : '(pode editar antes de enviar)'}:
              </p>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                rows={10}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' as any, fontFamily:'inherit', lineHeight:1.6 }}
              />

              {/* Preview formatado */}
              <div style={{ background:'#ECF9F1', borderRadius:8, padding:'10px 12px', marginTop:8 }}>
                <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:600, color:'#065F46' }}>PREVIEW (como vai aparecer no WhatsApp)</p>
                <div style={{ fontSize:13, color:'#065F46', lineHeight:1.6, whiteSpace:'pre-wrap' as any }}>
                  {mensagem}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botões de ação */}
        {tipo && (
          <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #E5E7EB', display:'flex', gap:10 }}>
            <button onClick={copiar}
              style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB', background:'#fff', fontSize:14, fontWeight:500, cursor:'pointer' }}>
              Copiar mensagem
            </button>
            <button onClick={enviar} disabled={!ordem.cliente_telefone}
              style={{ flex:2, padding:'10px', borderRadius:8, border:'none',
                background: ordem.cliente_telefone ? '#25D366' : '#9CA3AF',
                color:'#fff', fontSize:14, fontWeight:700, cursor: ordem.cliente_telefone ? 'pointer' : 'not-allowed' }}>
              Abrir WhatsApp e Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
