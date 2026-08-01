# TCK-0019: Verificação de disponibilidade de handle nunca roda no navegador

- **status:** done
- **owner:** frontend-developer
- **created:** 2026-08-01 · **by:** qa-validator (achado do TCK-0016)
- **type:** bug
- **size:** P
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Achado durante a escrita do e2e do TCK-0016. Referencia o TCK-0003/TCK-0004,
que estão `done` e não reabrem.)

## Diagnóstico

O formulário de cadastro mostra "Handle disponível." / "Este handle já está em
uso." conforme uma consulta a `/api/auth/check-handle`. No navegador, **essa
consulta nunca acontece**: um teste instrumentado registrando as requisições
contou **0 chamadas**, tanto com `fill()` quanto digitando caractere a caractere,
e nenhum texto de status aparece no formulário.

Causa raiz: `SignupForm` observa o campo com `watch('handle')` do react-hook-form
e usa o valor como dependência de um `useEffect`. `watch()` não é a API reativa —
não garante nova renderização —, então a dependência nunca muda e o efeito nunca
dispara. A API reativa é `useWatch`. O aviso de lint
`react-hooks/incompatible-library` nesta linha era o sintoma.

## Critérios de aceite

- [x] 1. Digitar um handle dispara a consulta a `/api/auth/check-handle`.
- [x] 2. O formulário mostra "Verificando...", depois disponível ou em uso.
- [x] 3. Handle já usado bloqueia o envio antes de o servidor recusar.
- [x] 4. Teste e2e cobre o indicador, para não voltar a passar despercebido.

## Referências

- Arquivos-alvo: `app/[locale]/signup/SignupForm.tsx` · Achado em: `tickets/TCK-0016-test-suite-ci/log.md`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0019: corrigir verificação de disponibilidade de handle`
- Evidência final: log entrada [2]
- Docs atualizados: —
