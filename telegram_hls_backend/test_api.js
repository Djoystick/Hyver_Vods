require('dotenv').config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const fileId = 'BQACAgIAAyEGAATsaaHLAAIBRWp8_anGjubrJlNpdoJvlvfzSt-KAAJ9oQACwqDpSzX0wQABmi4pIj0E';
fetch('https://api.telegram.org/bot' + token + '/getFile?file_id=' + fileId)
  .then(res => res.json())
  .then(data => console.log(data));
