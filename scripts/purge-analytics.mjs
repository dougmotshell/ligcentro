#!/usr/bin/env node
/**
 * Expurgo da retenção de analytics.
 *
 * Usa a janela de `ANALYTICS_RETENTION_DAYS` (padrão 730 dias) e delega a
 * exclusão à função `purge_old_analytics`, criada na migração 0007.
 *
 * Rodar periodicamente: `npm run analytics:purge` (cron do Supabase, GitHub
 * Actions agendado ou manualmente). Sem isso, `ANALYTICS_RETENTION_DAYS` seria
 * só um comentário — e a tabela cresceria para sempre.
 */
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL não definida.');
  process.exit(1);
}

const retentionDays = Number.parseInt(process.env.ANALYTICS_RETENTION_DAYS ?? '730', 10);

if (!Number.isFinite(retentionDays) || retentionDays < 1) {
  console.error(`ANALYTICS_RETENTION_DAYS inválida: ${process.env.ANALYTICS_RETENTION_DAYS}`);
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === 'true' || /supabase\.(com|co|in)/.test(databaseUrl);
const sql = postgres(databaseUrl, { ssl: useSsl ? 'require' : false, max: 1 });

try {
  const [result] = await sql`SELECT * FROM public.purge_old_analytics(${retentionDays})`;

  console.log(
    `Expurgo concluído (retenção de ${retentionDays} dias): ` +
      `${result.deleted_page_views} visitas e ${result.deleted_block_clicks} cliques removidos.`
  );
} catch (error) {
  console.error('Falha no expurgo:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
