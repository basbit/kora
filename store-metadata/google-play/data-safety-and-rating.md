# Google Play — Data safety и Content rating

## Data safety (Безопасность данных)
> Статус: заполнено и отправлено на ревью 2026-06-18 (билд с Google/Firebase Analytics).
> Содержимое древа — НЕ собирается.

Задекларированный сбор (всё: Collected, не Shared, не ephemeral, обязательно):

| Категория Play | Тип данных | Назначение | Shared |
|---|---|---|---|
| **App activity** | App interactions (просмотры экранов/события) | Analytics | No |
| **Device or other IDs** | Device or other IDs (рекламный/GA-идентификатор) | Analytics + Advertising or marketing | No |
| **Location** | Approximate location (по IP) | Analytics | No |

- **Encryption in transit:** Да (GA передаёт по HTTPS).
- **Account creation:** приложение не позволяет создавать аккаунты; вход через внешние аккаунты — нет.
- **Data deletion:** содержимое древа удаляется на устройстве («Очистить»); по аналитике отдельного механизма запроса удаления нет (данные не связаны с личностью).
- **Shared:** нет (Google выступает обработчиком/сервис-провайдером).
- Содержимое древа (имена, даты, фото, заметки) в Data safety НЕ указывать — оно не покидает устройство.

### Advertising ID
Firebase Analytics на Android тянет `com.google.android.gms.permission.AD_ID`. Решено **оставить**
и задекларировать Advertising ID = **«Да»**, цель **«Advertising or marketing»** (в форме Play нет
пункта «Аналитика» для рекламного ID). Реклама в приложении не показывается; идентификатор приходит
только из Firebase Analytics и используется для аналитики/оценки эффективности. Альтернатива на будущее:
убрать разрешение AD_ID (config-plugin) и переключить декларацию на «Нет».

## Content rating (анкета IARC)
- Категория приложения: **Reference / News / Education / Other** → Utility / Lifestyle.
- На все вопросы о насилии, сексуальном контенте, нецензурной лексике, азартных играх,
  наркотиках, страшных сценах — **Нет**.
- Обмен данными о местоположении/контактами между пользователями — **Нет**.
- Итог: **Для всех / Everyone (3+)**.

## Разрешения для обоснования (Play Console может запросить)
- **READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE** — выбор фото из галереи для карточек людей.
- **WRITE_EXTERNAL_STORAGE** — сохранение файла экспорта (резервная копия).

## ⚠️ Перед сборкой Android (см. ../README.md)
- Удалить `android.permission.RECORD_AUDIO` из app.json — приложение не использует микрофон,
  иначе Play потребует обоснование разрешения, а оно отсутствует.
