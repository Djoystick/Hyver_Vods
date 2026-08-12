import ffmpeg from 'fluent-ffmpeg';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { exec, spawn } from 'child_process';
import util from 'util';
import 'dotenv/config';

const execPromise = util.promisify(exec);

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const channelId = process.env.TELEGRAM_CHANNEL_ID || '';
const topicId = process.env.TELEGRAM_TOPIC_ID || '';
const bot = new TelegramBot(token, { polling: false });

const FRONTEND_DIR = path.resolve('../frontend/public');
const VODS_JSON_PATH = path.join(FRONTEND_DIR, 'data', 'vods.json');
const THUMBNAILS_DIR = path.join(FRONTEND_DIR, 'thumbnails');
const VODS_DIR = path.join(FRONTEND_DIR, 'vods');

// Утилита для интерфейса (прогресс-бары)
function drawProgressBar(label, percent, details) {
    const width = 30;
    const safePercent = Math.min(100, Math.max(0, percent || 0));
    const filled = Math.round((width * safePercent) / 100);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    // \x1b[K очищает строку до конца, \r возвращает каретку
    process.stdout.write(`\r\x1b[K[\x1b[36m${label}\x1b[0m] [${bar}] ${safePercent.toFixed(1)}% | ${details}`);
}

// Утилита для интерактивного ввода
const askQuestion = (query) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

// Получение метаданных
async function getMetadata(url, isAuto = false) {
    console.log(`\n[*] Анализ видео: ${url}`);
    const cmd = isAuto 
        ? `yt-dlp --dump-json --playlist-items 1 "${url}"`
        : `yt-dlp --dump-json "${url}"`;
    
    const { stdout } = await execPromise(cmd);
    const data = JSON.parse(stdout.trim());
    return {
        id: data.id,
        title: data.title,
        duration: data.duration_string || data.duration,
        thumbnailUrl: data.thumbnail
    };
}

// Загрузка скриншота
async function downloadThumbnail(url, destPath) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
        return true;
    } catch (e) {
        console.error('\n[Ошибка] Не удалось скачать обложку:', e.message);
        return false;
    }
}

// Этап 1: Скачивание видео целиком
function downloadFullVideo(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`\n[*] Этап 1/3: Скачивание исходного видео...`);
        // Используем --newline для стабильного парсинга прогресса
        const ytdlp = spawn('yt-dlp', ['--newline', '-o', destPath, url]);

        ytdlp.stdout.on('data', (data) => {
            const line = data.toString();
            // Парсинг строки вида: [download]  15.2% of ~ 20.00GiB at 10.00MiB/s ETA 00:20
            const match = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+)([a-zA-Z]+)\s+at\s+([\d.]+)([a-zA-Z/s]+)\s+ETA\s+([\d:]+)/);
            if (match) {
                const percent = parseFloat(match[1]);
                const size = `${match[2]}${match[3]}`;
                const speed = `${match[4]}${match[5]}`;
                const eta = match[6];
                drawProgressBar('Скачивание', percent, `Размер: ${size} | Скорость: ${speed} | Осталось: ${eta}`);
            }
        });

        ytdlp.stderr.on('data', (data) => {
            // Игнорируем обычные логи, если это не фатальная ошибка
        });

        ytdlp.on('close', (code) => {
            console.log(); // Перенос строки после завершения прогресс-бара
            if (code === 0) resolve();
            else reject(new Error(`yt-dlp завершился с кодом ${code}`));
        });
    });
}

// Этап 2: Нарезка локального файла
function chunkLocalVideo(inputPath, playlistPath) {
    return new Promise((resolve, reject) => {
        console.log(`\n[*] Этап 2/3: Нарезка видео на чанки (по 30 секунд)...`);
        
        ffmpeg(inputPath)
            .outputOptions([
                '-c copy',
                '-start_number 0',
                '-hls_time 30',
                '-hls_list_size 0',
                '-f hls'
            ])
            .output(playlistPath)
            .on('progress', (progress) => {
                if (progress.percent) {
                    drawProgressBar('Нарезка', progress.percent, `Фреймы: ${progress.frames} | Время: ${progress.timemark}`);
                } else {
                    drawProgressBar('Нарезка', 0, `Генерация чанков... Время: ${progress.timemark}`);
                }
            })
            .on('end', () => {
                drawProgressBar('Нарезка', 100, `Завершено успешно!`);
                console.log(); // Перенос строки
                resolve();
            })
            .on('error', (err) => {
                console.log();
                reject(err);
            })
            .run();
    });
}

// Этап 3: Загрузка в Telegram
async function uploadChunks(playlistPath, tempDir) {
    console.log(`\n[*] Этап 3/3: Загрузка чанков в Telegram...`);
    
    const m3u8Content = fs.readFileSync(playlistPath, 'utf8');
    const lines = m3u8Content.split('\n');
    const tsFiles = lines.filter(l => l.endsWith('.ts'));
    
    let fileIdMap = {};
    let uploadedCount = 0;
    const totalCount = tsFiles.length;

    for (let i = 0; i < tsFiles.length; i++) {
        const file = tsFiles[i];
        const filePath = path.join(tempDir, file);
        
        let success = false;
        let attempts = 0;
        
        while (!success) {
            try {
                const percent = (uploadedCount / totalCount) * 100;
                drawProgressBar('Загрузка', percent, `Чанк ${uploadedCount}/${totalCount} [${file}]`);
                
                const options = topicId ? { message_thread_id: topicId } : {};
                const fileStream = fs.createReadStream(filePath);
                
                const msg = await bot.sendDocument(channelId, fileStream, options);
                fileIdMap[file] = msg.document.file_id;
                
                uploadedCount++;
                drawProgressBar('Загрузка', (uploadedCount / totalCount) * 100, `Чанк ${uploadedCount}/${totalCount} [Успех]`);
                
                success = true;
                await new Promise(r => setTimeout(r, 1000)); // Пауза 1 секунда
                
            } catch (error) {
                attempts++;
                const errMsg = error.message;
                
                if (errMsg.includes('retry after')) {
                    const match = errMsg.match(/retry after (\d+)/);
                    const waitTime = match ? parseInt(match[1]) : 30;
                    drawProgressBar('Лимит API', (uploadedCount / totalCount) * 100, `Ждем ${waitTime} сек... (Попытка ${attempts})`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                } else {
                    drawProgressBar('Ошибка', (uploadedCount / totalCount) * 100, `Неизвестная ошибка, ждем 5 сек...`);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        }
    }
    
    console.log(); // Перенос строки
    return fileIdMap;
}

async function main() {
    console.clear();
    console.log('==============================================');
    console.log(' VOD Hyver - Умный Загрузчик (Full Download)');
    console.log('==============================================');

    const args = process.argv.slice(2);
    const isAuto = args.includes('--auto');
    let targetUrl = isAuto ? "https://www.twitch.tv/hyver/videos" : args[0];

    if (!targetUrl) {
        targetUrl = await askQuestion('Введите ссылку на Twitch/YouTube видео: ');
        if (!targetUrl) return;
    }

    let vods = [];
    if (fs.existsSync(VODS_JSON_PATH)) {
        vods = JSON.parse(fs.readFileSync(VODS_JSON_PATH));
    }

    const metadata = await getMetadata(targetUrl, isAuto);
    console.log(`\n[VOD] ${metadata.title}`);
    console.log(`[ID] ${metadata.id} | [Длительность] ${metadata.duration}`);

    // Проверка на дубликат
    if (vods.some(v => v.originalId === metadata.id)) {
        console.log(`\n✅ Видео уже есть в базе данных. Обновление не требуется.`);
        return;
    }

    let category = "Just Chatting";
    let youtubeId = "";
    if (!isAuto) {
        category = await askQuestion('\nКатегория/Игра (по умолч. Just Chatting): ') || "Just Chatting";
        let ytUrl = await askQuestion('Ссылка на YouTube (оставьте пустым, если нет): ');
        if (ytUrl.includes('v=')) youtubeId = ytUrl.split('v=')[1].split('&')[0];
        else if (ytUrl.includes('youtu.be/')) youtubeId = ytUrl.split('youtu.be/')[1].split('?')[0];
    }

    const newId = (vods.length > 0 ? Math.max(...vods.map(v => parseInt(v.id) || 0)) + 1 : 1).toString();
    
    // Подготовка директорий
    if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    const thumbnailPath = `/thumbnails/${newId}.jpg`;
    await downloadThumbnail(metadata.thumbnailUrl, path.join(THUMBNAILS_DIR, `${newId}.jpg`));

    const tempDir = path.resolve(`./temp_vod_${newId}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const mp4Path = path.join(tempDir, 'source.mp4');
    const playlistPath = path.join(tempDir, 'master.m3u8');
    
    const cleanId = metadata.id ? metadata.id.replace('v', '') : '';
    const fetchUrl = cleanId ? `https://www.twitch.tv/videos/${cleanId}` : targetUrl;

    // ЗАПУСК КОНВЕЙЕРА
    try {
        await downloadFullVideo(fetchUrl, mp4Path);
        await chunkLocalVideo(mp4Path, playlistPath);
        const fileIdMap = await uploadChunks(playlistPath, tempDir);

        console.log('\n[*] Этап Сборки: Генерация финального плейлиста...');
        let m3u8Content = fs.readFileSync(playlistPath, 'utf8');
        
        for (const [filename, fileId] of Object.entries(fileIdMap)) {
            m3u8Content = m3u8Content.replace(filename, `/api/proxy?file_id=${fileId}`);
        }

        const finalVodDir = path.join(VODS_DIR, newId);
        if (!fs.existsSync(finalVodDir)) fs.mkdirSync(finalVodDir, { recursive: true });
        fs.writeFileSync(path.join(finalVodDir, 'master.m3u8'), m3u8Content);

        console.log('[*] Обновление базы данных (vods.json)...');
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const date = new Date();
        const dateString = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

        const newVod = {
            id: newId,
            originalId: metadata.id,
            title: metadata.title,
            date: dateString,
            duration: metadata.duration,
            views: "0",
            category: category,
            thumbnail: thumbnailPath,
            youtubeId: youtubeId
        };

        vods.unshift(newVod);
        fs.writeFileSync(VODS_JSON_PATH, JSON.stringify(vods, null, 2));

        console.log('[*] Очистка временных файлов (удаление гигабайтов мусора)...');
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log('\n==================================');
        console.log('✅ УСПЕХ! Стрим успешно добавлен!');
        console.log(`ID: ${newId} | ${newVod.title}`);
        console.log(`Не забудьте сделать: git add . && git commit -m "Auto add VOD ${newId}" && git push`);
        console.log('==================================\n');

    } catch (err) {
        console.error('\n❌ Критическая ошибка в процессе:', err.message);
    }
}

main().catch(console.error);
