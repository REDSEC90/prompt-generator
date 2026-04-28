# 🚀 Guia de Início Rápido - Treinamento Automatizado

## Pré-requisitos

```bash
# 1. Verificar se Ollama está instalado
ollama --version

# 2. Iniciar Ollama
ollama serve

# 3. (Opcional) Verificar modelo
ollama list | grep prompt-generator
```

## Primeiro Treinamento (5 minutos)

```bash
# 1. Navegar para o projeto
cd ~/Ambiente/prompt-generator

# 2. Executar treinamento básico (10 iterações)
npm run train 10

# Saída esperada:
# 🎯 Iniciando treinamento automatizado: 10 iterações
# 
# [1/10] CODE — autenticação JWT
#   🔄 Executando variação: contextual
#   ⭐ Rating automático: 4/5
# 
# [2/10] ANALYSIS — arquitetura microserviços vs monolito
#   🔄 Executando variação: chainOfThought
#   ⭐ Rating automático: 3/5
# ...
# ✅ Treinamento concluído: 10/10 sucessos em 25.3s
```

## Visualizar Resultados

```bash
# Ver últimas 5 execuções
cat ~/.prompt-generator/history.json | jq '.[-5:]'

# Ver estatísticas gerais
cat ~/.prompt-generator/history.json | jq '[.[] | .rating] | add/length'

# Contar por categoria
cat ~/.prompt-generator/history.json | jq 'group_by(.config.category) | map({category: .[0].config.category, count: length})'
```

## Treinamento Intensivo (30 minutos)

```bash
# 100 iterações com delay de 1.5s
npm run train 100 1500

# Resultado esperado:
# - ~150 segundos de execução
# - 100 feedbacks salvos
# - Relatório detalhado com insights
```

## Treinamento Adaptativo (1 hora)

```bash
# 200 iterações com checkpoints a cada 20
npm run train:adaptive 200

# O sistema irá:
# - Executar 20 iterações
# - Avaliar métricas
# - Aplicar estratégias adaptativas
# - Repetir até completar 200
```

## Análise de Resultados

### Relatório Automático

Ao final de cada treinamento, você verá:

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
   ...

🔀 Performance por variação:
   direct          3.45/5 (28 usos)
   contextual      3.92/5 (35 usos)
   chainOfThought  4.21/5 (37 usos)

💡 Insights do Learning Engine:
   CODE (45 amostras, confiança: medium)
   Melhor variação: chainOfThought
   • Variação chainOfThought supera direct em +0.5
```

### Análise Manual

```bash
# Rating médio por categoria
cat ~/.prompt-generator/history.json | jq '
  group_by(.config.category) | 
  map({
    category: .[0].config.category, 
    avg_rating: ([.[] | .rating] | add / length | round * 100 / 100),
    count: length
  })
'

# Variações mais usadas
cat ~/.prompt-generator/history.json | jq '
  group_by(.usedVariation) | 
  map({
    variation: .[0].usedVariation,
    count: length,
    avg_rating: ([.[] | .rating] | add / length | round * 100 / 100)
  })
'

# Motivos de falha (rating <= 2)
cat ~/.prompt-generator/history.json | jq '
  [.[] | select(.rating <= 2)] | 
  group_by(.failureReason) | 
  map({
    reason: .[0].failureReason,
    count: length
  })
'
```

## Exportar Dataset para Fine-tuning

```bash
# Exportar apenas prompts com rating >= 4
npm run export-dataset

# Arquivo gerado: training-dataset.jsonl
# Formato: Alpaca (instruction, input, output)
```

## Troubleshooting

### Ollama não responde

```bash
# Verificar se está rodando
curl http://localhost:11434/api/tags

# Se não estiver, iniciar
ollama serve

# Em outro terminal, executar treinamento
npm run train 10
```

### Rating sempre baixo (< 2.5)

**Causa**: Modelo base não está otimizado

**Solução**:
1. Executar mais iterações (100+)
2. Exportar dataset: `npm run export-dataset`
3. Fine-tuning: `npm run finetune`
4. Criar modelo no Ollama: `ollama create prompt-generator -f training/Modelfile`

### Memória insuficiente

**Sintoma**: Ollama trava ou fica muito lento

**Solução**:
```bash
# Reduzir delay entre iterações
npm run train 50 3000  # 3s de delay

# Ou executar em batches menores
npm run train 20
# aguardar alguns minutos
npm run train 20
```

### Histórico muito grande

```bash
# Backup do histórico
cp ~/.prompt-generator/history.json ~/.prompt-generator/history-backup.json

# Manter apenas últimas 1000 entradas
cat ~/.prompt-generator/history.json | jq '.[-1000:]' > /tmp/history-trimmed.json
mv /tmp/history-trimmed.json ~/.prompt-generator/history.json
```

## Próximos Passos

1. **Treinamento Inicial**: `npm run train 50`
2. **Análise de Resultados**: Verificar relatório e histórico
3. **Treinamento Adaptativo**: `npm run train:adaptive 100`
4. **Exportar Dataset**: `npm run export-dataset`
5. **Fine-tuning**: `npm run finetune` (requer GPU)
6. **Avaliação A/B**: `npm run eval`

## Dicas de Otimização

### Para Treinamento Rápido
- Use delay baixo (1000-1500ms)
- Execute em horários de baixo uso do sistema
- Monitore uso de CPU/RAM

### Para Melhor Qualidade
- Execute 200+ iterações
- Use treinamento adaptativo
- Analise insights do LearningEngine
- Ajuste cenários em `src/core/auto-trainer.ts`

### Para Produção
- Execute treinamento noturno: `nohup npm run train:adaptive 500 > training.log 2>&1 &`
- Configure cron job para treinamento diário
- Monitore métricas com scripts customizados

## Recursos Adicionais

- **Documentação Completa**: `docs/auto-training.md`
- **Exemplos Práticos**: `docs/exemplos-praticos.md`
- **Referência Técnica**: `docs/referencia-tecnica.md`
- **Changelog**: `CHANGELOG.md`

---

**Dúvidas?** Abra uma issue no GitHub ou consulte a documentação completa.
