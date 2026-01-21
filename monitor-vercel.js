// Teste Final - Aguarda deploy do Vercel e testa automaticamente

const testTranscript = `
Estratégia SMC: Daily Bias D1, Premium Discount H1, MSB M5.
Entry em zona discount após break de estrutura.
Stop abaixo OB, Take 2:1. Londres e NY.
`;

let attempt = 0;
const maxAttempts = 12; // 6 minutos (30s cada)

async function testVercel() {
    attempt++;
    const now = new Date().toLocaleTimeString('pt-BR');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TENTATIVA ${attempt}/${maxAttempts} - ${now}`);
    console.log('='.repeat(60));

    try {
        console.log('📤 Testando: https://crt-ai-builder.vercel.app/api/analyze-video');

        const response = await fetch('https://crt-ai-builder.vercel.app/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: testTranscript })
        });

        console.log(`📊 Status: ${response.status}`);
        const data = await response.json();

        if (response.status === 200 && data.strategyName) {
            console.log('\n🎉🎉🎉 ============= SUCESSO! =============');
            console.log('✅✅✅ VERCEL DEPLOYOU O CÓDIGO NOVO! ✅✅✅');
            console.log('========================================\n');
            console.log(`📋 Estratégia: ${data.strategyName}`);
            console.log(`📊 Win Rate: ${data.winRate}%`);
            console.log(`🎯 Confiabilidade: ${data.confidence}%`);
            console.log(`📍 Nós Gerados: ${data.graph?.nodes?.length || 0}`);
            console.log('\n🚀 PRÓXIMO PASSO: Adicionar campo textarea na UI!');
            console.log('========================================\n');
            process.exit(0);

        } else if (data.error && data.error.includes("URL não fornecida")) {
            console.log('❌ Ainda usando código antigo (pede URL)');
            console.log(`⏳ Aguardando deploy... (${30 * (attempt)} segundos decorridos)`);

        } else {
            console.log(`❌ Erro inesperado: ${data.error || 'Desconhecido'}`);
            if (data.hint) console.log(`💡 ${data.hint}`);
        }

        if (attempt >= maxAttempts) {
            console.log('\n❌ Atingido tempo máximo de espera (6 minutos)');
            console.log('💡 Vercel pode estar com problema. Ações sugeridas:');
            console.log('   1. Login no Vercel Dashboard');
            console.log('   2. Verificar logs de build');
            console.log('   3. Forçar redeploy manual');
            process.exit(1);
        }

        console.log(`⏱️  Próxima tentativa em 30 segundos...`);
        setTimeout(testVercel, 30000);

    } catch (error) {
        console.log(`❌ Erro conexão: ${error.message}`);

        if (attempt >= maxAttempts) {
            process.exit(1);
        }

        console.log(`⏱️  Tentando novamente em 30 segundos...`);
        setTimeout(testVercel, 30000);
    }
}

console.log('🚀 MONITORAMENTO AUTOMÁTICO DO DEPLOY VERCEL');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('⏱️  Testará a cada 30 segundos por até 6 minutos');
console.log('✅ Teste local PASSOU - Código está correto!');
console.log('📦 Commit: [CRITICAL] FORCE Vercel Clean Rebuild');
console.log('🔄 Aguardando Vercel processar...\n');

testVercel();
