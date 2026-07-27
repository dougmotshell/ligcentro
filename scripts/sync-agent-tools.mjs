#!/usr/bin/env node
/**
 * sync-agent-tools.mjs — gera os wrappers de slash commands e agentes
 * para as ferramentas de IA a partir das fontes canônicas do repositório.
 *
 * Fontes canônicas (edite SOMENTE estas):
 *   - Skills:  .agents/skills/<name>/SKILL.md  (padrão aberto Agent Skills;
 *              lido nativamente por Claude Code via symlink .claude/skills,
 *              Codex e GitHub Copilot)
 *   - Agentes: agents/**<name>.md
 *
 * Saídas geradas (NÃO editar à mão — rode `npm run sync-agent-tools`):
 *   - .github/prompts/<name>.prompt.md   → Copilot (VS Code): /<name>
 *   - .github/agents/<name>.agent.md     → Copilot: @<name>
 *   - .gemini/commands/<name>.toml       → Gemini CLI: /<name>
 *   - .agent/workflows/<name>.md         → Antigravity: /<name>
 *   - .windsurf/workflows/<name>.md      → Windsurf: /<name>
 *   - .cursor/commands/<name>.md         → Cursor: /<name>
 *   (Codex não precisa de wrapper: invoca as skills de .agents/skills
 *    com `$<name>` ou pelo menu /skills.)
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, '.agents', 'skills');
const AGENTS_DIR = join(ROOT, 'agents');

const GENERATED_NOTE =
  'Arquivo gerado por scripts/sync-agent-tools.mjs — não edite à mão.';

/** Lê o frontmatter YAML simples (name/description em uma linha) de um .md. */
function parseFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields.name && fields.description ? fields : null;
}

/** Coleta as skills canônicas. */
function collectSkills() {
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .map((entry) => {
      const meta = parseFrontmatter(join(SKILLS_DIR, entry, 'SKILL.md'));
      if (!meta) throw new Error(`SKILL.md sem frontmatter válido: ${entry}`);
      return { ...meta, sourcePath: `.agents/skills/${entry}/SKILL.md` };
    });
}

/** Coleta os agentes canônicos (exclui READMEs e protocolos, que não são personas). */
function collectAgents() {
  const NOT_PERSONAS = new Set([
    'README.md',
    'handoff-protocol.md',
    'security-audit-protocol.md',
    'security-workflow.md',
  ]);
  const agents = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== 'memory') walk(full); // memory/ é contexto, não persona
        continue;
      }
      if (!entry.endsWith('.md') || NOT_PERSONAS.has(entry)) continue;
      const meta = parseFrontmatter(full);
      if (!meta) continue;
      agents.push({ ...meta, sourcePath: relative(ROOT, full) });
    }
  };
  walk(AGENTS_DIR);
  return agents;
}

/** Recria um diretório de saída do zero (remove wrappers órfãos). */
function resetDir(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

/** Corpo comum dos wrappers de skill: aponta para a fonte canônica. */
function skillBody(skill, argsPlaceholder) {
  return [
    `Leia o arquivo \`${skill.sourcePath}\` deste repositório e siga rigorosamente as instruções dele, resolvendo os links relativos a partir daquele arquivo.`,
    '',
    argsPlaceholder
      ? `Argumentos do usuário para a skill: ${argsPlaceholder}`
      : 'O texto digitado após o comando são os argumentos do usuário para a skill.',
    '',
    'Antes de começar, leia também o `AGENTS.md` na raiz do repositório (regras globais do projeto).',
  ].join('\n');
}

const skills = collectSkills();
const agents = collectAgents();

// --- Copilot: prompt files (/<name> no chat do VS Code) ---
const promptsDir = join(ROOT, '.github', 'prompts');
resetDir(promptsDir);
for (const skill of skills) {
  writeFileSync(
    join(promptsDir, `${skill.name}.prompt.md`),
    [
      '---',
      `description: ${skill.description}`,
      '---',
      '',
      `<!-- ${GENERATED_NOTE} Fonte: ${skill.sourcePath} -->`,
      '',
      skillBody(skill, null),
      '',
    ].join('\n'),
  );
}

// --- Copilot: custom agents (@<name>) ---
const copilotAgentsDir = join(ROOT, '.github', 'agents');
resetDir(copilotAgentsDir);
for (const agent of agents) {
  writeFileSync(
    join(copilotAgentsDir, `${agent.name}.agent.md`),
    [
      '---',
      `name: ${agent.name}`,
      `description: ${agent.description}`,
      '---',
      '',
      `<!-- ${GENERATED_NOTE} Fonte: ${agent.sourcePath} -->`,
      '',
      `Assuma integralmente o papel de agente definido em \`${agent.sourcePath}\` neste repositório: leia aquele arquivo antes de qualquer ação e siga missão, responsabilidades, limites ("não faz") e handoffs descritos nele.`,
      '',
      'Siga também o `AGENTS.md` na raiz (regras globais), o `agents/handoff-protocol.md` (fluxo de tickets, logs e memória persistente) e leia `agents/memory/` antes de trabalhar.',
      '',
    ].join('\n'),
  );
}

// --- Gemini CLI: custom commands (/<name>) ---
const geminiDir = join(ROOT, '.gemini', 'commands');
resetDir(geminiDir);
for (const skill of skills) {
  const escape = (s) => s.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  writeFileSync(
    join(geminiDir, `${skill.name}.toml`),
    [
      `# ${GENERATED_NOTE} Fonte: ${skill.sourcePath}`,
      `description = "${escape(skill.description)}"`,
      'prompt = """',
      skillBody(skill, '{{args}}').replaceAll('"""', '\\"""'),
      '"""',
      '',
    ].join('\n'),
  );
}

// --- Antigravity (.agent/workflows) e Windsurf (.windsurf/workflows): /<name> ---
for (const base of [join(ROOT, '.agent', 'workflows'), join(ROOT, '.windsurf', 'workflows')]) {
  resetDir(base);
  for (const skill of skills) {
    writeFileSync(
      join(base, `${skill.name}.md`),
      [
        '---',
        `description: ${skill.description}`,
        '---',
        '',
        `<!-- ${GENERATED_NOTE} Fonte: ${skill.sourcePath} -->`,
        '',
        skillBody(skill, null),
        '',
      ].join('\n'),
    );
  }
}

// --- Cursor: commands (/<name>) ---
const cursorDir = join(ROOT, '.cursor', 'commands');
resetDir(cursorDir);
for (const skill of skills) {
  writeFileSync(
    join(cursorDir, `${skill.name}.md`),
    [
      `# /${skill.name}`,
      '',
      `<!-- ${GENERATED_NOTE} Fonte: ${skill.sourcePath} -->`,
      '',
      skillBody(skill, null),
      '',
    ].join('\n'),
  );
}

console.log(
  `ok: ${skills.length} skills → prompts/gemini/antigravity/windsurf/cursor; ${agents.length} agentes → .github/agents`,
);
