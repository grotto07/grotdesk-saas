const router = require('express').Router()
const db = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

router.get('/', async (req, res) => {
  try {
    const { pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite

    const { rows } = await db.query(
      'SELECT v.*, c.nome as cliente_nome FROM vendas v ' +
      'LEFT JOIN clientes c ON v.cliente_id = c.id ' +
      'WHERE v.empresa_id = $1 ' +
      'ORDER BY v.criado_em DESC ' +
      'LIMIT $2 OFFSET $3',
      [req.usuario.empresa_id, limite, offset]
    )

    const total = await db.query(
      'SELECT COUNT(*) FROM vendas WHERE empresa_id = $1',
      [req.usuario.empresa_id]
    )

    const resumo = await db.query(
      'SELECT ' +
      'COALESCE(SUM(total) FILTER (WHERE DATE(criado_em) = CURRENT_DATE), 0) as vendas_hoje, ' +
      'COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC(\'month\', criado_em) = DATE_TRUNC(\'month\', NOW())), 0) as vendas_mes, ' +
      'COUNT(*) FILTER (WHERE DATE(criado_em) = CURRENT_DATE) as qtd_hoje ' +
      'FROM vendas WHERE empresa_id = $1 AND status = \'concluida\'',
      [req.usuario.empresa_id]
    )

    res.json({ vendas: rows, total: parseInt(total.rows[0].count), resumo: resumo.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar vendas' })
  }
})

router.post('/', async (req, res) => {
  const { cliente_id, itens, desconto, forma_pagamento } = req.body
  if (!itens || itens.length === 0) {
    return res.status(400).json({ erro: 'Adicione pelo menos um item' })
  }

  const subtotal = itens.reduce(function(s, i) { return s + (i.quantidade * i.preco_unitario) }, 0)
  const desc = desconto || 0
  const total = subtotal - desc

  try {
    await db.query('BEGIN')

    const { rows } = await db.query(
      'INSERT INTO vendas (empresa_id, cliente_id, usuario_id, itens, subtotal, desconto, total, forma_pagamento, status) ' +
      'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [req.usuario.empresa_id, cliente_id || null, req.usuario.id,
       JSON.stringify(itens), subtotal, desc, total, forma_pagamento || 'dinheiro', 'concluida']
    )

    // Baixar estoque dos produtos vendidos
    for (const item of itens) {
      if (item.produto_id) {
        await db.query(
          'UPDATE estoque SET quantidade = quantidade - $1 WHERE id = $2 AND empresa_id = $3 AND quantidade >= $1',
          [item.quantidade, item.produto_id, req.usuario.empresa_id]
        )
        await db.query(
          'INSERT INTO estoque_movimentos (empresa_id, produto_id, tipo, quantidade, motivo, usuario_id) VALUES ($1,$2,$3,$4,$5,$6)',
          [req.usuario.empresa_id, item.produto_id, 'saida', item.quantidade, 'Venda PDV #' + rows[0].id, req.usuario.id]
        )
      }
    }

    // Registrar receita no financeiro
    await db.query(
      'INSERT INTO financeiro (empresa_id, tipo, categoria, descricao, valor, status, pago_em) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE)',
      [req.usuario.empresa_id, 'receita', 'Venda', 'Venda PDV - ' + (forma_pagamento || 'dinheiro'), total, 'pago']
    )

    await db.query('COMMIT')
    res.status(201).json(rows[0])
  } catch (err) {
    await db.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ erro: 'Erro ao registrar venda' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vendas WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    res.json({ mensagem: 'Venda removida' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover' })
  }
})

module.exports = router
