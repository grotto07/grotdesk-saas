const router = require('express').Router()
const db     = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

// ── LISTAR clientes ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { busca, pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite

    let query = `
      SELECT id, nome, email, telefone, cpf_cnpj, criado_em,
        (SELECT COUNT(*) FROM ordens o WHERE o.cliente_id = clientes.id) as total_ordens
      FROM clientes
      WHERE empresa_id = $1
    `
    const params = [req.usuario.empresa_id]

    if (busca) {
      query += ` AND (nome ILIKE $2 OR email ILIKE $2 OR telefone ILIKE $2 OR cpf_cnpj ILIKE $2)`
      params.push(`%${busca}%`)
      query += ` ORDER BY nome LIMIT $3 OFFSET $4`
      params.push(limite, offset)
    } else {
      query += ` ORDER BY nome LIMIT $2 OFFSET $3`
      params.push(limite, offset)
    }

    const { rows } = await db.query(query, params)

    const total = await db.query(
      'SELECT COUNT(*) FROM clientes WHERE empresa_id = $1',
      [req.usuario.empresa_id]
    )

    res.json({ clientes: rows, total: parseInt(total.rows[0].count), pagina: parseInt(pagina) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar clientes' })
  }
})

// ── BUSCAR um cliente ─────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM clientes WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' })

    // Últimas ordens do cliente
    const ordens = await db.query(
      `SELECT id, numero, equipamento, status, valor_total, data_entrada
       FROM ordens WHERE cliente_id = $1 ORDER BY data_entrada DESC LIMIT 5`,
      [req.params.id]
    )

    res.json({ ...rows[0], ultimas_ordens: ordens.rows })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cliente' })
  }
})

// ── CRIAR cliente ─────────────────────────────
router.post('/', async (req, res) => {
  const { nome, email, telefone, cpf_cnpj, endereco, observacoes } = req.body

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })

  try {
    const { rows } = await db.query(
      `INSERT INTO clientes (empresa_id, nome, email, telefone, cpf_cnpj, endereco, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.usuario.empresa_id, nome, email, telefone, cpf_cnpj, endereco, observacoes]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar cliente' })
  }
})

// ── ATUALIZAR cliente ─────────────────────────
router.put('/:id', async (req, res) => {
  const { nome, email, telefone, cpf_cnpj, endereco, observacoes } = req.body

  try {
    const { rows } = await db.query(
      `UPDATE clientes SET nome=$1, email=$2, telefone=$3, cpf_cnpj=$4, endereco=$5, observacoes=$6
       WHERE id=$7 AND empresa_id=$8 RETURNING *`,
      [nome, email, telefone, cpf_cnpj, endereco, observacoes, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar cliente' })
  }
})

// ── DELETAR cliente ───────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const ordens = await db.query(
      'SELECT COUNT(*) FROM ordens WHERE cliente_id = $1', [req.params.id]
    )
    if (parseInt(ordens.rows[0].count) > 0) {
      return res.status(400).json({ erro: 'Cliente possui ordens de serviço. Não é possível excluir.' })
    }

    await db.query(
      'DELETE FROM clientes WHERE id=$1 AND empresa_id=$2',
      [req.params.id, req.usuario.empresa_id]
    )
    res.json({ mensagem: 'Cliente removido com sucesso' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar cliente' })
  }
})

module.exports = router
