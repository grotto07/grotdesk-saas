-- =============================================
-- GROTTECH SAAS - BANCO DE DADOS COMPLETO
-- =============================================

-- EXTENSÃO para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── EMPRESAS (cada assinante é uma empresa) ──
CREATE TABLE empresas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  telefone      VARCHAR(20),
  cnpj          VARCHAR(18),
  endereco      TEXT,
  logo_url      TEXT,
  plano         VARCHAR(20) DEFAULT 'basico' CHECK (plano IN ('basico','pro','enterprise')),
  assinatura_status VARCHAR(20) DEFAULT 'trial' CHECK (assinatura_status IN ('trial','ativa','cancelada','suspensa')),
  trial_ate     TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── USUÁRIOS ──────────────────────────────────
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  senha_hash    TEXT NOT NULL,
  perfil        VARCHAR(20) DEFAULT 'tecnico' CHECK (perfil IN ('admin','tecnico','atendente')),
  ativo         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── CLIENTES ─────────────────────────────────
CREATE TABLE clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(100),
  telefone      VARCHAR(20),
  cpf_cnpj      VARCHAR(18),
  endereco      TEXT,
  observacoes   TEXT,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── ORDENS DE SERVIÇO ─────────────────────────
CREATE TABLE ordens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id),
  tecnico_id    UUID REFERENCES usuarios(id),
  numero        SERIAL,
  equipamento   VARCHAR(100) NOT NULL,
  marca         VARCHAR(50),
  modelo        VARCHAR(100),
  numero_serie  VARCHAR(100),
  problema      TEXT NOT NULL,
  diagnostico   TEXT,
  solucao       TEXT,
  status        VARCHAR(30) DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','aguardando_peca','pronta','entregue','cancelada')),
  prioridade    VARCHAR(10) DEFAULT 'normal' CHECK (prioridade IN ('baixa','normal','alta','urgente')),
  valor_servico DECIMAL(10,2) DEFAULT 0,
  valor_pecas   DECIMAL(10,2) DEFAULT 0,
  valor_total   DECIMAL(10,2) GENERATED ALWAYS AS (valor_servico + valor_pecas) STORED,
  data_entrada  TIMESTAMP DEFAULT NOW(),
  data_previsao TIMESTAMP,
  data_conclusao TIMESTAMP,
  observacoes   TEXT,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── ORÇAMENTOS ───────────────────────────────
CREATE TABLE orcamentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id),
  ordem_id      UUID REFERENCES ordens(id),
  numero        SERIAL,
  status        VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','aprovado','recusado','expirado')),
  itens         JSONB NOT NULL DEFAULT '[]',
  subtotal      DECIMAL(10,2) DEFAULT 0,
  desconto      DECIMAL(10,2) DEFAULT 0,
  total         DECIMAL(10,2) DEFAULT 0,
  validade_dias INTEGER DEFAULT 7,
  observacoes   TEXT,
  enviado_em    TIMESTAMP,
  respondido_em TIMESTAMP,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── ESTOQUE ──────────────────────────────────
CREATE TABLE estoque (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  categoria     VARCHAR(50),
  marca         VARCHAR(50),
  modelo        VARCHAR(100),
  codigo        VARCHAR(50),
  quantidade    INTEGER DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 1,
  preco_custo   DECIMAL(10,2) DEFAULT 0,
  preco_venda   DECIMAL(10,2) DEFAULT 0,
  localizacao   VARCHAR(50),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── MOVIMENTAÇÕES DE ESTOQUE ─────────────────
CREATE TABLE estoque_movimentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id    UUID NOT NULL REFERENCES estoque(id),
  tipo          VARCHAR(10) CHECK (tipo IN ('entrada','saida')),
  quantidade    INTEGER NOT NULL,
  motivo        VARCHAR(100),
  ordem_id      UUID REFERENCES ordens(id),
  usuario_id    UUID REFERENCES usuarios(id),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── FINANCEIRO ───────────────────────────────
CREATE TABLE financeiro (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo          VARCHAR(10) CHECK (tipo IN ('receita','despesa')),
  categoria     VARCHAR(50),
  descricao     VARCHAR(200) NOT NULL,
  valor         DECIMAL(10,2) NOT NULL,
  status        VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  vencimento    DATE,
  pago_em       DATE,
  ordem_id      UUID REFERENCES ordens(id),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── PDV - VENDAS ─────────────────────────────
CREATE TABLE vendas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID REFERENCES clientes(id),
  usuario_id    UUID REFERENCES usuarios(id),
  itens         JSONB NOT NULL DEFAULT '[]',
  subtotal      DECIMAL(10,2) DEFAULT 0,
  desconto      DECIMAL(10,2) DEFAULT 0,
  total         DECIMAL(10,2) DEFAULT 0,
  forma_pagamento VARCHAR(30),
  status        VARCHAR(20) DEFAULT 'concluida',
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── DIAGNÓSTICOS TECHSCAN ────────────────────
CREATE TABLE techscan (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID REFERENCES clientes(id),
  ordem_id      UUID REFERENCES ordens(id),
  dados_pc      JSONB NOT NULL,
  diagnostico   TEXT,
  sugestoes     JSONB DEFAULT '[]',
  valor_sugerido DECIMAL(10,2),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ── ÍNDICES para performance ─────────────────
CREATE INDEX idx_ordens_empresa    ON ordens(empresa_id);
CREATE INDEX idx_ordens_cliente    ON ordens(cliente_id);
CREATE INDEX idx_ordens_status     ON ordens(status);
CREATE INDEX idx_clientes_empresa  ON clientes(empresa_id);
CREATE INDEX idx_estoque_empresa   ON estoque(empresa_id);
CREATE INDEX idx_financeiro_empresa ON financeiro(empresa_id);
CREATE INDEX idx_vendas_empresa    ON vendas(empresa_id);

-- ── EMPRESA E USUÁRIO ADMIN INICIAL ──────────
INSERT INTO empresas (nome, email, plano, assinatura_status)
VALUES ('Grottech', 'admin@grottech.com', 'pro', 'ativa');

INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil)
VALUES (
  (SELECT id FROM empresas WHERE email = 'admin@grottech.com'),
  'Administrador',
  'admin@grottech.com',
  '$2a$10$X9vFMFuIKMU1hVLmMBWRf.nxLBTH3ksPHK7S5JvXoRdTwJuQNqfYK',
  'admin'
);
-- senha padrão: grottech123

SELECT 'Banco criado com sucesso!' as resultado;
