import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@shared/config/theme/colors";
import { loadTreeById } from "@shared/lib/storage/indexedDB";

import type { Person } from "@entities/person/model/types";

import { useSettings } from "@app/providers/SettingsProvider";
import { normalizePerson } from "@app/providers/StoreProvider";
import { useTreesStore } from "@app/providers/TreesProvider";

type Props = {
  visible: boolean;
  activeTreeId: string;
  otherTreeId: string;
  onClose: () => void;
};

export const MergeModal: React.FC<Props> = ({
  visible,
  activeTreeId,
  otherTreeId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;
  const { trees, mergeIntoTree } = useTreesStore();

  const [anchorAId, setAnchorAId] = useState<string | null>(null);
  const [anchorBId, setAnchorBId] = useState<string | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [personsA, setPersonsA] = useState<Person[]>([]);
  const [personsB, setPersonsB] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  const treeAMeta = trees.find((tr) => tr.id === activeTreeId);
  const treeBMeta = trees.find((tr) => tr.id === otherTreeId);

  // Load persons when modal opens
  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([loadTreeById(activeTreeId), loadTreeById(otherTreeId)])
      .then(([treeA, treeB]) => {
        setPersonsA((treeA?.persons ?? []).map(normalizePerson));
        setPersonsB((treeB?.persons ?? []).map(normalizePerson));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, activeTreeId, otherTreeId]);

  const filteredA = useMemo(
    () =>
      personsA.filter((p) =>
        `${p.firstName} ${p.lastName ?? ""}`
          .toLowerCase()
          .includes(searchA.toLowerCase()),
      ),
    [personsA, searchA],
  );

  const filteredB = useMemo(
    () =>
      personsB.filter((p) =>
        `${p.firstName} ${p.lastName ?? ""}`
          .toLowerCase()
          .includes(searchB.toLowerCase()),
      ),
    [personsB, searchB],
  );

  const canMerge = !!anchorAId && !!anchorBId;

  const handleMerge = async () => {
    if (!anchorAId || !anchorBId) return;
    setMerging(true);
    try {
      const [treeAData, treeBData] = await Promise.all([
        loadTreeById(activeTreeId),
        loadTreeById(otherTreeId),
      ]);
      if (!treeAData || !treeBData) return;

      const toState = (id: string, data: typeof treeAData) => ({
        id,
        personsById: Object.fromEntries(
          (data!.persons ?? []).map(normalizePerson).map((p) => [p.id, p]),
        ),
        positions: data!.positions ?? {},
        uiOffsets: {},
        rootId: undefined as string | undefined,
      });

      await mergeIntoTree({
        treeA: toState(activeTreeId, treeAData),
        treeB: toState(otherTreeId, treeBData),
        anchorAId,
        anchorBId,
      });
      onClose();
    } catch (e) {
      console.warn("Merge failed:", e);
    } finally {
      setMerging(false);
    }
  };

  const renderPerson = (
    item: Person,
    selectedId: string | null,
    onSelect: (id: string) => void,
  ) => {
    const isSelected = item.id === selectedId;
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelect(item.id)}
        style={{
          padding: 10,
          borderRadius: 8,
          backgroundColor: isSelected ? theme.accent : theme.surface,
          borderWidth: 1,
          borderColor: isSelected ? theme.accent : theme.border,
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            color: isSelected ? "#fff" : theme.primary,
            fontWeight: "600",
          }}
        >
          {item.firstName} {item.lastName ?? ""}
        </Text>
        {item.birthDateISO && (
          <Text
            style={{
              color: isSelected ? "rgba(255,255,255,0.8)" : theme.secondary,
              fontSize: 12,
            }}
          >
            {item.birthDateISO}
          </Text>
        )}
      </Pressable>
    );
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
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            maxHeight: "90%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text
              style={{ fontSize: 17, fontWeight: "700", color: theme.primary }}
            >
              {t("tree_merge")}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: theme.secondary }}>{t("cancel")}</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator
              color={theme.accent}
              style={{ marginVertical: 32 }}
            />
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                {/* Tree A column */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.secondary,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {treeAMeta?.name ?? activeTreeId}
                  </Text>
                  <TextInput
                    value={searchA}
                    onChangeText={setSearchA}
                    placeholder={t("search")}
                    placeholderTextColor={theme.secondary}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      padding: 8,
                      color: theme.primary,
                      marginBottom: 8,
                      fontSize: 13,
                    }}
                  />
                  <FlatList
                    data={filteredA}
                    keyExtractor={(p) => p.id}
                    renderItem={({ item }) =>
                      renderPerson(item, anchorAId, setAnchorAId)
                    }
                    style={{ maxHeight: 280 }}
                  />
                </View>

                {/* Tree B column */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.secondary,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {treeBMeta?.name ?? otherTreeId}
                  </Text>
                  <TextInput
                    value={searchB}
                    onChangeText={setSearchB}
                    placeholder={t("search")}
                    placeholderTextColor={theme.secondary}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      padding: 8,
                      color: theme.primary,
                      marginBottom: 8,
                      fontSize: 13,
                    }}
                  />
                  <FlatList
                    data={filteredB}
                    keyExtractor={(p) => p.id}
                    renderItem={({ item }) =>
                      renderPerson(item, anchorBId, setAnchorBId)
                    }
                    style={{ maxHeight: 280 }}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleMerge}
                disabled={!canMerge || merging}
                style={{
                  backgroundColor: canMerge ? theme.accent : theme.disabled,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                {merging ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("tree_merge_confirm")}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
