// Teste rápido da API com Whisper

async function testarWhisper() {
    console.log('🎬 Testando análise com Whisper...\n');

    const url = 'https://youtu.be/ceW5_D2ZCH4';

    try {
        console.log('📹 URL:', url);
        console.log('🔄 Enviando requisição...');
        console.log('⏱️  Isso pode demorar 40-60 segundos (Whisper está trabalhando)...\n');

        const startTime = Date.now();

        const response = await fetch('http://localhost:3001/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        console.log(`\n⏱️  Tempo total: ${duration}s`);
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

            console.log('\n📋 Tipos de Nós:');
            data.graph.nodes.forEach((node, i) => {
                console.log(`  ${i + 1}. ${node.type}`);
            });

            console.log('\n🎉 WHISPER FUNCIONOU! Sistema OK!');
        }

    } catch (error) {
        console.log('\n❌ Erro ao testar:', error.message);
    }
}

console.log('⚠️  AVISO: Este teste vai demorar ~40-60 segundos');
console.log('Aguarde enquanto Whisper baixa e transcreve o áudio...\n');

testarWhisper();
