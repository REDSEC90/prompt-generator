# Fine-tuning do Llama (Ollama + dataset)

Este guia descreve o fluxo para treinar e usar um modelo Llama para o `prompt-generator`.

Importante: o fine-tuning gera uma pasta no formato Hugging Face (`./prompt-generator-model`).
Para servir via Ollama, voce precisa converter o resultado para um arquivo `.gguf`
(`./prompt-generator-model.gguf`).

## 1) Setup do Ollama (baseline offline)

Cria o modelo `prompt-generator` baseado em `llama3.2` + system prompt (sem fine-tuning).

```bash
npm run setup-ollama
```

Ao final, o script configura o `.env` com:

- `AI_PROVIDER=ollama`
- `AI_MODEL=prompt-generator`

## 2) Gerar dataset

Opcao A: usar feedbacks reais (recomendado apos uso).

```bash
npm run export-dataset
```

Opcao B: bootstrap sintetico (para comecar agora).

```bash
npm run seed-dataset
```

Dica: para escolher o arquivo de saida:

```bash
python3 training/seed-dataset.py --output /tmp/dataset.jsonl --min 50
```

## 3) Fine-tuning (requer GPU)

Local (GPU NVIDIA) ou Google Colab.

```bash
python3 training/finetune.py --dataset dataset.jsonl --epochs 3
```

Saida:

- pasta HF: `./prompt-generator-model`

## 4) Converter para GGUF (necessario para Ollama)

Converta o modelo treinado para GGUF e salve como:

- `./prompt-generator-model.gguf`

Obs: a conversao para GGUF depende de ferramentas externas (ex: llama.cpp) e varia por setup.
Depois de gerar o arquivo `.gguf`, siga para o passo 5.

## 5) Registrar o modelo no Ollama

Com `./prompt-generator-model.gguf` presente na raiz do projeto:

```bash
npm run setup-ollama
```

O script vai detectar o GGUF e criar/atualizar o modelo `prompt-generator` via `training/Modelfile`.

## 6) Avaliar melhoria

```bash
npm run eval
```

