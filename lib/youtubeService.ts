import { YoutubeTranscript } from 'youtube-transcript';
import { transcribeWithWhisper } from './whisperService';

/**
 * Extrai transcrição REAL do YouTube
 * Tenta legendas primeiro, se falhar usa Whisper (funciona SEM legendas!)
 * @param videoUrl - URL completa ou ID do vídeo
 * @returns Texto completo da transcrição
 */
export async function getYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
        // Extrair ID do vídeo PRIMEIRO
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            throw new Error('URL do YouTube inválida');
        }

        console.log('📹 ID do vídeo extraído:', videoId);

        try {
            // TENTATIVA 1: Buscar legendas/transcrição (rápido e grátis)
            console.log('🔍 Tentando obter legendas...');
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);

            const fullText = transcript
                .map(item => item.text)
                .join(' ')
                .replace(/\[.*?\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (fullText.length > 100) {
                console.log(`✅ Legendas encontradas: ${fullText.length} caracteres`);
                return fullText;
            }

            throw new Error('Transcrição muito curta');

        } catch (transcriptError: any) {
            // TENTATIVA 2: Usar Whisper (funciona SEM legendas!)
            console.log('⚠️  Legendas não disponíveis');
            console.log('🎵 Usando Whisper para transcrever áudio...');

            const whisperTranscription = await transcribeWithWhisper(videoUrl);

            if (whisperTranscription.length < 100) {
                throw new Error('Transcrição Whisper muito curta');
            }

            return whisperTranscription;
        }

    } catch (error: any) {
        console.error('Erro ao extrair transcrição:', error);
        throw new Error(`Falha ao extrair transcrição: ${error.message}`);
    }
}

/**
 * Extrai ID do vídeo de uma URL do YouTube
 */
function extractVideoId(url: string): string | null {
    // Remover espaços e limpar URL
    url = url.trim();

    // Padrões de URL do YouTube
    const patterns = [
        // youtu.be/ID ou youtu.be/ID?params
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        // youtube.com/watch?v=ID
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        // youtube.com/embed/ID
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        // youtube.com/v/ID
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Se já é um ID direto (11 caracteres alfanuméricos)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}
