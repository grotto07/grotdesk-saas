const router = require('express').Router()
const db = require('../config/database')
const { autenticar } = require('../middlewares/auth')

router.use(autenticar)

router.get('/', async (req, res) => {
  try {
    const { busca, categoria } = req.query
    const params = [req.usuario.empresa_id]
    let where = 'WHERE empresa_id = $1'

    if (busca) {
      params.push('%' + busca + '%')
      where += ' AND (nome ILIKE $' + params.length + ' OR descricao ILIKE $' + params.length + ')'
    }
    if (categoria) {
      params.push(categoria)
      where += ' AND categoria = $' + params.length
    }

    const { rows } = await db.query(
      'SELECT * FROM servicos ' + where + ' ORDER BY categoria, nome',
      params
    )
    res.json({ servicos: rows, total: rows.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar servicos' })
  }
})

router.post('/', async (req, res) => {
  const { nome, descricao, categoria, preco, duracao_estimada, ativo } = req.body
  if (!nome) return res.status(400).json({ erro: 'Nome e obrigatorio' })
  try {
    const { rows } = await db.query(
      'INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada, ativo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.usuario.empresa_id, nome, descricao, categoria, preco || 0, duracao_estimada, ativo !== false]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar servico' })
  }
})

router.put('/:id', async (req, res) => {
  const { nome, descricao, categoria, preco, duracao_estimada, ativo } = req.body
  try {
    const { rows } = await db.query(
      'UPDATE servicos SET nome=$1, descricao=$2, categoria=$3, preco=$4, duracao_estimada=$5, ativo=$6 WHERE id=$7 AND empresa_id=$8 RETURNING *',
      [nome, descricao, categoria, preco || 0, duracao_estimada, ativo !== false, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Servico nao encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar servico' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM servicos WHERE id=$1 AND empresa_id=$2', [req.params.id, req.usuario.empresa_id])
    res.json({ mensagem: 'Servico removido' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover servico' })
  }
})

module.exports = router
