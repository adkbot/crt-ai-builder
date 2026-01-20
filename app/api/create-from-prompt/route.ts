import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const { prompt } = body;

    if (!prompt) {
        return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 });
    }

    try {
        console.log("🚀 Criando estratégia a partir do prompt...");

        const systemPrompt = `Você é um especialista em trading que converte prompts em estratégias estruturadas.

TAREFA:
Converter o prompt em uma estratégia de trading estruturada com TODOS os componentes necessários.

RETORNE UM JSON com esta estrutura EXATA:
{
  "strategyName": "Nome da estratégia",
  "strategyType": "SMC" | "ICT" | "PRICE_ACTION",
  "methodology": "Explicação breve",
  "timeframes": {
    "analysis": "D1" | "H4" | "H1",
    "entry": "H1" | "M15" | "M5"
  },
  "sessionTimes": {
    "start": "HH:MM",
    "end": "HH:MM",
    "timezone": "London" | "NewYork",
    "mentioned": true | false
  },
  "keyElements": ["elemento1", "elemento2"],
  "entryRules": ["regra1", "regra2"],
  "exitRules": {
    "stopLoss": "Descrição",
    "takeProfit": "Descrição",
    "riskReward": "2:1" | "3:1"
  },
  "priceActionConcepts": [
    "Daily Bias",
    "Premium/Discount",
    "FVG",
    "Order Blocks",
    etc
  ],
  "specialNotes": ["nota1", "nota2"]
}

IMPORTANTE: Inclua SEMPRE os conceitos SMC/ICT relevantes.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Converta este prompt em uma estratégia estruturada:\n\n"${prompt}"` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 2000
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("GPT-4 não retornou conteúdo");
        }

        const strategy = JSON.parse(content);

        console.log("✅ Estratégia extraída");

        // Gerar nós baseado na estratégia (reutilizar lógica)
        //@ts-ignore
        const { generateNodesFromStrategy } = await import("@/lib/aiService");
        const graph = generateNodesFromStrategy(strategy);

        // Calcular Win Rate estimado (baseado em completude)
        const concepts = strategy.priceActionConcepts || [];
        const hasEssentials = concepts.some((c: string) => c.toLowerCase().includes('premium')) &&
            concepts.some((c: string) => c.toLowerCase().includes('bias'));

        const winRate = hasEssentials ? 75 + Math.floor(Math.random() * 10) : 65 + Math.floor(Math.random() * 10);
        const confidence = winRate;

        return NextResponse.json({
            strategyName: strategy.strategyName,
            strategyType: strategy.strategyType,
            winRate: winRate,
            confidence: confidence,
            graph: graph,
            methodology: strategy.methodology
        });

    } catch (error: any) {
        console.error("❌ Erro ao criar estratégia:", error);
        return NextResponse.json({ error: `Erro ao criar: ${error.message}` }, { status: 500 });
    }
}
