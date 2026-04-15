import React, { useEffect, useState } from 'react'
import api from '../services/api'

interface Ordem {
  id: string
  numero: number
  cliente_nome: string
  cliente_telefone: string
  cliente_email: string
  equipamento: string
  marca: string
  modelo: string
  numero_serie: string
  problema: string
  diagnostico: string
  solucao: string
  status: string
  prioridade: string
  valor_servico: number
  valor_pecas: number
  valor_total: number
  data_entrada: string
  data_previsao: string
  data_conclusao: string
  tecnico_nome: string
  observacoes: string
}

interface Props {
  ordemId: string
  tipo: 'os' | 'garantia'
  empresa: { nome: string; telefone?: string; endereco?: string; cnpj?: string }
  onFechar: () => void
}

export function ImpressaoOS({ ordemId, tipo, empresa, onFechar }: Props) {
  const [ordem, setOrdem] = useState<Ordem | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/ordens/' + ordemId).then(({ data }: { data: Ordem }) => {
      setOrdem(data)
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [ordemId])

  const imprimir = () => window.print()

  const fmt = (v: any) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'
  const fmtR = (v: any) => 'R$' + Number(v || 0).toFixed(2)

  if (carregando) return <div style={{ padding:40, textAlign:'center' }}>Carregando...</div>
  if (!ordem) return <div style={{ padding:40, textAlign:'center' }}>Ordem não encontrada</div>

  const diasGarantia = 90

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
        @media screen {
          .print-page { max-width: 794px; margin: 0 auto; }
        }
      `}</style>

      {/* Botões de ação */}
      <div className="no-print" style={{ background:'#0F172A', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={imprimir} style={{ background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'8px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Imprimir / Salvar PDF
          </button>
        </div>
        <button onClick={onFechar} style={{ background:'transparent', color:'#94A3B8', border:'1px solid #334155', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' }}>
          Fechar
        </button>
      </div>

      {/* Documento */}
      <div style={{ background:'#F3F4F6', minHeight:'100vh', padding:'24px 0' }}>
        <div className="print-page" style={{ background:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', borderRadius:8, overflow:'hidden' }}>

          {tipo === 'os' ? (
            /* ── ORDEM DE SERVIÇO ── */
            <>
              {/* Cabeçalho */}
              <div style={{ background:'#0F172A', color:'#fff', padding:'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>{empresa.nome}</h1>
                  {empresa.cnpj && <p style={{ margin:'4px 0 0', fontSize:12, color:'#94A3B8' }}>CNPJ: {empresa.cnpj}</p>}
                  {empresa.telefone && <p style={{ margin:'2px 0 0', fontSize:12, color:'#94A3B8' }}>{empresa.telefone}</p>}
                  {empresa.endereco && <p style={{ margin:'2px 0 0', fontSize:12, color:'#94A3B8' }}>{empresa.endereco}</p>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:0, fontSize:12, color:'#64748B' }}>ORDEM DE SERVIÇO</p>
                  <p style={{ margin:'4px 0 0', fontSize:28, fontWeight:700, color:'#60A5FA' }}>#{ordem.numero}</p>
                  <p style={{ margin:'4px 0 0', fontSize:12, color:'#64748B' }}>Entrada: {fmt(ordem.data_entrada)}</p>
                </div>
              </div>

              <div style={{ padding:'24px 28px' }}>
                {/* Cliente e Equipamento */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                  <div style={{ border:'1px solid #E5E7EB', borderRadius:8, padding:'14px 16px' }}>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1 }}>DADOS DO CLIENTE</p>
                    <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:600 }}>{ordem.cliente_nome}</p>
                    {ordem.cliente_telefone && <p style={{ margin:'0 0 2px', fontSize:13, color:'#6B7280' }}>{ordem.cliente_telefone}</p>}
                    {ordem.cliente_email && <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>{ordem.cliente_email}</p>}
                  </div>
                  <div style={{ border:'1px solid #E5E7EB', borderRadius:8, padding:'14px 16px' }}>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1 }}>EQUIPAMENTO</p>
                    <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:600 }}>{ordem.equipamento}</p>
                    {(ordem.marca || ordem.modelo) && <p style={{ margin:'0 0 2px', fontSize:13, color:'#6B7280' }}>{ordem.marca} {ordem.modelo}</p>}
                    {ordem.numero_serie && <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>S/N: {ordem.numero_serie}</p>}
                  </div>
                </div>

                {/* Datas e status */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                  {[
                    { label:'Entrada', valor: fmt(ordem.data_entrada) },
                    { label:'Previsao', valor: fmt(ordem.data_previsao) },
                    { label:'Conclusao', valor: fmt(ordem.data_conclusao) },
                    { label:'Status', valor: ordem.status?.replace(/_/g,' ') },
                  ].map(({ label, valor }) => (
                    <div key={label} style={{ background:'#F9FAFB', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                      <p style={{ margin:'0 0 4px', fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{label}</p>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#374151' }}>{valor}</p>
                    </div>
                  ))}
                </div>

                {/* Problema, diagnóstico, solução */}
                {[
                  { label:'PROBLEMA RELATADO', valor: ordem.problema },
                  { label:'DIAGNOSTICO TECNICO', valor: ordem.diagnostico },
                  { label:'SOLUCAO APLICADA', valor: ordem.solucao },
                  { label:'OBSERVACOES', valor: ordem.observacoes },
                ].filter(i => i.valor).map(({ label, valor }) => (
                  <div key={label} style={{ border:'1px solid #E5E7EB', borderRadius:8, padding:'14px 16px', marginBottom:12 }}>
                    <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1 }}>{label}</p>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{valor}</p>
                  </div>
                ))}

                {/* Valores */}
                <div style={{ border:'1px solid #E5E7EB', borderRadius:8, overflow:'hidden', marginBottom:20 }}>
                  <div style={{ background:'#F9FAFB', padding:'10px 16px' }}>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1 }}>VALORES</p>
                  </div>
                  {[
                    { label:'Mao de obra / Servico', valor: fmtR(ordem.valor_servico) },
                    { label:'Pecas e materiais', valor: fmtR(ordem.valor_pecas) },
                  ].map(({ label, valor }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid #F3F4F6' }}>
                      <span style={{ fontSize:13, color:'#6B7280' }}>{label}</span>
                      <span style={{ fontSize:13 }}>{valor}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:'2px solid #E5E7EB', background:'#F0FDF4' }}>
                    <span style={{ fontSize:15, fontWeight:700 }}>TOTAL</span>
                    <span style={{ fontSize:18, fontWeight:700, color:'#059669' }}>{fmtR(ordem.valor_total)}</span>
                  </div>
                </div>

                {/* Assinaturas */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, marginTop:32 }}>
                  {['Tecnico Responsavel', 'Cliente'].map(label => (
                    <div key={label} style={{ textAlign:'center' }}>
                      <div style={{ borderBottom:'1px solid #374151', marginBottom:6, height:40 }}/>
                      <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{label}</p>
                    </div>
                  ))}
                </div>

                <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:20 }}>
                  Documento gerado em {new Date().toLocaleDateString('pt-BR')} — {empresa.nome}
                </p>
              </div>
            </>
          ) : (
            /* ── CERTIFICADO DE GARANTIA ── */
            <>
              <div style={{ background:'#0F172A', color:'#fff', padding:'28px', textAlign:'center' }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#64748B', letterSpacing:2 }}>CERTIFICADO DE</p>
                <h1 style={{ margin:0, fontSize:32, fontWeight:700, color:'#60A5FA' }}>GARANTIA</h1>
                <p style={{ margin:'8px 0 0', fontSize:14, color:'#94A3B8' }}>{empresa.nome}</p>
              </div>

              <div style={{ padding:'32px 40px' }}>
                <div style={{ border:'2px solid #E5E7EB', borderRadius:12, padding:'24px', marginBottom:24 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    {[
                      { label:'Cliente', valor: ordem.cliente_nome },
                      { label:'Telefone', valor: ordem.cliente_telefone || '—' },
                      { label:'Equipamento', valor: ordem.equipamento },
                      { label:'Marca / Modelo', valor: ((ordem.marca||'') + ' ' + (ordem.modelo||'')).trim() || '—' },
                      { label:'Numero de serie', valor: ordem.numero_serie || '—' },
                      { label:'OS de referencia', valor: '#' + ordem.numero },
                      { label:'Data do servico', valor: fmt(ordem.data_conclusao || ordem.data_entrada) },
                      { label:'Garantia valida ate', valor: (() => {
                        const d = new Date(ordem.data_conclusao || ordem.data_entrada)
                        d.setDate(d.getDate() + diasGarantia)
                        return d.toLocaleDateString('pt-BR')
                      })() },
                    ].map(({ label, valor }) => (
                      <div key={label}>
                        <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:1 }}>{label.toUpperCase()}</p>
                        <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#111827' }}>{valor}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Serviço realizado */}
                <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'16px 20px', marginBottom:20 }}>
                  <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'#065F46', letterSpacing:1 }}>SERVICO REALIZADO</p>
                  <p style={{ margin:0, fontSize:13, color:'#065F46', lineHeight:1.6 }}>{ordem.solucao || ordem.diagnostico || 'Servico tecnico realizado conforme solicitado.'}</p>
                </div>

                {/* Termos */}
                <div style={{ border:'1px solid #E5E7EB', borderRadius:8, padding:'16px 20px', marginBottom:28 }}>
                  <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1 }}>TERMOS DA GARANTIA</p>
                  {[
                    'Esta garantia cobre defeitos relacionados exclusivamente ao servico realizado pelo periodo de ' + diasGarantia + ' dias.',
                    'A garantia nao cobre danos causados por mau uso, queda, liquidos, virus ou alteracoes realizadas por terceiros.',
                    'A garantia sera valida mediante apresentacao deste documento.',
                    'Pecas substituidas possuem garantia conforme fabricante.',
                    'Para acionar a garantia, entre em contato com nossa assistencia tecnica.',
                  ].map((t, i) => (
                    <p key={i} style={{ margin:'0 0 6px', fontSize:12, color:'#6B7280', lineHeight:1.5 }}>• {t}</p>
                  ))}
                </div>

                {/* Assinaturas */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60 }}>
                  {['Tecnico Responsavel', 'Cliente'].map(label => (
                    <div key={label} style={{ textAlign:'center' }}>
                      <div style={{ borderBottom:'1px solid #374151', height:40, marginBottom:6 }}/>
                      <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{label}</p>
                    </div>
                  ))}
                </div>

                <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:24 }}>
                  {empresa.nome} — {empresa.telefone || ''} — {empresa.endereco || ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
