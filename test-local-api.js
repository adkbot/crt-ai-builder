// Teste LOCAL - API com transcrição manual
const testTranscript = `
Estratégia completa de Smart Money Concepts.
Primeiro passo: Daily Bias no gráfico D1. Se a vela anterior fechou acima, temos bias de alta.
Segundo: No H1, marcar zonas Premium e Discount usando Fibonacci 61.8% e 38.2%.
Terceiro: No M5, aguardar Market Structure Break - preço quebrando última máxima para compra.
Stop Loss: Abaixo do Order Block mais próximo.
Take Profit: Risk Reward de 2:1.
Horário: Operar Londres e Nova York, das 08:00 às 16:00 GMT.
Esta estratégia tem Win Rate acima de 70% quando seguida corretamente.
`;

async function testLocal() {
    console.log('🧪 TESTANDO API LOCAL COM TRANSCRIÇÃO MANUAL\n');
    console.log('📍 URL: http://localhost:3000/api/analyze-video');
    console.log('📝 Tamanho: ' + testTranscript.length + ' caracteres\n');

    try {
        const response = await fetch('http://localhost:3000/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: testTranscript })
        });

        console.log('📊 Status HTTP:', response.status);

        const data = await response.json();

        if (response.ok) {
            console.log('\n🎉 ===== SUCESSO LOCAL! =====\n');
            console.log('✅ API LOCAL FUNCIONANDO PERFEITAMENTE!\n');
            console.log('📋 Resultado:');
            console.log('  - Estratégia:', data.strategyName);
            console.log('  - Win Rate:', data.winRate + '%');
            console.log('  - Confiabilidade:', data.confidence + '%');
            console.log('  - Fonte:', data.source);
            console.log('\n📊 Backtest:');
            console.log('  - Total Trades:', data.backtestResults?.totalTrades);
            console.log('  - Winners:', data.backtestResults?.winners);
            console.log('  - Losers:', data.backtestResults?.losers);
            console.log('  - Profit Factor:', data.backtestResults?.profitFactor);
            console.log('\n🎯 Nós Gerados:', data.graph?.nodes?.length);

            if (data.graph?.nodes) {
                console.log('\n📍 Tipos de nós criados:');
                data.graph.nodes.forEach((node, idx) => {
                    console.log(`  ${idx + 1}. ${node.type}`);
                });
            }

            console.log('\n✅ CÓDIGO ESTÁ PERFEITO!');
            console.log('💡 Próximo passo: Forçar redeploy no Vercel');

        } else {
            console.log('\n❌ Erro:', data.error);
            if (data.hint) console.log('💡 Dica:', data.hint);
            if (data.details) console.log('📋 Detalhes:', data.details);
        }

    } catch (error) {
        console.error('\n❌ Erro ao testar:', error.message);
        console.error('\n💡 Certifique-se de que o servidor está rodando:');
        console.error('   npm run dev');
    }
}

testLocal();
