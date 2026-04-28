# Prompt Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-133%20passing-brightgreen)](#testes)
[![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen)](#testes)
[![Node](https://img.shields.io/badge/node-%3E%3D18-blue)](https://nodejs.org)

CLI inteligente para criar, revisar e executar prompts estruturados para LLMs — com aprendizado contínuo, fine-tuning local e suporte a Ollama, Anthropic e OpenAI.

---

## Início rápido

```bash
npm install
cp .env.example .env
npm start
```

Sem `AI_API_KEY`, o sistema roda em modo offline (exibe o prompt sem enviar).

---

## Uso por flags

```bash
npm start -- \
  --theme "JWT no Express" \
  --action "escreva" \
  --category code \
  --audience "dev backend" \
  --objective "validar token em rotas protegidas" \
  --tone technical \
  --format code \
  --language TypeScript
```

## Modo IA generativa

```bash
npm start -- --ai-generate "criar endpoint REST com autenticação JWT"
```

Gera o prompt via meta-prompt + few-shot dinâmico do histórico.

---

## Arquitetura

```
src/
├── index.ts              # orquestrador principal
├── core/
│   ├── types.ts          # PromptConfig, Category, Tone, OutputFormat
│   ├── engine.ts         # TemplateEngine — validação + preenchimento
│   ├── templates.ts      # 8 templates com role prompting por categoria
│   ├── variations.ts     # VariationGenerator — direct / contextual / CoT
│   ├── ai.ts             # integração Ollama + Anthropic + OpenAI (streaming)
│   ├── retry.ts          # RetryManager — backoff exponencial
│   ├── store.ts          # FeedbackStore — persistência em ~/.prompt-generator/
│   ├── learning.ts       # LearningEngine — insights + sugestões automáticas
│   ├── generator.ts      # generatePrompt() + rewritePrompt() via meta-prompt
│   ├── dataset.ts        # exportDataset() — JSONL Alpaca para fine-tuning
│   └── eval.ts           # runEval() — avaliação A/B baseline vs fine-tunado
└── cli/
    ├── args.ts           # parseArgs() — flags + validação
    ├── fields.ts         # choices para @inquirer/prompts
    ├── questions.ts      # runQuestionFlow() — wizard interativo
    └── ui.ts             # pickVariation() + askFeedback() + askExport()

training/
├── finetune.py           # fine-tuning com Unsloth + LoRA (Llama 3.2 3B)
├── seed-dataset.py       # geração de dataset inicial
├── setup-ollama.sh       # setup automatizado do Ollama
└── Modelfile             # template para criar modelo no Ollama

tests/                    # 122 testes unitários (Jest + ts-jest)
docs/                     # documentação completa
```

### Fluxo de dados

```
CLI flags / wizard
       ↓
  PromptConfig
       ↓
TemplateEngine.fill()  ←→  TEMPLATES[category]
       ↓
VariationGenerator  →  direct | contextual | chainOfThought
       ↓
  pickVariation (UI)
       ↓
   sendToAI()  →  Ollama | Anthropic | OpenAI  (streaming)
       ↓
  askFeedback()  →  FeedbackStore (~/.prompt-generator/history.json)
       ↓
  LearningEngine.analyze()  →  insights + sugestões para próxima sessão
```

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| Wizard interativo (12 campos) | ✅ |
| Uso completo por flags | ✅ |
| Modo híbrido (flags + wizard) | ✅ |
| 3 variações de prompt (direct / contextual / CoT) | ✅ |
| Role prompting por categoria | ✅ |
| Streaming progressivo no terminal | ✅ |
| Ollama local (sem custo, sem internet) | ✅ |
| Anthropic (Claude) | ✅ |
| OpenAI (GPT-4o) | ✅ |
| Modo auto (Ollama → remote → offline) | ✅ |
| Retry com backoff exponencial | ✅ |
| Coleta de feedback (1-5 + motivo da falha) | ✅ |
| Persistência do histórico (~/.prompt-generator/) | ✅ |
| Aprendizado in-context (few-shot dinâmico) | ✅ |
| Reescrita automática de prompts ruins | ✅ |
| Exportação de dataset JSONL (Alpaca) | ✅ |
| Fine-tuning local (Unsloth + LoRA) | ✅ |
| Avaliação A/B baseline vs fine-tunado | ✅ |
| Exportação para Markdown | ✅ |
| CRUD de prompts salvos (--save/--load/--list/--delete) | ✅ |
| 133 testes unitários (94% cobertura) | ✅ |

---

## Categorias

| Categoria | Uso |
|---|---|
| `summary` | Síntese de conteúdo |
| `code` | Geração de scripts e funções |
| `analysis` | Comparações e avaliações |
| `marketing` | Copywriting e campanhas |
| `brainstorming` | Geração de ideias |
| `translation` | Tradução contextualizada |
| `qa` | Perguntas e respostas |
| `creative` | Escrita criativa |

---

## Configuração

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `AI_MODE` | `auto` | `auto` \| `local` \| `remote` \| `offline` |
| `AI_PROVIDER` | `anthropic` | `anthropic` \| `openai` (para remote) |
| `AI_API_KEY` | — | Chave da API (Anthropic ou OpenAI) |
| `AI_MODEL` | provider default | Modelo específico |
| `AI_MAX_TOKENS` | `4000` | Limite de tokens (Anthropic) |
| `OLLAMA_HOST` | `http://localhost:11434` | Host do Ollama |
| `OLLAMA_TIMEOUT` | `120000` | Timeout em ms |

---

## Scripts disponíveis

```bash
npm start                          # executa o gerador
npm test                           # 122 testes unitários
npm test -- --coverage             # com relatório de cobertura
npm run export-dataset             # exporta dataset JSONL
npm run export-dataset out.jsonl 4 # caminho e rating mínimo customizados
npm run eval                       # avaliação A/B dos modelos
npm run eval "objetivo 1" "obj 2"  # com objetivos customizados
npm run seed-dataset               # gera dataset inicial (Python)
npm run setup-ollama               # instala e configura Ollama
npm run finetune                   # fine-tuning local (requer GPU)
npm run build                      # compila TypeScript
```

---

## Roadmap

### v1.4 — CRUD de prompts salvos ✅

- [x] `PromptStore` — salvar, listar, editar e deletar prompts nomeados
- [x] `npm start -- --save "nome"` — salva o prompt gerado com nome
- [x] `npm start -- --load "nome"` — carrega e executa prompt salvo
- [x] `npm start -- --list` — lista todos os prompts salvos
- [x] `npm start -- --delete "nome"` — remove prompt salvo
- [x] Armazenamento em `~/.prompt-generator/prompts.json`

### v1.5 — Novos providers e modelos

- [ ] Gemini (Google AI Studio)
- [ ] Mistral API
- [ ] Groq (inferência rápida)
- [ ] Cohere

### v1.6 — Interface web local

- [ ] Servidor Express/Fastify embutido (`npm run web`)
- [ ] UI React com os mesmos campos do wizard
- [ ] Histórico visual com filtros por categoria e rating
- [ ] Comparação side-by-side das 3 variações

### v2.0 — Agente autônomo

- [ ] Loop de melhoria automática: gera → avalia → reescreve sem intervenção
- [ ] Benchmark automático contra dataset de referência
- [ ] API REST para integração com outras ferramentas
- [ ] Plugin para VS Code
- [ ] Suporte a conversas multi-turno

### Melhorias contínuas

- [ ] i18n (inglês, espanhol)
- [ ] Novas categorias: `email`, `presentation`, `documentation`
- [ ] Templates customizáveis pelo usuário
- [ ] Exportação para JSON, CSV além de Markdown
- [ ] Integração com clipboard

---

## Testes

```bash
npm test -- --coverage
```

```
Tests:       133 passed
Coverage:    94.1% statements
Suites:      8 (ai, core, store, learning, generator, dataset, eval, prompt-store)
```

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licença

[MIT](LICENSE) © 2026 REDSEC90

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [Início Rápido](docs/inicio-rapido.md) | Primeiros passos |
| [Guia Básico](docs/guia-basico.md) | Uso do dia a dia |
| [Guia Avançado](docs/guia-avancado.md) | Flags, modos e fine-tuning |
| [Exemplos Práticos](docs/exemplos-praticos.md) | Receitas prontas |
| [Cheatsheet](docs/CHEATSHEET.md) | Consulta rápida |
| [Referência Técnica](docs/referencia-tecnica.md) | Arquitetura interna |
| [Fine-tuning Llama](docs/llama-finetuning.md) | Treino local com Ollama |
| [Changelog](CHANGELOG.md) | Histórico de versões |
