# App Store Connect — ответы на опросы и заметки для ревью

## App Privacy («Конфиденциальность приложения»)
Выбрать: **Data Not Collected** / «Данные не собираются».
Обоснование: приложение хранит всё локально, ничего не отправляет на серверы, нет аналитики,
рекламы и трекинга (подтверждено кодом и Privacy Policy).

Если ASC всё же требует расшифровать по типам данных — для каждого пункта:
- Используется ли для трекинга? **Нет.**
- Связано ли с пользователем? **Нет.**
- (Но корректный ответ — именно «Data Not Collected».)

## Age Rating («Возрастной рейтинг»)
Ответить **«Нет / None»** на все вопросы анкеты (насилие, контент для взрослых,
азартные игры, нелимитированный веб-доступ, пользовательский контент из сети и т.д.).
Итоговый рейтинг: **4+**.

## Export Compliance («Экспортное соответствие / шифрование»)
- Использует ли приложение шифрование? Для целей экспорта — **Нет**
  (`ITSAppUsesNonExemptEncryption = false` уже задано в app.json,
  поэтому при загрузке билда вопрос не должен появляться).

## Content Rights («Права на контент»)
- Содержит ли приложение стороннего контента? **Нет.** Весь контент — собственный
  либо вводится пользователем и хранится локально.

## Sign-in / демо-аккаунт для ревью
- Аккаунт/логин **не требуется** — приложение работает офлайн без регистрации.
  В поле «Sign-in required» указать **No**.

## App Review Notes (заметки для ревьюера, EN)
KORA is a fully offline family tree app. No account or login is required — you can start
adding people immediately. All data is stored locally on the device; nothing is sent to any
server. Photos are added only from the device photo library. The app does not use the camera.
Import/Export produces a local ZIP/JSON file for backup and transfer.

## Контакт для ревью
- Имя: Roman Bastrakov
- Email: (указать актуальный e-mail аккаунта разработчика)
- Phone: (указать)
