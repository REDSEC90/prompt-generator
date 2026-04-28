import chalk from 'chalk';
import { generateAndJudge } from './judge';
import { FeedbackStore } from './store';
import { PromptFeedback, FailureReason } from './learning';
import { PromptConfig } from './types';

const SEED_GOALS = [
  'criar endpoint REST com autenticação JWT em Node.js',
  'resumir artigo técnico sobre microserviços para devs júnior',
  'escrever copy de email marketing para lançamento de SaaS',
  'gerar 10 ideias de negócio no nicho de ferramentas para desenvolvedores',
  'traduzir documentação técnica de inglês para português mantendo termos técnicos',
  'criar testes unitários para função de validação de CPF em TypeScript',
  'analisar prós e contras de arquitetura monolítica vs microsserviços',
  'escrever conto de ficção científica de 300 palavras sobre IA consciente',
  'criar perguntas de entrevista técnica para engenheiro backend sênior',
  'gerar plano de marketing de conteúdo para blog de programação',
];

export interface AutoLoopStats {
  totalRuns: number;
  totalIterations: number;
  convergedRuns: number;
  avgFinalRating: number;
  bestPrompt: string;
  bestRating: number;
  bestGoal: string;
}

function makeConfig(goal: string): PromptConfig {
  return { action: 'gerar', theme: goal, format: 'markdown', audience: '-', objective: goal, tone: 'technical', category: 'analysis' };
}

/**
 * Loop autônomo infinito com 1 chamada por iteração (gera + avalia combinados).
 * Para no SIGINT (Ctrl+C).
 */
export async function runAutoLoop(
  onCycle: (stats: AutoLoopStats) => void,
  maxIter = 4,
  target: 1|2|3|4|5 = 4,
): Promise<void> {
  const stats: AutoLoopStats = {
    totalRuns: 0, totalIterations: 0, convergedRuns: 0,
    avgFinalRating: 0, bestPrompt: '', bestRating: 0, bestGoal: '',
  };

  let running = true;
  process.once('SIGINT', () => { running = false; });

  const store = new FeedbackStore();
  let goalIndex = 0;

  while (running) {
    const history = store.load();

    // Objetivos aprendidos do histórico (bem avaliados)
    const learnedGoals = [...new Set(
      history.filter(fb => fb.rating >= 4).slice(-20).map(fb => fb.config.objective).filter(Boolean)
    )];
    const allGoals = [...SEED_GOALS, ...learnedGoals];
    const goal = allGoals[goalIndex % allGoals.length];
    goalIndex++;

    console.log(chalk.dim(`\n  ▶ Ciclo ${stats.totalRuns + 1} — "${goal.slice(0, 60)}"`));

    let currentPrompt: string | undefined;
    let lastReason: FailureReason | undefined;
    let finalRating: 1|2|3|4|5 = 3;
    let converged = false;
    let iterCount = 0;

    for (let i = 1; i <= maxIter && running; i++) {
      iterCount++;
      process.stdout.write(chalk.dim(`    iter ${i}/${maxIter} — chamando IA…`));

      const result = await generateAndJudge(goal, currentPrompt, lastReason);

      // Usa o prompt gerado pela IA combinada, ou mantém o anterior se não gerou
      if (result.generatedPrompt) currentPrompt = result.generatedPrompt;

      const stars = '★'.repeat(result.rating) + '☆'.repeat(5 - result.rating);
      process.stdout.write(`\r    iter ${i}/${maxIter}  ${stars}  ${chalk.dim(result.critique)}\n`);

      // Persiste no histórico
      if (currentPrompt) {
        store.save({
          config: makeConfig(goal),
          generatedPrompt: currentPrompt,
          rating: result.rating,
          usedVariation: 'direct',
          failureReason: result.failureReason,
          timestamp: Date.now(),
        } as PromptFeedback);
      }

      finalRating = result.rating;
      lastReason  = result.failureReason;

      if (result.rating >= target) {
        converged = true;
        break;
      }
    }

    // Atualiza stats
    stats.totalRuns++;
    stats.totalIterations += iterCount;
    if (converged) stats.convergedRuns++;
    const safeRating = Number.isFinite(finalRating) ? finalRating : 3;
    stats.avgFinalRating = parseFloat(
      ((stats.avgFinalRating * (stats.totalRuns - 1) + safeRating) / stats.totalRuns).toFixed(2)
    );
    if (finalRating > stats.bestRating && currentPrompt) {
      stats.bestRating = finalRating;
      stats.bestPrompt = currentPrompt;
      stats.bestGoal   = goal;
    }

    onCycle(stats);
    if (running) await new Promise(r => setTimeout(r, 200));
  }
}
