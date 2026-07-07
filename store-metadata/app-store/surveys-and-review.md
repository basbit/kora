# App Store Connect — ответы на опросы и заметки для ревью

## App Privacy («Конфиденциальность приложения»)
> Статус: билд с Google/Firebase Analytics — App Privacy = «Yes, we collect data».
> Содержимое древа НЕ собирается. **Только Analytics** — без рекламных целей (см. ниже про 5.1.2).

Задекларированные типы данных:

| Тип данных | Категория ASC | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| ID устройства (GA client/app-instance ID) | **Identifiers → Device ID** | No | No | Analytics |
| Просмотры экранов, взаимодействия | **Usage Data → Product Interaction** | No | No | Analytics |
| Примерная геолокация по IP | **Location → Coarse Location** | No | No | Analytics |

- **Used for tracking: No** для всех — IDFA не собирается, нет ATT-промпта.
- ⚠️ **5.1.2(i):** Apple отклонил билд 16, когда Device ID был помечен «Developer's Advertising or Marketing» (Apple трактует это как tracking → требует ATT). На iOS приложение НЕ трекает (Firebase iOS не собирает IDFA), поэтому цель откатили на **только Analytics**. На Android отдельно: AD_ID присутствует → там декларируется Advertising/marketing (это корректно для Play, разные платформы).
- **Linked to the user: No** — не связано с личностью пользователя, не привязано к содержимому древа.
- Содержимое древа (имена, даты, фото, заметки) — **НЕ собирается** (остаётся на устройстве).

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
