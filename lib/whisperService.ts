import OpenAI from 'openai';
import ytdl from '@distube/ytdl-core';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Transcreve áudio de vídeo do YouTube usando ytdl-core + OpenAI Whisper
 * Funciona com QUALQUER vídeo, mesmo sem legendas!
 * COMPATÍVEL COM VERCEL (serverless)
 * @param videoUrl - URL do YouTube
 * @returns Transcrição completa do áudio
 */
export async function transcribeWithWhisper(videoUrl: string): Promise<string> {
    let audioPath: string | null = null;

    try {
        console.log('🎵 Baixando áudio com ytdl-core...');

        // Baixar áudio usando ytdl-core (compatível com serverless!)
        audioPath = await downloadAudioWithYtdl(videoUrl);

        console.log('🤖 Transcrevendo com Whisper...');

        // Transcrever com Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath) as any,
            model: 'whisper-1',
            language: 'pt', // Português  
            response_format: 'text'
        });

        const text = typeof transcription === 'string' ? transcription : (transcription as any).text || '';

        console.log(`✅ Transcrição Whisper: ${text.length} caracteres`);

        return text;

    } catch (error: any) {
        console.error('Erro ao transcrever com Whisper:', error);
        throw new Error(`Falha na transcrição Whisper: ${error.message}`);
    } finally {
        // Limpar arquivo temporário
        if (audioPath && fs.existsSync(audioPath)) {
            try {
                fs.unlinkSync(audioPath);
                console.log('🗑️  Arquivo temporário removido');
            } catch (e) {
                console.warn('Aviso: não foi possível remover arquivo temp');
            }
        }
    }
}

/**
 * Baixa áudio do YouTube usando ytdl-core (biblioteca Node.js)
 * Compatível com ambientes serverless como Vercel!
 */
async function downloadAudioWithYtdl(videoUrl: string): Promise<string> {
    const timestamp = Date.now();
    const audioPath = path.join(os.tmpdir(), `yt-audio-${timestamp}.mp3`);

    console.log('📥 Baixando de:', videoUrl);
    console.log('💾 Salvando em:', audioPath);

    return new Promise((resolve, reject) => {
        try {
            // Obter stream de áudio (melhor qualidade possível)
            const audioStream = ytdl(videoUrl, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            const writeStream = fs.createWriteStream(audioPath);

            // Pipeline: stream do YouTube -> arquivo local
            audioStream.pipe(writeStream);

            audioStream.on('error', (error) => {
                console.error('❌ Erro no stream de áudio:', error);
                reject(new Error(`Falha ao baixar áudio: ${error.message}`));
            });

            writeStream.on('error', (error) => {
                console.error('❌ Erro ao escrever arquivo:', error);
                reject(new Error(`Falha ao salvar áudio: ${error.message}`));
            });

            writeStream.on('finish', () => {
                console.log(`✅ Áudio baixado: ${path.basename(audioPath)}`);

                // Verificar se arquivo existe e tem conteúdo
                if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
                    resolve(audioPath);
                } else {
                    reject(new Error('Arquivo de áudio vazio ou não encontrado'));
                }
            });

        } catch (error: any) {
            console.error('Erro ao baixar áudio:', error.message);
            reject(new Error(`Falha ao baixar áudio: ${error.message}`));
        }
    });
}
