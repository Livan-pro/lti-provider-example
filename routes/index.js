const express = require('express');
const router = express.Router();
const lti = require('ims-lti');
const { promisify } = require('util');
require('dotenv').config();

// создание Provider с заданными ключом и секретом
const provider = new lti.Provider(process.env.CONSUMER_KEY, process.env.CONSUMER_SECRET);
// получение асинхронной функции для валидации запроса запуска
const validateLaunch = promisify(provider.valid_request);

router.post('/lti-launch', async (req, res) => {
  // валидация параметров и подписи запроса
  const isValid = await validateLaunch(req);
  // ошибка 403 при неверном запросе
  if (!isValid) return res.sendStatus(403);
  // ошибка 400, если Tool Consumer не поддерживает сохранение оценок
  if (!provider.outcome_service) return res.sendStatus(400);

  // генерация новой оценки
  const score = Math.random();
  // получение асинхронной функции для отправки оценки в Tool Consumer
  const sendReplaceResult = promisify(
    provider.outcome_service.send_replace_result.bind(provider.outcome_service)
  );
  // сохранение новой оценки в Tool Consumer
  const success = await sendReplaceResult(score);
  // ошибка 500, если сохранение оценки не удалось
  if (!success) return res.sendStatus(500);

  // получение имени пользователя
  const userName = req.body.lis_person_name_given || "Студент";
  // вывод текста пользователю
  res.send(`${userName}, твоя новая оценка: ${score}. Проверь журнал оценок!`);
});

module.exports = router;
