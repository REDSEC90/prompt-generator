# Exemplos Práticos

Use este documento como catálogo de receitas prontas.

Cada receita tem:

- contexto;
- comando completo;
- resultado esperado;
- variações úteis quando fizer sentido.

## Índice

- desenvolvimento
- documentação
- análise
- marketing
- brainstorming
- modos úteis

## Desenvolvimento

### Middleware Express com TypeScript

Contexto:

- middleware funcional;
- validação;
- tratamento de erro;
- testes básicos.

```bash
npm start -- \
  --theme "middleware de autenticação JWT" \
  --action "escreva" \
  --category code \
  --audience "dev backend Node.js" \
  --objective "validar token em rotas protegidas do Express" \
  --tone technical \
  --format code \
  --language TypeScript \
  --restrictions "sem libs extras além de jsonwebtoken,incluir tratamento de erros" \
  --variation 2
```

Resultado esperado:

- código TypeScript funcional;
- docstring explicativa;
- testes unitários básicos;
- tratamento de erros.

Variações úteis:

```bash
# Rate limiting
--theme "middleware de rate limiting por IP"
--restrictions "usar Redis para armazenamento,sem libs além de ioredis"

# Logging
--theme "middleware de logging de requisições"
--restrictions "usar Winston,incluir correlationId"
```

### Testes unitários

Contexto:

- código existente;
- necessidade de cobertura;
- casos válidos, inválidos e edge cases.

```bash
npm start -- \
  --theme "testes unitários para validação de email" \
  --action "escreva" \
  --category code \
  --audience "dev frontend React" \
  --objective "cobrir casos válidos, inválidos e edge cases" \
  --tone technical \
  --format code \
  --language TypeScript \
  --restrictions "usar Jest,sem libs de validação externas" \
  --limit "mínimo 10 casos de teste" \
  --variation 2
```

Resultado esperado:

- suite de testes com Jest;
- casos válidos e inválidos;
- edge cases cobertos;
- comentários explicativos.

### Validação de dados

Contexto:

- formulário;
- API;
- entrada de usuário.

```bash
npm start -- \
  --theme "validação de formulário de cadastro" \
  --action "escreva" \
  --category code \
  --audience "dev frontend" \
  --objective "validar email, senha forte, CPF e telefone" \
  --tone technical \
  --format code \
  --language TypeScript \
  --restrictions "sem libs de validação,usar regex nativo" \
  --variation 2
```

Resultado esperado:

- funções de validação puras;
- regex por campo;
- mensagens de erro claras;
- testes básicos.

### Refatoração de código legado

Contexto:

- callback hell;
- modernização para async/await;
- melhoria de legibilidade.

```bash
npm start -- \
  --theme "refatorar callback hell para async/await" \
  --action "escreva" \
  --category code \
  --audience "dev backend Node.js" \
  --objective "converter código com callbacks aninhados para async/await" \
  --tone technical \
  --format code \
  --language TypeScript \
  --few-shot-input "função com 3 níveis de callbacks aninhados" \
  --few-shot-output "mesma função usando async/await com try/catch" \
  --variation 2
```

## Documentação

### Guia de onboarding

Contexto:

- novo desenvolvedor entrando no time;
- necessidade de setup e primeiros passos.

```bash
npm start -- \
  --theme "onboarding técnico para projeto Node.js com PostgreSQL" \
  --action "escreva" \
  --category summary \
  --audience "desenvolvedores novos no time" \
  --objective "setup completo do ambiente em menos de 1 hora" \
  --tone didactic \
  --format markdown \
  --limit "máximo 500 palavras" \
  --restrictions "sem jargão,incluir troubleshooting comum" \
  --variation 2
```

Resultado esperado:

- passo a passo claro;
- comandos prontos para copiar;
- troubleshooting básico;
- links ou próximos passos.

### FAQ técnico

Contexto:

- suporte;
- documentação;
- perguntas recorrentes.

```bash
npm start -- \
  --theme "uso da API REST de pagamentos" \
  --action "gere perguntas e respostas frequentes" \
  --category qa \
  --audience "desenvolvedores integrando a API" \
  --objective "cobrir autenticação, webhooks, erros comuns e rate limiting" \
  --tone technical \
  --format markdown \
  --limit "15 pares de Q&A" \
  --variation 2
```

Resultado esperado:

- pares de pergunta e resposta;
- cobertura dos tópicos principais;
- exemplos quando relevante.

### Resumo de arquitetura

```bash
npm start -- \
  --theme "arquitetura de microsserviços da plataforma" \
  --action "resuma" \
  --category summary \
  --audience "novos engenheiros de software" \
  --objective "explicar componentes, responsabilidades e fluxo principal" \
  --tone didactic \
  --format markdown \
  --variation 2
```

### Tradução de documentação técnica

```bash
npm start -- \
  --theme "documentação de API REST" \
  --action "traduza" \
  --category translation \
  --audience "desenvolvedores internacionais" \
  --objective "preservar precisão técnica" \
  --tone technical \
  --format prose \
  --language "Inglês" \
  --variation 3
```

## Análise

### Comparar tecnologias

```bash
npm start -- \
  --theme "PostgreSQL vs MongoDB" \
  --action "compare" \
  --category analysis \
  --audience "arquitetos de software" \
  --objective "escolha para e-commerce" \
  --tone technical \
  --format table \
  --variation 3
```

### Avaliar tradeoffs

```bash
npm start -- \
  --theme "monorepo vs multirepo" \
  --action "analise" \
  --category analysis \
  --audience "liderança de engenharia" \
  --objective "decisão para organização de times e código" \
  --tone technical \
  --format markdown \
  --variation 3
```

### Benchmark conceitual

```bash
npm start -- \
  --theme "Redis vs RabbitMQ para fila interna" \
  --action "compare" \
  --category analysis \
  --audience "engenheiros de plataforma" \
  --objective "escolha para processamento assíncrono" \
  --tone technical \
  --format table \
  --variation 3
```

## Marketing

### Copy de landing page

```bash
npm start -- \
  --theme "plataforma de automação comercial para pequenas empresas" \
  --action "crie uma copy de landing page" \
  --category marketing \
  --audience "donos de pequenas empresas com operação manual" \
  --objective "gerar cadastro para demonstração" \
  --tone persuasive \
  --format markdown \
  --limit "até 6 blocos curtos" \
  --variation 2
```

### E-mail de prospecção

```bash
npm start -- \
  --theme "software de gestão para clínicas pequenas" \
  --action "crie um e-mail de prospecção" \
  --category marketing \
  --audience "gestores de clínicas" \
  --objective "agendar demonstração comercial" \
  --tone persuasive \
  --format markdown \
  --limit "até 180 palavras" \
  --restrictions "sem exagero,sem tom agressivo" \
  --variation 2
```

### Post para LinkedIn

```bash
npm start -- \
  --theme "lançamento de produto SaaS B2B" \
  --action "crie um post para LinkedIn" \
  --category marketing \
  --audience "líderes de operação e tecnologia" \
  --objective "anunciar o lançamento e atrair demonstrações" \
  --tone persuasive \
  --format markdown \
  --limit "até 220 palavras" \
  --variation 2
```

## Brainstorming

### Nomes de produto

```bash
npm start -- \
  --theme "app de finanças pessoais para jovens" \
  --action "gere 10 ideias de nome" \
  --category brainstorming \
  --audience "público de 18 a 30 anos" \
  --objective "cada ideia deve conter nome, tagline e diferencial" \
  --tone friendly \
  --format numbered-list \
  --limit "10 ideias" \
  --variation 3
```

### Features de roadmap

```bash
npm start -- \
  --theme "plataforma SaaS de analytics" \
  --action "gere ideias de features" \
  --category brainstorming \
  --audience "time de produto" \
  --objective "cada ideia deve conter problema, solução e impacto" \
  --tone friendly \
  --format numbered-list \
  --limit "12 ideias" \
  --variation 3
```

### Ideias de conteúdo

```bash
npm start -- \
  --theme "newsletter sobre engenharia de software" \
  --action "gere ideias de pauta" \
  --category brainstorming \
  --audience "devs plenos e seniores" \
  --objective "cada ideia deve conter título, gancho e público" \
  --tone friendly \
  --format numbered-list \
  --limit "15 ideias" \
  --variation 3
```

## Modos úteis

### Só gerar o prompt

```bash
npm start -- \
  --theme "migração de REST para GraphQL" \
  --action "analise" \
  --category analysis \
  --audience "arquitetos de solução" \
  --objective "identificar ganhos e riscos" \
  --tone technical \
  --format markdown \
  --variation 3 \
  --no-send
```

### Forçar wizard com pré-preenchimento

```bash
npm start -- \
  --theme "política de versionamento semântico" \
  --category summary \
  --tone formal \
  --interactive
```

### Exportar automaticamente

```bash
npm start -- \
  --theme "checklist de revisão de pull request" \
  --action "gere" \
  --category qa \
  --audience "devs plenos" \
  --objective "padronizar code review" \
  --tone technical \
  --format markdown \
  --variation 2 \
  --export
```

## Próximo passo

Se quiser entendimento interno do sistema, siga para [Referência Técnica](referencia-tecnica.md).
