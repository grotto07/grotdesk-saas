const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'grottech',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'grottech123',
})

pool.on('connect', () => {
  console.log('Banco de dados conectado!')
})

pool.on('error', (err) => {
  console.error('Erro no banco de dados:', err)
})

module.exports = pool