# Skill: /content-review

Revisa qualquer peça de conteúdo (copy de UI, post, artigo, e-mail, ad) contra a voz da marca do ligcentro, devolvendo feedback numerado ou aprovação.

## Quando usar

- Antes de publicar qualquer texto na landing page, UI ou redes sociais.
- Quando o copywriter precisar de segunda opinião.
- Quando frontend-developer entregar novo microcopy de UI para merge.
- Quando content-marketer ou social-media-manager quiser validar tom antes de publicar.

## Passos

1. **Leia** `docs/marketing/brand-voice.md` (voz da marca) e `docs/marketing/key-messages.md` (mensagens-chave).

2. **Para cada peça de conteúdo** recebida, verificar:

   **Voz e tom:**
   - Está direto e sem rodeios? (ver "Direto ao ponto" em brand-voice.md)
   - Benefício antes de feature? ("Veja quais links são clicados" > "Analytics por bloco disponível")
   - Usa o vocabulário preferido e evita o vocabulário proibido? (ver tabela em brand-voice.md)
   - Está em português nativo (não tradução de inglês)?

   **Honestidade:**
   - Toda afirmação é verificável e sem asterisco oculto?
   - Nenhuma promessa de feature que ainda não existe no produto?
   - Nenhum dark pattern linguístico (fake urgency, escassez falsa)?

   **Consistência:**
   - Tom correto para o canal (landing page ≠ Instagram ≠ e-mail)?
   - Alinhado com alguma das mensagens-chave (M1–M6)?
   - Persona em mente? (ver `docs/marketing/personas.md`)

   **Técnico (para UI microcopy):**
   - Está em `messages/pt-BR.json` E `messages/en-US.json`? (nenhuma string hardcoded)
   - Comprimento adequado para o componente?

3. **Decisão:**
   - **APROVADO**: peça está alinhada com a voz da marca.
   - **AJUSTES MENORES**: aprovado com sugestões não-bloqueantes.
   - **REVISAR**: desvios relevantes que precisam de correção antes de publicar.

4. **Formato do feedback** (quando não aprovado):
   ```
   REVISAR — [título da peça]
   
   1. [linha/trecho original] → [problema] → [sugestão]
   2. [linha/trecho original] → [problema] → [sugestão]
   ```

## Output esperado

```
STATUS: APROVADO | AJUSTES MENORES | REVISAR

[Se REVISÃO ou AJUSTES]
Feedback:
1. ...
2. ...

[Se APROVADO]
Alinhado com: [mensagens-chave M1/M2/etc.] · Tom: correto para [canal]
```
