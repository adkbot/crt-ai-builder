import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Transcreve áudio de vídeo do YouTube usando yt-dlp + OpenAI Whisper
 * Funciona com QUALQUER vídeo, mesmo sem legendas!
 * @param videoUrl - URL do YouTube
 * @returns Transcrição completa do áudio
 */
export async function transcribeWithWhisper(videoUrl: string): Promise<string> {
    let audioPath: string | null = null;

    try {
        console.log('🎵 Baixando áudio com yt-dlp...');

        // Baixar áudio usando yt-dlp (muito mais confiável!)
        audioPath = await downloadAudioWithYtDlp(videoUrl);

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
 * Baixa áudio do YouTube usando yt-dlp (CLI tool)
 * Muito mais confiável que bibliotecas Node.js!
 */
async function downloadAudioWithYtDlp(videoUrl: string): Promise<string> {
    const timestamp = Date.now();
    const audioPath = path.join(os.tmpdir(), `yt-audio-${timestamp}.mp3`);

    console.log('📥 Baixando de:', videoUrl);
    console.log('💾 Salvando em:', audioPath);

    try {
        // Possíveis locais do ffmpeg (instalado pelo winget)
        const ffmpegLocations = [
            path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-N-122319-gf6a95c7eb7-win64-gpl', 'bin'),
            'C:\\ProgramData\\chocolatey\\bin', // Se instalado via chocolatey
            'C:\\ffmpeg\\bin' // Instalação manual comum
        ];

        let ffmpegPath = '';
        for (const loc of ffmpegLocations) {
            if (fs.existsSync(path.join(loc, 'ffmpeg.exe'))) {
                ffmpegPath = loc;
                console.log(`✅ FFmpeg encontrado em: ${ffmpegPath}`);
                break;
            }
        }

        // Comando yt-dlp
        let command = 'yt-dlp';
        command += ' --extractor-args "youtube:player_client=default"'; // Evita warning
        command += ' -x --audio-format mp3 --audio-quality 9';

        if (ffmpegPath) {
            command += ` --ffmpeg-location "${ffmpegPath}"`;
        }

        command += ` -o "${audioPath}" "${videoUrl}"`;

        console.log('⚙️  Executando yt-dlp...');

        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 120000 // 2 minutos timeout
        });

        if (stderr && !stderr.includes('Deleting original file')) {
            console.log('⚠️  yt-dlp stderr:', stderr.substring(0, 500));
        }

        // yt-dlp pode adicionar extensão, verificar
        const possiblePaths = [
            audioPath,
            audioPath.replace('.mp3', '.m4a'),
            audioPath.replace('.mp3', '.webm'),
            audioPath.replace('.mp3', '.opus')
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                console.log(`✅ Áudio encontrado: ${path.basename(p)}`);
                return p;
            }
        }

        throw new Error('Arquivo de áudio não encontrado após download');

    } catch (error: any) {
        console.error('Erro ao executar yt-dlp:', error.message);
        throw new Error(`Falha ao baixar áudio: ${error.message}`);
    }
}
