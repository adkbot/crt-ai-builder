// Testar TODOS os 5 vídeos do GRACE FX

const videos = [
    'https://youtu.be/ceW5_D2ZCH4',
    'https://youtu.be/4hz2wMOWA0s',
    'https://youtu.be/DgIM5n1zo28',
    'https://youtu.be/c_wRj7Xmyzg',
    'https://youtu.be/6-qKXzS7wkY'
];

async function testarTodosVideos() {
    console.log('🎬 Testando TODOS os 5 vídeos do GRACE FX...\n');
    console.log('⏱️  Isso vai demorar ~7-10 minutos (5 vídeos x ~90s cada)\n');

    const resultados = [];

    for (let i = 0; i < videos.length; i++) {
        const url = videos[i];
        const id = url.split('/').pop().split('?')[0];

        console.log(`${'='.repeat(70)}`);
        console.log(`VÍDEO ${i + 1}/5: ${id}`);
        console.log(`${'='.repeat(70)}`);
        console.log(`URL: ${url}\n`);

        const startTime = Date.now();

        try {
            const response = await fetch('http://localhost:3001/api/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(1);

            const data = await response.json();

            if (data.error) {
                console.log(`❌ ERRO: ${data.error}\n`);
                resultados.push({
                    video: i + 1,
                    id,
                    sucesso: false,
                    erro: data.error,
                    tempo: duration
                });
            } else {
                console.log(`✅ SUCESSO! (${duration}s)\n`);
                console.log(`📝 Estratégia: ${data.strategyName}`);
                console.log(`📈 Win Rate: ${data.winRate}%`);
                console.log(`🎯 Confiança: ${data.confidence}%`);
                console.log(`🔧 Nós: ${data.graph.nodes.length}`);

                console.log(`\n📋 Nós Criados:`);
                data.graph.nodes.forEach((node, idx) => {
                    console.log(`  ${idx + 1}. ${node.type}`);
                });

                resultados.push({
                    video: i + 1,
                    id,
                    sucesso: true,
                    estrategia: data.strategyName,
                    winRate: data.winRate,
                    confianca: data.confidence,
                    nos: data.graph.nodes.length,
                    tipos: data.graph.nodes.map(n => n.type),
                    tempo: duration
                });
            }

        } catch (error) {
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(1);

            console.log(`❌ Erro de conexão: ${error.message}\n`);
            resultados.push({
                video: i + 1,
                id,
                sucesso: false,
                erro: error.message,
                tempo: duration
            });
        }

        console.log('');

        // Aguardar 3s entre vídeos para não sobrecarregar
        if (i < videos.length - 1) {
            console.log('⏳ Aguardando 3 segundos antes do próximo...\n');
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // RESUMO FINAL
    console.log(`${'='.repeat(70)}`);
    console.log('📊 RESUMO FINAL');
    console.log(`${'='.repeat(70)}\n`);

    const sucessos = resultados.filter(r => r.sucesso);
    const falhas = resultados.filter(r => !r.sucesso);

    console.log(`✅ Sucessos: ${sucessos.length}/${videos.length}`);
    console.log(`❌ Falhas: ${falhas.length}/${videos.length}\n`);

    if (sucessos.length > 0) {
        console.log('✅ VÍDEOS ANALISADOS COM SUCESSO:\n');
        sucessos.forEach(r => {
            console.log(`  ${r.video}. ${r.id}`);
            console.log(`     Estratégia: ${r.estrategia}`);
            console.log(`     Win Rate: ${r.winRate}% | Nós: ${r.nos} | Tempo: ${r.tempo}s`);
            console.log(`     Tipos: ${r.tipos.join(', ')}\n`);
        });
    }

    if (falhas.length > 0) {
        console.log('❌ VÍDEOS COM ERRO:\n');
        falhas.forEach(r => {
            console.log(`  ${r.video}. ${r.id}`);
            console.log(`     Erro: ${r.erro}`);
            console.log(`     Tempo: ${r.tempo}s\n`);
        });
    }

    console.log('🎉 Teste completo!');
}

testarTodosVideos();
