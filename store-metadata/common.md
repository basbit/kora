# КОРⱯ (KORA) — общие данные для сторов

> Все данные проверены по исходному коду приложения (app.json, src/). Пишем только то, что приложение реально делает.

## Идентификаторы
- **App name (отображаемое):** КОРⱯ
- **iOS bundle identifier:** `com.rbaster.kora`
- **Android package:** `com.rbaster.kora`
- **Apple App ID:** 6754966534
- **EAS projectId:** 7bcb0810-67f4-4d33-9cf3-9d7b19cd995e
- **Marketing version:** 1.0.1
- **iOS buildNumber:** 1 · **Android versionCode:** 2
- **EAS аккаунт:** rbaster

## Ссылки
- **Лендинг / маркетинг:** https://rbaster.ru/apps/kora/
- **Web-версия:** https://kora.rbaster.ru/
- **GitHub (исходный код):** https://github.com/basbit/kora
- **Лицензия:** MIT — https://github.com/basbit/kora/blob/main/LICENSE
- **Privacy Policy (EN):** https://github.com/basbit/kora/blob/main/PRIVACY_POLICY.md
- **Privacy Policy (RU):** https://github.com/basbit/kora/blob/main/PRIVACY_POLICY_RU.md
- **Поддержка:** https://github.com/basbit/kora/issues
- **Автор:** Roman Bastrakov

## Категория
- **App Store:** Lifestyle (Образ жизни). Вторичная — при желании: Utilities.
- **Google Play:** Lifestyle (Образ жизни).

## Возрастной рейтинг
- **4+ / Everyone.** Нет пользовательского контента из сети, рекламы, покупок, насилия.

## Шифрование (App Store export compliance)
- `ITSAppUsesNonExemptEncryption = false` (уже в app.json).
- Ответ в ASC: **«Нет»** — приложение не использует нестандартное шифрование.

## Конфиденциальность (что собирает приложение)
- **Ничего.** Данные хранятся только на устройстве, не передаются на серверы, нет облака,
  нет аналитики, рекламы и трекинга. Нет аккаунтов и регистрации.

## Реально используемые разрешения (по коду)
- **Доступ к фото-библиотеке (чтение)** — `expo-image-picker.launchImageLibraryAsync` для добавления фото.
- **Хранилище (Android)** — для импорта/экспорта архива (ZIP/JSON).

## ⚠️ Нестыковки в манифесте — проверить ДО сборки (см. README.md)
- Объявлено, но НЕ используется в коде: камера (`NSCameraUsageDescription`, нет вызова камеры —
  только выбор из галереи) и `android.permission.RECORD_AUDIO`.
- Privacy Policy упоминает доступ к камере, которого по факту нет.
