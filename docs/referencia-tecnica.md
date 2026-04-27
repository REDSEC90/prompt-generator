# Referência Técnica

Documento voltado para quem quer entender o comportamento interno do sistema.

Se você quer aprender a usar o programa, leia primeiro:

- [Início Rápido](inicio-rapido.md)
- [Guia Básico](guia-basico.md)

## Visão geral

O sistema é dividido em camadas principais:

- `core/`: geração, validação, templates, variações, integração com IA
- `cli/`: argumentos, fluxo interativo e seleção de UI
- `index.ts`: orquestração da execução

## 1. TemplateEngine

Arquivo:

```text
src/core/engine.ts
```

### `validate(config)`

Responsabilidade:

- verificar campos obrigatórios;
- emitir warnings de incompatibilidade entre `format` e `category`.

Warnings conhecidos:

- `json` com `marketing`
- `code` com `marketing`, `summary`, `analysis`, `brainstorming`
- `table` com `code`, `marketing`

Comportamento:

- warnings não bloqueiam a execução;
- o fluxo continua;
- `valid` indica se há erro bloqueante, não se existem warnings.

### `fill(config)`

Responsabilidade:

- selecionar o template correto;
- interpolar os campos do `PromptConfig`;
- lançar erro se a categoria não existir;
- lançar erro se a configuração for inválida.

## 2. VariationGenerator

Arquivo:

```text
src/core/variations.ts
```

Gera três versões:

- `direct`
- `contextual`
- `chainOfThought`

### `direct`

Características:

- usa a mesma categoria base;
- reduz contexto;
- remove `restrictions`;
- remove `fewShot`;
- desliga `chainOfThought`;
- filtra placeholders como `-`.

### `contextual`

Características:

- mantém obrigatórios;
- mantém opcionais fornecidos;
- é a variação de uso geral.

### `chainOfThought`

Características:

- mantém o contexto completo;
- ativa instrução de raciocínio nos templates que suportam isso.

Observação:

- em `code`, o efeito prático dessa variação hoje é baixo.

## 3. Templates por categoria

Arquivo:

```text
src/core/templates.ts
```

Cada categoria tem uma função que monta o prompt final.

### `summary`

Foco:

- síntese;
- resumo;
- condensação de conteúdo.

Inclui:

- tema;
- formato;
- público;
- objetivo;
- tom;
- limite;
- restrições;
- few-shot;
- CoT, quando ativado.

### `code`

Foco:

- geração de código funcional;
- docstring;
- testes unitários.

Inclui:

- linguagem ou tema;
- descrição funcional;
- formato;
- contexto;
- estilo;
- restrições;
- few-shot.

### `analysis`

Foco:

- comparação;
- critérios;
- justificativa.

### `marketing`

Foco:

- persuasão;
- copy;
- texto promocional.

### `brainstorming`

Foco:

- ideação;
- estrutura por ideia;
- diferencial.

### `translation`

Foco:

- tradução contextualizada;
- adaptação técnica ou cultural;
- idioma de destino.

### `qa`

Foco:

- pares de pergunta e resposta;
- critério de qualidade;
- contexto de uso.

### `creative`

Foco:

- escrita criativa;
- intenção narrativa;
- estrutura ou arco.

## 4. Tipos centrais

Arquivo:

```text
src/core/types.ts
```

### `PromptConfig`

Obrigatórios:

- `action`
- `theme`
- `format`
- `audience`
- `objective`
- `tone`
- `category`

Opcionais:

- `language`
- `limit`
- `restrictions`
- `fewShot`
- `chainOfThought`

### `OutputFormat`

```text
markdown
json
table
numbered-list
prose
html
code
```

### `Tone`

```text
formal
friendly
persuasive
didactic
journalistic
technical
```

### `Category`

```text
summary
code
analysis
marketing
brainstorming
translation
qa
creative
```

## 5. Fluxo interativo

Arquivo:

```text
src/cli/questions.ts
```

O fluxo atual conduz até 12 etapas.

Obrigatórias:

1. `theme`
2. `action`
3. `category`
4. `audience`
5. `objective`
6. `tone`
7. `format`

Opcionais:

8. `language`
9. `limit`
10. `restrictions`
11. `fewShotInput`
12. `fewShotOutput`

Comportamentos relevantes:

- reaproveita valores vindos de flags;
- permite edição de campo;
- permite recomeço;
- converte `restrictions` para `string[]`;
- monta `fewShot` apenas quando entrada e saída existem ao mesmo tempo.

## 6. Integração com IA

Arquivo:

```text
src/core/ai.ts
```

Providers suportados:

- Anthropic
- OpenAI

### Anthropic

- endpoint: `https://api.anthropic.com/v1/messages`
- usa `x-api-key`
- usa `system`
- envia `AI_MAX_TOKENS`

### OpenAI

- endpoint: `https://api.openai.com/v1/chat/completions`
- usa `Authorization: Bearer`
- usa mensagem `role: system`

### Streaming

O parser:

- lê eventos SSE;
- concatena chunks incompletos;
- ignora eventos sem payload textual útil;
- imprime a resposta progressivamente no terminal.

### Retry

Arquivo:

```text
src/core/retry.ts
```

Configuração padrão:

- `maxRetries = 3`
- `baseDelayMs = 1000`

Retenta em:

- falha de rede
- `429`
- `503`
- `504`

## 7. Variáveis de ambiente

```text
AI_PROVIDER
AI_API_KEY
AI_MODEL
AI_MAX_TOKENS
```

Valores padrão relevantes:

- `AI_PROVIDER=anthropic`
- `AI_MAX_TOKENS=4000`

Sem `AI_API_KEY`:

- o sistema entra em modo offline.

## 8. Decisões de design

### Por que 3 variações

- porque nenhuma serve melhor para todos os casos;
- a escolha final fica com o usuário.

### Por que warnings não bloqueiam

- porque algumas combinações ruins ainda podem ser úteis em contexto específico;
- o sistema alerta, mas não assume a decisão pelo usuário.

### Por que filtrar campos vazios

- para evitar linhas inúteis;
- para evitar desperdício de tokens;
- para reduzir ruído no prompt final.

## Limites atuais

- `chainOfThought` ainda não tem efeito relevante em `code`;
- o fluxo interativo ainda concentra bastante lógica em `questions.ts`;
- a camada CLI ainda merece testes mais profundos.
