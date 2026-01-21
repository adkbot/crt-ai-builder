// Teste DIRETO da biblioteca youtube-transcript
const { YoutubeTranscript } = require('youtube-transcript');

async function testDirect() {
    const videoId = 'Unzc731iCUY'; // TED Talk

    console.log('📹 Testando biblioteca diretamente...');
    console.log('Video ID:', videoId);

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'pt'  // Forçar português
        });

        console.log('\n✅ Conseguiu! Items:', transcript.length);
        console.log('\nPrimeiros 3 items:');
        transcript.slice(0, 3).forEach((item, i) => {
            console.log(`${i + 1}. [${item.offset}s] ${item.text}`);
        });

    } catch (error) {
        console.log('\n❌ Erro:', error.message);
        console.log('\nTentando sem especificar idioma...');

        try {
            const transcript2 = await YoutubeTranscript.fetchTranscript(videoId);
            console.log('✅ Funcionou sem idioma! Items:', transcript2.length);
            console.log('\nPrimeiros 3 items:');
            transcript2.slice(0, 3).forEach((item, i) => {
                console.log(`${i + 1}. [${item.offset}s] ${item.text}`);
            });
        } catch (error2) {
            console.log('❌ Também falhou:', error2.message);
        }
    }
}

testDirect();
