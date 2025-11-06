import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Pressable } from "react-native";

import { colors } from "@shared/config/theme/colors";

import { TreeView } from "@features/tree/ui/TreeView";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreeStore } from "@app/providers/StoreProvider";

import { AddPersonModal } from "./AddPersonModal";

export function HomeScreen() {
  const { t } = useTranslation();
  const { personsById, rootId } = useTreeStore();
  const { currentTheme } = useSettings();

  const theme = currentTheme === "dark" ? colors.dark : colors.light;

  const roots = useMemo(
    () => Object.values(personsById).filter((p) => p.parentIds.length === 0),
    [personsById],
  );
  const effectiveRootId = rootId ?? roots[0]?.id;

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 12 }} />

      <View style={{ flex: 1, padding: 12 }}>
        {effectiveRootId ? (
          <TreeView rootId={effectiveRootId} />
        ) : (
          <Text style={{ padding: 16, color: theme.secondary }}>
            {t("no_persons_prompt")}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          position: "absolute",
          right: 16,
          bottom: 72,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.accent,
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <AddPersonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
