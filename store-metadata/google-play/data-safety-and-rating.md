# Google Play — Data safety и Content rating

## Data safety (Безопасность данных)
> ⚠️ Билд БЕЗ аналитики = «No data collected». С появлением Google Analytics (новый билд) —
> задекларировать сбор, как ниже. Сверить с официальным маппингом Google «Data safety for GA4».

С Google Analytics приложение **собирает** данные (содержимое древа — НЕ собирается):

| Категория Play | Тип данных | Назначение | Shared | Optional |
|---|---|---|---|---|
| **App activity** | App interactions (просмотры экранов/события) | Analytics | No | No (обязательно для аналитики) |
| **App info & performance** | Crash logs, Diagnostics | Analytics | No | — |
| **Device or other IDs** | App instance ID (GA) | Analytics | No | — |
| **Location** | Approximate location (по IP) | Analytics | No | — |

- **Encryption in transit:** Да (GA передаёт по HTTPS).
- **Data deletion:** содержимое древа удаляется на устройстве («Очистить»); аналитика анонимна и управляется через Google Analytics.
- **Shared:** нет (Google выступает обработчиком/сервис-провайдером).
- Содержимое древа (имена, даты, фото, заметки) в Data safety НЕ указывать — оно не покидает устройство.

### ⚠️ Advertising ID
GA4 по умолчанию не использует Advertising ID (без Google Signals). Если в манифесте присутствует
`com.google.android.gms.permission.AD_ID` (тянется зависимостями) и реклама не нужна — лучше
исключить это разрешение в app.json, тогда декларация Advertising ID = «Нет» корректна.

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
