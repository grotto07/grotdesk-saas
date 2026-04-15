const router = require('express').Router()
const db     = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

// ── LISTAR ordens ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, tecnico_id, busca, pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite
    const params = [req.usuario.empresa_id]
    let where = 'WHERE o.empresa_id = $1'

    if (status) { params.push(status); where += ` AND o.status = $${params.length}` }
    if (tecnico_id) { params.push(tecnico_id); where += ` AND o.tecnico_id = $${params.length}` }
    if (busca) { params.push(`%${busca}%`); where += ` AND (c.nome ILIKE $${params.length} OR o.equipamento ILIKE $${params.length} OR o.numero::text ILIKE $${params.length})` }

    params.push(limite, offset)
    const { rows } = await db.query(
      `SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone,
              u.nome as tecnico_nome
       FROM ordens o
       JOIN clientes c ON o.cliente_id = c.id
       LEFT JOIN usuarios u ON o.tecnico_id = u.id
       ${where}
       ORDER BY o.data_entrada DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const total = await db.query(
      `SELECT COUNT(*) FROM ordens o JOIN clientes c ON o.cliente_id = c.id ${where}`,
      params.slice(0, params.length - 2)
    )

    res.json({ ordens: rows, total: parseInt(total.rows[0].count), pagina: parseInt(pagina) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar ordens' })
  }
})

// ── BUSCAR uma ordem ──────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone,
              c.email as cliente_email, u.nome as tecnico_nome
       FROM ordens o
       JOIN clientes c ON o.cliente_id = c.id
       LEFT JOIN usuarios u ON o.tecnico_id = u.id
       WHERE o.id = $1 AND o.empresa_id = $2`,
      [req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Ordem não encontrada' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar ordem' })
  }
})

// ── CRIAR ordem ───────────────────────────────
router.post('/', async (req, res) => {
  const { cliente_id, tecnico_id, equipamento, marca, modelo, numero_serie,
          problema, prioridade, data_previsao, observacoes } = req.body

  if (!cliente_id || !equipamento || !problema) {
    return res.status(400).json({ erro: 'Cliente, equipamento e problema são obrigatórios' })
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO ordens
        (empresa_id, cliente_id, tecnico_id, equipamento, marca, modelo, numero_serie,
         problema, prioridade, data_previsao, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.usuario.empresa_id, cliente_id, tecnico_id, equipamento, marca, modelo,
       numero_serie, problema, prioridade || 'normal', data_previsao, observacoes]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar ordem' })
  }
})

// ── ATUALIZAR ordem ───────────────────────────
router.put('/:id', async (req, res) => {
  const { tecnico_id, equipamento, marca, modelo, problema, diagnostico,
          solucao, status, prioridade, valor_servico, valor_pecas,
          data_previsao, data_conclusao, observacoes } = req.body
  try {
    const { rows } = await db.query(
      `UPDATE ordens SET
        tecnico_id=$1, equipamento=$2, marca=$3, modelo=$4, problema=$5,
        diagnostico=$6, solucao=$7, status=$8, prioridade=$9,
        valor_servico=$10, valor_pecas=$11, data_previsao=$12,
        data_conclusao=$13, observacoes=$14
       WHERE id=$15 AND empresa_id=$16 RETURNING *`,
      [tecnico_id, equipamento, marca, modelo, problema, diagnostico,
       solucao, status, prioridade, valor_servico, valor_pecas,
       data_previsao, data_conclusao, observacoes, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Ordem não encontrada' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar ordem' })
  }
})

// ── ATUALIZAR só o status ─────────────────────
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const statusValidos = ['aberta','em_andamento','aguardando_peca','pronta','entregue','cancelada']
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' })
  }
  try {
    const conclusao = status === 'entregue' ? new Date() : null
    const { rows } = await db.query(
      'UPDATE ordens SET status=$1, data_conclusao=$2 WHERE id=$3 AND empresa_id=$4 RETURNING *',
      [status, conclusao, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Ordem não encontrada' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status' })
  }
})

module.exports = router
