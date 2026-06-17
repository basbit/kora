# App Store Connect — ответы на опросы и заметки для ревью

## App Privacy («Конфиденциальность приложения»)
> ⚠️ Версии БЕЗ аналитики (текущий билд iOS 11) = **Data Not Collected**. Как только выйдет
> билд с Google Analytics — обновить на сбор данных, как ниже. НЕ менять, пока в ревью билд без GA.

Приложение с Google Analytics собирает данные (содержимое древа НЕ собирается). Указать «Yes, we collect data» и задекларировать типы:

| Тип данных | Категория ASC | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Идентификатор экземпляра приложения (GA client/app instance ID) | **Identifiers → Device ID** | No | No | Analytics |
| Просмотры экранов, взаимодействия | **Usage Data → Product Interaction** | No | No | Analytics |
| Диагностика/производительность | **Diagnostics → Performance / Other** | No | No | Analytics |
| Примерная геолокация по IP | **Location → Coarse Location** | No | No | Analytics |

- **Used for tracking: No** для всех (не объединяем с данными других компаний для рекламы, не используем IDFA/рекламу).
- **Linked to the user: No** (анонимно, не привязано к содержимому древа).
- Содержимое древа (имена, даты, фото, заметки) — **НЕ собирается** (остаётся на устройстве).
- Сверить с официальным маппингом Google «GA4 → App privacy» при заполнении.

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
