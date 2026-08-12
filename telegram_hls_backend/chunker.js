import ffmpeg from 'fluent-ffmpeg';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Укажите ваш токен бота и ID канала в файле .env
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const channelId = process.env.TELEGRAM_CHANNEL_ID || '@your_channel_id';

const bot = new TelegramBot(token, { polling: false });

/**
 * Нарезает видео на HLS чанки
 * @param {string} inputVideoPath Путь к исходному VOD
 * @param {string} outputDir Папка для сохранения чанков
 */
async function processVideo(inputVideoPath, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const playlistName = 'master.m3u8';
    const outputPath = path.join(outputDir, playlistName);

    console.log(`[FFmpeg] Начало нарезки VOD: ${inputVideoPath}...`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputVideoPath)
            .outputOptions([
                '-codec: copy',       // Не пережимаем видео, если кодек уже H.264
                '-start_number 0',
                '-hls_time 10',       // Длина каждого чанка 10 секунд
                '-hls_list_size 0',   // Сохраняем все чанки в плейлист
                '-f hls'
            ])
            .output(outputPath)
            .on('end', () => {
                console.log('[FFmpeg] Нарезка успешно завершена!');
                resolve(outputDir);
            })
            .on('error', (err) => {
                console.error('[FFmpeg] Ошибка при обработке:', err);
                reject(err);
            })
            .run();
    });
}

/**
 * Загружает все .ts чанки в Telegram
 * @param {string} outputDir Папка с чанками
 */
async function uploadToTelegram(outputDir) {
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));
    console.log(`[Telegram] Найдено ${files.length} чанков для загрузки. Начинаем...`);

    const topicId = process.env.TELEGRAM_TOPIC_ID;

    for (const file of files) {
        const filePath = path.join(outputDir, file);
        try {
            console.log(`Загрузка ${file}...`);
            const options = topicId ? { message_thread_id: topicId } : {};
            const msg = await bot.sendDocument(channelId, filePath, options);
            console.log(`Успех: ${file} -> file_id: ${msg.document.file_id}`);
            // В продакшене нужно сохранять file_id каждого чанка в базу данных 
        } catch (error) {
            console.error(`Ошибка при загрузке ${file}:`, error.message);
        }
    }
}

// export
export { processVideo, uploadToTelegram };
