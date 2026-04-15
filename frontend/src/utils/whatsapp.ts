// Utilitário de mensagens WhatsApp
// Abre o WhatsApp Web com mensagem e número preenchidos automaticamente

export function abrirWhatsApp(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, '')
  const tel = numero.startsWith('55') ? numero : '55' + numero
  const url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(mensagem)
  window.open(url, '_blank')
}

export function copiarMensagem(mensagem: string, callback?: () => void) {
  navigator.clipboard.writeText(mensagem).then(() => {
    if (callback) callback()
  })
}

// ── TEMPLATES DE MENSAGEM ─────────────────────

export function msgOrcamento(params: {
  cliente: string
  empresa: string
  numero: number
  itens: Array<{ descricao: string; quantidade: number; valor_unitario: number }>
  total: number
  validade_dias: number
  observacoes?: string
}) {
  const itens = params.itens.map(i =>
    '  - ' + i.descricao + ' (' + i.quantidade + 'x R$' + Number(i.valor_unitario).toFixed(2) + ')'
  ).join('\n')

  const validade = new Date()
  validade.setDate(validade.getDate() + params.validade_dias)

  return (
    'Ola, ' + params.cliente + '! 👋\n\n' +
    'Segue o orcamento *#' + params.numero + '* da *' + params.empresa + '*:\n\n' +
    '*Servicos/Pecas:*\n' + itens + '\n\n' +
    '*Total: R$' + Number(params.total).toFixed(2) + '*\n' +
    'Validade: ' + validade.toLocaleDateString('pt-BR') + '\n' +
    (params.observacoes ? '\nObs: ' + params.observacoes + '\n' : '') +
    '\nPodemos prosseguir com o servico? 😊'
  )
}

export function msgOSPronta(params: {
  cliente: string
  empresa: string
  numero: number
  equipamento: string
  valor_total: number
  endereco?: string
}) {
  return (
    'Ola, ' + params.cliente + '! 😊\n\n' +
    'Seu *' + params.equipamento + '* esta pronto!\n\n' +
    '*OS #' + params.numero + '* - ' + params.empresa + '\n' +
    'Valor: *R$' + Number(params.valor_total).toFixed(2) + '*\n\n' +
    (params.endereco ? 'Endereco para retirada:\n' + params.endereco + '\n\n' : '') +
    'Horario de atendimento: seg-sex das 8h as 18h, sabados das 8h as 12h.\n\n' +
    'Qualquer duvida estamos a disposicao! 🛠️'
  )
}

export function msgOSEntregue(params: {
  cliente: string
  empresa: string
  numero: number
  equipamento: string
}) {
  return (
    'Ola, ' + params.cliente + '! 🎉\n\n' +
    'Obrigado por confiar no servico da *' + params.empresa + '*!\n\n' +
    'Seu *' + params.equipamento + '* foi entregue com sucesso.\n' +
    'OS #' + params.numero + '\n\n' +
    'Lembre-se: oferecemos *garantia de 90 dias* para o servico realizado.\n\n' +
    'Se precisar de qualquer suporte, entre em contato. Ate a proxima! 😊'
  )
}

export function msgCobranca(params: {
  cliente: string
  empresa: string
  numero: number
  valor: number
  vencimento: string
}) {
  return (
    'Ola, ' + params.cliente + '!\n\n' +
    'Passando para lembrar sobre o pagamento pendente da *' + params.empresa + '*:\n\n' +
    'OS #' + params.numero + '\n' +
    'Valor: *R$' + Number(params.valor).toFixed(2) + '*\n' +
    'Vencimento: ' + params.vencimento + '\n\n' +
    'Por favor, entre em contato para regularizar. Obrigado!'
  )
}
