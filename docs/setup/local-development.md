# Início rápido — desenvolvimento local

> Sobe o ligcentro completo em < 5 minutos sem nenhuma conta externa.

## Pré-requisitos

- Node.js ≥ 20 (`node -v`)
- Docker + Docker Compose (`docker -v` e `docker compose version`)
- Git

## 1. Clonar e instalar

```bash
git clone https://github.com/dougmotshell/ligcentro.git
cd ligcentro
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Para dev local, o .env.example já tem os valores corretos — sem necessidade de editar
```

## 3. Subir o ambiente

```bash
docker compose up --build -d
```

Isso sobe:
- **Postgres 16** na porta 5432 (dados em volume Docker)
- **App Next.js** na porta definida em `APP_PORT` (padrão 3000)

As migrações e seeds rodam automaticamente no primeiro `up`.

## 4. Acessar

| URL | O que é |
|---|---|
| `http://localhost:3000` | App (redireciona para `/pt-BR`) |
| `http://localhost:3000/pt-BR/demo` | Perfil de demonstração (seed) |
| `http://localhost:3000/pt-BR/login` | Login |
| `http://localhost:3000/pt-BR/dashboard` | Dashboard (autenticado) |

## 5. Comandos úteis

```bash
# Verificar qualidade
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run build         # Build de produção

# Testes
npm run test:unit     # Vitest (unitários)
npm run test:e2e      # Playwright (e2e) — requer app rodando

# Banco de dados
npm run db:migrate    # Aplicar migrações pendentes
npm run db:seed       # Executar seeds
npm run db:reset      # Resetar banco (APAGA TUDO — só dev!)

# Docker
docker compose up -d          # Subir em background
docker compose down           # Parar
docker compose down -v        # Parar + apagar volumes (reset total)
docker compose logs -f app    # Ver logs do app
docker compose logs -f db     # Ver logs do Postgres

# Acesso direto ao banco (dev)
psql postgresql://ligcentro:ligcentro@localhost:5432/ligcentro
```

## 6. Auth em desenvolvimento local

Por padrão, o dev local usa uma **simulação de auth** via middleware:
- Qualquer e-mail/senha aceita no formulário de login (sem Supabase)
- O usuário de sessão é o do perfil `demo` (seed)

Para testar com Supabase Auth real em dev, configure as variáveis `NEXT_PUBLIC_SUPABASE_*` no `.env` com um projeto Supabase real. Ver [guia de configuração](./external-services.md).

## Resolução de problemas comuns

| Problema | Solução |
|---|---|
| Porta 3000 ocupada | `APP_PORT=3001 docker compose up` |
| Migrations não aplicadas | `docker compose down -v && docker compose up --build` |
| Erro de tipos TypeScript | `npm run typecheck` para ver erros; verifique `.env` |
| Build falha | `npm run build 2>&1 \| head -50` — ver primeiro erro |
