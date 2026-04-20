# Funcionalidades do Gerador de Prompts

Referência técnica das capacidades do sistema, organizada por módulo.

---

## 1. TemplateEngine

**Arquivo:** `src/core/engine.ts`

### `validate(config: PromptConfig): { valid: boolean; warnings: string[] }`

Verifica incompatibilidades entre `format` e `category` antes da geração.

| Formato | Categorias incompatíveis |
|---|---|
| `json` | `marketing` |
| `code` | `marketing`, `summary`, `analysis`, `brainstorming` |
| `table` | `code`, `marketing` |

Retorna `valid: false` e lista de avisos quando há conflito. Não lança exceção — permite que o chamador decida se bloqueia ou apenas alerta.

### `fill(config: PromptConfig): string`

Seleciona o template da categoria e interpola os campos do `PromptConfig`. Lança `Error` se a categoria não existir.

Campos obrigatórios sempre incluídos: `action`, `theme`, `format`, `tone`.  
Campos opcionais incluídos apenas quando presentes: `audience`, `objective`, `limit`, `restrictions`, `fewShot`, `chainOfThought`.

---

## 2. VariationGenerator

**Arquivo:** `src/core/variations.ts`

### `generate(config: PromptConfig): GeneratedPrompt`

Produz três variações a partir de um único `PromptConfig`:

| Variação | Campos ativos | Uso ideal |
|---|---|---|
| `direct` | `action`, `theme`, `format`, `tone` | Tarefas simples, iteração rápida |
| `contextual` | Todos os obrigatórios + opcionais fornecidos | Uso geral |
| `chainOfThought` | Igual ao contextual + `chainOfThought: true` | Análises, diagnósticos, decisões |

A variação `direct` zera `audience`, `objective`, `restrictions` e `fewShot` para produzir o prompt mais enxuto possível.

---

## 3. Templates por Categoria

**Arquivo:** `src/core/templates.ts`

Cada categoria tem uma função `(config: PromptConfig) => string` que monta o prompt filtrando campos falsy (evita linhas vazias).

### `summary`
Estrutura: ação → formato → público → objetivo → tom → limite → restrições → few-shot → CoT.  
CoT instrui a IA a listar e justificar os pontos antes de responder.

### `code`
Estrutura: ação/linguagem → saída esperada (código + docstring + testes) → contexto → estilo → restrições → few-shot.  
Não usa CoT — raciocínio explícito prejudica geração de código.

### `analysis`
Estrutura: ação/tema → critérios → formato → público → restrições → few-shot → CoT.  
CoT instrui a IA a listar e justificar critérios antes de gerar a tabela/comparação.

### `marketing`
Estrutura: ação/produto → público → objetivo → tom → formato/limite → restrições.  
Não usa CoT nem few-shot por padrão — fluxo criativo não se beneficia de raciocínio explícito.

### `brainstorming`
Estrutura: ação/nicho → campos por ideia → restrições → few-shot → CoT.  
CoT instrui a IA a justificar o diferencial de mercado de cada ideia.

---

## 4. Tipos Centrais

**Arquivo:** `src/core/types.ts`

### `PromptConfig`

```typescript
interface PromptConfig {
  // Obrigatórios
  action: string;       // verbo imperativo: "escreva", "compare", "liste"
  theme: string;        // assunto ou escopo
  format: OutputFormat; // estrutura da saída
  audience: string;     // quem vai consumir
  objective: string;    // resultado funcional esperado
  tone: Tone;           // registro linguístico
  category: Category;   // determina qual template usar

  // Opcionais
  limit?: string;           // ex: "200 palavras", "5 itens"
  restrictions?: string[];  // o que evitar
  fewShot?: FewShotExample; // exemplo input/output
  chainOfThought?: boolean; // ativa instrução de raciocínio
}
```

### `OutputFormat`
`markdown` | `json` | `table` | `numbered-list` | `prose` | `html` | `code`

### `Tone`
`formal` | `friendly` | `persuasive` | `didactic` | `journalistic` | `technical`

### `Category`
`summary` | `code` | `analysis` | `marketing` | `brainstorming`

---

## 5. Fluxo de Perguntas (CLI)

**Arquivo:** `src/cli/questions.ts`

`runQuestionFlow()` conduz 9 perguntas sequenciais via `readline` e retorna `Partial<PromptConfig>`.

Perguntas com `type: 'choice'` exibem opções numeradas e mapeiam o índice para o valor tipado.  
Perguntas com `optional: true` são ignoradas se o usuário pressionar Enter sem digitar.  
O campo `restrictions` é automaticamente convertido para `string[]`.

---

## 6. Integração com API (index.ts)

Suporta dois providers via variável `AI_PROVIDER`:

| Provider | Endpoint | Streaming |
|---|---|---|
| `anthropic` | `api.anthropic.com/v1/messages` | SSE (`data:` lines) |
| `openai` | `api.openai.com/v1/chat/completions` | SSE (`data:` lines) |

**Modo offline:** sem `AI_API_KEY`, exibe o prompt gerado no terminal sem enviar à API.

O `system prompt` é fixo e separado do conteúdo dinâmico gerado pelo `TemplateEngine` — conforme a prática recomendada de separar instruções permanentes do conteúdo variável.

---

## 7. Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `AI_PROVIDER` | Não | `anthropic` | Provider de IA |
| `AI_API_KEY` | Não* | — | Chave da API (*sem ela: modo offline) |
| `AI_MODEL` | Não | `claude-sonnet-4-5` / `gpt-4o` | Modelo específico |
| `AI_MAX_TOKENS` | Não | `2000` | Limite de tokens na resposta |

---

## 8. Decisões de Design

**Por que 3 variações?**  
Nenhuma variação é universalmente melhor. A direta serve para iteração rápida; a CoT, para tarefas que exigem raciocínio auditável. Deixar o usuário escolher é mais eficaz do que tentar prever o nível ideal.

**Por que validar compatibilidade formato × categoria?**  
Combinações como `json` + `marketing` ou `code` + `summary` produzem saídas defeituosas ou que ignoram uma das instruções. A validação antecipa o problema antes do envio à API.

**Por que campos opcionais são filtrados com `.filter(Boolean)`?**  
Evita linhas em branco no prompt final. Linhas vazias aumentam o consumo de tokens sem contribuir para a instrução.

**Por que `chainOfThought` é desativado na variação `direct`?**  
A variação direta prioriza concisão. Instrução de raciocínio explícito é incompatível com esse objetivo.
