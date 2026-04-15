const router = require('express').Router()
const db = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

router.get('/', async (req, res) => {
  try {
    const { status, pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite
    const params = [req.usuario.empresa_id]
    let where = 'WHERE o.empresa_id = $1'

    if (status) {
      params.push(status)
      where += ' AND o.status = $' + params.length
    }

    params.push(limite, offset)

    const { rows } = await db.query(
      'SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email ' +
      'FROM orcamentos o ' +
      'JOIN clientes c ON o.cliente_id = c.id ' +
      where +
      ' ORDER BY o.criado_em DESC ' +
      'LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length,
      params
    )

    const total = await db.query(
      'SELECT COUNT(*) FROM orcamentos o ' + where,
      params.slice(0, params.length - 2)
    )

    res.json({ orcamentos: rows, total: parseInt(total.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar orcamentos' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email ' +
      'FROM orcamentos o ' +
      'JOIN clientes c ON o.cliente_id = c.id ' +
      'WHERE o.id = $1 AND o.empresa_id = $2',
      [req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Orcamento nao encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar orcamento' })
  }
})

router.post('/', async (req, res) => {
  const { cliente_id, ordem_id, itens, desconto, validade_dias, observacoes } = req.body
  if (!cliente_id || !itens || itens.length === 0) {
    return res.status(400).json({ erro: 'Cliente e itens sao obrigatorios' })
  }

  const subtotal = itens.reduce(function(s, i) { return s + (i.quantidade * i.valor_unitario) }, 0)
  const desc = desconto || 0
  const total = subtotal - desc

  try {
    const { rows } = await db.query(
      'INSERT INTO orcamentos (empresa_id, cliente_id, ordem_id, itens, subtotal, desconto, total, validade_dias, observacoes) ' +
      'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [req.usuario.empresa_id, cliente_id, ordem_id || null, JSON.stringify(itens), subtotal, desc, total, validade_dias || 7, observacoes]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar orcamento' })
  }
})

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const validos = ['pendente', 'enviado', 'aprovado', 'recusado', 'expirado']
  if (!validos.includes(status)) return res.status(400).json({ erro: 'Status invalido' })

  try {
    const enviado_em = status === 'enviado' ? new Date() : null
    const respondido_em = (status === 'aprovado' || status === 'recusado') ? new Date() : null

    const { rows } = await db.query(
      'UPDATE orcamentos SET status=$1, enviado_em = COALESCE($2, enviado_em), respondido_em = COALESCE($3, respondido_em) ' +
      'WHERE id=$4 AND empresa_id=$5 RETURNING *',
      [status, enviado_em, respondido_em, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Orcamento nao encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status' })
  }
})

router.get('/:id/mensagem', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone, e.nome as empresa_nome ' +
      'FROM orcamentos o ' +
      'JOIN clientes c ON o.cliente_id = c.id ' +
      'JOIN empresas e ON o.empresa_id = e.id ' +
      'WHERE o.id = $1 AND o.empresa_id = $2',
      [req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Orcamento nao encontrado' })

    const orc = rows[0]
    const itens = orc.itens.map(function(i) {
      return '  - ' + i.descricao + ' (' + i.quantidade + 'x R$' + Number(i.valor_unitario).toFixed(2) + ') = R$' + (i.quantidade * i.valor_unitario).toFixed(2)
    }).join('\n')

    const validade = new Date(orc.criado_em)
    validade.setDate(validade.getDate() + orc.validade_dias)

    const msg = 'Ola, ' + orc.cliente_nome + '!\n\n' +
      'Segue o orcamento #' + orc.numero + ' da ' + orc.empresa_nome + ':\n\n' +
      'Itens:\n' + itens + '\n\n' +
      (orc.desconto > 0 ? 'Desconto: -R$' + Number(orc.desconto).toFixed(2) + '\n' : '') +
      'Total: R$' + Number(orc.total).toFixed(2) + '\n\n' +
      'Validade: ate ' + validade.toLocaleDateString('pt-BR') + '\n' +
      (orc.observacoes ? '\nObs: ' + orc.observacoes + '\n' : '') +
      '\nPodemos prosseguir com o servico?'

    res.json({ mensagem: msg, telefone: orc.cliente_telefone })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao gerar mensagem' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM orcamentos WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    res.json({ mensagem: 'Orcamento removido' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover' })
  }
})

module.exports = router