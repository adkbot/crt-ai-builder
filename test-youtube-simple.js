// Teste LOCAL da função de análise de vídeos
// Para identificar o erro EXATO

const { getYouTubeTranscript } = require('./lib/youtubeService.ts');

const testURL = 'https://youtu.be/jfKfPfyJRdk';

console.log('🧪 Testando extração de legendas...');
console.log('URL:', testURL);

getYouTubeTranscript(testURL)
    .then(transcript => {
        console.log('\n✅ SUCESSO!');
        console.log('Tamanho:', transcript.length, 'caracteres');
        console.log('Preview:', transcript.substring(0, 200) + '...');
    })
    .catch(error => {
        console.error('\n❌ ERRO:', error.message);
        console.error('Stack:', error.stack);
    });
