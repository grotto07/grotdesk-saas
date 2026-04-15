require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Segurança ──────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Limite de requisições (anti-ataque)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use(limiter)

// ── Rotas ──────────────────────────────────
app.use('/api/auth',      require('./routes/auth'))
app.use('/api/clientes',  require('./routes/clientes'))
app.use('/api/ordens',    require('./routes/ordens'))
app.use('/api/orcamentos',require('./routes/orcamentos'))
app.use('/api/estoque',   require('./routes/estoque'))
app.use('/api/financeiro',require('./routes/financeiro'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/techscan',  require('./routes/techscan'))

// ── Rota de teste ──────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', sistema: 'Grottech SaaS', versao: '1.0.0' })
})

// ── Erro genérico ──────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ erro: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
app.use('/api/pdv', require('./routes/pdv'))
app.use('/api/servicos', require('./routes/servicos'))
app.use('/api/configuracoes', require('./routes/configuracoes'))