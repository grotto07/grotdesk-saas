const router = require('express').Router()
const db     = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

router.get('/', async (req, res) => {
  const eid = req.usuario.empresa_id
  try {
    const [ordens, clientes, receita, estoque, orcamentos] = await Promise.all([
      db.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'aberta') as abertas,
        COUNT(*) FILTER (WHERE DATE(data_entrada) = CURRENT_DATE) as hoje,
        COUNT(*) as total
        FROM ordens WHERE empresa_id = $1`, [eid]),
      db.query(`SELECT COUNT(*) FROM clientes WHERE empresa_id = $1`, [eid]),
      db.query(`SELECT COALESCE(SUM(valor_total),0) as receita,
        COALESCE(AVG(valor_total),0) as ticket
        FROM ordens WHERE empresa_id = $1
        AND DATE_TRUNC('month', data_entrada) = DATE_TRUNC('month', NOW())
        AND status != 'cancelada'`, [eid]),
      db.query(`SELECT COUNT(*) FROM estoque WHERE empresa_id = $1 AND quantidade <= quantidade_minima`, [eid]),
      db.query(`SELECT COUNT(*) FROM orcamentos WHERE empresa_id = $1 AND status = 'pendente'`, [eid]),
    ])

    res.json({
      total_ordens:         parseInt(ordens.rows[0].total),
      ordens_abertas:       parseInt(ordens.rows[0].abertas),
      ordens_hoje:          parseInt(ordens.rows[0].hoje),
      total_clientes:       parseInt(clientes.rows[0].count),
      receita_mes:          parseFloat(receita.rows[0].receita),
      ticket_medio:         parseFloat(receita.rows[0].ticket),
      estoque_baixo:        parseInt(estoque.rows[0].count),
      orcamentos_pendentes: parseInt(orcamentos.rows[0].count),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao carregar dashboard' })
  }
})

module.exports = router