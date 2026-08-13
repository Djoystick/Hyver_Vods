import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const VODS_JSON_PATH = path.resolve('../frontend/public/data/vods.json');
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@HYVERTTV';

function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
        });
    });
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

function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
}

// Поиск общих слов (нечеткий поиск)
function getWordMatchScore(title1, title2) {
    const words1 = title1.toLowerCase().replace(/[^a-zа-я0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const words2 = title2.toLowerCase().replace(/[^a-zа-я0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    
    let matches = 0;
    for (const w1 of words1) {
        if (words2.includes(w1)) matches++;
    }
    
    const minWords = Math.min(words1.length, words2.length);
    if (minWords === 0) return 0;
    return matches / minWords;
}

async function main() {
    console.log('[*] Запуск продвинутого мэтчинга VK <-> YouTube...');
    
    let vods = JSON.parse(fs.readFileSync(VODS_JSON_PATH, 'utf-8'));
    
    console.log('1. Получение структуры с YouTube...');
    let ytVideos = [];
    try {
        const plOutput = await execPromise(`yt-dlp --cookies cookies.txt --dump-json --flat-playlist "${YOUTUBE_CHANNEL_URL}/playlists"`);
        const parsedPls = parseYtDlpJson(plOutput);
        for (const pl of parsedPls) {
            try {
                const vidOutput = await execPromise(`yt-dlp --cookies cookies.txt --dump-json --flat-playlist "https://www.youtube.com/playlist?list=${pl.id}"`);
                const parsedVids = parseYtDlpJson(vidOutput);
                for (const v of parsedVids) {
                    if (!ytVideos.find(existing => existing.id === v.id)) {
                        ytVideos.push(v);
                    }
                }
            } catch (err) {}
        }
        
        const allVidOutput = await execPromise(`yt-dlp --cookies cookies.txt --dump-json --flat-playlist "${YOUTUBE_CHANNEL_URL}/videos"`);
        const allParsedVids = parseYtDlpJson(allVidOutput);
        for (const v of allParsedVids) {
            if (!ytVideos.find(existing => existing.id === v.id)) {
                ytVideos.push(v);
            }
        }
    } catch (e) {
        console.error('Ошибка при работе с yt-dlp:', e.message);
        return;
    }
    
    console.log(`Скачано ${ytVideos.length} видео с YouTube.`);
    
    let matchedCount = 0;

    for (const yt of ytVideos) {
        // Пропускаем те, что уже сматчены
        if (vods.find(v => v.youtubeId === yt.id)) continue;
        
        const normYtTitle = normalizeTitle(yt.title);
        
        // Сначала пробуем точный поиск, но только среди тех, у кого ЕЩЕ НЕТ youtubeId
        let matchedVod = vods.find(v => normalizeTitle(v.title) === normYtTitle && !v.youtubeId);
        
        // Если не нашли точный, пробуем нечеткий (содержит друг друга)
        if (!matchedVod) {
            matchedVod = vods.find(v => !v.youtubeId && (normalizeTitle(v.title).includes(normYtTitle) || normYtTitle.includes(normalizeTitle(v.title))));
        }

        // Если все еще не нашли, пробуем по совпадению слов (>70% общих слов)
        if (!matchedVod) {
            let bestScore = 0;
            let bestMatch = null;
            for (const v of vods) {
                if (v.youtubeId) continue;
                const score = getWordMatchScore(v.title, yt.title);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = v;
                }
            }
            if (bestScore >= 0.7) {
                matchedVod = bestMatch;
            }
        }
        
        if (matchedVod) {
            matchedVod.youtubeId = yt.id;
            console.log(`  ✓ Сматчилось: [VK] ${matchedVod.title} <---> [YT] ${yt.title}`);
            matchedCount++;
        }
    }
    
    console.log(`\nДополнительно сматчено видео: ${matchedCount}`);
    
    fs.writeFileSync(VODS_JSON_PATH, JSON.stringify(vods, null, 2));
    console.log('База vods.json обновлена!');
}

main().catch(console.error);
