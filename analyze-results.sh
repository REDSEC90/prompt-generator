#!/bin/bash
# Script para analisar resultados do treinamento

HISTORY_FILE="$HOME/.prompt-generator/history.json"

if [ ! -f "$HISTORY_FILE" ]; then
    echo "❌ Arquivo de histórico não encontrado: $HISTORY_FILE"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           📊 ANÁLISE DE RESULTADOS DO TREINAMENTO             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Total de execuções
TOTAL=$(jq 'length' "$HISTORY_FILE")
echo "📊 Total de execuções: $TOTAL"
echo ""

# Rating médio geral
AVG_RATING=$(jq '[.[] | .rating] | add / length | round * 100 / 100' "$HISTORY_FILE")
echo "⭐ Rating médio geral: $AVG_RATING/5"
echo ""

# Últimas 10 execuções
echo "📈 Últimas 10 execuções:"
jq -r '.[-10:] | .[] | "   [\(.timestamp | strftime("%H:%M:%S"))] \(.config.category | ascii_upcase) — Rating: \(.rating)/5 — Variação: \(.usedVariation)"' "$HISTORY_FILE"
echo ""

# Rating médio por categoria
echo "📂 Rating médio por categoria:"
jq -r 'group_by(.config.category) | map({
  category: .[0].config.category,
  avg_rating: ([.[] | .rating] | add / length | round * 100 / 100),
  count: length
}) | .[] | "   \(.category | ascii_upcase | ljust(15)) \(.avg_rating)/5 (\(.count) execuções)"' "$HISTORY_FILE"
echo ""

# Performance por variação
echo "🔀 Performance por variação:"
jq -r 'group_by(.usedVariation) | map({
  variation: .[0].usedVariation,
  avg_rating: ([.[] | .rating] | add / length | round * 100 / 100),
  count: length
}) | .[] | "   \(.variation | ljust(20)) \(.avg_rating)/5 (\(.count) usos)"' "$HISTORY_FILE"
echo ""

# Taxa de melhoria (primeiros 20 vs últimos 20)
if [ "$TOTAL" -ge 40 ]; then
    FIRST_20=$(jq '[.[0:20] | .[] | .rating] | add / length' "$HISTORY_FILE")
    LAST_20=$(jq '.[-20:] | [.[] | .rating] | add / length' "$HISTORY_FILE")
    IMPROVEMENT=$(echo "scale=2; (($LAST_20 - $FIRST_20) / $FIRST_20) * 100" | bc)
    echo "📈 Taxa de melhoria (primeiros 20 vs últimos 20): ${IMPROVEMENT}%"
    echo ""
fi

# Motivos de falha (rating <= 2)
FAILURES=$(jq '[.[] | select(.rating <= 2)] | length' "$HISTORY_FILE")
if [ "$FAILURES" -gt 0 ]; then
    echo "⚠️  Falhas detectadas (rating ≤ 2): $FAILURES"
    echo ""
    echo "   Motivos:"
    jq -r '[.[] | select(.rating <= 2)] | group_by(.failureReason) | map({
      reason: .[0].failureReason,
      count: length
    }) | .[] | "   • \(.reason): \(.count) ocorrências"' "$HISTORY_FILE"
    echo ""
fi

# Distribuição de ratings
echo "📊 Distribuição de ratings:"
for i in {1..5}; do
    COUNT=$(jq "[.[] | select(.rating == $i)] | length" "$HISTORY_FILE")
    PERCENT=$(echo "scale=1; ($COUNT * 100) / $TOTAL" | bc)
    BAR=$(printf '█%.0s' $(seq 1 $(echo "$PERCENT / 2" | bc)))
    echo "   $i ⭐ [$BAR] $COUNT ($PERCENT%)"
done
echo ""

# Recomendações
echo "💡 RECOMENDAÇÕES:"
echo ""

# Se rating médio < 3.5
if (( $(echo "$AVG_RATING < 3.5" | bc -l) )); then
    echo "   🔴 Rating médio baixo ($AVG_RATING/5)"
    echo "      → Execute mais iterações para melhorar"
    echo "      → Considere ajustar cenários em src/core/auto-trainer.ts"
    echo ""
fi

# Se taxa de melhoria < 5%
if [ "$TOTAL" -ge 40 ] && (( $(echo "$IMPROVEMENT < 5" | bc -l) )); then
    echo "   🟡 Taxa de melhoria baixa (${IMPROVEMENT}%)"
    echo "      → Use treinamento adaptativo: npm run train:adaptive"
    echo ""
fi

# Se muitas falhas
if [ "$FAILURES" -gt $(echo "$TOTAL * 0.2" | bc) ]; then
    echo "   🟡 Muitas falhas detectadas (${FAILURES}/${TOTAL})"
    echo "      → Revise motivos de falha acima"
    echo "      → Ajuste expectedKeywords nos cenários"
    echo ""
fi

# Próximos passos
echo "🚀 PRÓXIMOS PASSOS:"
echo ""
echo "   1. Exportar dataset para fine-tuning:"
echo "      npm run export-dataset"
echo ""
echo "   2. Executar treinamento adaptativo:"
echo "      npm run train:adaptive 100"
echo ""
echo "   3. Avaliar modelo fine-tunado:"
echo "      npm run eval"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Análise completa em: $(date '+%Y-%m-%d %H:%M:%S')                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
