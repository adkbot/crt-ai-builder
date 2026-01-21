import { Innertube } from 'youtubei.js';

/**
 * Extrai transcrição do YouTube usando youtubei.js (mais robusta!)
 * @param videoUrl - URL completa ou ID do vídeo
 * @returns Texto completo da transcrição
 */
export async function getYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            throw new Error('URL do YouTube inválida');
        }

        console.log('📹 ID do vídeo extraído:', videoId);
        console.log('🔍 Buscando transcrição com YouTubei.js...');

        // Inicializar cliente do YouTube
        const youtube = await Innertube.create();

        // Buscar informações do vídeo
        const info = await youtube.getInfo(videoId);

        // Tentar obter legendas/transcrição
        const transcriptData = await info.getTranscript();

        if (!transcriptData || !transcriptData.transcript) {
            throw new Error('Este vídeo não possui legendas disponíveis');
        }

        // Extrair texto das legendas
        const segments = transcriptData.transcript.content.body.initial_segments;

        if (!segments || segments.length === 0) {
            throw new Error('Legendas vazias');
        }

        // Concatenar todo o texto
        const fullText = segments
            .map((segment: any) => segment.snippet.text)
            .filter((text: string) => text && text.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        console.log(`✅ Transcrição extraída: ${fullText.length} caracteres`);
        console.log('Preview:', fullText.substring(0, 200) + '...');

        if (fullText.length === 0) {
            throw new Error('Texto extraído está vazio');
        }

        return fullText;

    } catch (error: any) {
        console.error('❌ Erro ao extrair transcrição:', error.message);

        // Mensagens claras para o usuário
        if (error.message.includes('unavailable') ||
            error.message.includes('not available') ||
            error.message.includes('disabled')) {
            throw new Error('Este vídeo não possui legendas disponíveis. Por favor, escolha um vídeo com legendas ativadas.');
        }

        throw new Error(`Falha ao extrair legendas: ${error.message}`);
    }
}

/**
 * Extrai ID do vídeo de uma URL do YouTube
 */
function extractVideoId(url: string): string | null {
    url = url.trim();

    const patterns = [
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}
