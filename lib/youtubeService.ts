import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extrai transcrição do YouTube usando APENAS legendas
 * SIMPLIFICADO - Sem Whisper para evitar problemas no Vercel
 * @param videoUrl - URL completa ou ID do vídeo
 * @returns Texto completo da transcrição
 */
export async function getYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
        // Extrair ID do vídeo
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            throw new Error('URL do YouTube inválida');
        }

        console.log('📹 ID do vídeo extraído:', videoId);

        // Buscar legendas/transcrição
        console.log('🔍 Buscando legendas do YouTube...');
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        const fullText = transcript
            .map(item => item.text)
            .join(' ')
            .replace(/\[.*?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (fullText.length < 100) {
            throw new Error('Transcrição muito curta. Vídeo pode não ter legendas disponíveis.');
        }

        console.log(`✅ Legendas encontradas: ${fullText.length} caracteres`);
        return fullText;

    } catch (error: any) {
        console.error('Erro ao extrair transcrição:', error);

        // Mensagem mais clara para o usuário
        if (error.message.includes('Transcript is disabled') ||
            error.message.includes('No transcript found')) {
            throw new Error('Este vídeo não possui legendas disponíveis. Por favor, escolha um vídeo com legendas ativadas.');
        }

        throw new Error(`Falha ao extrair legendas: ${error.message}`);
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
