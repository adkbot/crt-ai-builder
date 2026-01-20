import OpenAI from 'openai';

// Inicializar OpenAI (chave vem de variável de ambiente)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Analisa transcrição e extrai EXATAMENTE a estratégia ensinada
 * @param transcript - Texto completo da transcrição do vídeo
 * @returns Estratégia estruturada em JSON
 */
export async function analyzeStrategyWithAI(transcript: string): Promise<any> {

    const systemPrompt = `Você é um especialista em trading que analisa vídeos do YouTube e extrai EXATAMENTE a estratégia ensinada.

REGRAS FUNDAMENTAIS:
1. Extrair SOMENTE o que está NO VÍDEO
2. NÃO adicionar nada extra
3. NÃO inventar conceitos não mencionados
4. NÃO sugerir melhorias
5. Apenas DOCUMENTAR fielmente o que foi ensinado

Se o vídeo menciona "Daily Bias", extraia isso.
Se menciona "ICT Key Zones", extraia isso.
Se menciona horários específicos, extraia exatamente.

IMPORTANTE: Retorne APENAS o que foi EXPLICITAMENTE mencionado no vídeo.`;

    const userPrompt = `Analise esta transcrição de vídeo do YouTube e extraia a estratégia de trading ensinada:

TRANSCRIÇÃO:
${transcript}

Retorne um JSON com esta estrutura EXATA:
{
  "strategyName": "Nome exato mencionado no vídeo",
  "strategyType": "SMC" | "ICT" | "PRICE_ACTION" | "CONTINUATION" | "REVERSAL",
  "methodology": "Explicação da metodologia principal",
  "timeframes": {
    "analysis": "D1" | "H4" | "H1",
    "entry": "H1" | "M15" | "M5" | "M1"
  },
  "sessionTimes": {
    "start": "HH:MM",
    "end": "HH:MM", 
    "timezone": "NewYork" | "London" | "Tokyo",
    "mentioned": true | false
  },
  "keyElements": [
    "Elemento 1 mencionado",
    "Elemento 2 mencionado"
  ],
  "entryRules": [
    "Regra 1 EXATA do vídeo",
    "Regra 2 EXATA do vídeo"
  ],
  "exitRules": {
    "stopLoss": "Descrição exata",
    "takeProfit": "Descrição exata",
    "riskReward": "Ratio mencionado (ex: 2:1, 3:1)"
  },
  "indicators": [],
  "priceActionConcepts": [
    "Daily Bias",
    "Order Blocks",
    "FVG",
    "Liquidity Sweep",
    "ICT Key Zones",
    "Judas Swing",
    "Premium/Discount",
    "etc - APENAS os mencionados"
  ],
  "specialNotes": [
    "Nota importante 1",
    "Nota importante 2"
  ]
}

RETORNE APENAS O JSON VÁLIDO, SEM TEXTO ADICIONAL.`;

    try {
        console.log('🤖 Analisando estratégia com GPT-4...');

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Modelo mais recente e preciso
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }, // Força resposta em JSON
            temperature: 0.1, // Baixíssima temperatura = máxima precisão
            max_tokens: 2000
        });

        const content = response.choices[0].message.content;

        if (!content) {
            throw new Error('GPT-4 não retornou conteúdo');
        }

        const strategy = JSON.parse(content);

        console.log('✅ Estratégia extraída:', strategy.strategyName);

        return strategy;

    } catch (error: any) {
        console.error('Erro ao analisar com GPT-4:', error);
        throw new Error(`Falha na análise com IA: ${error.message}`);
    }
}

/**
 * Gera nós do editor baseado EXATAMENTE na estratégia extraída
 */
export function generateNodesFromStrategy(strategy: any): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    const id = () => Math.random().toString(16).slice(2, 10);

    let xPos = 100;
    const yPos = 200;
    const xGap = 280;

    let lastNodeId: string | null = null;

    // Helper para adicionar nó e conectar ao anterior
    const addNode = (type: string, data: any) => {
        const nodeId = id();
        nodes.push({
            id: nodeId,
            type,
            data,
            position: { x: xPos, y: yPos }
        });

        if (lastNodeId) {
            edges.push({
                id: id(),
                source: lastNodeId,
                target: nodeId
            });
        }

        lastNodeId = nodeId;
        xPos += xGap;
    };

    // 1. TIME FILTER (se horário foi mencionado)
    if (strategy.sessionTimes?.mentioned) {
        addNode("TIME_FILTER", {
            start: strategy.sessionTimes.start,
            end: strategy.sessionTimes.end,
            tz: strategy.sessionTimes.timezone
        });
    }

    // 2. PRICE ACTION ELEMENTS baseado nos conceitos mencionados
    const concepts = strategy.priceActionConcepts || [];

    // Detectar se é CRT Dynamic (London/NY Flow)
    const isCRTDynamic = concepts.some((c: string) =>
        c.toLowerCase().includes('london') ||
        c.toLowerCase().includes('new york') ||
        c.toLowerCase().includes('ny session') ||
        c.toLowerCase().includes('session') ||
        c.toLowerCase().includes('3h box') ||
        c.toLowerCase().includes('fvg') ||
        c.toLowerCase().includes('fair value gap')
    );

    // ICT Key Zones (K2 BOXES) - OBRIGATÓRIO no CRT Dynamic!
    if (isCRTDynamic || concepts.some((c: string) => c.toLowerCase().includes('ict') ||
        c.toLowerCase().includes('key zones'))) {
        addNode("ICT_KEY_ZONES", {
            sessions: ["London", "NewYork"],
            londonStart: 8,
            londonEnd: 11,
            nyStart: 13,
            nyEnd: 16,
            sessionBased: isCRTDynamic  // Flag para detecção de metodologia
        });
    }

    // Daily Bias / Continuation Direction (mais comum em SMC Static)
    if (!isCRTDynamic && (concepts.some((c: string) => c.toLowerCase().includes('daily bias') ||
        c.toLowerCase().includes('continuation')))) {
        addNode("DAILY_BIAS", {
            timeframe: strategy.timeframes.analysis,
            method: "Candle Color Reversal"
        });
    }

    // Judas Swing
    if (concepts.some((c: string) => c.toLowerCase().includes('judas'))) {
        addNode("JUDAS_SWING", {
            detectFakeMove: true
        });
    }

    // Premium/Discount (Fibonacci) - SEMPRE gera!
    // (Grace FX usa em ambas metodologias)
    addNode("FIBONACCI_ZONES", {
        premium: 0.618,
        discount: 0.382
    });

    // Order Blocks
    if (concepts.some((c: string) => c.toLowerCase().includes('order block') ||
        c.toLowerCase().includes('ob'))) {
        addNode("SMC_ORDER_BLOCK", {
            lookback: 20
        });
    }

    // FVG (Fair Value Gap)
    if (concepts.some((c: string) => c.toLowerCase().includes('fvg') ||
        c.toLowerCase().includes('fair value gap'))) {
        addNode("FAIR_VALUE_GAP", {
            minPips: 10,
            methodology: isCRTDynamic ? 'CRT_DYNAMIC' : 'SMC_STATIC'
        });
    }

    // Liquidity Sweep
    if (concepts.some((c: string) => c.toLowerCase().includes('liquidity') ||
        c.toLowerCase().includes('sweep'))) {
        addNode("SMC_LIQUIDITY", {
            sweepPips: 30
        });
    }

    // Se NENHUM conceito específico, usar SMC genérico
    if (nodes.length === 0 || (nodes.length === 1 && nodes[0].type === "TIME_FILTER")) {
        // Gera K2 Boxes + SMC básico
        addNode("ICT_KEY_ZONES", {
            sessions: ["London", "NewYork"],
            sessionBased: false
        });

        addNode("SMC_SILVERBULLET", {
            rr: extractRR(strategy.exitRules?.riskReward),
            sweepMaxPips: 30
        });
    }

    // 3. Q-AGENT (SEMPRE!)
    addNode("Q_AGENT", {
        alpha: 0.1,
        gamma: 0.95,
        epsilon: 0.2,
        enable: true,
        minConfidence: 0.75
    });

    // 4. BUY/SELL
    const rr = extractRR(strategy.exitRules?.riskReward);

    const buyId = id();
    const sellId = id();

    nodes.push({
        id: buyId,
        type: "BUY_MARKET",
        data: {
            lot: 0.01,
            slPips: 30,
            rr: rr,
            description: strategy.exitRules?.takeProfit || ""
        },
        position: { x: xPos, y: yPos - 80 }
    });

    nodes.push({
        id: sellId,
        type: "SELL_MARKET",
        data: {
            lot: 0.01,
            slPips: 30,
            rr: rr,
            description: strategy.exitRules?.takeProfit || ""
        },
        position: { x: xPos, y: yPos + 80 }
    });

    // Conectar Q-Agent aos BUY/SELL
    if (lastNodeId) {
        edges.push({ id: id(), source: lastNodeId, target: buyId });
        edges.push({ id: id(), source: lastNodeId, target: sellId });
    }

    return { nodes, edges };
}

/**
 * Extrai Risk/Reward de string (ex: "2:1" → 2, "3:1" → 3)
 */
function extractRR(rrString?: string): number {
    if (!rrString) return 2; // Default

    const match = rrString.match(/(\d+):1/);
    return match ? parseInt(match[1]) : 2;
}
