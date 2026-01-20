const fetch = require('node-fetch');

async function testarAPI() {
    console.log('🎬 Testando API com vídeo do GRACE FX...\n');

    const url = 'https://youtu.be/ceW5_D2ZCH4';

    try {
        console.log('📹 URL:', url);
        console.log('🔄 Enviando requisição...\n');

        const response = await fetch('http://localhost:3001/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        console.log('📊 Status:', response.status);

        const data = await response.json();

        if (data.error) {
            console.log('\n❌ ERRO:', data.error);
        } else {
            console.log('\n✅ SUCESSO!\n');
            console.log('📝 Nome da Estratégia:', data.strategyName);
            console.log('📈 Win Rate:', data.winRate + '%');
            console.log('🎯 Confiança:', data.confidence + '%');
            console.log('\n🔧 Nós Criados:', data.graph.nodes.length);
            console.log('🔗 Conexões:', data.graph.edges.length);

            console.log('\n📋 Nós:');
            data.graph.nodes.forEach((node, i) => {
                console.log(`  ${i + 1}. ${node.type}`);
            });

            if (data.originalStrategy) {
                console.log('\n🎯 Estratégia Original Detectada:');
                console.log('  - Metodologia:', data.originalStrategy.methodology);
                console.log('  - Timeframes:', JSON.stringify(data.originalStrategy.timeframes));
                if (data.originalStrategy.priceActionConcepts) {
                    console.log('  - Conceitos:');
                    data.originalStrategy.priceActionConcepts.forEach(c => {
                        console.log(`    • ${c}`);
                    });
                }
            }
        }

    } catch (error) {
        console.log('\n❌ Erro ao testar:', error.message);
    }
}

testarAPI();
