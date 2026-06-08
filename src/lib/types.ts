// Доменные типы PrintProof. Все span'ы — в координатах immutable-текста одной ревизии.

export type EditCategory = 'spelling' | 'punctuation' | 'typography' | 'style';
export type EditSeverity = 'normal' | 'important';
export type EditDecision = 'pending' | 'accepted' | 'rejected';
export type SourceModule = 'rule-pass' | 'llm-pass' | 'vision-pass' | 'profile';

export interface Edit {
  id?: number;
  orderId: number;
  spanStart: number; // offset в тексте base-ревизии
  spanEnd: number;
  baseRevision: number;
  original: string;
  suggested: string;
  contextBefore: string;
  contextAfter: string;
  category: EditCategory;
  severity: EditSeverity;
  confidence: number; // 0..1
  reason: string;
  sourceModule: SourceModule;
  decision: EditDecision;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export interface LayoutIssue {
  id?: number;
  orderId: number;
  page: number;
  blockHint: string;
  description: string;
  category: string;
  severity: EditSeverity;
  confidence: number;
  decision: EditDecision;
  /** Нормализованный bounding box (0–1000 по обеим осям), null если модель не уверена в координатах */
  bbox?: { x: number; y: number; w: number; h: number } | null;
  /** Точный фрагмент текста для snap-to-text уточнения bbox по геометрии PDF */
  anchorText?: string | null;
}

export interface ClientProfile {
  id?: number;
  name: string;
  rules: ProfileRules;
  notes?: string;
}

export interface StyleExample {
  before: string; // как было
  after: string; // как нравится клиенту
  note?: string; // чему учит пример
}

export interface ProfileRules {
  enforceYo?: boolean; // ё обязательна
  quotes?: 'guillemets' | 'straight'; // кавычки-ёлочки
  brandDictionary?: Record<string, string>; // неверное → верное написание (детерминированно, rule-pass)
  stylePrompt?: string; // стилевые указания для llm-pass («тон дружелюбный, без канцелярита…»)
  examples?: StyleExample[]; // few-shot примеры правок для llm-pass
  autoAccept?: boolean; // авто-принятие безопасных правок (rule-pass/profile, не «важные»)
  autoAcceptThreshold?: number; // порог уверенности, по умолчанию 0.97
}

export type OrderStatus = 'uploaded' | 'estimated' | 'queued' | 'checking' | 'review' | 'done' | 'error';
export type OrderType = 'text' | 'layout' | 'pdf';

export interface Estimate {
  chars: number;
  etaMinutes: number;
  priceEur: number;
  /** Прозрачная разбивка: как посчитана цена */
  breakdown?: {
    model: string; // модель llm/vision-pass
    inputTokens: number; // оценка входных токенов (текст + системный промпт [+ изображение])
    outputTokens: number; // оценка выходных токенов (JSON правок)
    tokenCostEur: number; // себестоимость токенов по тарифу модели
    modelPriceInUsdPerMTok: number;
    modelPriceOutUsdPerMTok: number;
    tariffEur: number; // тариф клиенту: 0.50 € / 1000 знаков (мин. 0.60) + 0.80 € за страницу макета
    formula: string; // словами, как сложилась цена
  };
}

export interface Order {
  id?: number;
  filename: string;
  type: OrderType;
  status: OrderStatus;
  estimate?: Estimate | null;
  clientProfileId?: number | null;
  textHash?: string | null;
  documentRevision: number;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Кандидат правки от какого-либо pass'а — до resolver'а, без orderId
export type EditCandidate = Omit<Edit, 'orderId' | 'decision' | 'id'>;
