// Teste do Backend - Transcrição Manual
// Testa se a API aceita transcrição manual e gera estratégia

const testTranscript = `
Olá pessoal, hoje vou ensinar uma estratégia de trading muito eficaz.
Essa estratégia usa o conceito de Smart Money Concepts, especialmente 
focando em Order Blocks e Fair Value Gaps.

Primeiro, você precisa identificar o Daily Bias no gráfico D1. 
Se a vela anterior fechou acima da anterior, temos um bias de alta.
Caso contrário, bias de baixa.

Depois, no H1, você vai marcar as zonas de Premium e Discount usando
Fibonacci. Premium é acima de 61.8% e Discount é abaixo de 38.2%.

Para entradas, esperamos um Market Structure Break no M5, que é quando
o preço quebra a última máxima (para compra) ou mínima (para venda).

O Stop Loss deve ser colocado abaixo do Order Block mais próximo,
e o Take Profit deve ter um Risk Reward de pelo menos 2:1.

Recomendo operar apenas durante a sessão de Londres e Nova York,
das 08:00 às 16:00 GMT, quando há maior volume e liquidez.

Esta estratégia tem funcionado muito bem para mim, com um Win Rate
consistente acima de 70%. Espero que ajude vocês também!
`;

async function testBackend() {
    console.log('🧪 TESTANDO BACKEND - Transcrição Manual\n');

    const url = 'https://crt-ai-builder.vercel.app/api/analyze-video';
    // const url = 'http://localhost:3000/api/analyze-video'; // Descomente para teste local

    console.log('📤 Enviando transcrição para:', url);
    console.log('📝 Tamanho da transcrição:', testTranscript.length, 'caracteres\n');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcript: testTranscript
            })
        });

        console.log('📊 Status HTTP:', response.status);

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ SUCESSO! Backend funcionando!\n');
            console.log('📋 Resultado:');
            console.log('  - Estratégia:', data.strategyName);
            console.log('  - Win Rate:', data.winRate + '%');
            console.log('  - Confiabilidade:', data.confidence + '%');
            console.log('  - Fonte:', data.source || 'manual');
            console.log('\n📊 Backtest:');
            console.log('  - Total Trades:', data.backtestResults?.totalTrades);
            console.log('  - Winners:', data.backtestResults?.winners);
            console.log('  - Losers:', data.backtestResults?.losers);
            console.log('  - Profit Factor:', data.backtestResults?.profitFactor);
            console.log('\n🎯 Nós Gerados:', data.graph?.nodes?.length || 0);

            if (data.graph?.nodes) {
                console.log('\n📍 Tipos de nós:');
                data.graph.nodes.forEach((node, idx) => {
                    console.log(`  ${idx + 1}. ${node.type}`);
                });
            }

            console.log('\n🎉 BACKEND ESTÁ FUNCIONANDO PERFEITAMENTE!');
            console.log('✅ Próximo passo: Adicionar campo textarea na UI');

        } else {
            console.log('\n❌ ERRO na resposta:\n');
            console.log('Erro:', data.error);
            if (data.hint) {
                console.log('Dica:', data.hint);
            }
            if (data.details) {
                console.log('Detalhes:', data.details);
            }
        }

    } catch (error) {
        console.error('\n❌ ERRO ao testar:', error.message);
        console.error('\nPossíveis causas:');
        console.error('- Vercel ainda está fazendo deploy (aguarde 2-3 min)');
        console.error('- Problema de rede');
        console.error('- API offline');
    }
}

// Executar teste
console.log('⏳ Aguardando 2 minutos para Vercel completar deploy...\n');

setTimeout(() => {
    console.log('🚀 Tempo de espera concluído! Iniciando teste...\n');
    testBackend();
}, 120000); // 2 minutos

console.log('💡 Teste agendado para executar em 2 minutos.');
console.log('💡 Pressione Ctrl+C para cancelar.\n');

// Ou execute imediatamente descomentando a linha abaixo:
// testBackend();
