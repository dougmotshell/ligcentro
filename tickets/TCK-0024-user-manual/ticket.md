# TCK-0024: Manual do usuário gerado por Playwright

- **status:** done
- **owner:** docs-writer
- **created:** 2026-08-15 · **by:** Douglas
- **type:** docs
- **size:** M
- **phase:** Fase 4 — Polimento e lançamento do grátis

## Pedido original (verbatim)

> implemente tudo e depois quero que na mesma tela ... (ver TCK-0020)

## Diagnóstico (tech-lead)

`docs/user-manual/` não existe. A skill `/user-manual` descreve o que gerar, mas
o script que navega as telas, tira os screenshots e monta os capítulos nunca foi
escrito. Agora é viável: existe suíte e2e e o Playwright sobe o app sozinho.

Depende do TCK-0020 (a tela de cadastro muda) — o manual é gerado **depois**, para
não fotografar uma UI que já mudou.

## Requisito refinado (product-analyst)

- User story: como pessoa que acabou de criar conta, quero um manual com imagens
  reais de cada tela para aprender a montar meu perfil sem tentativa e erro.
- Fora de escopo: vídeo, tradução para idiomas além de pt-BR/en-US.

## Critérios de aceite (verificáveis)

- [x] 1. `npm run manual:capture` navega o app real e gera `docs/user-manual/` do zero.
- [x] 2. Screenshots cobrem as telas principais: landing, cadastro, login,
      onboarding, dashboard (perfil, blocos, tema, compartilhar), analytics e
      perfil público.
- [x] 3. Capturas nos dois temas (claro/escuro) e nos dois idiomas (pt-BR/en-US),
      em viewport mobile e desktop, com nomes previsíveis.
- [x] 4. Um capítulo por tela, em pt-BR, explicando o que fazer — não apenas a imagem.
- [x] 5. O script é determinístico: roda duas vezes seguidas sem intervenção manual
      e sem depender de dados pré-existentes no banco.
- [x] 6. O manual reflete a tela de cadastro unificada do TCK-0020.

## Referências

- Skill: `.agents/skills/user-manual/SKILL.md` · Plano: `03-mvp-roadmap.md:69`
- Arquivos-alvo: `scripts/`, `docs/user-manual/`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0024: manual do usuário gerado por Playwright`
- Evidência final: 10 capítulos + 80 imagens; duas execuções consecutivas byte a byte idênticas
- Docs atualizados: `docs/user-manual/` (gerado), roadmap
