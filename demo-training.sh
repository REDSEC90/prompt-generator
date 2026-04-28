#!/bin/bash
# Script de demonstração do sistema de treinamento automatizado

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DEMONSTRAÇÃO: Sistema de Treinamento Automatizado        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se Ollama está rodando
echo "🔍 Verificando Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama não está rodando!"
    echo "   Execute: ollama serve"
    exit 1
fi
echo "✅ Ollama está ativo"
echo ""

# Verificar modelo
echo "🔍 Verificando modelo prompt-generator..."
if ! ollama list | grep -q "prompt-generator"; then
    echo "⚠️  Modelo não encontrado. Usando modelo padrão do Ollama."
else
    echo "✅ Modelo prompt-generator encontrado"
fi
echo ""

# Limpar histórico anterior (opcional)
read -p "🗑️  Limpar histórico anterior? (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -f ~/.prompt-generator/history.json
    echo "✅ Histórico limpo"
fi
echo ""

# Executar treinamento básico
echo "🎯 Executando treinamento básico (10 iterações)..."
echo "   Pressione Ctrl+C para interromper"
echo ""
sleep 2

npm run train 10 1500

echo ""
echo "✅ Treinamento básico concluído!"
echo ""

# Perguntar se deseja executar treinamento adaptativo
read -p "🧠 Executar treinamento adaptativo? (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🚀 Iniciando treinamento adaptativo (20 iterações)..."
    echo ""
    sleep 2
    npm run train:adaptive 20
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DEMONSTRAÇÃO CONCLUÍDA                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Verifique o histórico em: ~/.prompt-generator/history.json"
echo "📖 Documentação completa: docs/auto-training.md"
echo ""
