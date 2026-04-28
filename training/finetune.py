"""
Fine-tuning do Llama 3.2 3B com o dataset gerado pelo prompt-generator.

Pré-requisitos:
  pip install unsloth datasets trl transformers

Para rodar no Google Colab (gratuito):
  1. Abrir https://colab.research.google.com
  2. Runtime → Change runtime type → T4 GPU
  3. Instalar dependências e executar este script

Uso:
  python training/finetune.py --dataset dataset.jsonl --epochs 3

Tempo estimado: ~15 min para 200 exemplos × 3 épocas no Colab T4.

Nota:
  Este script salva um modelo no formato Hugging Face em `./prompt-generator-model`.
  Para servir via Ollama, converta o resultado para um arquivo `.gguf` e salve como
  `./prompt-generator-model.gguf`, depois rode `bash training/setup-ollama.sh`.
"""

import argparse
import json
from pathlib import Path

def parse_args():
    p = argparse.ArgumentParser(description="Fine-tuning do Llama 3.2 com dataset de prompts.")
    p.add_argument("--dataset",    default="dataset.jsonl",          help="Caminho do dataset JSONL exportado (Tarefa 2.3)")
    p.add_argument("--model",      default="unsloth/Llama-3.2-3B-Instruct", help="Modelo base Hugging Face")
    p.add_argument("--output-dir", default="./model-output",         help="Diretório de checkpoints")
    p.add_argument("--save-dir",   default="./prompt-generator-model", help="Diretório do modelo final")
    p.add_argument("--epochs",     type=int, default=3,               help="Número de épocas de treino")
    p.add_argument("--batch-size", type=int, default=4,               help="Batch size por dispositivo")
    p.add_argument("--lr",         type=float, default=2e-4,          help="Learning rate")
    p.add_argument("--max-seq",    type=int, default=2048,            help="Comprimento máximo da sequência")
    p.add_argument("--lora-r",     type=int, default=16,              help="Rank LoRA")
    return p.parse_args()


def load_dataset_file(path: str):
    """Carrega o JSONL exportado pela Tarefa 2.3."""
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset não encontrado: {path}\n"
            "Execute primeiro: npm run export-dataset"
        )
    with open(dataset_path) as f:
        data = [json.loads(line) for line in f if line.strip()]
    print(f"✔ Dataset carregado: {len(data)} exemplos de {path}")
    return data


def format_alpaca(row: dict) -> dict:
    """
    Formata cada par (instruction → output) no template Alpaca.
    Este é o formato esperado pelo SFTTrainer do trl.
    """
    return {
        "text": (
            f"### Instrução:\n{row['instruction']}\n\n"
            f"### Prompt:\n{row['output']}"
        )
    }


def main():
    args = parse_args()

    # ── 1. Carregar dados ──────────────────────────────────────────────────────
    raw_data = load_dataset_file(args.dataset)

    from datasets import Dataset
    dataset = Dataset.from_list([format_alpaca(r) for r in raw_data])
    print(f"✔ Dataset formatado: {len(dataset)} exemplos")

    # ── 2. Carregar modelo base com quantização 4-bit ──────────────────────────
    from unsloth import FastLanguageModel

    print(f"\n⏳ Carregando modelo base: {args.model}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq,
        load_in_4bit=True,  # Quantização 4-bit: roda em 6GB VRAM
    )
    print("✔ Modelo carregado")

    # ── 3. Aplicar LoRA — treina apenas 1-3% dos parâmetros ───────────────────
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        target_modules=["q_proj", "v_proj"],
        lora_alpha=args.lora_r,  # Convenção: lora_alpha = r
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
    )
    print(f"✔ LoRA aplicado (r={args.lora_r})")

    # ── 4. Treinar ─────────────────────────────────────────────────────────────
    from trl import SFTTrainer
    from transformers import TrainingArguments

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        fp16=True,
        logging_steps=10,
        save_strategy="epoch",
        warmup_ratio=0.05,
        lr_scheduler_type="cosine",
        report_to="none",  # Desativa W&B / wandb
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq,
        args=training_args,
    )

    print(f"\n🚀 Iniciando treinamento ({args.epochs} épocas × {len(dataset)} exemplos)…")
    trainer.train()
    print("✔ Treinamento concluído")

    # ── 5. Salvar modelo final ─────────────────────────────────────────────────
    model.save_pretrained(args.save_dir)
    tokenizer.save_pretrained(args.save_dir)
    print(f"\n✔ Modelo salvo em: {args.save_dir}")
    print("\nPróximo passo — servir via Ollama:")
    print("  1) Converta para GGUF e salve como ./prompt-generator-model.gguf")
    print("  2) bash training/setup-ollama.sh")


if __name__ == "__main__":
    main()
