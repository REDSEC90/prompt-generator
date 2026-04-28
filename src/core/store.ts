import * as fs from 'fs';
import * as path from 'path';
import { PromptFeedback } from './learning';

const STORE_PATH = path.join(
  process.env.HOME ?? process.cwd(),
  '.prompt-generator',
  'history.json',
);

const MAX_HISTORY = 10_000;

/**
 * FeedbackStore — persiste e carrega o histórico de feedback em disco.
 *
 * Localização: ~/.prompt-generator/history.json
 * O diretório é criado automaticamente na primeira escrita.
 * Mantém no máximo MAX_HISTORY entradas (remove as mais antigas).
 */
export class FeedbackStore {
  /** Caminho completo do arquivo de histórico (exposto para testes). */
  readonly storePath: string = STORE_PATH;

  /** Carrega todo o histórico. Retorna array vazio se o arquivo não existir. */
  load(): PromptFeedback[] {
    if (!fs.existsSync(STORE_PATH)) return [];
    try {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as PromptFeedback[];
    } catch {
      // Arquivo corrompido — começa do zero sem perder o processo.
      return [];
    }
  }

  /** Salva um novo feedback no final do histórico. Mantém no máximo MAX_HISTORY entradas. */
  save(fb: PromptFeedback): void {
    const history = this.load();
    history.push(fb);
    const trimmed = history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history;
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(trimmed, null, 2));
  }

  /** Remove o arquivo de histórico. Usado em testes e reset manual. */
  clear(): void {
    if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
  }

  /** Retorna apenas os feedbacks de uma categoria específica. */
  loadByCategory(category: string): PromptFeedback[] {
    return this.load().filter(fb => fb.config.category === category);
  }

  /** Estatísticas rápidas sem carregar tudo em memória. */
  stats(): { total: number; avgRating: number } {
    const history = this.load();
    if (history.length === 0) return { total: 0, avgRating: 0 };
    const avg = history.reduce((s, fb) => s + fb.rating, 0) / history.length;
    return { total: history.length, avgRating: parseFloat(avg.toFixed(2)) };
  }
}
