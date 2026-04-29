# Guia Completo — IA e Sistema de Training

## Índice

1. [Configuração da IA](#1-configuração-da-ia)
2. [Modos de execução](#2-modos-de-execução)
3. [Providers disponíveis](#3-providers-disponíveis)
4. [Como a IA é chamada](#4-como-a-ia-é-chamada)
5. [Training básico — `npm run train`](#5-training-básico----npm-run-train)
6. [Training adaptativo — `npm run train:adaptive`](#6-training-adaptativo----npm-run-trainadaptive)
7. [Loop autônomo — `--auto`](#7-loop-autônomo----auto)
8. [Loop de aprendizado — `--loop`](#8-loop-de-aprendizado----loop)
9. [Como o sistema aprende](#9-como-o-sistema-aprende)
10. [Exportar e fine-tunar](#10-exportar-e-fine-tunar)
11. [Fluxo completo recomendado](#11-fluxo-completo-recomendado)
12. [Referência de variáveis de ambiente](#12-referência-de-variáveis-de-ambiente)

---

## 1. Configuração da IA

Copie o arquivo de exemplo e edite conforme seu ambiente:

```bash
cp .env.example .env
```

Configuração mínima para cada cenário:

```bash
# Apenas Ollama local (sem custo, sem internet)
AI_MODE=local
AI_MODEL=llama3.2

# Apenas Anthropic
AI_MODE=remote
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...

# Apenas OpenAI
AI_MODE=remote
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o

# Automático (recomendado): tenta Ollama → API → offline
AI_MODE=auto
AI_API_KEY=sk-ant-...   # opcional; sem ela, cai em offline se Ollama falhar
```

---

## 2. Modos de execução

| Modo | Comportamento |
|---|---|
| `auto` | Tenta Ollama → API remota → offline. **Padrão.** |
| `local` | Força Ollama. Falha se Ollama não estiver rodando. |
| `remote` | Força API (Anthropic ou OpenAI). Requer `AI_API_KEY`. |
| `offline` | Sem IA. Exibe o prompt gerado pelos templates e encerra. |

O modo `auto` é o mais resiliente: se o Ollama estiver rodando, usa ele (sem custo); se não, tenta a API; se não tiver chave, exibe o prompt sem enviar.

---

## 3. Providers disponíveis

### Ollama (local)

Requer o Ollama instalado e rodando:

```bash
# Instalar e configurar automaticamente
npm run setup-ollama

# Ou manualmente
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2        # modelo padrão
ollama pull llama3.2:1b     # modelo leve para o loop autônomo
```

Modelos recomendados por uso:

| Uso | Modelo | Velocidade |
|---|---|---|
| Uso geral | `llama3.2` | ★★★ |
| Training/batch | `llama3.2` | ★★★ |
| Loop autônomo | `llama3.2:1b` | ★★★★★ |
| Qualidade máxima | `llama3.1:70b` | ★ |

### Anthropic (remoto)

```bash
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_MODEL=claude-sonnet-4-6   # padrão
# AI_MODEL=claude-opus-4-6   # mais capaz, mais lento
AI_MAX_TOKENS=4000
```

### OpenAI (remoto)

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o
```

---

## 4. Como a IA é chamada

O sistema tem duas funções principais de chamada:

**`sendToAI(prompt)`** — uso interativo (wizard, `--load`, `--ai-generate`)
- Usa streaming: exibe tokens progressivamente no terminal
- Respeita `AI_MODE` e faz fallback automático

**`callOllamaSilent(prompt)`** — uso em batch (training)
- Sem streaming: retorna a resposta completa de uma vez
- Significativamente mais rápido para loops de treinamento
- Sem output no terminal durante a execução

**`sendToAIFast(prompt, numPredict)`** — loop autônomo
- Usa modelo menor (`AUTO_MODEL`, padrão `llama3.2:1b`)
- Limita tokens de saída (`numPredict`, padrão 300)
- `temperature=0` para respostas determinísticas

---

## 5. Training básico — `npm run train`

O training básico executa um loop de N iterações, gerando prompts com cenários pré-definidos, enviando ao Ollama e avaliando as respostas automaticamente.

### Executar

```bash
npm run train              # 50 iterações
npm run train 100          # 100 iterações
npm run train 200 0        # 200 iterações, sem delay entre elas
```

### O que acontece em cada iteração

```
1. Seleciona cenário  →  round-robin com shuffle entre 13 cenários
2. Aplica sugestões   →  LearningEngine sugere ajustes baseado no histórico
3. Gera prompt        →  TemplateEngine + VariationGenerator
4. Escolhe variação   →  a que teve melhor rating histórico na categoria
5. Envia ao Ollama    →  callOllamaSilent (sem streaming, mais rápido)
6. Avalia resposta    →  score automático 1-5 por critérios objetivos
7. Salva feedback     →  ~/.prompt-generator/history.json
```

### Critérios de avaliação automática

| Critério | Pontos |
|---|---|
| Resposta ≥ comprimento mínimo esperado | +1 |
| Resposta < 50% do mínimo | -1 |
| ≥ 70% das palavras-chave esperadas presentes | +1 |
| < 30% das palavras-chave presentes | -1 |
| Formato correto (ex: ```` ``` ```` para `code`, `##` para `markdown`) | +0.5 |

Baseline é 3. O score final é arredondado e limitado ao intervalo 1–5.

### Cenários cobertos

O training cobre todas as 8 categorias:

| Categoria | Cenários |
|---|---|
| `code` | JWT middleware, API REST CRUD, WebSocket real-time |
| `analysis` | Microserviços vs monolito, performance de banco |
| `summary` | Documentação de API, changelog de release |
| `brainstorming` | Features para app, estratégias de cache |
| `marketing` | Landing page SaaS B2B |
| `translation` | Documentação técnica EN→PT |
| `qa` | Debugging de memory leak |
| `creative` | Nome para startup de DevOps |

### Relatório ao final

```
📊 Total de execuções: 50
⭐ Rating médio: 4.12/5
📈 Taxa de melhoria: +8.3%

📂 Distribuição por categoria:
   code            8 execuções
   analysis        7 execuções
   ...

🔀 Performance por variação:
   direct          3.80/5 (15 usos)
   contextual      4.20/5 (22 usos)
   chainOfThought  4.05/5 (13 usos)
```

---

## 6. Training adaptativo — `npm run train:adaptive`

O training adaptativo divide o total de iterações em batches e, a cada checkpoint, avalia o progresso e aplica estratégias automáticas de ajuste.

### Executar

```bash
npm run train:adaptive         # 100 iterações, checkpoint a cada 20
npm run train:adaptive 200     # 200 iterações
```

### Estratégias adaptativas

O sistema monitora as métricas a cada checkpoint e ativa estratégias automaticamente:

| Estratégia | Gatilho | Ação |
|---|---|---|
| **Reforço de Categoria Fraca** | Alguma categoria com rating médio < 3.5 e > 5 amostras | Aumenta iterações nessa categoria |
| **Exploração de Variações** | Desbalanceamento > 3× entre variações mais e menos usadas | Força uso das variações subutilizadas |
| **Intensificação de Sucesso** | Taxa de melhoria > 15% | Duplica o batch atual |

### Fluxo do training adaptativo

```
Batch 1 (20 iterações)
  ↓
Checkpoint: avalia métricas
  ↓
Aplica estratégias se necessário
  ↓
Pausa 3s
  ↓
Batch 2 (20 iterações)
  ↓
... repete até totalIterations
  ↓
Relatório final
```

### Quando usar adaptativo vs básico

| Situação | Recomendação |
|---|---|
| Primeiro treinamento | `train` (básico) com 50 iterações |
| Histórico > 100 entradas | `train:adaptive` |
| Categoria específica com rating baixo | `train:adaptive` (detecta e corrige) |
| Treinamento rápido/pontual | `train` |
| Treinamento contínuo/noturno | `train:adaptive` com 500+ iterações |

---

## 7. Loop autônomo — `--auto`

O loop autônomo é diferente do training: ele usa **LLM-as-judge** — a própria IA avalia a qualidade dos prompts gerados, sem critérios fixos de palavras-chave.

```bash
npm start -- --auto                    # loop infinito (Ctrl+C para parar)
npm start -- --auto --auto-max 20      # máximo de 20 ciclos
npm start -- --auto --auto-target 4.5  # para quando atingir rating médio 4.5
```

### Diferença entre `--auto` e `npm run train`

| | `npm run train` | `--auto` |
|---|---|---|
| Avaliação | Critérios objetivos (keywords, tamanho) | LLM-as-judge (IA avalia IA) |
| Modelo | Modelo principal (`AI_MODEL`) | Modelo leve (`AUTO_MODEL`) |
| Velocidade | Mais rápido | Mais lento (2 chamadas por ciclo) |
| Qualidade da avaliação | Heurística | Semântica |
| Uso ideal | Acumular histórico em volume | Refinar qualidade |

### Configurar o modelo do loop autônomo

```bash
# .env
AUTO_MODEL=llama3.2:1b   # padrão — rápido
# AUTO_MODEL=llama3.2    # mais preciso na avaliação
```

---

## 8. Loop de aprendizado — `--loop`

O loop de aprendizado foca em um objetivo específico, iterando até atingir um rating alvo ou o número máximo de tentativas.

```bash
npm start -- --loop "criar API REST com autenticação"
npm start -- --loop "escrever copy para landing page" --loop-max 5
npm start -- --loop "analisar arquitetura de microserviços" --loop-target 4
```

Útil para refinar um prompt específico até obter qualidade satisfatória.

---

## 9. Como o sistema aprende

Todo feedback (manual ou automático) é salvo em `~/.prompt-generator/history.json`. O `LearningEngine` analisa esse histórico e deriva insights que influenciam as próximas execuções.

### O que é aprendido

- **Melhor variação por categoria**: qual das 3 variações (direct, contextual, chainOfThought) tem melhor rating em cada categoria
- **Sugestões de configuração**: tom, formato e público que geram melhores resultados
- **Nível de confiança**: `low` (< 10 amostras), `medium` (< 50), `high` (≥ 50)

### Como o aprendizado é aplicado

```
Próxima execução
  ↓
LearningEngine.suggest(config, history)
  ↓
Retorna patches: { tone: 'technical', format: 'code', ... }
  ↓
Aplicados sobre a config antes de gerar o prompt
```

### Motivos de falha registrados

Quando rating ≤ 2, o sistema registra o motivo:

| Código | Significado |
|---|---|
| `too_vague` | Prompt sem contexto suficiente |
| `wrong_format` | Formato de saída inadequado |
| `wrong_tone` | Tom não adequado ao público |
| `missing_context` | Faltou role ou restrições |
| `too_long` | Resposta excessivamente longa |
| `hallucinated` | IA inventou informações |

Esses motivos alimentam o `rewritePrompt()`, que reescreve automaticamente prompts ruins.

### Ver o histórico acumulado

```bash
cat ~/.prompt-generator/history.json | jq 'length'          # total de entradas
cat ~/.prompt-generator/history.json | jq '[.[].rating] | add / length'  # rating médio
```

---

## 10. Exportar e fine-tunar

Após acumular histórico com ratings altos, exporte para fine-tuning:

```bash
# Exportar entradas com rating >= 4 (padrão)
npm run export-dataset

# Exportar para arquivo específico com rating mínimo 5
npm run export-dataset meu-dataset.jsonl 5

# Fine-tuning local (requer GPU + Python + Unsloth)
npm run finetune
```

O dataset exportado segue o formato Alpaca (JSONL), compatível com Unsloth, LLaMA Factory e outros frameworks de fine-tuning.

### Fluxo completo de fine-tuning

```bash
# 1. Gerar dataset seed inicial
npm run seed-dataset

# 2. Acumular histórico via training
npm run train 200

# 3. Exportar apenas os bons (rating >= 4)
npm run export-dataset dataset.jsonl 4

# 4. Fine-tuning (Llama 3.2 3B + LoRA, ~6GB VRAM)
npm run finetune

# 5. Avaliar modelo fine-tunado vs baseline
npm run eval
```

---

## 11. Fluxo completo recomendado

### Início (sem histórico)

```bash
# 1. Configurar ambiente
cp .env.example .env
# editar .env com AI_MODE=local e modelo Ollama

# 2. Instalar Ollama e baixar modelo
npm run setup-ollama

# 3. Primeiro training para acumular histórico
npm run train 50
```

### Uso contínuo

```bash
# Training diário para manter o modelo atualizado
npm run train 100

# Ou training adaptativo para sessões mais longas
npm run train:adaptive 200

# Verificar progresso
./analyze-results.sh
```

### Ciclo de melhoria

```
train (acumula dados)
  ↓
export-dataset (filtra os bons)
  ↓
finetune (treina modelo customizado)
  ↓
eval (compara baseline vs fine-tunado)
  ↓
train:adaptive (continua melhorando)
```

---

## 12. Referência de variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `AI_MODE` | `auto` | `auto` \| `local` \| `remote` \| `offline` |
| `AI_PROVIDER` | `anthropic` | `anthropic` \| `openai` (para modo remote) |
| `AI_API_KEY` | — | Chave da API Anthropic ou OpenAI |
| `AI_MODEL` | provider default | Modelo principal |
| `AI_MAX_TOKENS` | `4000` | Limite de tokens (Anthropic) |
| `OLLAMA_HOST` | `http://localhost:11434` | Host do Ollama |
| `OLLAMA_TIMEOUT` | `300000` | Timeout em ms para chamadas Ollama |
| `AUTO_MODEL` | `llama3.2:1b` | Modelo usado no loop autônomo (`--auto`) |
