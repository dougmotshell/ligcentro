# Manual do usuário — ligcentro

> **Gerado automaticamente** por `npm run manual:capture`. Não edite estes
> arquivos à mão: o texto vive em `e2e/manual/screens.ts` e as imagens são
> capturadas do app rodando de verdade. Editar aqui é perder o trabalho na
> próxima execução.

Este manual mostra o ligcentro como ele é hoje — cada imagem é uma foto da tela
real, não uma maquete. As telas aparecem em tema claro e escuro, em português e
inglês, no celular e no computador.

## Capítulos

1. [Página inicial](./01-landing.md) — A porta de entrada do ligcentro.
2. [Criar conta](./02-signup.md) — Onde a conta nasce.
3. [Entrar](./03-login.md) — Retorno de quem já tem conta, pelos mesmos caminhos do cadastro.
4. [Primeiros passos](./04-onboarding.md) — O guia que aparece logo após o cadastro e leva do zero ao primeiro perfil publicado em poucos passos.
5. [Editor — Perfil](./05-dashboard-profile.md) — O centro do produto.
6. [Editor — Blocos](./06-dashboard-blocks.md) — A lista de blocos é o conteúdo da sua página: links, redes sociais e formas de contato, na ordem que você definir.
7. [Editor — Temas](./07-dashboard-themes.md) — A aparência da página pública: temas prontos e ajuste fino de cor de fundo, cor de botão, fonte e formato dos botões.
8. [Editor — Meus dados](./08-dashboard-account.md) — Seus direitos sobre os próprios dados: exportar tudo o que o ligcentro guarda ou apagar a conta de vez.
9. [Analytics](./09-analytics.md) — Quantas visitas e cliques sua página recebeu, e quais links funcionam melhor.
10. [Página pública](./10-public-profile.md) — O que o mundo vê quando abre o seu link.

## Como regenerar

```sh
docker compose up -d db     # o Postgres de desenvolvimento
npm run manual:capture
```

O comando builda o app, sobe um servidor próprio, fotografa todas as telas e
reescreve este diretório. Diferença esperada entre execuções: as datas do gráfico
de analytics acompanham o dia em que a captura rodou.
