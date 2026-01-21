// Teste com URL que TEM legendas confirmadas
const { getYouTubeTranscript } = require('./lib/youtubeService.ts');

// URLs conhecidas COM legendas ativadas
const testsURLs = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll (tem legendas)
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',  // "Me at the zoo" (tem legendas)
];

async function testAll() {
    for (const url of testsURLs) {
        console.log('\n🧪 Testando:', url);
        try {
            const transcript = await getYouTubeTranscript(url);
            console.log('✅ SUCESSO! Tamanho:', transcript.length);
            console.log('Preview:', transcript.substring(0, 150) + '...');
        } catch (error) {
            console.log('❌ FALHOU:', error.message);
        }
    }
}

testAll();
