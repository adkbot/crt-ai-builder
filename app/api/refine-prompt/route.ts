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
        console.log("🤖 Refinando prompt com GPT-4...");

        const systemPrompt = `Você é um especialista em trading que refina prompts de estratégias.

TAREFA:
- Receber um prompt do usuário descrevendo uma estratégia de trading
- Refinar o prompt para incluir TODOS os conceitos SMC/ICT relevantes
- Tornar o prompt mais claro, específico e completo
- Manter a intenção original do usuário

CONCEITOS SMC/ICT A CONSIDERAR:
- Daily Bias (D1)
- Premium/Discount Zones (Fibonacci 61.8% / 38.2%)
- ICT Key Zones (London/NY sessions)
- Market Structure Break (MSB)
- Fair Value Gap (FVG)
- Order Blocks
- Judas Swing
- Liquidity Sweeps
- Q-Learning adaptativo

FORMATO DE SAÍDA:
Retorne APENAS o prompt refinado, sem explicações adicionais.
O prompt refinado deve ser claro e completo o suficiente para gerar uma estratégia funcional.`;

        const userMessage = `Prompt original do usuário:
"${prompt}"

Refine este prompt para incluir todos os conceitos SMC/ICT relevantes e torná-lo mais específico.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const refinedPrompt = response.choices[0].message.content || prompt;

        console.log("✅ Prompt refinado com sucesso");

        return NextResponse.json({
            originalPrompt: prompt,
            refinedPrompt: refinedPrompt
        });

    } catch (error: any) {
        console.error("❌ Erro ao refinar prompt:", error);
        return NextResponse.json({ error: `Erro ao refinar: ${error.message}` }, { status: 500 });
    }
}
