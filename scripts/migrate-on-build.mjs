#!/usr/bin/env node
/**
 * Portão de migração no build de produção.
 *
 * Motivo (TCK-0025): o deploy de produção é a integração Git da Vercel, e nada
 * no caminho aplicava `db/migrations/`. O banco de produção ficou **sem nenhuma
 * tabela** enquanto o app era publicado normalmente — o login com Google
 * respondia `oauth_failed` porque `SELECT ... FROM profiles` estourava com
 * `relation "profiles" does not exist`. Schema e código passam a subir juntos:
 * se a migração não puder ser aplicada, o build falha em vez de publicar um app
 * que conversa com um banco que não existe.
 *
 * Onde roda:
 *   * fora da Vercel (build local, CI)  → pula. O CI não tem banco de produção,
 *     e migrar a partir da máquina de alguém não é o contrato deste script.
 *   * Vercel preview                    → pula. Preview compartilha o banco com
 *     produção; migrar num preview aplicaria em produção sem revisão.
 *   * Vercel produção                   → aplica; falha o build em qualquer erro.
 */
import { spawnSync } from 'node:child_process';

const isVercel = Boolean(process.env.VERCEL);
const vercelEnv = process.env.VERCEL_ENV;

function skip(reason) {
  console.log(`[migrate-on-build] pulado: ${reason}`);
  process.exit(0);
}

if (!isVercel) {
  skip('build fora da Vercel — rode `npm run db:migrate` manualmente quando precisar.');
}

if (vercelEnv !== 'production') {
  skip(`VERCEL_ENV=${vercelEnv ?? '(vazio)'} — só o build de produção migra.`);
}

if (!process.env.DATABASE_URL) {
  console.error(
    '[migrate-on-build] DATABASE_URL ausente no build de produção.\n' +
      'Sem ela o schema não pode ser aplicado e o app subiria contra um banco não migrado.\n' +
      'Defina DATABASE_URL nas variáveis de ambiente do projeto na Vercel (escopo Production).'
  );
  process.exit(1);
}

console.log('[migrate-on-build] aplicando migrações pendentes em produção...');

const result = spawnSync(process.execPath, ['scripts/migrate.mjs'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.error(
    '[migrate-on-build] a migração falhou — build interrompido de propósito.\n' +
      'Publicar o código sem o schema correspondente é o defeito que este portão existe para impedir.'
  );
  process.exit(1);
}

console.log('[migrate-on-build] schema em dia.');
