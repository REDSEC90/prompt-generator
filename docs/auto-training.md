# Sistema de Treinamento Automatizado para Ollama

## Visão Geral

Sistema profissional de treinamento contínuo que gera inputs diversificados, executa prompts no Ollama, avalia respostas automaticamente e alimenta o learning engine para melhoria contínua.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   AutoTrainer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cenários Diversificados (13 templates)              │   │
│  │  • 8 categorias balanceadas                          │   │
│  │  • Múltiplos tons e formatos                         │   │
│  │  • Critérios de avaliação objetivos                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Loop de Treinamento                                 │   │
│  │  1. Seleciona cenário (round-robin + shuffle)        │   │
│  │  2. Aplica sugestões do LearningEngine               │   │
│  │  3. Gera prompt com melhor variação                  │   │
│  │  4. Executa no Ollama                                │   │
│  │  5. Avalia resposta (1-5 stars)                      │   │
│  │  6. Salva feedback no histórico                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Métricas e Insights                                 │   │
│  │  • Rating médio por categoria                        │   │
│  │  • Performance por variação                          │   │
│  │  • Taxa de melhoria ao longo do tempo                │   │
│  │  • Sugestões automáticas                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          AdaptiveTrainingOrchestrator                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Estratégias Adaptativas                             │   │
│  │  • Reforço de categorias fracas                      │   │
│  │  • Exploração de variações subutilizadas             │   │
│  │  • Intensificação de sucessos                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Checkpoints Periódicos                              │   │
│  │  • Avaliação a cada N iterações                      │   │
│  │  • Ajuste automático de estratégia                   │   │
│  │  • Otimização contínua                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Uso

### Treinamento Básico

```bash
# 50 iterações padrão
npm run train

# 100 iterações
npm run train 100

# 200 iterações com delay de 3s entre cada
npm run train 200 3000
```

### Treinamento Adaptativo

```bash
# 100 iterações com ajustes automáticos
npm run train:adaptive

# 500 iterações com checkpoints a cada 50
npm run train:adaptive 500
```

## Cenários de Treinamento

### Diversidade Garantida

O sistema inclui **13 cenários pré-configurados** cobrindo:

| Categoria | Cenários | Foco |
|-----------|----------|------|
| **code** | 3 | JWT auth, REST API, WebSocket |
| **analysis** | 2 | Arquitetura, Performance DB |
| **summary** | 2 | Docs técnicas, Changelog |
| **brainstorming** | 2 | Features, Estratégias cache |
| **marketing** | 1 | Landing page B2B |
| **translation** | 1 | Docs técnicas EN→PT |
| **qa** | 1 | Debugging memory leak |
| **creative** | 1 | Naming startup |

### Seleção Inteligente

- **Round-robin com shuffle**: evita viés de ordem
- **Balanceamento automático**: todas as categorias são treinadas igualmente
- **Variação adaptativa**: usa histórico para escolher melhor variação

## Avaliação Automática

### Critérios Objetivos

1. **Comprimento adequado**
   - ✅ `>= minLength`: +1 ponto
   - ⚠️ `< minLength * 0.5`: -1 ponto

2. **Palavras-chave esperadas**
   - ✅ `>= 70% presentes`: +1 ponto
   - ⚠️ `< 30% presentes`: -1 ponto

3. **Estrutura do formato**
   - ✅ Code com ` ``` `: +0.5 ponto
   - ✅ Markdown com `##`: +0.5 ponto
   - ✅ Numbered list com `1.`: +0.5 ponto

### Detecção de Falhas

Para ratings ≤ 2, o sistema identifica automaticamente:

- `too_vague`: resposta muito curta (< 30% do esperado)
- `missing_context`: nenhuma palavra-chave presente
- `wrong_format`: formato inadequado (ex: code sem ` ``` `)
- `too_long`: resposta excessiva (> 5x o esperado)
- `wrong_tone`: outros problemas de qualidade

## Métricas e Relatórios

### Métricas Coletadas

```typescript
interface TrainingMetrics {
  totalRuns: number;
  avgRating: number;
  categoryDistribution: Record<Category, number>;
  variationPerformance: Record<string, { count: number; avgRating: number }>;
  improvementRate: number;  // % de melhoria ao longo do tempo
}
```

### Exemplo de Relatório

```
╔════════════════════════════════════════╗
║     RELATÓRIO DE TREINAMENTO           ║
╚════════════════════════════════════════╝

📊 Total de execuções: 100
⭐ Rating médio: 3.87/5
📈 Taxa de melhoria: +12.3%

📂 Distribuição por categoria:
   code            15 execuções
   analysis        13 execuções
   summary         12 execuções
   brainstorming   14 execuções
   marketing       8 execuções
   translation     10 execuções
   qa              9 execuções
   creative        19 execuções

🔀 Performance por variação:
   direct          3.45/5 (28 usos)
   contextual      3.92/5 (35 usos)
   chainOfThought  4.21/5 (37 usos)

💡 Insights do Learning Engine:

   CODE (45 amostras, confiança: medium)
   Melhor variação: chainOfThought
   • Variação chainOfThought supera direct em +0.5 — ative chainOfThought por padrão.
   • Few-shot examples melhoram o rating — inclua exemplos sempre que possível.

   ANALYSIS (38 amostras, confiança: medium)
   Melhor variação: contextual
   • Prompts diretos performam melhor — reduza campos opcionais.
```

## Estratégias Adaptativas

### 1. Reforço de Categoria Fraca

**Trigger**: Categoria com rating < 3.5 e > 5 amostras

**Ação**: Executa 10 iterações extras focadas nessa categoria

### 2. Exploração de Variações

**Trigger**: Desbalanceamento > 3x entre variações mais/menos usadas

**Ação**: Força uso de variações subutilizadas

### 3. Intensificação de Sucesso

**Trigger**: Taxa de melhoria > 15%

**Ação**: Duplica número de iterações no próximo batch

## Integração com Learning Engine

### Fluxo de Aprendizado

```
Execução → Avaliação → Feedback → Histórico → Insights → Próxima Execução
    ↑                                                            ↓
    └────────────────────────────────────────────────────────────┘
                    Loop de Melhoria Contínua
```

### Sugestões Automáticas

O `LearningEngine` analisa o histórico e sugere:

- Melhor variação por categoria
- Formato de saída mais eficaz
- Necessidade de few-shot examples
- Ajustes de tom e público

## Boas Práticas

### Configuração Inicial

```bash
# 1. Garantir que Ollama está rodando
ollama serve

# 2. Verificar modelo instalado
ollama list | grep prompt-generator

# 3. Executar treinamento inicial (50 iterações)
npm run train
```

### Treinamento Contínuo

```bash
# Executar diariamente em background
nohup npm run train:adaptive 200 > training.log 2>&1 &

# Monitorar progresso
tail -f training.log

# Verificar métricas
cat ~/.prompt-generator/history.json | jq '.[-10:]'
```

### Otimização de Performance

- **Delay entre iterações**: 2-3s (evita sobrecarga do Ollama)
- **Batch size**: 20-50 (checkpoints frequentes)
- **Total de iterações**: 100-500 (balanceia tempo vs aprendizado)

## Troubleshooting

### Ollama não responde

```bash
# Verificar se está rodando
curl http://localhost:11434/api/tags

# Reiniciar se necessário
pkill ollama && ollama serve
```

### Rating sempre baixo

- Verificar se modelo está fine-tunado
- Ajustar `expectedKeywords` nos cenários
- Reduzir `minLength` para testes iniciais

### Memória insuficiente

- Reduzir `MAX_HISTORY` em `store.ts`
- Executar menos iterações por batch
- Limpar histórico antigo: `rm ~/.prompt-generator/history.json`

## Roadmap

- [ ] Exportação de métricas para Grafana/Prometheus
- [ ] Integração com Weights & Biases para tracking
- [ ] Suporte a múltiplos modelos Ollama em paralelo
- [ ] A/B testing automático entre modelos
- [ ] Geração automática de novos cenários via meta-prompt
- [ ] API REST para controle remoto do treinamento
- [ ] Dashboard web em tempo real

## Contribuindo

Novos cenários de treinamento são bem-vindos! Adicione em `auto-trainer.ts`:

```typescript
{
  theme: 'seu tema',
  action: 'verbo imperativo',
  category: 'categoria',
  audience: 'público-alvo',
  objective: 'resultado esperado',
  tone: 'tom',
  format: 'formato',
  expectedKeywords: ['palavra1', 'palavra2'],
  minLength: 200,
}
```
