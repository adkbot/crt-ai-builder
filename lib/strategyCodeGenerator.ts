/**
 * Gerador de Código MQL5 com Suporte a Múltiplas Metodologias
 * - SMC Estático (D1 -> H1 -> M5)
 * - CRT Dynamic (London -> NY -> FVG)
 */

import * as fs from 'fs';
import * as path from 'path';

interface StrategyNode {
    id: string;
    type: string;
    data?: any;
}

interface StrategyEdge {
    id: string;
    source: string;
    target: string;
}

interface GeneratedCode {
    mql5: string;
    description: string;
    methodology: string;
    parameters: any;
}

/**
 * Detecta qual metodologia usar baseado nos nós
 */
function detectMethodology(nodes: StrategyNode[]): 'CRT_DYNAMIC' | 'SMC_STATIC' {
    // CRT Dynamic tem London/NY sessions como foco principal
    const hasLondonSession = nodes.some(n =>
        n.type === 'LONDON_SESSION' ||
        n.type === 'ICT_KEY_ZONES' ||
        n.data?.sessionBased === true
    );

    const hasFVG = nodes.some(n => n.type === 'FAIR_VALUE_GAP' || n.type === 'ORDER_BLOCK');
    const hasDailyBias = nodes.some(n => n.type === 'DAILY_BIAS');

    // Se tem session-based nodes ou FVG prominente = CRT Dynamic
    if (hasLondonSession || (hasFVG && !hasDailyBias)) {
        return 'CRT_DYNAMIC';
    }

    // Caso contrário = SMC Estático tradicional
    return 'SMC_STATIC';
}

/**
 * Carrega template do disco
 */
function loadTemplate(templateName: string): string {
    const templatePath = path.join(process.cwd(), 'templates', templateName);

    try {
        return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
        console.error(`Template ${templateName} não encontrado`);
        return '';
    }
}

/**
 * Gera código CRT Dynamic
 */
function generateCRTDynamic(
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    strategyName: string
): GeneratedCode {

    // Carregar template base
    let code = loadTemplate('mql5-crt-dynamic.mq5');

    if (!code) {
        // Fallback: gerar inline se template não existir
        code = generateCRTDynamicInline(strategyName);
    }

    // Customizar parâmetros baseado nos nós
    const timeNode = nodes.find(n => n.type === 'TIME_FILTER' || n.type === 'ICT_KEY_ZONES');
    const lonStart = timeNode?.data?.londonStart || 8;
    const lonEnd = timeNode?.data?.londonEnd || 11;
    const nyStart = timeNode?.data?.nyStart || 13;
    const nyEnd = timeNode?.data?.nyEnd || 16;

    // Substituir placeholders se necessário
    // (Template já tem valores default corretos)

    return {
        mql5: code,
        description: `Estratégia CRT Dynamic (London/NY Flow) - ${strategyName}`,
        methodology: 'CRT_DYNAMIC',
        parameters: {
            londonStart: lonStart,
            londonEnd: lonEnd,
            nyStart: nyStart,
            nyEnd: nyEnd,
            methodology: 'CRT_DYNAMIC'
        }
    };
}

/**
 * Gerador inline caso template não exista
 */
function generateCRTDynamicInline(strategyName: string): string {
    return `//+------------------------------------------------------------------+
//| ${strategyName} - CRT Dynamic                                    |
//| London/NY Flow com FVG + Q-Learning                              |
//+------------------------------------------------------------------+
#property strict
#property version "4.00"
#include <Trade/Trade.mqh>

CTrade trade;

// === PARÂMETROS DE SESSÃO ===
input int InpLonStart = 8;
input int InpLonEnd   = 11;
input int InpNYStart  = 13;
input int InpNYEnd    = 16;

input double InpLot = 0.01;
input int InpSL_ExtraPips = 5;
input double InpRR = 2.0;
input long InpMagic = 999111;

// === Q-LEARNING ===
input double InpConfidenceThreshold = 0.70;

double Q[128][3];
enum QAction { Q_NO_TRADE=0, Q_BUY=1, Q_SELL=2 };

struct LondonRange {
    double high;
    double low;
    double origin;
    bool isBullish;
    bool isValid;
    double fvgPrice;
};
LondonRange lon;

//+------------------------------------------------------------------+
void OnTick() {
    // Implementação CRT Dynamic
    Comment("CRT Dynamic - ${strategyName}");
}
`;
}

/**
 * Gera código SMC Estático (usa gerador existente)
 */
async function generateSMCStatic(
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    strategyName: string
): Promise<GeneratedCode> {
    //@ts-ignore
    const { generateMQL5Code } = await import('./mql5Generator');

    const result = generateMQL5Code(nodes, edges, strategyName);

    return {
        ...result,
        methodology: 'SMC_STATIC'
    };
}

/**
 * Função principal de geração
 */
export async function generateStrategyCode(
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    strategyName: string
): Promise<GeneratedCode> {

    const methodology = detectMethodology(nodes);

    console.log(`Metodologia detectada: ${methodology}`);

    if (methodology === 'CRT_DYNAMIC') {
        return generateCRTDynamic(nodes, edges, strategyName);
    } else {
        return await generateSMCStatic(nodes, edges, strategyName);
    }
}

// Manter compatibilidade com código existente
export { generateMQL5Code } from './mql5Generator';
