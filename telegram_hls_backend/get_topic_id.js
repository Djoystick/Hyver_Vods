import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Ошибка: Токен не найден в .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('Бот запущен и ждет сообщения...');
console.log('Пожалуйста, добавьте бота в вашу группу, откройте тему "Чанки" и напишите туда любое сообщение!');

bot.on('message', (msg) => {
    console.log('\n--- ПОЛУЧЕНО СООБЩЕНИЕ ---');
    console.log(`Текст: ${msg.text}`);
    console.log(`Chat ID (ID вашей группы): ${msg.chat.id}`);
    
    if (msg.is_topic_message && msg.message_thread_id) {
        console.log(`Message Thread ID (ID темы "Чанки"): ${msg.message_thread_id}`);
        console.log('\nОтлично! Скопируйте эти два ID. Теперь можно остановить скрипт (Ctrl+C).');
    } else {
        console.log('Внимание: Это сообщение отправлено не в тему (или у группы выключены темы).');
    }
});
