"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const store_1 = require("../src/core/store");
const STORE_PATH = path.join(process.env.HOME ?? process.cwd(), '.prompt-generator', 'history.json');
const FB = {
    config: {
        action: 'Analise', theme: 'Node.js', format: 'markdown',
        audience: 'dev', objective: 'aprender', tone: 'technical', category: 'code',
    },
    generatedPrompt: 'prompt de teste',
    rating: 4,
    usedVariation: 'direct',
    timestamp: 1000,
};
describe('FeedbackStore', () => {
    let store;
    beforeEach(() => {
        store = new store_1.FeedbackStore();
        store.clear();
    });
    afterAll(() => store.clear());
    it('load retorna [] quando arquivo não existe', () => {
        expect(store.load()).toEqual([]);
    });
    it('save persiste e load recupera', () => {
        store.save(FB);
        const loaded = store.load();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].generatedPrompt).toBe('prompt de teste');
    });
    it('save acumula múltiplos feedbacks', () => {
        store.save(FB);
        store.save({ ...FB, rating: 2 });
        expect(store.load()).toHaveLength(2);
    });
    it('clear remove o arquivo', () => {
        store.save(FB);
        store.clear();
        expect(store.load()).toEqual([]);
    });
    it('stats retorna total e avgRating corretos', () => {
        store.save({ ...FB, rating: 4 });
        store.save({ ...FB, rating: 2 });
        const { total, avgRating } = store.stats();
        expect(total).toBe(2);
        expect(avgRating).toBe(3);
    });
    it('stats retorna zeros para histórico vazio', () => {
        expect(store.stats()).toEqual({ total: 0, avgRating: 0 });
    });
    it('loadByCategory filtra por categoria', () => {
        store.save(FB); // code
        store.save({ ...FB, config: { ...FB.config, category: 'summary' } });
        expect(store.loadByCategory('code')).toHaveLength(1);
        expect(store.loadByCategory('summary')).toHaveLength(1);
        expect(store.loadByCategory('marketing')).toHaveLength(0);
    });
    it('load retorna [] para arquivo corrompido', () => {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, 'não é json');
        expect(store.load()).toEqual([]);
    });
});
