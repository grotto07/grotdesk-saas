const router = require('express').Router()
const db     = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

// ── LISTAR ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { tipo, status, mes, pagina = 1, limite = 20 } = req.query
    const offset = (pagina - 1) * limite
    const params = [req.usuario.empresa_id]
    let where = 'WHERE empresa_id = $1'

    if (tipo)   { params.push(tipo);   where += ` AND tipo = $${params.length}` }
    if (status) { params.push(status); where += ` AND status = $${params.length}` }
    if (mes)    { params.push(mes);    where += ` AND TO_CHAR(criado_em, 'YYYY-MM') = $${params.length}` }

    params.push(limite, offset)
    const { rows } = await db.query(
      `SELECT * FROM financeiro ${where} ORDER BY criado_em DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )
    const total = await db.query(`SELECT COUNT(*) FROM financeiro ${where}`, params.slice(0, params.length-2))

    // Resumo do mês
    const resumo = await db.query(
      `SELECT
        COALESCE(SUM(valor) FILTER (WHERE tipo='receita' AND status='pago'),0) as receitas,
        COALESCE(SUM(valor) FILTER (WHERE tipo='despesa' AND status='pago'),0) as despesas,
        COALESCE(SUM(valor) FILTER (WHERE tipo='receita' AND status='pendente'),0) as a_receber,
        COALESCE(SUM(valor) FILTER (WHERE tipo='despesa' AND status='pendente'),0) as a_pagar
       FROM financeiro WHERE empresa_id = $1
       AND DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW())`,
      [req.usuario.empresa_id]
    )

    res.json({ lancamentos: rows, total: parseInt(total.rows[0].count), resumo: resumo.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar financeiro' })
  }
})

// ── CRIAR ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { tipo, categoria, descricao, valor, status, vencimento } = req.body
  if (!tipo || !descricao || !valor) return res.status(400).json({ erro: 'Tipo, descrição e valor são obrigatórios' })
  try {
    const { rows } = await db.query(
      `INSERT INTO financeiro (empresa_id,tipo,categoria,descricao,valor,status,vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.usuario.empresa_id, tipo, categoria, descricao, valor, status||'pendente', vencimento||null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar lançamento' })
  }
})

// ── MARCAR COMO PAGO ──────────────────────────
router.patch('/:id/pagar', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE financeiro SET status='pago', pago_em=CURRENT_DATE WHERE id=$1 AND empresa_id=$2 RETURNING *`,
      [req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Lançamento não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar' })
  }
})

// ── DELETAR ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM financeiro WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    res.json({ mensagem: 'Lançamento removido' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover' })
  }
})

module.exports = router
