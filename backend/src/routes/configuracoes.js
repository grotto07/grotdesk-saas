const router = require('express').Router()
const db = require('../config/database')
const { autenticar, apenasAdmin } = require('../middlewares/auth')

router.use(autenticar)

// ── BUSCAR DADOS DA EMPRESA ───────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM empresas WHERE id = $1',
      [req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Empresa nao encontrada' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar dados da empresa' })
  }
})

// ── ATUALIZAR DADOS DA EMPRESA ────────────────
router.put('/', apenasAdmin, async (req, res) => {
  const { nome, telefone, cnpj, endereco, logo_url } = req.body
  if (!nome) return res.status(400).json({ erro: 'Nome da empresa e obrigatorio' })
  try {
    const { rows } = await db.query(
      'UPDATE empresas SET nome=$1, telefone=$2, cnpj=$3, endereco=$4, logo_url=$5 WHERE id=$6 RETURNING *',
      [nome, telefone, cnpj, endereco, logo_url, req.usuario.empresa_id]
    )
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar empresa' })
  }
})

// ── LISTAR USUARIOS DA EMPRESA ────────────────
router.get('/usuarios', apenasAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE empresa_id = $1 ORDER BY nome',
      [req.usuario.empresa_id]
    )
    res.json({ usuarios: rows })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar usuarios' })
  }
})

// ── CRIAR USUARIO ─────────────────────────────
router.post('/usuarios', apenasAdmin, async (req, res) => {
  const { nome, email, senha, perfil } = req.body
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha sao obrigatorios' })
  const bcrypt = require('bcryptjs')
  try {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email])
    if (existe.rows[0]) return res.status(400).json({ erro: 'Email ja cadastrado' })
    const hash = await bcrypt.hash(senha, 10)
    const { rows } = await db.query(
      'INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil) VALUES ($1,$2,$3,$4,$5) RETURNING id, nome, email, perfil, ativo',
      [req.usuario.empresa_id, nome, email, hash, perfil || 'tecnico']
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar usuario' })
  }
})

// ── ATIVAR/DESATIVAR USUARIO ──────────────────
router.patch('/usuarios/:id/ativo', apenasAdmin, async (req, res) => {
  const { ativo } = req.body
  try {
    if (req.params.id === req.usuario.id) return res.status(400).json({ erro: 'Voce nao pode desativar sua propria conta' })
    const { rows } = await db.query(
      'UPDATE usuarios SET ativo=$1 WHERE id=$2 AND empresa_id=$3 RETURNING id, nome, ativo',
      [ativo, req.params.id, req.usuario.empresa_id]
    )
    if (!rows[0]) return res.status(404).json({ erro: 'Usuario nao encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar usuario' })
  }
})

module.exports = router
