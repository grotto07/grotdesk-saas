CREATE TABLE IF NOT EXISTS servicos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  categoria     VARCHAR(50),
  preco         DECIMAL(10,2) DEFAULT 0,
  duracao_estimada VARCHAR(30),
  ativo         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_empresa ON servicos(empresa_id);

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Formatacao Windows', 'Formatacao e instalacao do sistema operacional Windows', 'Software', 120, '2-3 horas'
FROM empresas WHERE email = 'admin@grottech.com';

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Limpeza interna', 'Limpeza completa interna com troca de pasta termica', 'Manutencao', 80, '1 hora'
FROM empresas WHERE email = 'admin@grottech.com';

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Remocao de virus', 'Remocao de virus, malware e spyware', 'Software', 90, '1-2 horas'
FROM empresas WHERE email = 'admin@grottech.com';

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Troca de tela notebook', 'Substituicao de tela danificada', 'Hardware', 280, '1-2 horas'
FROM empresas WHERE email = 'admin@grottech.com';

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Upgrade para SSD', 'Substituicao de HD por SSD com migracao de dados', 'Hardware', 150, '2 horas'
FROM empresas WHERE email = 'admin@grottech.com';

INSERT INTO servicos (empresa_id, nome, descricao, categoria, preco, duracao_estimada)
SELECT id, 'Backup de dados', 'Realizacao de backup completo dos dados do cliente', 'Software', 60, '1 hora'
FROM empresas WHERE email = 'admin@grottech.com';

SELECT 'Tabela de servicos criada com sucesso!' as resultado;
