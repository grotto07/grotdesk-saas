const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../config/database')
const { autenticar } = require('../middlewares/auth')

// ── REGISTRO DE NOVA EMPRESA ──────────────────
router.post('/registro', async (req, res) => {
  const { nome_empresa, nome, email, senha } = req.body

  if (!nome_empresa || !nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' })
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' })
  }

  try {
    // Verifica se email já existe
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email])
    if (existe.rows[0]) {
      return res.status(400).json({ erro: 'Email já cadastrado' })
    }

    const senha_hash = await bcrypt.hash(senha, 10)

    // Cria empresa e usuário admin em uma transação
    await db.query('BEGIN')

    const empresa = await db.query(
      'INSERT INTO empresas (nome, email) VALUES ($1, $2) RETURNING id',
      [nome_empresa, email]
    )

    await db.query(
      'INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4, $5)',
      [empresa.rows[0].id, nome, email, senha_hash, 'admin']
    )

    await db.query('COMMIT')

    res.status(201).json({ mensagem: 'Conta criada com sucesso! Faça login para continuar.' })
  } catch (err) {
    await db.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar conta' })
  }
})

// ── LOGIN ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' })
  }

  try {
    const { rows } = await db.query(
      `SELECT u.*, e.nome as nome_empresa, e.plano, e.assinatura_status, e.trial_ate
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.email = $1 AND u.ativo = true`,
      [email]
    )

    const usuario = rows[0]
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' })
    }

    if (usuario.assinatura_status === 'cancelada') {
      return res.status(403).json({ erro: 'Assinatura cancelada. Entre em contato para reativar.' })
    }

    const token = jwt.sign(
      { id: usuario.id, empresa_id: usuario.empresa_id, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'grottech_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      usuario: {
        id:            usuario.id,
        nome:          usuario.nome,
        email:         usuario.email,
        perfil:        usuario.perfil,
        nome_empresa:  usuario.nome_empresa,
        plano:         usuario.plano,
        assinatura:    usuario.assinatura_status,
        trial_ate:     usuario.trial_ate,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao fazer login' })
  }
})

// ── PERFIL DO USUÁRIO LOGADO ──────────────────
router.get('/perfil', autenticar, async (req, res) => {
  res.json({
    id:           req.usuario.id,
    nome:         req.usuario.nome,
    email:        req.usuario.email,
    perfil:       req.usuario.perfil,
    plano:        req.usuario.plano,
    assinatura:   req.usuario.assinatura_status,
  })
})

// ── ALTERAR SENHA ─────────────────────────────
router.put('/senha', autenticar, async (req, res) => {
  const { senha_atual, senha_nova } = req.body

  if (!senha_atual || !senha_nova) {
    return res.status(400).json({ erro: 'Preencha todos os campos' })
  }

  if (senha_nova.length < 6) {
    return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres' })
  }

  try {
    const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id])
    const correta = await bcrypt.compare(senha_atual, rows[0].senha_hash)

    if (!correta) {
      return res.status(401).json({ erro: 'Senha atual incorreta' })
    }

    const nova_hash = await bcrypt.hash(senha_nova, 10)
    await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [nova_hash, req.usuario.id])

    res.json({ mensagem: 'Senha alterada com sucesso!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao alterar senha' })
  }
})

module.exports = router