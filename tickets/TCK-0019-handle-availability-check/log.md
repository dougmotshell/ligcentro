# Log — TCK-0019: Verificação de disponibilidade de handle nunca roda no navegador

> Append-only.

## [1] ACTION — 2026-08-01 18:10 — qa-validator
- Ação: Ao escrever o e2e do TCK-0016, o passo que esperava "Handle disponível." falhou. Investiguei com um teste instrumentado que conta as requisições para `check-handle`.
- Resultado: **0 chamadas** com `fill()` e 0 com `pressSequentially()`; o formulário não exibe nem "Verificando disponibilidade...". Não é artefato do teste — a verificação está morta em produção desde que foi escrita.
- Handoff: ticket aberto para o frontend-developer; o e2e do TCK-0016 fica bloqueado neste ponto até a correção.

## [2] ACTION — 2026-08-01 18:40 — frontend-developer
- Ação: Duas correções. (a) `watch('handle')` → `useWatch({ control, name })`, a API reativa do react-hook-form. (b) O efeito deixou de espelhar estado: formato e reserva passaram a ser calculados na renderização (função pura do valor) e só a consulta ao servidor guarda estado — o que também eliminou o erro de lint `Calling setState synchronously within an effect`, que a correção (a) revelou.
- Motivo: Critérios 1 a 3.
- Resultado: ok — o e2e do TCK-0016 agora passa pelo passo "Handle disponível.", e o botão de envio fica desabilitado enquanto o handle é inválido ou está em uso. Lint: 0 erros (a correção removeu um dos avisos preexistentes).
- Lição: L-015 (registrada).

## [3] ACTION — 2026-08-01 18:45 — qa-validator
- Ação: Validação pelo e2e e pela suíte.
- Resultado: 3/3 no Playwright, incluindo o passo que espera o indicador; 84 testes unitários; lint 0 erros; typecheck e build limpos.
- Veredito: **aprovado**. Critério 4 atendido pelo próprio e2e do fluxo crítico, que falha se o indicador voltar a não aparecer.
