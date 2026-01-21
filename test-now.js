// Teste RÁPIDO - Executar agora
const testTranscript = `
Estratégia SMC: Daily Bias D1, Premium Discount H1, Market Structure Break M5.
Entry: Break of Structure bullish em zona de discount.
Stop Loss: Abaixo do Order Block. Take Profit: RR 2:1.
Operar Londres e NY, 08:00-16:00 GMT.
`;

async function testNow() {
    console.log('🧪 Testando backend AGORA...\n');

    try {
        const response = await fetch('https://crt-ai-builder.vercel.app/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: testTranscript })
        });

        console.log('Status:', response.status);
        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ FUNCIONOU!');
            console.log('Estratégia:', data.strategyName);
            console.log('Win Rate:', data.winRate + '%');
        } else {
            console.log('\n❌ Erro:', data.error);
            if (data.hint) console.log('Dica:', data.hint);
        }
    } catch (error) {
        console.log('\n⏳ Deploy ainda não terminou ou erro de rede:', error.message);
    }
}

testNow();
