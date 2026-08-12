import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file_id');

  if (!fileId) {
    return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
  }

  try {
    // 1. Получаем путь к файлу по его file_id через API Telegram
    const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileRes = await fetch(getFileUrl);
    const fileData = await fileRes.json();

    if (!fileData.ok) {
      return NextResponse.json({ error: 'Telegram API Error' }, { status: 404 });
    }

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // 2. Скачиваем файл из Telegram и отдаем потоком (стримим) прямо клиенту
    const streamRes = await fetch(downloadUrl);
    
    // Создаем Headers для передачи видео-чанка
    const headers = new Headers();
    headers.set('Content-Type', 'video/MP2T'); // Формат .ts
    headers.set('Cache-Control', 'public, max-age=86400'); // Кешируем чанки на сутки
    
    // Возвращаем поток клиенту
    return new NextResponse(streamRes.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
