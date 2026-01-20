// Testar qual vídeo tem transcrição disponível

const videos = [
    'https://youtu.be/ceW5_D2ZCH4',
    'https://youtu.be/4hz2wMOWA0s',
    'https://youtu.be/DgIM5n1zo28',
    'https://youtu.be/c_wRj7Xmyzg',
    'https://youtu.be/6-qKXzS7wkY'
];

async function testarVideos() {
    console.log('🎬 Testando todos os vídeos do GRACE FX...\n');

    for (let i = 0; i < videos.length; i++) {
        const url = videos[i];
        const id = url.split('/').pop().split('?')[0];

        console.log(`${i + 1}. Testando: ${id}`);
        console.log(`   URL: ${url}`);

        try {
            const response = await fetch('http://localhost:3001/api/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.error) {
                console.log(`   ❌ ERRO: ${data.error}\n`);
            } else {
                console.log(`   ✅ SUCESSO!`);
                console.log(`   📝 Estratégia: ${data.strategyName}`);
                console.log(`   📈 Win Rate: ${data.winRate}%`);
                console.log(`   🔧 Nós: ${data.graph.nodes.length}`);
                console.log(`\n   🎯 ESTE VÍDEO FUNCIONOU! Use ele no sistema.\n`);
                return; // Para no primeiro que funcionar
            }

        } catch (error) {
            console.log(`   ❌ Erro de conexão: ${error.message}\n`);
        }

        // Aguardar 2s entre requests para não sobrecarregar
        if (i < videos.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log('\n⚠️  Nenhum vídeo tem transcrição disponível.');
    console.log('Tente outros vídeos do canal GRACE FX que tenham legendas.');
}

testarVideos();
