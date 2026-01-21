// Teste Automático com Retry
// Testa a cada 30 segundos até funcionar

const testTranscript = `
Estratégia SMC completa: Usar Daily Bias no D1 para determinar direção.
No H1, marcar zonas de Premium e Discount com Fibonacci.
Entry no M5 quando houver Market Structure Break.
Stop Loss abaixo do Order Block, Take Profit com RR 2:1.
Operar apenas Londres e Nova York, 08:00-16:00 GMT.
`;

let attempts = 0;
const maxAttempts = 8; // 8 tentativas = 4 minutos

async function testWithRetry() {
    attempts++;
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 TENTATIVA ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));

    try {
        const response = await fetch('https://crt-ai-builder.vercel.app/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: testTranscript })
        });

        console.log(`📊 Status HTTP: ${response.status}`);
        const data = await response.json();

        if (response.ok && response.status === 200) {
            console.log('\n🎉 ============= SUCESSO! =============');
            console.log('✅ BACKEND ESTÁ FUNCIONANDO!');
            console.log('=====================================\n');
            console.log('📋 Resultado:');
            console.log(`  - Estratégia: ${data.strategyName}`);
            console.log(`  - Win Rate: ${data.winRate}%`);
            console.log(`  - Confiabilidade: ${data.confidence}%`);
            console.log(`  - Fonte: ${data.source || 'manual'}`);
            console.log(`\n📊 Backtest:`);
            console.log(`  - Total: ${data.backtestResults?.totalTrades} trades`);
            console.log(`  - Winners: ${data.backtestResults?.winners}`);
            console.log(`  - Losers: ${data.backtestResults?.losers}`);
            console.log(`  - Profit Factor: ${data.backtestResults?.profitFactor}`);
            console.log(`\n🎯 Nós: ${data.graph?.nodes?.length || 0} gerados`);

            console.log('\n✅ PRÓXIMO PASSO: Adicionar campo textarea na UI!');
            console.log('=====================================\n');
            process.exit(0);

        } else {
            console.log(`❌ Status ${response.status}: ${data.error || data.message}`);

            if (data.error === "URL não fornecida") {
                console.log('⏳ Vercel ainda usando código antigo...');
            } else if (data.hint) {
                console.log(`💡 Dica: ${data.hint}`);
            }

            if (attempts < maxAttempts) {
                console.log(`\n⏱️  Aguardando 30 segundos para próxima tentativa...`);
                setTimeout(testWithRetry, 30000);
            } else {
                console.log('\n❌ Atingido número máximo de tentativas.');
                console.log('💡 Possíveis ações:');
                console.log('   1. Verificar logs no Vercel Dashboard');
                console.log('   2. Fazer login e forçar redeploy manual');
                console.log('   3. Testar localmente com npm run dev');
                process.exit(1);
            }
        }

    } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);

        if (attempts < maxAttempts) {
            console.log(`⏱️  Aguardando 30 segundos para próxima tentativa...`);
            setTimeout(testWithRetry, 30000);
        } else {
            console.log('\n❌ Atingido número máximo de tentativas.');
            process.exit(1);
        }
    }
}

console.log('🚀 INICIANDO TESTE AUTOMÁTICO COM RETRY');
console.log('⏱️  Testará a cada 30 segundos até funcionar (máx: 4 minutos)\n');

testWithRetry();
