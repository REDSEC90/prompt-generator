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

- Ollama (local, padrão)
- Anthropic
- OpenAI

### Ollama

- endpoint: `http://localhost:11434/api/generate` (configurável via `OLLAMA_HOST`)
- sem API key
- timeout configurável via `OLLAMA_TIMEOUT` (padrão: 60000ms)
- usa `AbortController` para não travar indefinidamente

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

## 7. Geração via IA (meta-prompt)

Arquivo:

```text
src/core/generator.ts
```

### `generatePrompt(goal, examples?)`

- Usa a própria IA para gerar o prompt a partir de um objetivo em linguagem natural.
- Inclui até 3 exemplos few-shot do histórico com rating ≥ 4.
- Ativado via `--ai-generate "objetivo"` na CLI.

### `rewritePrompt(original, failureReason)`

- Reescreve automaticamente prompts com rating ≤ 2.
- Usa o motivo da falha (`FailureReason`) para orientar a correção.
- Chamado automaticamente após feedback ruim no fluxo principal.

## 8. Persistência e aprendizado

### FeedbackStore

Arquivo:

```text
src/core/store.ts
```

- Persiste em `~/.prompt-generator/history.json`.
- Limite de 10.000 entradas (remove as mais antigas).
- Métodos: `load`, `save`, `clear`, `stats`, `loadByCategory`.

### LearningEngine

Arquivo:

```text
src/core/learning.ts
```

- `analyze(history)` — retorna insights por categoria com `confidence` (low/medium/high).
- `suggest(config, history)` — retorna patch de config baseado no histórico.
- Aplicado automaticamente ao config antes do wizard.

### Exportação de dataset

Arquivo:

```text
src/core/dataset.ts
```

- Exporta feedbacks com rating ≥ minRating no formato JSONL Alpaca.
- Comando: `npm run export-dataset [outputPath] [minRating]`

## 9. Variáveis de ambiente

```text
AI_PROVIDER        # ollama | anthropic | openai  (padrão: anthropic)
AI_API_KEY         # obrigatório para anthropic/openai
AI_MODEL           # modelo específico do provider
AI_MAX_TOKENS      # padrão: 4000 (Anthropic)
OLLAMA_HOST        # padrão: http://localhost:11434
OLLAMA_TIMEOUT     # padrão: 60000 (ms)
```

Sem `AI_API_KEY` com provider anthropic/openai: modo offline.

## 10. Decisões de design

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

### Por que CoT desativado em `code` e `qa`

- `code`: CoT gera raciocínio em vez de código funcional.
- `qa`: CoT gera justificativas em vez de pares pergunta/resposta diretos.

## Limites atuais

- Fine-tuning (Fase 3) requer 200+ feedbacks com rating ≥ 4 e GPU para treino.
- Conversão para GGUF é manual (ver `docs/llama-finetuning.md`).
