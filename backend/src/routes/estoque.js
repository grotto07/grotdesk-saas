const router = require('express').Router()
const db     = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

// ── LISTAR ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { busca, categoria, pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite
    const params = [req.usuario.empresa_id]
    let where = 'WHERE empresa_id = $1'

    if (busca) { params.push(`%${busca}%`); where += ` AND (nome ILIKE $${params.length} OR codigo ILIKE $${params.length} OR marca ILIKE $${params.length})` }
    if (categoria) { params.push(categoria); where += ` AND categoria = $${params.length}` }

    params.push(limite, offset)
    const { rows } = await db.query(
      `SELECT * FROM estoque ${where} ORDER BY nome LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )
    const total = await db.query(`SELECT COUNT(*) FROM estoque ${where}`, params.slice(0, params.length-2))
    res.json({ produtos: rows, total: parseInt(total.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar estoque' })
  }
})

// ── CRIAR ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { nome, categoria, marca, modelo, codigo, quantidade, quantidade_minima, preco_custo, preco_venda, localizacao } = req.body
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })
  try {
    const { rows } = await db.query(
      `INSERT INTO estoque (empresa_id,nome,categoria,marca,modelo,codigo,quantidade,quantidade_minima,preco_custo,preco_venda,localizacao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.usuario.empresa_id, nome, categoria, marca, modelo, codigo, quantidade||0, quantidade_minima||1, preco_custo||0, preco_venda||0, localizacao]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar produto' })
  }
})

// ── ATUALIZAR ─────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nome, categoria, marca, modelo, codigo, quantidade_minima, preco_custo, preco_venda, localizacao } = req.body
  try {
    const { rows } = await db.query(
      `UPDATE estoque SET nome=$1,categoria=$2,marca=$3,modelo=$4,codigo=$5,quantidade_minima=$6,preco_custo=$7,preco_venda=$8,localizacao=$9
       WHERE id=$10 AND empresa_id=$11 RETURNING *`,
      [nome, categoria, marca, modelo, codigo, quantidade_minima||1, preco_custo||0, preco_venda||0, localizacao, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Produto não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar produto' })
  }
})

// ── MOVIMENTAR ESTOQUE (entrada/saída) ────────
router.post('/:id/movimentar', async (req, res) => {
  const { tipo, quantidade, motivo } = req.body
  if (!['entrada','saida'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' })
  if (!quantidade || quantidade <= 0) return res.status(400).json({ erro: 'Quantidade inválida' })

  try {
    await db.query('BEGIN')

    const prod = await db.query('SELECT * FROM estoque WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    if (!prod.rows[0]) { await db.query('ROLLBACK'); return res.status(404).json({ erro: 'Produto não encontrado' }) }

    if (tipo === 'saida' && prod.rows[0].quantidade < quantidade) {
      await db.query('ROLLBACK')
      return res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${prod.rows[0].quantidade}` })
    }

    const op = tipo === 'entrada' ? '+' : '-'
    const { rows } = await db.query(
      `UPDATE estoque SET quantidade = quantidade ${op} $1 WHERE id=$2 AND empresa_id=$3 RETURNING *`,
      [quantidade, req.params.id, req.usuario.empresa_id]
    )

    await db.query(
      'INSERT INTO estoque_movimentos (empresa_id,produto_id,tipo,quantidade,motivo,usuario_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.usuario.empresa_id, req.params.id, tipo, quantidade, motivo, req.usuario.id]
    )

    await db.query('COMMIT')
    res.json(rows[0])
  } catch (err) {
    await db.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ erro: 'Erro ao movimentar estoque' })
  }
})

// ── DELETAR ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM estoque WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    res.json({ mensagem: 'Produto removido' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover produto' })
  }
})

module.exports = router
