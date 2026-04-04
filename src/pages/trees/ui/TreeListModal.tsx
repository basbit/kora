import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@shared/config/theme/colors";
import { Alert } from "@shared/lib/platform/alert";

import type { TreeMetadata } from "@entities/tree/model/types";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreesStore } from "@app/providers/TreesProvider";

import { MergeModal } from "./MergeModal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const TreeListModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;
  const {
    trees,
    activeTreeId,
    setActiveTree,
    createTree,
    renameTree,
    deleteTree,
  } = useTreesStore();

  const [newTreeName, setNewTreeName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  const handleCreate = () => {
    const name = newTreeName.trim();
    if (!name) return;
    createTree(name);
    setNewTreeName("");
    setShowCreate(false);
  };

  const handleStartRename = (tree: TreeMetadata) => {
    setEditingId(tree.id);
    setEditingName(tree.name);
  };

  const handleRename = () => {
    if (!editingId || !editingName.trim()) return;
    renameTree(editingId, editingName.trim());
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (tree: TreeMetadata) => {
    Alert.alert(t("tree_delete"), t("tree_delete_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("ok"),
        style: "destructive",
        onPress: () => deleteTree(tree.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: TreeMetadata }) => {
    const isActive = item.id === activeTreeId;
    const isEditing = editingId === item.id;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderRadius: 10,
          backgroundColor: isActive ? theme.surfaceVariant : theme.surface,
          borderWidth: 1,
          borderColor: isActive ? theme.accent : theme.border,
          marginBottom: 8,
          gap: 8,
        }}
      >
        {isEditing ? (
          <TextInput
            value={editingName}
            onChangeText={setEditingName}
            autoFocus
            style={{
              flex: 1,
              color: theme.primary,
              borderBottomWidth: 1,
              borderBottomColor: theme.accent,
              paddingVertical: 2,
            }}
            onSubmitEditing={handleRename}
            onBlur={handleRename}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.primary,
                fontWeight: isActive ? "700" : "400",
                fontSize: 15,
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{ color: theme.secondary, fontSize: 12, marginTop: 2 }}
            >
              {t("tree_people_count", { count: item.personCount })}
            </Text>
          </View>
        )}

        {!isEditing && (
          <View style={{ flexDirection: "row", gap: 6 }}>
            {!isActive && (
              <Pressable
                onPress={() => {
                  setActiveTree(item.id);
                  onClose();
                }}
                style={{
                  backgroundColor: theme.accent,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}
                >
                  {t("tree_switch")}
                </Text>
              </Pressable>
            )}
            {isActive && (
              <View
                style={{
                  backgroundColor: theme.accent,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  opacity: 0.7,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}
                >
                  {t("tree_active")}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => handleStartRename(item)}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={theme.secondary}
              />
            </Pressable>
            {!isActive && (
              <Pressable
                onPress={() => setMergeTargetId(item.id)}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name="git-merge-outline"
                  size={18}
                  color={theme.secondary}
                />
              </Pressable>
            )}
            {trees.length > 1 && (
              <Pressable
                onPress={() => handleDelete(item)}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
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
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {t("trees_label")}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setShowCreate(true)}
                  style={{
                    backgroundColor: theme.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {t("tree_new")}
                  </Text>
                </Pressable>
                <Pressable onPress={onClose} style={{ padding: 8 }}>
                  <Ionicons name="close" size={22} color={theme.primary} />
                </Pressable>
              </View>
            </View>

            {showCreate && (
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                <TextInput
                  value={newTreeName}
                  onChangeText={setNewTreeName}
                  placeholder={t("tree_name_placeholder")}
                  placeholderTextColor={theme.secondary}
                  autoFocus
                  style={{
                    color: theme.primary,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.accent,
                    paddingVertical: 4,
                  }}
                  onSubmitEditing={handleCreate}
                />
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <Pressable
                    onPress={() => setShowCreate(false)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ color: theme.secondary }}>
                      {t("cancel")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreate}
                    style={{
                      backgroundColor: theme.accent,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {t("tree_create")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <FlatList
              data={trees}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>

      {mergeTargetId && activeTreeId && (
        <MergeModal
          visible={!!mergeTargetId}
          activeTreeId={activeTreeId}
          otherTreeId={mergeTargetId}
          onClose={() => setMergeTargetId(null)}
        />
      )}
    </>
  );
};
