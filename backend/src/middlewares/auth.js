const jwt = require('jsonwebtoken')
const db   = require('../config/database')

// ── Verifica se o token é válido ──────────────
const autenticar = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' })
    }

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grottech_secret')

    // Busca usuário no banco
    const { rows } = await db.query(
      'SELECT u.*, e.plano, e.assinatura_status FROM usuarios u JOIN empresas e ON u.empresa_id = e.id WHERE u.id = $1 AND u.ativo = true',
      [decoded.id]
    )

    if (!rows[0]) {
      return res.status(401).json({ erro: 'Usuário não encontrado' })
    }

    // Verifica assinatura ativa
    const empresa = rows[0]
    if (empresa.assinatura_status === 'cancelada' || empresa.assinatura_status === 'suspensa') {
      return res.status(403).json({ erro: 'Assinatura inativa. Acesse o painel para regularizar.' })
    }

    req.usuario = rows[0]
    next()
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

// ── Verifica se é admin ───────────────────────
const apenasAdmin = (req, res, next) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' })
  }
  next()
}

// ── Verifica plano do assinante ───────────────
const exigirPlano = (...planos) => (req, res, next) => {
  if (!planos.includes(req.usuario.plano)) {
    return res.status(403).json({
      erro: `Este recurso exige plano: ${planos.join(' ou ')}`,
      plano_atual: req.usuario.plano
    })
  }
  next()
}

module.exports = { autenticar, apenasAdmin, exigirPlano }