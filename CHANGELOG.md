# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.4.0] - 2026-04-28

### Adicionado
- `src/core/prompt-store.ts` — `PromptStore` com CRUD completo de prompts nomeados
  - `save(name, prompt, config)` — salva ou sobrescreve
  - `get(name)` — busca por nome
  - `list()` — lista ordenada por updatedAt desc
  - `delete(name)` — remove por nome
  - `rename(oldName, newName)` — renomeia
- Flags CLI: `--save "nome"`, `--load "nome"`, `--list`, `--delete "nome"`
- Armazenamento em `~/.prompt-generator/prompts.json`
- 11 testes unitários para `PromptStore`
- `LICENSE` (MIT), `CONTRIBUTING.md`, `CHANGELOG.md`
- Campos open source no `package.json` (repository, bugs, homepage, keywords)
- `.gitignore` atualizado com artefatos de treinamento

### Melhorado
- Total de testes: 122 → 133
- Cobertura mantida em 94%
- `package.json` versão 1.0.0 → 1.4.0

---



### Adicionado
- Testes para Ollama (streaming NDJSON, OLLAMA_HOST, AI_MODEL, erros HTTP)
- Testes para modo `auto` (fallback offline e fallback para remote)
- Suite completa de testes para `eval.ts` (7 casos)
- `CONTRIBUTING.md` com guia de contribuição
- `LICENSE` (MIT)
- `CHANGELOG.md`
- Campos open source no `package.json` (repository, bugs, homepage, keywords)

### Melhorado
- Cobertura de testes: 84.9% → 94.1% em statements
- Total de testes: 106 → 122

---

## [1.2.0] - 2026-04-28

### Adicionado
- Fase 3 completa: `src/core/eval.ts` — avaliação A/B baseline vs fine-tunado
- `training/finetune.py` — fine-tuning com Unsloth + LoRA
- `training/setup-ollama.sh` — setup automatizado do Ollama
- `training/Modelfile` — template para criar modelo customizado no Ollama
- `training/seed-dataset.py` — geração de dataset inicial
- `npm run eval` e `npm run finetune` no package.json

---

## [1.1.0] - 2026-04-28

### Adicionado
- Fase 2: `src/core/generator.ts` — geração de prompts via meta-prompt + few-shot dinâmico
- Fase 2: `rewritePrompt()` — reescrita automática de prompts com rating ≤ 2
- Fase 2: `src/core/dataset.ts` — exportação de dataset JSONL no formato Alpaca
- Fase 2: score de confiança (`low/medium/high`) no `LearningInsight`
- Flag `--ai-generate "objetivo"` na CLI para modo IA generativa
- `npm run export-dataset` no package.json

---

## [1.0.0] - 2026-04-27

### Adicionado
- Fase 1 completa: loop fechado geração → feedback → persistência
- `src/core/ai.ts` — integração com Ollama, Anthropic e OpenAI com streaming
- `src/core/store.ts` — `FeedbackStore` com persistência em `~/.prompt-generator/history.json`
- `src/core/learning.ts` — `LearningEngine` com análise por categoria e sugestões automáticas
- `src/core/retry.ts` — `RetryManager` com backoff exponencial
- Role prompting por categoria nos templates (`ROLES` map)
- `askFeedback()` no fluxo CLI com coleta de `FailureReason`
- Reescrita automática de prompts ruins após feedback
- Modo `auto` (Ollama → remote → offline)
- Streaming progressivo no terminal para todos os providers
- 106 testes unitários

---

## [0.3.0] - 2026-04-20

### Adicionado
- Wizard interativo com revisão e edição de campos
- Modo híbrido: flags + wizard
- Exportação de prompt + resposta para Markdown
- Validação bloqueante de campos obrigatórios
- Warnings de incompatibilidade formato × categoria

---

## [0.2.0] - 2026-04-20

### Adicionado
- 3 variações de prompt: `direct`, `contextual`, `chainOfThought`
- Streaming SSE para Anthropic e OpenAI
- Flags completas na CLI (`--theme`, `--action`, `--category`, etc.)

---

## [0.1.0] - 2026-04-20

### Adicionado
- Estrutura inicial do projeto
- Templates por categoria (8 categorias)
- `TemplateEngine` com validação
- `VariationGenerator`
- Tipos centrais (`PromptConfig`, `GeneratedPrompt`, etc.)
