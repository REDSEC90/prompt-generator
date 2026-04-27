import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { runQuestionFlow } from './cli/questions';
import { pickVariation, askExport } from './cli/ui';
import { parseArgs } from './cli/args';
import { VariationGenerator } from './core/variations';
import { TemplateEngine } from './core/engine';
import { sendToAI } from './core/ai';
import { PromptConfig } from './core/types';

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

  const parsed = parseArgs(process.argv);
  const config: Partial<PromptConfig> = (parsed.isComplete && !parsed.forceInteractive)
    ? parsed.config
    : await runQuestionFlow(parsed.config);

  const engine = new TemplateEngine();
  const { errors, warnings } = engine.validate(config as PromptConfig);

  if (errors.length) {
    errors.forEach(e => console.error(chalk.red('✖ ' + e)));
    process.exit(1);
  }
  warnings.forEach(w => console.warn(chalk.yellow('⚠  ' + w)));

  const variations = new VariationGenerator().generate(config as PromptConfig);
  const chosen = await pickVariation(variations, parsed.variation);

  if (parsed.noSend) {
    console.log('\n' + chalk.bold('─── PROMPT GERADO ───') + '\n');
    console.log(chalk.dim(chosen));
    return;
  }

  const response = await sendToAI(chosen);

  if (response) {
    const shouldExport = parsed.autoExport || await askExport();
    if (shouldExport) exportPrompt(chosen, response);
  }
}

main().catch(err => {
  console.error(chalk.red('\nErro fatal: ') + err.message);
  process.exit(1);
});
