/**
 * Catálogo de Nós com Badges de Metodologia
 */

export type NodeType =
  | "TIME_FILTER"
  | "MA"
  | "CROSS_UP"
  | "CROSS_DOWN"
  | "AND"
  | "Q_AGENT"
  | "BUY_MARKET"
  | "SELL_MARKET"
  | "CRT_SETUP"
  | "SMC_SILVERBULLET"
  | "DAILY_BIAS"
  | "ICT_KEY_ZONES"
  | "FIBONACCI_ZONES"
  | "SMC_ORDER_BLOCK"
  | "FAIR_VALUE_GAP"
  | "SMC_LIQUIDITY"
  | "JUDAS_SWING";

export type MethodologyBadge = "CRT" | "SMC" | "BOTH" | "REQUIRED" | null;

export type CatalogItem = {
  type: NodeType;
  title: string;
  group: "Contexto" | "Indicadores" | "Lógica" | "IA" | "Execução" | "Templates" | "SMC" | "CRT";
  description: string;
  defaults?: Record<string, any>;
  badge?: MethodologyBadge;  // ✅ NOVO: Badge de metodologia
  badgeColor?: string;        // ✅ NOVO: Cor do badge
};

export const NODE_CATALOG: CatalogItem[] = [
  // === CONTEXTO ===
  {
    type: "TIME_FILTER",
    title: "Filtro de Tempo",
    group: "Contexto",
    description: "Só permite operar dentro de um horário.",
    defaults: { start: "10:00", end: "11:00", tz: "NewYork" },
    badge: "BOTH",
    badgeColor: "#6366f1"
  },

  // === INDICADORES ===
  {
    type: "MA",
    title: "Média Móvel",
    group: "Indicadores",
    description: "Retorna valor da MA (SMA/EMA).",
    defaults: { period: 20, method: "SMA", price: "CLOSE" }
  },

  // === LÓGICA ===
  {
    type: "CROSS_UP",
    title: "Cruzamento UP",
    group: "Lógica",
    description: "A cruza acima de B."
  },
  {
    type: "CROSS_DOWN",
    title: "Cruzamento DOWN",
    group: "Lógica",
    description: "A cruza abaixo de B."
  },
  {
    type: "AND",
    title: "AND Gate",
    group: "Lógica",
    description: "TRUE se todas entradas forem TRUE."
  },

  // === IA (OBRIGATÓRIO) ===
  {
    type: "Q_AGENT",
    title: "Q-Agent (IA)",
    group: "IA",
    description: "🧠 Inteligência Artificial que decide BUY/SELL/NO_TRADE. OBRIGATÓRIO!",
    defaults: { alpha: 0.1, gamma: 0.95, epsilon: 0.2, enable: true },
    badge: "REQUIRED",
    badgeColor: "#ef4444"
  },

  // === EXECUÇÃO ===
  {
    type: "BUY_MARKET",
    title: "Compra (Market)",
    group: "Execução",
    description: "Executa buy a mercado.",
    defaults: { lot: 0.01, slPips: 30, rr: 2 }
  },
  {
    type: "SELL_MARKET",
    title: "Venda (Market)",
    group: "Execução",
    description: "Executa sell a mercado.",
    defaults: { lot: 0.01, slPips: 30, rr: 2 }
  },

  // === CRT DYNAMIC ===
  {
    type: "ICT_KEY_ZONES",
    title: "London/NY Sessions",
    group: "CRT",
    description: "🟢 CRT: Session boxes (Londres 3h + NY 3h). Dinâmico!",
    defaults: {
      sessions: ["London", "NewYork"],
      londonStart: 8,
      londonEnd: 11,
      nyStart: 13,
      nyEnd: 16,
      sessionBased: true
    },
    badge: "CRT",
    badgeColor: "#10b981"
  },
  {
    type: "FAIR_VALUE_GAP",
    title: "Fair Value Gap (FVG)",
    group: "CRT",
    description: "🟢 CRT: Detecta gaps de preço (imã de retração).",
    defaults: { minPips: 10, methodology: 'CRT_DYNAMIC' },
    badge: "CRT",
    badgeColor: "#10b981"
  },

  // === SMC STATIC ===
  {
    type: "DAILY_BIAS",
    title: "Daily Bias (D1)",
    group: "SMC",
    description: "🔵 SMC: Determina direção do dia (D1). Static!",
    defaults: { timeframe: "D1", method: "Candle Color Reversal" },
    badge: "SMC",
    badgeColor: "#3b82f6"
  },
  {
    type: "SMC_ORDER_BLOCK",
    title: "Order Blocks",
    group: "SMC",
    description: "🔵 SMC: Identifica Order Blocks (zonas de liquidez institucionais).",
    defaults: { lookback: 20 },
    badge: "SMC",
    badgeColor: "#3b82f6"
  },
  {
    type: "JUDAS_SWING",
    title: "Judas Swing",
    group: "SMC",
    description: "🔵 SMC: Detecta fake moves (false breakouts).",
    defaults: { detectFakeMove: true },
    badge: "SMC",
    badgeColor: "#3b82f6"
  },
  {
    type: "SMC_LIQUIDITY",
    title: "Liquidity Sweep",
    group: "SMC",
    description: "🔵 SMC: Detecta varredura de liquidez (stop hunts).",
    defaults: { sweepPips: 30 },
    badge: "SMC",
    badgeColor: "#3b82f6"
  },

  // === AMBOS (CRT + SMC) ===
  {
    type: "FIBONACCI_ZONES",
    title: "Premium/Discount",
    group: "SMC",
    description: "🟣 AMBOS: Fibonacci zones (Premium >61.8%, Discount <38.2%).",
    defaults: { premium: 0.618, discount: 0.382 },
    badge: "BOTH",
    badgeColor: "#8b5cf6"
  },

  // === TEMPLATES (Legado) ===
  {
    type: "CRT_SETUP",
    title: "CRT Setup (Template)",
    group: "Templates",
    description: "Template CRT. Use nós específicos para melhor controle.",
    defaults: { tf: "M15" },
    badge: "CRT",
    badgeColor: "#10b981"
  },
  {
    type: "SMC_SILVERBULLET",
    title: "Silver Bullet (Template)",
    group: "Templates",
    description: "Template SMC Silver Bullet (Sweep→MSS→FVG→Entry).",
    defaults: { rr: 2, sweepMaxPips: 30 },
    badge: "SMC",
    badgeColor: "#3b82f6"
  }
];

/**
 * Helper para obter badge info
 */
export function getBadgeInfo(badge: MethodologyBadge): { text: string; color: string } | null {
  switch (badge) {
    case "CRT":
      return { text: "CRT Only", color: "#10b981" };
    case "SMC":
      return { text: "SMC Only", color: "#3b82f6" };
    case "BOTH":
      return { text: "CRT + SMC", color: "#8b5cf6" };
    case "REQUIRED":
      return { text: "OBRIGATÓRIO", color: "#ef4444" };
    default:
      return null;
  }
}
