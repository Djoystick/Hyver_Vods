import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import https from 'https';
import http from 'http';

const VODS_JSON_PATH = path.resolve('../frontend/public/data/vods.json');
const PLAYLISTS_JSON_PATH = path.resolve('../frontend/public/data/playlists.json');
const THUMBNAILS_DIR = path.resolve('../frontend/public/thumbnails');
const VK_LINKS_PATH = path.resolve('../vk_links.txt');
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@HYVERTTV';

function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
        });
    });
}

async function execWithRetry(cmd, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await execPromise(cmd);
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

function parseYtDlpJson(output) {
    return output.trim().split('\n').filter(Boolean).map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
}

function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve();
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download image, status code: ${res.statusCode}`));
            }
            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Мая', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
function formatDate(timestamp) {
    if (!timestamp) return "Неизвестно";
    const d = new Date(timestamp * 1000);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
}

function determineCategory(title) {
    const t = title.toLowerCase();
    if (t.includes('смотрим') || t.includes('фильм') || t.includes('кино') || t.includes('сериал') || t.includes('аниме') || t.includes('шоу')) {
        return "Просмотры (Кино/Шоу)";
    }
    if (t.includes('разговор') || t.includes('just chatting') || t.includes('подкаст') || t.includes('румтур')) {
        return "Just Chatting";
    }
    return "Игры";
}

async function main() {
    console.log('[*] Запуск импорта (Базовый источник: VK)...\n');

    let vods = [];
    if (fs.existsSync(VODS_JSON_PATH)) {
        vods = JSON.parse(fs.readFileSync(VODS_JSON_PATH, 'utf-8'));
    }
    
    let nextId = 1;
    if (vods.length > 0) {
        const maxId = Math.max(...vods.map(v => parseInt(v.id) || 0));
        nextId = maxId + 1;
    }

    if (!fs.existsSync(THUMBNAILS_DIR)){
        fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    }

    // 1. Обработка VK видео как ОСНОВНОГО источника
    console.log('[1/4] Собираем видео из ВКонтакте (через vk_links.txt)...');
    let vkVideos = [];
    if (fs.existsSync(VK_LINKS_PATH)) {
        const links = fs.readFileSync(VK_LINKS_PATH, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
        console.log(`  - Найдено ссылок VK: ${links.length}`);
        
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            try {
                const vkOutput = await execWithRetry(`yt-dlp --dump-json "${link}"`, 3);
                const vkData = parseYtDlpJson(vkOutput)[0];
                
                if (vkData) {
                    if (vods.find(v => v.vkId === vkData.id)) {
                        console.log(`    [${i+1}/${links.length}] Пропуск (уже в базе): ${vkData.title}`);
                        continue;
                    }

                    const thumbPath = path.join(THUMBNAILS_DIR, `${nextId}.jpg`);
                    if (vkData.thumbnail && !fs.existsSync(thumbPath)) {
                        try {
                            await downloadImage(vkData.thumbnail, thumbPath);
                        } catch (imgErr) {
                            console.log(`    ! Ошибка скачивания обложки для ${vkData.title}`);
                        }
                    }

                    const newVod = {
                        id: nextId.toString(),
                        originalId: vkData.id,
                        title: vkData.title,
                        date: formatDate(vkData.timestamp || (Date.now()/1000)),
                        duration: formatDuration(vkData.duration),
                        views: "0",
                        category: determineCategory(vkData.title),
                        thumbnail: fs.existsSync(thumbPath) ? `/thumbnails/${nextId}.jpg` : "/thumbnails/default.jpg",
                        youtubeId: "",
                        vkId: vkData.id,
                        playlistId: ""
                    };
                    
                    vods.push(newVod);
                    vkVideos.push(newVod); // для дальнейшего мэтчинга
                    console.log(`    [${i+1}/${links.length}] ✓ Добавлено VK: ${newVod.title}`);
                    nextId++;
                }
            } catch (e) {
                console.log(`    [${i+1}/${links.length}] x Ошибка парсинга VK (после 3 попыток): ${link}`);
            }
        }
    } else {
        console.log('  - Файл vk_links.txt не найден. VK пропущен.');
    }

    // 2. Получение плейлистов YouTube
    console.log('\n[2/4] Собираем информацию о плейлистах с YouTube (только структуру)...');
    let playlists = [];
    let ytVideos = [];
    
    try {
        const plOutput = await execWithRetry(`yt-dlp --dump-json --flat-playlist "${YOUTUBE_CHANNEL_URL}/playlists"`);
        const parsedPls = parseYtDlpJson(plOutput);
        
        for (const pl of parsedPls) {
            const plId = pl.id;
            console.log(`  - Структура плейлиста: ${pl.title}`);
            
            playlists.push({
                id: plId,
                title: pl.title,
                thumbnail: "/thumbnails/default.jpg", // Заполним позже из видео
                vodIds: []
            });

            try {
                const vidOutput = await execWithRetry(`yt-dlp --dump-json --flat-playlist "https://www.youtube.com/playlist?list=${plId}"`);
                const parsedVids = parseYtDlpJson(vidOutput);
                for (const v of parsedVids) {
                    v.playlistId = plId;
                    ytVideos.push(v);
                }
            } catch (err) {
                console.log(`    x Не удалось получить видео из плейлиста ${pl.title}`);
            }
        }
    } catch (e) {
        console.error('[-] Ошибка при парсинге плейлистов:', e.message ? e.message.split('\n')[0] : String(e));
    }

    // 3. Сопоставление YouTube видео с VK
    console.log('\n[3/4] Сопоставляем видео YouTube с базой VK...');
    try {
        const allVidOutput = await execWithRetry(`yt-dlp --dump-json --flat-playlist "${YOUTUBE_CHANNEL_URL}/videos"`);
        const allParsedVids = parseYtDlpJson(allVidOutput);
        
        for (const v of allParsedVids) {
            if (!ytVideos.find(existing => existing.id === v.id)) {
                ytVideos.push(v);
            }
        }
        
        for (const yt of ytVideos) {
            const normYtTitle = normalizeTitle(yt.title);
            // Ищем это видео среди уже добавленных VK видео
            const matchedVod = vods.find(v => normalizeTitle(v.title) === normYtTitle && !v.youtubeId);
            
            if (matchedVod) {
                matchedVod.youtubeId = yt.id;
                if (yt.playlistId) {
                    matchedVod.playlistId = yt.playlistId;
                    const pl = playlists.find(p => p.id === yt.playlistId);
                    if (pl) pl.vodIds.push(matchedVod.id);
                }
                console.log(`  ✓ Связано: ${matchedVod.title} (VK + YT)`);
            } else if (!vods.find(v => v.youtubeId === yt.id)) {
                // Видео есть только на Ютубе
                console.log(`  ! Найдено эксклюзивное видео YT: ${yt.title}`);
                // Можно добавить скачивание обложки Ютуба здесь, если нужно
            }
        }
    } catch (e) {
         console.error('[-] Ошибка при парсинге канала Ютуб:', e.message ? e.message.split('\n')[0] : String(e));
    }

    // 4. Финализация плейлистов
    console.log('\n[4/4] Назначение обложек плейлистам...');
    for (const pl of playlists) {
        if (pl.vodIds.length > 0) {
            const firstVod = vods.find(v => v.id === pl.vodIds[0]);
            if (firstVod && firstVod.thumbnail) {
                pl.thumbnail = firstVod.thumbnail;
                console.log(`  - Плейлист "${pl.title}" получил обложку от "${firstVod.title}"`);
            }
        }
    }

    fs.writeFileSync(VODS_JSON_PATH, JSON.stringify(vods, null, 2));
    fs.writeFileSync(PLAYLISTS_JSON_PATH, JSON.stringify(playlists, null, 2));

    console.log('\n✅ Импорт успешно завершен! Базы vods.json и playlists.json обновлены.');
}

main().catch(console.error);
