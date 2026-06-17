# Plano de Execução — Nível 1 ao Nível 3
## IA Geradora de Prompts com Aprendizado Contínuo (100% Open Source e Gratuito)

**Stack de IA gratuita:** Ollama (runtime local) + modelos open source (Llama 3.2, Mistral, Phi-3)  
**Sem custos de API. Sem dependência de nuvem.**

---

## Visão geral

```
Nível 1 → Loop fechado: gera → usa → avalia → persiste
Nível 2 → Aprende: few-shot dinâmico com histórico real
Nível 3 → Especializa: fine-tuning de modelo open source local
```

---

## FASE 1 — Fundação do loop de aprendizado

> Objetivo: fechar o ciclo geração → feedback → persistência.  
> Pré-requisito: nenhum. Só código.

### Tarefa 1.1 — Adicionar Ollama como provider local

**Por quê:** elimina dependência de API paga. Ollama roda modelos localmente via HTTP.

Instalar Ollama: https://ollama.com  
Modelo recomendado: `ollama pull llama3.2` (2GB, roda em qualquer máquina com 8GB RAM)

Arquivo: `src/core/ai.ts`  
Adicionar função `callOllama`:

```typescript
async function callOllama(prompt: string): Promise<string> {
  const model = process.env.AI_MODEL ?? 'llama3.2';
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw Object.assign(new Error(`Ollama HTTP ${res.status}`), { status: res.status });
  const data = await res.json() as { response: string };
  return data.response;
}
```

Atualizar `sendToAI` para aceitar `AI_PROVIDER=ollama`.

Atualizar `.env.example`:
```
AI_PROVIDER=ollama
AI_MODEL=llama3.2
```

**Teste:** `ollama serve` + `npm start` sem nenhuma API key.

---

### Tarefa 1.2 — FeedbackStore: persistência local do histórico

**Por quê:** sem persistência, o LearningEngine (já implementado) não tem dados entre sessões.

Arquivo novo: `src/core/store.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { PromptFeedback } from './learning';

const STORE_PATH = path.join(
  process.env.HOME ?? process.cwd(),
  '.prompt-generator',
  'history.json',
);

export class FeedbackStore {
  load(): PromptFeedback[] {
    if (!fs.existsSync(STORE_PATH)) return [];
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as PromptFeedback[];
  }

  save(fb: PromptFeedback): void {
    const history = this.load();
    history.push(fb);
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(history, null, 2));
  }

  clear(): void {
    if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
  }
}
```

---

### Tarefa 1.3 — Adicionar failureReason ao PromptFeedback

**Por quê:** rating numérico não diz *por que* o prompt falhou. Com o motivo, o LearningEngine sugere patches cirúrgicos.

Arquivo: `src/core/learning.ts`  
Adicionar ao `PromptFeedback`:

```typescript
export type FailureReason =
  | 'too_vague'        // prompt sem contexto suficiente
  | 'wrong_format'     // formato de saída inadequado
  | 'wrong_tone'       // tom não adequado ao público
  | 'missing_context'  // faltou role ou restrições
  | 'too_long'         // prompt gerou resposta excessiva
  | 'hallucinated';    // IA inventou informações

export interface PromptFeedback {
  config: PromptConfig;
  generatedPrompt: string;          // texto exato do prompt usado
  rating: 1 | 2 | 3 | 4 | 5;
  usedVariation: 'direct' | 'contextual' | 'chainOfThought';
  failureReason?: FailureReason;    // preenchido quando rating <= 2
  timestamp: number;
}
```

---

### Tarefa 1.4 — Coletar feedback no fluxo CLI

**Por quê:** o loop só funciona se o usuário avaliar. Deve ser rápido (2 perguntas).

Arquivo: `src/cli/ui.ts`  
Adicionar função `askFeedback`:

```typescript
export async function askFeedback(
  config: PromptConfig,
  generatedPrompt: string,
  usedVariation: 'direct' | 'contextual' | 'chainOfThought',
): Promise<void> {
  const { select, input } = await import('@inquirer/prompts');
  const rating = await select<1|2|3|4|5>({
    message: 'Avalie o prompt gerado (1-5):',
    choices: [
      { value: 5, name: '5 — Excelente' },
      { value: 4, name: '4 — Bom' },
      { value: 3, name: '3 — Regular' },
      { value: 2, name: '2 — Ruim' },
      { value: 1, name: '1 — Inútil' },
    ],
  });

  let failureReason: FailureReason | undefined;
  if (rating <= 2) {
    failureReason = await select({
      message: 'Qual foi o problema?',
      choices: [
        { value: 'too_vague',        name: 'Muito vago' },
        { value: 'wrong_format',     name: 'Formato errado' },
        { value: 'wrong_tone',       name: 'Tom inadequado' },
        { value: 'missing_context',  name: 'Faltou contexto' },
        { value: 'too_long',         name: 'Resposta longa demais' },
        { value: 'hallucinated',     name: 'IA inventou informações' },
      ],
    });
  }

  new FeedbackStore().save({
    config, generatedPrompt, rating, usedVariation,
    failureReason, timestamp: Date.now(),
  });
}
```

Integrar em `src/index.ts` após `sendToAI`.

---

### Tarefa 1.5 — Role prompting + output scaffolding nos templates

**Por quê:** é a melhoria de qualidade de maior impacto com menor esforço. Adicionar role e estrutura de saída esperada aumenta precisão do LLM em ~30%.

Arquivo: `src/core/templates.ts`  
Adicionar mapa de roles por categoria:

```typescript
const ROLES: Record<Category, string> = {
  summary:       'especialista em síntese de conteúdo',
  code:          'engenheiro de software sênior',
  analysis:      'analista estratégico',
  marketing:     'copywriter especializado em conversão',
  brainstorming: 'consultor de inovação',
  translation:   'tradutor técnico especializado',
  qa:            'especialista em qualidade de software',
  creative:      'escritor criativo profissional',
};
```

Prefixar cada template com `Você é um ${ROLES[c.category]}.`

**Resultado esperado:** prompts gerados passam de instruções planas para prompts com persona, contexto e estrutura.

---

### Entregável da Fase 1

- Sistema roda 100% offline com Ollama
- Cada uso persiste feedback em `~/.prompt-generator/history.json`
- Templates geram prompts com role + estrutura
- `LearningEngine` tem dados reais para analisar

**Gatilho para Fase 2:** 20+ feedbacks salvos.

---

## FASE 2 — Aprendizado in-context

> Objetivo: usar o histórico acumulado para melhorar prompts automaticamente.  
> Pré-requisito: Fase 1 completa + 20 feedbacks.

### Tarefa 2.1 — generatePrompt() com meta-prompt

**Por quê:** em vez de templates fixos, a IA gera o prompt a partir do objetivo do usuário.

Arquivo novo: `src/core/generator.ts`

```typescript
import { sendToAI } from './ai';
import { PromptFeedback } from './learning';

const META = `Você é um especialista em engenharia de prompts para LLMs.
Dado o objetivo abaixo, gere um prompt otimizado.
O prompt deve incluir: papel (role), contexto específico, tarefa clara,
formato de saída esperado, restrições e critério de qualidade.
Retorne apenas o prompt, sem explicações.`;

export async function generatePrompt(
  goal: string,
  examples: PromptFeedback[] = [],
): Promise<string> {
  const shots = examples
    .filter(e => e.rating >= 4)
    .slice(-3)
    .map(e => `Objetivo: "${e.config.objective}"\nPrompt:\n${e.generatedPrompt}`)
    .join('\n\n---\n\n');

  const prompt = [
    META,
    shots ? `\nExemplos de prompts bem avaliados:\n${shots}\n\n---` : '',
    `\nObjetivo: ${goal}`,
  ].filter(Boolean).join('\n');

  return sendToAI(prompt);
}
```

---

### Tarefa 2.2 — Reescrita automática de prompts ruins

**Por quê:** prompts com rating ≤ 2 viram dados de melhoria. A IA reescreve com base no motivo da falha.

Arquivo: `src/core/generator.ts`  
Adicionar função `rewritePrompt`:

```typescript
const FAILURE_HINTS: Record<string, string> = {
  too_vague:       'adicione contexto específico e restrições claras',
  wrong_format:    'especifique a estrutura exata da saída esperada',
  wrong_tone:      'ajuste o tom para o público-alvo descrito',
  missing_context: 'adicione role, contexto de uso e critérios de qualidade',
  too_long:        'adicione limite de tamanho e instrução de concisão',
  hallucinated:    'adicione instrução: "Se não souber, diga explicitamente"',
};

export async function rewritePrompt(
  original: string,
  failureReason: string,
): Promise<string> {
  const hint = FAILURE_HINTS[failureReason] ?? 'melhore a clareza e especificidade';
  const meta = `O prompt abaixo foi mal avaliado porque: ${failureReason}.
Para corrigir, ${hint}.
Reescreva o prompt mantendo o objetivo original.
Retorne apenas o prompt reescrito.

Prompt original:
${original}`;
  return sendToAI(meta);
}
```

---

### Tarefa 2.3 — Exportar dataset JSONL para fine-tuning

**Por quê:** prepara os dados para a Fase 3 no formato exato que Llama/Mistral esperam.

Arquivo novo: `src/core/dataset.ts`

```typescript
import * as fs from 'fs';
import { FeedbackStore } from './store';

/** Exporta pares (objetivo → prompt) com rating >= minRating no formato JSONL. */
export function exportDataset(outputPath: string, minRating = 4): void {
  const history = new FeedbackStore().load();
  const lines = history
    .filter(fb => fb.rating >= minRating)
    .map(fb => JSON.stringify({
      instruction: fb.config.objective,
      input: '',
      output: fb.generatedPrompt,
    }));
  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`Dataset exportado: ${lines.length} exemplos → ${outputPath}`);
}
```

Adicionar comando CLI: `npm run export-dataset`

---

### Tarefa 2.4 — Score de confiança por categoria

**Por quê:** o sistema deve saber quando tem dados suficientes para sugerir com confiança.

Arquivo: `src/core/learning.ts`  
Adicionar ao `LearningInsight`:

```typescript
export interface LearningInsight {
  // ... campos existentes
  confidence: 'low' | 'medium' | 'high';  // low < 10, medium < 50, high >= 50
}
```

Lógica: `confidence = samples < 10 ? 'low' : samples < 50 ? 'medium' : 'high'`

---

### Entregável da Fase 2

- Sistema gera prompts via IA (não só templates)
- Prompts ruins são reescritos automaticamente
- Dataset JSONL pronto para fine-tuning
- Score de confiança indica quando o aprendizado é confiável

**Gatilho para Fase 3:** 200+ exemplos com rating ≥ 4 no dataset exportado.

---

## FASE 3 — Fine-tuning local com modelo open source

> Objetivo: modelo especializado em gerar prompts para o seu padrão de uso.  
> Pré-requisito: 200+ exemplos no dataset + GPU com 8GB VRAM (ou Google Colab gratuito).  
> Stack: Unsloth + Llama 3.2 3B (gratuito, roda em Colab T4).

### Tarefa 3.1 — Preparar ambiente de fine-tuning

**Opção A — Local (GPU NVIDIA 8GB+):**
```bash
pip install unsloth
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**Opção B — Google Colab gratuito (recomendado para começar):**
- Abrir https://colab.research.google.com
- Runtime → Change runtime type → T4 GPU (gratuito)
- Instalar Unsloth no notebook

---

### Tarefa 3.2 — Script de fine-tuning com Unsloth

Arquivo novo: `training/finetune.py`

```python
from unsloth import FastLanguageModel
from datasets import Dataset
import json

# Carregar dataset exportado pela Tarefa 2.3
with open("dataset.jsonl") as f:
    data = [json.loads(line) for line in f]

# Formato Alpaca (instruction → output)
def format_sample(row):
    return {
        "text": f"### Instrução:\n{row['instruction']}\n\n### Prompt:\n{row['output']}"
    }

dataset = Dataset.from_list([format_sample(r) for r in data])

# Carregar modelo base (Llama 3.2 3B — 2GB, gratuito)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Llama-3.2-3B-Instruct",
    max_seq_length=2048,
    load_in_4bit=True,  # quantização 4-bit: roda em 6GB VRAM
)

# LoRA: treina apenas 1-3% dos parâmetros
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "v_proj"],
    lora_alpha=16,
    lora_dropout=0,
)

from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    dataset_text_field="text",
    args=TrainingArguments(
        output_dir="./model-output",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_strategy="epoch",
    ),
)

trainer.train()
model.save_pretrained("./prompt-generator-model")
tokenizer.save_pretrained("./prompt-generator-model")
print("Fine-tuning concluído.")
```

**Tempo estimado:** 200 exemplos × 3 épocas = ~15 minutos no Colab T4.

---

### Tarefa 3.3 — Servir modelo fine-tunado via Ollama

**Por quê:** após o fine-tuning, o modelo precisa ser servido localmente. Ollama suporta modelos GGUF.

```bash
# Converter para GGUF (formato Ollama)
# O fine-tuning gera uma pasta Hugging Face em ./prompt-generator-model.
# Para servir via Ollama, converta para um arquivo GGUF e salve como:
#   ./prompt-generator-model.gguf

# OU usar Ollama com Modelfile
cat > Modelfile << 'EOF'
FROM ./prompt-generator-model.gguf
SYSTEM "Você é um especialista em engenharia de prompts."
EOF

ollama create prompt-generator -f Modelfile
ollama run prompt-generator
```

Atualizar `.env`:
```
AI_PROVIDER=ollama
AI_MODEL=prompt-generator
```

---

### Tarefa 3.4 — Avaliação automática: modelo fine-tunado vs baseline

**Por quê:** precisa confirmar que o fine-tuning melhorou antes de usar em produção.

Arquivo novo: `src/core/eval.ts`

```typescript
import { generatePrompt } from './generator';
import { FeedbackStore } from './store';

/** Compara baseline (llama3.2) vs fine-tunado (prompt-generator) no mesmo objetivo. */
export async function runEval(goals: string[]): Promise<void> {
  for (const goal of goals) {
    const baseline = await generatePrompt(goal);   // AI_MODEL=llama3.2
    // trocar model no env e gerar novamente
    const finetuned = await generatePrompt(goal);  // AI_MODEL=prompt-generator

    console.log(`\nObjetivo: ${goal}`);
    console.log(`\n[Baseline]\n${baseline}`);
    console.log(`\n[Fine-tunado]\n${finetuned}`);
    console.log('\n---');
  }
}
```

Critério de aprovação: avaliação manual de 20 exemplos. Se fine-tunado ganhar em 14+ (70%), usar como padrão.

---

### Entregável da Fase 3

- Modelo Llama 3.2 fine-tunado no seu padrão de uso
- Rodando localmente via Ollama, sem custo
- Avaliação A/B documentada
- Pipeline completo: uso → feedback → dataset → fine-tuning → deploy

---

## Resumo executivo

| Fase | Duração | Pré-requisito | Entregável |
|---|---|---|---|
| 1 | 1 semana | Nenhum | Loop fechado + Ollama + persistência |
| 2 | 2-4 semanas | 20 feedbacks | Geração via IA + reescrita automática |
| 3 | 1-2 semanas | 200 exemplos + GPU | Modelo especializado rodando local |

## Ferramentas gratuitas usadas

| Ferramenta | Uso | Link |
|---|---|---|
| Ollama | Runtime de LLM local | https://ollama.com |
| Llama 3.2 3B | Modelo base de geração | Meta (via Ollama) |
| Unsloth | Fine-tuning eficiente com LoRA | https://github.com/unslothai/unsloth |
| Google Colab | GPU gratuita para fine-tuning | https://colab.research.google.com |
| Hugging Face | Repositório de modelos | https://huggingface.co |

## Próximo passo imediato

Executar **Tarefa 1.1** — adicionar Ollama como provider:
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
```
Depois implementar o `callOllama()` em `src/core/ai.ts`.
