import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Pressable,
  Modal,
  Linking,
  ScrollView,
  Platform,
} from "react-native";

import { colors } from "@shared/config/theme/colors";
import { Alert } from "@shared/lib/platform/alert";
import { clearStorage } from "@shared/lib/storage/indexedDB";

import {
  exportTreeArchive,
  importTreeArchive,
  exportMultiTreeArchive,
  importMultiTreeArchive,
} from "@features/importExport/model/files";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreeStore } from "@app/providers/StoreProvider";
import { useTreesStore } from "@app/providers/TreesProvider";

export function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, setTheme, setLanguage, currentTheme, currentLanguage } =
    useSettings();
  const { exportJson, importJson, personsById } = useTreeStore();
  const { trees, importTree } = useTreesStore();
  const [aboutVisible, setAboutVisible] = useState(false);

  const theme = currentTheme === "dark" ? colors.dark : colors.light;

  const doExport = async () => {
    try {
      const json = exportJson();
      await exportTreeArchive(json);
    } catch (e) {
      Alert.alert("Export", String(e));
    }
  };
  const doImport = async () => {
    try {
      const json = await importTreeArchive();
      if (json) importJson(json);
    } catch (e) {
      Alert.alert("Import", String(e));
    }
  };
  const doExportAll = async () => {
    try {
      const meta = Object.fromEntries(trees.map((t) => [t.id, t]));
      await exportMultiTreeArchive(
        trees.map((t) => t.id),
        meta,
      );
    } catch (e) {
      Alert.alert("Export", String(e));
    }
  };
  const doImportAll = async () => {
    try {
      const results = await importMultiTreeArchive();
      if (!results?.length) return;
      for (const { name, treeJson } of results) {
        await importTree(name, JSON.parse(treeJson));
      }
    } catch (e) {
      Alert.alert("Import", String(e));
    }
  };
  const doClear = () => {
    Alert.alert(t("clear_data_title"), t("clear_data_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("ok"),
        style: "destructive",
        onPress: async () => {
          await clearStorage();
          importJson(JSON.stringify({ persons: [], positions: {} }));
        },
      },
    ]);
  };

  const openAppStore = () => {
    Linking.openURL("https://apps.apple.com/app/id/com.rbaster.kora");
  };

  const openGooglePlay = () => {
    Linking.openURL(
      "https://play.google.com/store/apps/details?id=com.rbaster.kora",
    );
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: theme.background,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: theme.primary }}>
        {t("settings")}
      </Text>

      <View
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          padding: 12,
          gap: 10,
        }}
      >
        <Text style={{ color: theme.secondary }}>{t("theme_label")}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip
            active={settings.theme === "system"}
            onPress={() => setTheme("system")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("theme_system")}
          </Chip>
          <Chip
            active={settings.theme === "light"}
            onPress={() => setTheme("light")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("theme_light")}
          </Chip>
          <Chip
            active={settings.theme === "dark"}
            onPress={() => setTheme("dark")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("theme_dark")}
          </Chip>
        </View>
        <Text style={{ color: theme.secondary }}>
          {t("current_theme")}: {currentTheme}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          padding: 12,
          gap: 10,
        }}
      >
        <Text style={{ color: theme.secondary }}>{t("language_label")}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip
            active={settings.language === "system"}
            onPress={() => setLanguage("system")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("lang_system")}
          </Chip>
          <Chip
            active={settings.language === "ru"}
            onPress={() => setLanguage("ru")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("lang_ru")}
          </Chip>
          <Chip
            active={settings.language === "en"}
            onPress={() => setLanguage("en")}
            accent={theme.accent}
            primary={theme.primary}
          >
            {t("lang_en")}
          </Chip>
        </View>
        <Text style={{ color: theme.secondary }}>
          {t("current_language")}: {currentLanguage}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          padding: 12,
          gap: 10,
        }}
      >
        <Text style={{ color: theme.secondary }}>{t("data_label")}</Text>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <IconBtn
            label={t("import_label")}
            icon="cloud-upload-outline"
            onPress={doImport}
            bg={theme.surfaceVariant}
            fg={theme.primary}
          />
          <IconBtn
            label={t("export_label")}
            icon="cloud-download-outline"
            onPress={doExport}
            bg={theme.surfaceVariant}
            fg={theme.primary}
          />
          <IconBtn
            label={t("import_all_label")}
            icon="archive-outline"
            onPress={doImportAll}
            bg={theme.surfaceVariant}
            fg={theme.primary}
          />
          <IconBtn
            label={t("export_all_label")}
            icon="server-outline"
            onPress={doExportAll}
            bg={theme.surfaceVariant}
            fg={theme.primary}
          />
          <IconBtn
            label={t("clear_label")}
            icon="trash-outline"
            onPress={doClear}
            bg={theme.error}
            fg="white"
          />
        </View>
        <Text style={{ color: theme.secondary }}>
          {t("total_people")}: {Object.keys(personsById).length}
        </Text>
      </View>

      {Platform.OS === "web" && (
        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            padding: 12,
            gap: 10,
          }}
        >
          <Text style={{ color: theme.secondary }}>
            {t("download_mobile_app")}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <IconBtn
              label={t("app_store")}
              icon="logo-apple"
              onPress={openAppStore}
              bg={theme.surfaceVariant}
              fg={theme.primary}
            />
            <IconBtn
              label={t("google_play")}
              icon="logo-google-playstore"
              onPress={openGooglePlay}
              bg={theme.surfaceVariant}
              fg={theme.primary}
            />
          </View>
        </View>
      )}

      <View>
        <Pressable
          onPress={() => setAboutVisible(true)}
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: theme.primary }}>{t("about")}</Text>
        </Pressable>
      </View>

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 10,
              width: "90%",
              maxHeight: "85%",
            }}
          >
            <ScrollView style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: theme.primary,
                  marginBottom: 8,
                }}
              >
                {t("about_app_title")}
              </Text>
              <Text style={{ color: theme.secondary, marginBottom: 16 }}>
                {t("language") === "Язык" ? "Версия 1.0.0" : "Version 1.0.0"}
              </Text>
              <Text
                style={{
                  color: theme.primary,
                  lineHeight: 22,
                  marginBottom: 16,
                }}
              >
                {t("about_app_description")}
              </Text>

              <View
                style={{
                  backgroundColor: theme.surfaceVariant,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.primary,
                    marginBottom: 4,
                  }}
                >
                  {t("license")}
                </Text>
                <Text style={{ fontSize: 13, color: theme.secondary }}>
                  {t("license_text")}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  Linking.openURL("https://github.com/basbit/kora")
                }
                style={{
                  backgroundColor: theme.surfaceVariant,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="logo-github" size={20} color={theme.primary} />
                <Text
                  style={{
                    color: theme.accent,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {t("github")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Linking.openURL("https://buymeacoffee.com/rbaster")
                }
                style={{
                  backgroundColor: "#FFDD00",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="cafe" size={20} color="#000000" />
                <Text
                  style={{ color: "#000000", fontSize: 14, fontWeight: "600" }}
                >
                  {t("support")}
                </Text>
              </Pressable>

              <View
                style={{ flexDirection: "row", justifyContent: "flex-end" }}
              >
                <Pressable
                  onPress={() => setAboutVisible(false)}
                  style={{
                    backgroundColor: theme.accent,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {t("ok")}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Chip: React.FC<{
  active?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  accent: string;
  primary: string;
  border?: string;
}> = ({ active, onPress, children, accent, primary, border = "#cccccc" }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: active ? accent : "transparent",
      borderWidth: active ? 0 : 1,
      borderColor: active ? "transparent" : border,
    }}
  >
    <Text style={{ color: active ? "white" : primary, fontWeight: "700" }}>
      {children}
    </Text>
  </Pressable>
);

const IconBtn: React.FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  bg: string;
  fg: string;
}> = ({ label, icon, onPress, bg, fg }) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: bg,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    }}
  >
    <Ionicons name={icon} size={18} color={fg} />
    <Text style={{ color: fg, fontWeight: "600" }}>{label}</Text>
  </Pressable>
);
