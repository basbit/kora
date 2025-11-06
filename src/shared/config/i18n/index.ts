import i18n from "i18next";
import { initReactI18next } from "react-i18next";

function detectLanguage(): string {
  try {
    const Localization = require("expo-localization");
    const locales = Localization.getLocales?.() ?? [];
    if (locales.length && locales[0]?.languageCode)
      return locales[0].languageCode;
    const locale = Localization.locale as string | undefined;
    if (locale) return locale.split("-")[0];
  } catch {
    void 0;
  }
  return "en";
}

const resources = {
  en: {
    translation: {
      import_archive: "Import archive",
      export_archive: "Export archive",
      add: "Add",
      no_persons_prompt: "Add the first person",
      new_person: "New person",
      first_name: "First name",
      last_name: "Last name",
      birth_date: "Birth date (YYYY-MM-DD)",
      death_date: "Death date (YYYY-MM-DD)",
      comment: "Comment",
      photo: "Photo",
      parent_optional: "Parent (optional)",
      cancel: "Cancel",
      export_error: "Export error",
      import_error: "Import error",
      enter_first_name: "Enter first name",
      export_dialog_title: "Export tree",
      language_ru: "RU",
      language_en: "EN",
      settings: "Settings",
      ok: "OK",
      search: "Search…",
      about: "About",
      theme: "Theme",
      language: "Language",
      back: "Back",
      import: "Import",
      export: "Export",
      spouse_optional: "Spouse (optional)",
      about_app_title: "КОРⱯ",
      about_app_description:
        "A simple and convenient app for creating your family tree.\n\nNo registration or authorization — all data is stored only on your device.\n\nAdd family members, mark relationships and dates, build your tree easily and clearly.\n\nImport and export data for backup or transfer between devices.\n\nКОРɐ — your roots, always with you.",
      license: "License",
      license_text: "This app is open source under MIT License",
      github: "Source code on GitHub",
      support: "Support the project",
      theme_label: "Theme",
      current_theme: "Current",
      language_label: "Language",
      current_language: "Current",
      data_label: "Data",
      import_label: "Import",
      export_label: "Export",
      clear_label: "Clear",
      total_people: "Total people",
      life_dates: "Life dates",
      born: "Born",
      died: "Died",
      parents_label: "Parents",
      spouse_label: "Spouse",
      comment_label: "Comment",
      delete_label: "Delete",
      delete_confirm_title: "Delete?",
      delete_confirm_message: "Delete {{name}}?",
      close_label: "Close",
      edit_label: "Edit",
      clear_data_title: "Clear",
      clear_data_message: "Delete all data?",
    },
  },
  ru: {
    translation: {
      import_archive: "Импорт архива",
      export_archive: "Экспорт архива",
      add: "Добавить",
      no_persons_prompt: "Добавьте первого человека",
      new_person: "Новый человек",
      first_name: "Имя",
      last_name: "Фамилия",
      birth_date: "Дата рождения (YYYY-MM-DD)",
      death_date: "Дата смерти (YYYY-MM-DD)",
      comment: "Комментарий",
      photo: "Фото",
      parent_optional: "Родитель (опционально)",
      cancel: "Отмена",
      export_error: "Ошибка экспорта",
      import_error: "Ошибка импорта",
      enter_first_name: "Введите имя",
      export_dialog_title: "Экспорт дерева",
      language_ru: "RU",
      language_en: "EN",
      settings: "Настройки",
      ok: "ОК",
      search: "Поиск…",
      about: "О приложении",
      theme: "Тема",
      language: "Язык",
      back: "Назад",
      import: "Импорт",
      export: "Экспорт",
      spouse_optional: "Супруг(а) (опционально)",
      about_app_title: "КОРⱯ",
      about_app_description:
        "Простое и удобное приложение для создания вашего генеалогического древа.\n\nБез регистрации и авторизации — все данные хранятся только на вашем устройстве.\n\nДобавляйте членов семьи, отмечайте связи и даты, стройте дерево легко и наглядно.\n\nИмпортируйте и экспортируйте данные для резервного копирования или переноса между устройствами.\n\nКОРɐ — ваши корни, всегда с вами.",
      license: "Лицензия",
      license_text:
        "Это приложение с открытым исходным кодом под лицензией MIT",
      github: "Исходный код на GitHub",
      support: "Поддержать проект",
      theme_label: "Тема",
      current_theme: "Текущая",
      language_label: "Язык",
      current_language: "Текущий",
      data_label: "Данные",
      import_label: "Импорт",
      export_label: "Экспорт",
      clear_label: "Очистить",
      total_people: "Всего людей",
      life_dates: "Даты жизни",
      born: "Родился",
      died: "Умер",
      parents_label: "Родители",
      spouse_label: "Супруг(а)",
      comment_label: "Комментарий",
      delete_label: "Удалить",
      delete_confirm_title: "Удалить?",
      delete_confirm_message: "Удалить {{name}}?",
      close_label: "Закрыть",
      edit_label: "Редактировать",
      clear_data_title: "Очистить",
      clear_data_message: "Удалить все данные?",
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: "v3",
      resources,
      lng: detectLanguage(),
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    })
    .catch(() => undefined);
}

export default i18n;
