import * as fs from 'fs';
import * as path from 'path';
import { PromptConfig } from './types';

function getStorePath(): string {
  return path.join(
    process.env.HOME ?? process.cwd(),
    '.prompt-generator',
    'prompts.json',
  );
}

export interface SavedPrompt {
  name: string;
  prompt: string;
  config: PromptConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * PromptStore — CRUD de prompts nomeados persistidos em disco.
 * Localização: ~/.prompt-generator/prompts.json
 */
export class PromptStore {
  get storePath(): string { return getStorePath(); }

  private load(): Record<string, SavedPrompt> {
    const p = getStorePath();
    if (!fs.existsSync(p)) return {};
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return {};
    }
  }

  private persist(data: Record<string, SavedPrompt>): void {
    const p = getStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }

  /** Salva ou sobrescreve um prompt com o nome dado. */
  save(name: string, prompt: string, config: PromptConfig): SavedPrompt {
    const data = this.load();
    const now = Date.now();
    const entry: SavedPrompt = {
      name,
      prompt,
      config,
      createdAt: data[name]?.createdAt ?? now,
      updatedAt: now,
    };
    data[name] = entry;
    this.persist(data);
    return entry;
  }

  /** Retorna um prompt pelo nome, ou undefined se não existir. */
  get(name: string): SavedPrompt | undefined {
    return this.load()[name];
  }

  /** Lista todos os prompts salvos, ordenados por updatedAt desc. */
  list(): SavedPrompt[] {
    return Object.values(this.load()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Remove um prompt pelo nome. Retorna true se existia. */
  delete(name: string): boolean {
    const data = this.load();
    if (!data[name]) return false;
    delete data[name];
    this.persist(data);
    return true;
  }

  /** Renomeia um prompt. Retorna false se o nome original não existir. */
  rename(oldName: string, newName: string): boolean {
    const data = this.load();
    if (!data[oldName]) return false;
    data[newName] = { ...data[oldName], name: newName, updatedAt: Date.now() };
    delete data[oldName];
    this.persist(data);
    return true;
  }
}
