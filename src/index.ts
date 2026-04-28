import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { runQuestionFlow } from './cli/questions';
import { pickVariation, askExport, askFeedback, runLearningLoop } from './cli/ui';
import { parseArgs } from './cli/args';
import { VariationGenerator } from './core/variations';
import { TemplateEngine } from './core/engine';
import { sendToAI, resolveAIStatus } from './core/ai';
import { PromptConfig } from './core/types';
import { LearningEngine } from './core/learning';
import { FeedbackStore } from './core/store';
import { generatePrompt, rewritePrompt } from './core/generator';
import { PromptStore } from './core/prompt-store';
import { runAutoLoop } from './core/auto-loop';

// Sair limpo no Ctrl+C durante wizard interativo
process.on('SIGINT', () => {
  console.log(chalk.dim('\n\nInterrompido.'));
  process.exit(0);
});

function exportPrompt(prompt: string, response: string): void {
  const dir = path.join(process.cwd(), 'exports');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `prompt-${ts}.md`);
  fs.writeFileSync(file, `# Prompt\n\n${prompt}\n\n---\n\n# Resposta\n\n${response}\n`);
  console.log(chalk.green(`\n✔ Exportado: ${file}`));
}

async function main(): Promise<void> {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('     GERADOR DE PROMPTS INTELIGENTE   ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════╝'));

  const store = new FeedbackStore();
  const history = store.load();

  // ── Mostrar modo de IA e insights do histórico ────────────────────────────
  const aiStatus = await resolveAIStatus();
  const modeColor = aiStatus.mode === 'local' ? chalk.green : aiStatus.mode === 'remote' ? chalk.cyan : chalk.yellow;
  console.log(chalk.dim(`  IA: ${modeColor(aiStatus.mode)} · ${aiStatus.provider}`));
  if (history.length > 0) {
    const { total, avgRating } = store.stats();
    console.log(chalk.dim(`  Histórico: ${total} avaliações  |  média: ${avgRating.toFixed(1)} ★`));
    const insights = new LearningEngine().analyze(history);
    if (insights.length > 0) {
      const top = insights.sort((a, b) => b.avgRating - a.avgRating)[0];
      const conf = top.confidence === 'high' ? chalk.green('alta') :
                   top.confidence === 'medium' ? chalk.yellow('média') : chalk.red('baixa');
      if (top.suggestions.length > 0) {
        console.log(chalk.dim(`  Sugestão  : ${top.suggestions[0]}`) +
                    chalk.dim(` (confiança ${conf})`));
      }
    }
    console.log('');
  }

  const parsed = parseArgs(process.argv);

  // ── CRUD: --list ──────────────────────────────────────────────────────────
  if (parsed.list) {
    const prompts = new PromptStore().list();
    if (prompts.length === 0) {
      console.log(chalk.yellow('\n  Nenhum prompt salvo ainda. Use --save "nome" após gerar.\n'));
    } else {
      console.log(chalk.bold('\n  Prompts salvos:\n'));
      for (const p of prompts) {
        const date = new Date(p.updatedAt).toLocaleDateString('pt-BR');
        console.log(`  ${chalk.cyan(p.name.padEnd(24))} ${chalk.dim(p.config.category.padEnd(14))} ${chalk.dim(date)}`);
      }
      console.log('');
    }
    return;
  }

  // ── CRUD: --delete "nome" ─────────────────────────────────────────────────
  if (parsed.deleteName) {
    const deleted = new PromptStore().delete(parsed.deleteName);
    if (deleted) {
      console.log(chalk.green(`\n✔ Prompt "${parsed.deleteName}" removido.\n`));
    } else {
      console.log(chalk.red(`\n✖ Prompt "${parsed.deleteName}" não encontrado.\n`));
    }
    return;
  }

  // ── CRUD: --load "nome" ───────────────────────────────────────────────────
  if (parsed.load) {
    const saved = new PromptStore().get(parsed.load);
    if (!saved) {
      console.error(chalk.red(`\n✖ Prompt "${parsed.load}" não encontrado. Use --list para ver os disponíveis.\n`));
      process.exit(1);
    }
    console.log(chalk.bold(`\n  Carregando: ${chalk.cyan(saved.name)}\n`));
    console.log(chalk.dim(saved.prompt));
    if (!parsed.noSend) {
      const response = await sendToAI(saved.prompt);
      if (response && (parsed.autoExport || await askExport())) {
        exportPrompt(saved.prompt, response);
      }
    }
    return;
  }

  // ── Modo loop autônomo: --auto ────────────────────────────────────────────
  if (parsed.auto) {
    console.log(chalk.bold.magenta('\n╔══════════════════════════════════════╗'));
    console.log(chalk.bold.magenta('║') + chalk.bold.white('     LOOP AUTÔNOMO INFINITO           ') + chalk.bold.magenta('║'));
    console.log(chalk.bold.magenta('╚══════════════════════════════════════╝'));
    console.log(chalk.dim('  Avaliação por IA (LLM-as-judge). Ctrl+C para parar.\n'));

    await runAutoLoop(
      (stats) => {
        const conv = `${stats.convergedRuns}/${stats.totalRuns}`;
        const bar  = '█'.repeat(Math.round(stats.avgFinalRating)) + '░'.repeat(5 - Math.round(stats.avgFinalRating));
        console.log(
          chalk.bold.magenta(`\n  ── Ciclo ${stats.totalRuns} ──`) +
          chalk.dim(`  convergidos: ${conv}`) +
          chalk.dim(`  rating médio: ${bar} ${stats.avgFinalRating}`) +
          chalk.dim(`  iterações: ${stats.totalIterations}`)
        );
        if (stats.bestRating >= 4) {
          console.log(chalk.dim(`  melhor até agora: ${stats.bestRating}★  "${stats.bestGoal.slice(0, 50)}"`));
        }
      },
      parsed.autoMax,
      parsed.autoTarget,
    );

    const finalStore = new FeedbackStore();
    const { total, avgRating } = finalStore.stats();
    console.log(chalk.bold.green(`\n✔ Loop encerrado. ${total} prompts no histórico | média: ${avgRating.toFixed(1)} ★\n`));
    return;
  }

  // ── Modo loop de aprendizado: --loop "objetivo" ───────────────────────────
  if (parsed.loop) {
    await runLearningLoop(parsed.loop, parsed.loopMax, parsed.loopTarget);
    return;
  }

  // ── Modo IA generativa: --ai-generate "objetivo" ──────────────────────────
  if (parsed.aiGenerate) {
    console.log(chalk.dim('  Modo: IA generativa (meta-prompt + few-shot)\n'));
    const prompt = await generatePrompt(parsed.aiGenerate, history);
    if (!prompt) return;

    if (parsed.noSend) {
      console.log('\n' + chalk.bold('─── PROMPT GERADO PELA IA ───') + '\n');
      console.log(chalk.dim(prompt));
      return;
    }

    const response = await sendToAI(prompt);
    if (response && (parsed.autoExport || await askExport())) {
      exportPrompt(prompt, response);
    }

    // Feedback com config mínimo derivado do objetivo
    const minConfig: PromptConfig = {
      action: 'gerar', theme: parsed.aiGenerate,
      format: 'markdown', audience: '-', objective: parsed.aiGenerate,
      tone: 'technical', category: 'analysis',
    };
    const fb = await askFeedback(minConfig, prompt, 'direct');
    if (fb.rating <= 2 && fb.failureReason) {
      console.log(chalk.dim('\n⏳ Reescrevendo prompt…'));
      try {
        const rewritten = await rewritePrompt(prompt, fb.failureReason);
        if (rewritten) {
          console.log('\n' + chalk.bold.yellow('─── PROMPT REESCRITO ───') + '\n');
          console.log(chalk.dim(rewritten));
          if (await askExport()) exportPrompt(rewritten, '');
        }
      } catch { /* modo offline — não bloqueia */ }
    }
    return;
  }

  // ── Modo wizard (templates) ───────────────────────────────────────────────
  const suggestedPatch = history.length >= 2
    ? new LearningEngine().suggest({ category: 'analysis', ...parsed.config } as PromptConfig, history)
    : {};

  const baseConfig: Partial<PromptConfig> = { ...suggestedPatch, ...parsed.config };
  const config: Partial<PromptConfig> = (parsed.isComplete && !parsed.forceInteractive)
    ? baseConfig
    : await runQuestionFlow(baseConfig);

  const engine = new TemplateEngine();
  const { errors, warnings } = engine.validate(config as PromptConfig);
  if (errors.length) {
    errors.forEach(e => console.error(chalk.red('✖ ' + e)));
    process.exit(1);
  }
  warnings.forEach(w => console.warn(chalk.yellow('⚠  ' + w)));

  const variations = new VariationGenerator().generate(config as PromptConfig);
  const chosen = await pickVariation(variations, parsed.variation);
  const chosenKey: 'direct' | 'contextual' | 'chainOfThought' =
    chosen === variations.direct     ? 'direct' :
    chosen === variations.contextual ? 'contextual' : 'chainOfThought';

  if (parsed.noSend) {
    console.log('\n' + chalk.bold('─── PROMPT GERADO ───') + '\n');
    console.log(chalk.dim(chosen));
    return;
  }

  const response = await sendToAI(chosen);
  if (response && (parsed.autoExport || await askExport())) {
    exportPrompt(chosen, response);
  }

  // ── CRUD: --save "nome" ───────────────────────────────────────────────────
  if (parsed.save) {
    new PromptStore().save(parsed.save, chosen, config as PromptConfig);
    console.log(chalk.green(`\n✔ Prompt salvo como "${parsed.save}". Use --load "${parsed.save}" para reutilizar.\n`));
  }

  const fb = await askFeedback(config as PromptConfig, chosen, chosenKey);
  if (fb.rating <= 2 && fb.failureReason) {
    console.log(chalk.dim('\n⏳ Reescrevendo prompt com base no feedback…'));
    try {
      const rewritten = await rewritePrompt(chosen, fb.failureReason);
      if (rewritten) {
        console.log('\n' + chalk.bold.yellow('─── PROMPT REESCRITO ───') + '\n');
        console.log(chalk.dim(rewritten));
        if (await askExport()) exportPrompt(rewritten, '');
      }
    } catch { /* modo offline — não bloqueia */ }
  }
}

main().catch(err => {
  console.error(chalk.red('\nErro fatal: ') + err.message);
  process.exit(1);
});
