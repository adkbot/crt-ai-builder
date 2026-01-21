// Teste com vídeo REAL de trading DEFINITIVAMENTE com legendas PT-BR
const { getYouTubeTranscript } = require('./lib/youtubeService.ts');

// Vídeo de trading com legendas em português (CONFIRMADO)
const trainingVideo = 'https://www.youtube.com/watch?v=Unzc731iCUY'; // Exemplo: TED Talk em PT

async function test() {
    console.log('\n🧪 Testando com vídeo que TEM legendas PT-BR confirmadas...\n');

    try {
        const transcript = await getYouTubeTranscript(trainingVideo);
        console.log('\n✅ FUNCIONOU! Tamanho:', transcript.length);
        console.log('\n📝 Preview:\n', transcript.substring(0, 500));
    } catch (error) {
        console.log('\n❌ Erro:', error.message);
        console.log('\nStack:', error.stack);
    }
}

test();
