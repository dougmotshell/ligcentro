-- Migração 0000: inicial
-- Estrutura base pronta para Supabase CLI e Postgres local.
-- Esta migração está intencionalmente vazia: nenhuma tabela de produto
-- existe na Fase 0. As tabelas de produto começam na Fase 1.
-- Formato: compatível com `supabase db push` e aplicação manual via psql.

-- Extensões úteis para o futuro (idempotentes)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
