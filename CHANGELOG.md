# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.5.0] - 2026-04-28

### Adicionado

- **Sistema de Treinamento Automatizado** (`AutoTrainer`)
  - Loop de treinamento com inputs diversificados
  - 13 cenários pré-configurados cobrindo 8 categorias
  - Avaliação automática de respostas (1-5 stars)
  - Detecção automática de motivos de falha
  - Métricas agregadas e relatórios detalhados
  - Seleção inteligente de variações baseada em histórico
  - Balanceamento automático de categorias (round-robin + shuffle)

- **Sistema de Treinamento Adaptativo** (`AdaptiveTrainingOrchestrator`)
  - Estratégia: Reforço de categorias fracas
  - Estratégia: Exploração de variações subutilizadas
  - Estratégia: Intensificação de sucessos
  - Checkpoints periódicos com ajustes automáticos
  - Otimização contínua baseada em métricas

- **Novos comandos CLI**
  - `npm run train [iterations] [delay]` — treinamento básico
  - `npm run train:adaptive [iterations]` — treinamento adaptativo

- **Documentação**
  - `docs/auto-training.md` — guia completo do sistema de treinamento
  - Exemplos de uso e troubleshooting
  - Arquitetura e fluxo de dados

- **Testes**
  - Suite completa para `AutoTrainer`
  - Cobertura de avaliação automática
  - Testes de seleção de variações

### Melhorado

- `LearningEngine` agora é usado ativamente durante treinamento
- `FeedbackStore` otimizado para queries por categoria
- Relatórios de métricas mais detalhados e visuais

### Documentação

- README atualizado com v1.5 no roadmap
- Scripts disponíveis incluem comandos de treinamento
- Adicionado `demo-training.sh` para demonstração

## [1.4.0] - 2026-04-XX

### Adicionado

- CRUD de prompts salvos (`PromptStore`)
- Comandos `--save`, `--load`, `--list`, `--delete`
- Armazenamento em `~/.prompt-generator/prompts.json`

## [1.3.0] - 2026-04-XX

### Adicionado

- Modo IA generativa (`--ai-generate`)
- Meta-prompt com few-shot dinâmico
- Reescrita automática de prompts ruins
- Exportação de dataset JSONL (Alpaca)
- Fine-tuning local (Unsloth + LoRA)
- Avaliação A/B baseline vs fine-tunado

## [1.2.0] - 2026-04-XX

### Adicionado

- Sistema de aprendizado contínuo (`LearningEngine`)
- Coleta de feedback estruturado
- Persistência de histórico
- Insights e sugestões automáticas

## [1.1.0] - 2026-04-XX

### Adicionado

- Suporte a Ollama local
- Suporte a Anthropic (Claude)
- Suporte a OpenAI (GPT-4o)
- Modo auto (fallback inteligente)
- Retry com backoff exponencial

## [1.0.0] - 2026-04-XX

### Adicionado

- Wizard interativo com 12 campos
- Uso completo por flags
- 3 variações de prompt (direct / contextual / CoT)
- Role prompting por categoria
- 8 categorias de prompts
- Exportação para Markdown
- 122 testes unitários (94% cobertura)
