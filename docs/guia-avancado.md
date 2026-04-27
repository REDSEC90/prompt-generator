# Guia Avançado

Leitura estimada: 35 a 40 minutos.

Este guia é para quem quer dominar o programa por completo.

## O que este guia cobre

- todas as 8 categorias;
- comportamento dos campos;
- few-shot;
- restrições avançadas;
- combinações de tom e formato;
- warnings de compatibilidade;
- casos de uso complexos.

## Como pensar o PromptConfig

Os campos não têm o mesmo peso.

Na prática:

- `category` define a estrutura base;
- `theme` define o assunto;
- `objective` define a finalidade real;
- `audience` calibra profundidade e vocabulário;
- `tone` muda a voz da resposta;
- `format` muda a forma final.

Se um prompt estiver ruim, revise nesta ordem:

1. `objective`
2. `audience`
3. `category`
4. `theme`

## Categorias em profundidade

### `summary`

Use quando o objetivo principal é síntese.

Boa para:

- resumo de documento;
- síntese de reunião;
- visão executiva;
- condensação de conteúdo técnico.

```bash
npm start -- \
  --theme "arquitetura de microsserviços" \
  --action "resuma" \
  --category summary \
  --audience "liderança de engenharia" \
  --objective "explicar benefícios, riscos e custo operacional" \
  --tone formal \
  --format markdown \
  --limit "300 palavras" \
  --variation 2
```

### `code`

Use quando a saída principal precisa ser código.

Boa para:

- middlewares;
- funções;
- serviços;
- scripts;
- endpoints.

```bash
npm start -- \
  --theme "middleware de autenticação JWT" \
  --action "escreva" \
  --category code \
  --audience "dev backend Node.js" \
  --objective "validar token em rotas protegidas" \
  --tone technical \
  --format code \
  --language TypeScript \
  --restrictions "sem libs extras além de jsonwebtoken" \
  --variation 2
```

Observação:

- `variation 3` hoje não muda materialmente essa categoria.

### `analysis`

Use quando você quer comparação, avaliação ou raciocínio estruturado.

Boa para:

- benchmark conceitual;
- comparação de tecnologias;
- tradeoffs;
- diagnósticos.

```bash
npm start -- \
  --theme "PostgreSQL vs MongoDB" \
  --action "compare" \
  --category analysis \
  --audience "arquiteto de software" \
  --objective "escolha para plataforma de e-commerce" \
  --tone technical \
  --format table \
  --variation 3
```

### `marketing`

Use quando a resposta precisa persuadir.

Boa para:

- landing page;
- headline;
- anúncio;
- e-mail comercial;
- texto promocional.

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
  --restrictions "sem promessas exageradas,sem tom agressivo" \
  --variation 2
```

### `brainstorming`

Use quando quer geração de ideias com alguma estrutura.

Boa para:

- nomes de produto;
- features;
- ideias de campanha;
- posicionamento;
- temas de conteúdo.

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
  --restrictions "sem palavras em inglês,sem nomes genéricos" \
  --variation 3
```

### `translation`

Use quando quer tradução contextualizada, não só literal.

Boa para:

- documentação técnica;
- manuais;
- materiais multilíngues;
- conteúdo com terminologia especializada.

```bash
npm start -- \
  --theme "documentação de API REST" \
  --action "traduza" \
  --category translation \
  --audience "desenvolvedores internacionais" \
  --objective "manter precisão técnica e clareza" \
  --tone technical \
  --format prose \
  --language "Inglês" \
  --few-shot-input "Endpoint de autenticação que retorna token JWT" \
  --few-shot-output "Authentication endpoint that returns a JWT token" \
  --variation 3
```

### `qa`

Use quando a saída precisa ser pergunta e resposta.

Boa para:

- FAQ;
- onboarding;
- treinamento;
- material de estudo;
- suporte interno.

```bash
npm start -- \
  --theme "uso da CLI do prompt-generator" \
  --action "gere perguntas e respostas frequentes" \
  --category qa \
  --audience "desenvolvedores iniciantes" \
  --objective "cobrir instalação, configuração e uso básico" \
  --tone didactic \
  --format markdown \
  --limit "10 pares de Q&A" \
  --variation 2
```

### `creative`

Use quando a resposta precisa ser criativa.

Boa para:

- contos;
- narrativas curtas;
- storytelling;
- peças experimentais.

```bash
npm start -- \
  --theme "uma cidade costeira onde a maré devolve memórias perdidas" \
  --action "escreva um conto curto" \
  --category creative \
  --audience "leitores de ficção especulativa" \
  --objective "provocar estranhamento e reflexão" \
  --tone journalistic \
  --format prose \
  --limit "até 800 palavras" \
  --restrictions "sem clichês de viagem no tempo,sem final explicativo" \
  --variation 3
```

## Few-shot avançado

Few-shot vale mais quando você quer:

- padronizar estrutura;
- demonstrar estilo;
- reduzir ambiguidade;
- ensinar uma convenção específica.

Exemplo:

```bash
npm start -- \
  --theme "manual interno de integração" \
  --action "traduza" \
  --category translation \
  --audience "times internacionais" \
  --objective "preservar terminologia técnica" \
  --tone technical \
  --format prose \
  --language "Inglês" \
  --few-shot-input "Fila de processamento assíncrono com retentativa" \
  --few-shot-output "Asynchronous processing queue with retry support" \
  --variation 3
```

## Restrições avançadas

Restrições são especialmente úteis em:

- `marketing`;
- `creative`;
- `code`;
- `summary` para público não técnico.

Exemplos:

- `sem jargão técnico`
- `sem libs externas`
- `sem exagero comercial`
- `sem final explicativo`
- `sem abstração desnecessária`

## Tons e formatos: combinações boas

Combinações frequentes:

- `technical + table` para análise;
- `didactic + markdown` para documentação;
- `persuasive + markdown` para marketing;
- `formal + prose` para síntese executiva;
- `friendly + numbered-list` para brainstorming.

Combinações arriscadas:

- `marketing + json`
- `marketing + table`
- `summary + code`

## Warnings de compatibilidade

O sistema avisa quando detecta combinações problemáticas.

Exemplos:

- `json + marketing`
- `code + summary`
- `table + marketing`

Esses warnings:

- não bloqueiam a execução;
- indicam maior chance de resposta ruim;
- devem ser tratados como alerta de qualidade.

## Casos de uso complexos

### Tradução técnica com terminologia específica

```bash
npm start -- \
  --theme "guia de observabilidade distribuída" \
  --action "traduza" \
  --category translation \
  --audience "engenheiros de plataforma" \
  --objective "preservar termos de telemetria e tracing" \
  --tone technical \
  --format prose \
  --language "Inglês" \
  --variation 3
```

### Marketing com múltiplas restrições

```bash
npm start -- \
  --theme "software de gestão para clínicas pequenas" \
  --action "crie um e-mail de prospecção" \
  --category marketing \
  --audience "gestores de clínicas com operação manual" \
  --objective "agendar demonstração comercial" \
  --tone persuasive \
  --format markdown \
  --limit "até 180 palavras" \
  --restrictions "sem exagero,sem pressão artificial,sem jargão técnico" \
  --variation 2
```

### Código com few-shot e restrições

```bash
npm start -- \
  --theme "worker assíncrono para fila interna" \
  --action "escreva" \
  --category code \
  --audience "time backend Node.js" \
  --objective "processar jobs com retry e logging" \
  --tone technical \
  --format code \
  --language TypeScript \
  --restrictions "sem dependências extras,sem abstração desnecessária" \
  --few-shot-input "função que recebe job e retorna status" \
  --few-shot-output "worker com try/catch, retry e retorno tipado" \
  --variation 2
```

## Limites atuais

- `chainOfThought` não muda de forma relevante a categoria `code`;
- o wizard principal ainda usa `readline`, enquanto outras partes usam `@inquirer/prompts`;
- a camada interativa ainda tem pouca cobertura de testes;
- parte da lógica do fluxo interativo ainda está concentrada em `questions.ts`.

## Próximo passo

Siga para [Exemplos Práticos](exemplos-praticos.md).
