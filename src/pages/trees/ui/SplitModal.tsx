import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@shared/config/theme/colors";

import type { Person } from "@entities/person/model/types";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreeStore, genId } from "@app/providers/StoreProvider";
import { useTreesStore } from "@app/providers/TreesProvider";

type Props = {
  visible: boolean;
  rootPerson: Person;
  onClose: () => void;
};

function countDescendants(
  rootId: string,
  personsById: Record<string, Person>,
): number {
  const visited = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const p = personsById[id];
    if (!p) continue;
    for (const [pid, person] of Object.entries(personsById)) {
      if (!visited.has(pid) && person.parentIds.includes(id)) {
        queue.push(pid);
      }
    }
    for (const sid of p.spouseIds ?? []) {
      if (!visited.has(sid)) queue.push(sid);
    }
  }
  return visited.size;
}

export const SplitModal: React.FC<Props> = ({
  visible,
  rootPerson,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;
  const { treeId, personsById, positions } = useTreeStore();
  const { splitFromTree } = useTreesStore();

  const [newTreeName, setNewTreeName] = useState("");
  const [splitting, setSplitting] = useState(false);

  const descendantCount = useMemo(
    () => countDescendants(rootPerson.id, personsById),
    [rootPerson.id, personsById],
  );

  const handleSplit = async () => {
    if (!treeId) return;
    setSplitting(true);
    try {
      const newTreeId = genId();
      const sourceState = {
        id: treeId,
        personsById,
        positions,
        uiOffsets: {},
        rootId: undefined as string | undefined,
      };
      await splitFromTree({
        source: sourceState,
        rootPersonId: rootPerson.id,
        keepInOriginal: true,
        newTreeId,
        newTreeName,
      });
      onClose();
    } catch (e) {
      console.warn("Split failed:", e);
    } finally {
      setSplitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            borderRadius: 16,
            padding: 20,
            width: "90%",
            maxWidth: 400,
            gap: 14,
          }}
        >
          <Text
            style={{ fontSize: 17, fontWeight: "700", color: theme.primary }}
          >
            {t("tree_split")}
          </Text>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              {rootPerson.firstName} {rootPerson.lastName ?? ""}
            </Text>
            <Text
              style={{ color: theme.secondary, fontSize: 13, marginTop: 4 }}
            >
              {t("tree_people_count", { count: descendantCount })}
            </Text>
          </View>

          <TextInput
            value={newTreeName}
            onChangeText={setNewTreeName}
            placeholder={t("tree_split_new_name")}
            placeholderTextColor={theme.secondary}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 10,
              padding: 12,
              color: theme.primary,
            }}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.primary }}>{t("cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={handleSplit}
              disabled={splitting}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                backgroundColor: theme.accent,
                alignItems: "center",
              }}
            >
              {splitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {t("tree_split_confirm")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
