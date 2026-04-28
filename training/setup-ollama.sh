#!/usr/bin/env bash
# setup-ollama.sh — Instala Ollama, puxa llama3.2 e cria o modelo prompt-generator
# Uso: bash training/setup-ollama.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELFILE="$ROOT/training/Modelfile"
MODEL_GGUF="$ROOT/prompt-generator-model.gguf"

# ── 1. Instalar Ollama ─────────────────────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
  echo "⏳ Instalando Ollama…"
  curl -fsSL https://ollama.com/install.sh | sh
  echo "✔ Ollama instalado"
else
  echo "✔ Ollama já instalado: $(ollama --version)"
fi

# ── 2. Garantir que o servidor está rodando ────────────────────────────────────
if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
  echo "⏳ Iniciando ollama serve em background…"
  ollama serve &>/tmp/ollama.log &
  sleep 3
fi
echo "✔ Ollama server ativo"

# ── 3. Puxar modelo base ───────────────────────────────────────────────────────
echo "⏳ Baixando llama3.2 (2GB — pode demorar)…"
ollama pull llama3.2
echo "✔ llama3.2 disponível"

# ── 4. Criar modelo: fine-tunado (se existir GGUF) ou base ────────────────────
# O fine-tuning gera uma pasta Hugging Face, mas o Ollama serve arquivos GGUF.
if [ -f "$MODEL_GGUF" ]; then
  echo "⏳ Criando modelo prompt-generator a partir do GGUF fine-tunado…"
  ollama create prompt-generator -f "$MODELFILE"
  echo "✔ Modelo prompt-generator criado (GGUF: $(basename "$MODEL_GGUF"))"
else
  echo ""
  echo "⚠  Fine-tune não detectado: $MODEL_GGUF não encontrado."
  echo "   Este setup vai criar um modelo 'prompt-generator' baseado em llama3.2 + system prompt."
  echo ""
  echo "   Para usar pesos fine-tunados no Ollama:"
  echo "     1) Treine e gere a pasta HF: python training/finetune.py --dataset dataset.jsonl"
  echo "     2) Converta para GGUF e salve como: ./prompt-generator-model.gguf"
  echo "     3) Rode este script novamente: bash training/setup-ollama.sh"
  echo ""
  echo "   Enquanto isso, criando modelo com system prompt customizado sobre llama3.2…"

  # Cria Modelfile temporário usando llama3.2 como base (sem fine-tuning)
  TMP_MF="$(mktemp)"
  sed 's|FROM ./prompt-generator-model.gguf|FROM llama3.2|' "$MODELFILE" > "$TMP_MF"
  ollama create prompt-generator -f "$TMP_MF"
  rm "$TMP_MF"
  echo "✔ Modelo prompt-generator criado (base: llama3.2 + system prompt)"
fi

# ── 5. Teste rápido ────────────────────────────────────────────────────────────
echo ""
echo "⏳ Testando modelo…"
ollama run prompt-generator "Gere um prompt para: criar um endpoint REST com autenticação JWT em Node.js" --nowordwrap 2>/dev/null | head -20
echo ""

# ── 6. Configurar .env ────────────────────────────────────────────────────────
ENV_FILE="$ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
fi

if grep -q "^AI_PROVIDER=" "$ENV_FILE"; then
  sed -i 's/^AI_PROVIDER=.*/AI_PROVIDER=ollama/' "$ENV_FILE"
else
  echo "AI_PROVIDER=ollama" >> "$ENV_FILE"
fi

if grep -q "^AI_MODEL=" "$ENV_FILE"; then
  sed -i 's/^AI_MODEL=.*/AI_MODEL=prompt-generator/' "$ENV_FILE"
else
  echo "AI_MODEL=prompt-generator" >> "$ENV_FILE"
fi

echo "✔ .env configurado: AI_PROVIDER=ollama  AI_MODEL=prompt-generator"
echo ""
echo "══════════════════════════════════════════════════"
echo "  Pronto! Execute: npm start"
echo "══════════════════════════════════════════════════"
