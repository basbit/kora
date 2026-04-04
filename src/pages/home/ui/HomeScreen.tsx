import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Pressable } from "react-native";

import { colors } from "@shared/config/theme/colors";

import type { Person } from "@entities/person/model/types";

import { TreeView } from "@features/tree/ui/TreeView";

import { SplitModal } from "@pages/trees/ui/SplitModal";
import { TreeListModal } from "@pages/trees/ui/TreeListModal";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreeStore } from "@app/providers/StoreProvider";
import { useTreesStore } from "@app/providers/TreesProvider";

import { AddPersonModal } from "./AddPersonModal";

export function HomeScreen() {
  const { t } = useTranslation();
  const { personsById, rootId } = useTreeStore();
  const { currentTheme } = useSettings();
  const { trees, activeTreeId } = useTreesStore();

  const theme = currentTheme === "dark" ? colors.dark : colors.light;

  const roots = useMemo(
    () => Object.values(personsById).filter((p) => p.parentIds.length === 0),
    [personsById],
  );
  const effectiveRootId = rootId ?? roots[0]?.id;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [treesModalVisible, setTreesModalVisible] = useState(false);
  const [splitPerson, setSplitPerson] = useState<Person | undefined>();

  const activeTreeName = trees.find((tr) => tr.id === activeTreeId)?.name ?? "";

  const handleRequestEditPerson = useCallback((person: Person) => {
    setEditingPerson(person);
  }, []);

  const handleExtractFamily = useCallback((person: Person) => {
    setSplitPerson(person);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Tree switcher header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 4,
          gap: 8,
        }}
      >
        <Pressable
          onPress={() => setTreesModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            maxWidth: "70%",
          }}
        >
          <Ionicons name="git-branch-outline" size={16} color={theme.accent} />
          <Text
            numberOfLines={1}
            style={{ color: theme.primary, fontWeight: "600", fontSize: 14 }}
          >
            {activeTreeName}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.secondary} />
        </Pressable>
        {trees.length > 1 && (
          <Text style={{ color: theme.secondary, fontSize: 12 }}>
            {trees.length} {t("trees_label").toLowerCase()}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, padding: 12 }}>
        {effectiveRootId ? (
          <TreeView
            rootId={effectiveRootId}
            onRequestEditPerson={handleRequestEditPerson}
          />
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
      <AddPersonModal
        visible={!!editingPerson}
        onClose={() => setEditingPerson(undefined)}
        editPerson={editingPerson}
        onExtractFamily={handleExtractFamily}
      />
      <TreeListModal
        visible={treesModalVisible}
        onClose={() => setTreesModalVisible(false)}
      />
      {splitPerson && (
        <SplitModal
          visible={true}
          rootPerson={splitPerson}
          onClose={() => setSplitPerson(undefined)}
        />
      )}
    </View>
  );
}
