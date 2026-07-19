# ADR-0003 — Backend serverless em AWS Lambda

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Contêineres de API e renderização (C4-C2)

## Contexto e problema

O tráfego de um produto link-in-bio é **extremamente irregular**: um criador com
milhões de seguidores posta um link e gera um pico instantâneo em um único perfil.
Precisamos de uma plataforma de execução que:

- escale de zero a picos altos sem provisionamento manual;
- tenha custo proporcional ao uso (muitos perfis têm tráfego baixo);
- minimize operação de servidores/patching.

## Alternativas consideradas

1. **Contêineres sempre ligados (ECS/EKS/k8s)** — controle fino e latência
   previsível, mas exige capacity planning e paga-se ocioso.
2. **AWS Lambda (FaaS)** — escala automática por requisição, custo por invocação,
   zero servidores para gerir. Sujeito a cold start e limites de execução.
3. **PaaS (Heroku/App Runner)** — simples, mas menos elástico e mais caro em escala.

## Decisão

Adotar **AWS Lambda** como plataforma primária de execução para a API GraphQL
(ver [ADR-0004](./0004-api-graphql.md)) e para a renderização SSR. Node.js/TypeScript
como runtime. Infra descrita em **Terraform**.

Fronteiras: cargas de trabalho de longa duração ou stateful (processamento de
dados em lote) ficam fora do Lambda e vão para o pipeline de dados
(ver [ADR-0006](./0006-pipeline-analytics-eventos.md)).

## Consequências

- **Positivas:** elasticidade automática; custo proporcional; menor carga
  operacional; encaixe natural com o pipeline orientado a eventos.
- **Negativas / custos:** cold starts; limites de tempo/memória; complexidade de
  observabilidade distribuída; acoplamento a AWS.
- **Riscos e mitigação:** cold start → provisioned concurrency nas funções de
  perfil; lock-in → isolar regras de negócio em módulos independentes do handler.

## Referência ao Linktree (engenharia reversa)

**AWS Lambda** aparece confirmado na stack do Linktree, assim como **Terraform**
para IaC. O uso de EventBridge/Glue/S3 no pipeline reforça uma arquitetura
AWS-native e event-driven — consistente com a escolha por serverless.
