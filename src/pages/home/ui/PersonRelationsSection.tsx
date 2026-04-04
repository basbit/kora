import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";

import type { Person } from "@entities/person/model/types";

import type { PersonsById } from "@app/providers/StoreProvider";

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 6,
  padding: 8,
} as const;

type Props = {
  parent1Id: string | undefined;
  onParent1Change: (id: string | undefined) => void;
  parent2Id: string | undefined;
  onParent2Change: (id: string | undefined) => void;
  spouseId: string | undefined;
  onSpouseChange: (id: string | undefined) => void;
  personsById: PersonsById;
  excludePersonId?: string;
};

export const PersonRelationsSection: React.FC<Props> = ({
  parent1Id,
  onParent1Change,
  parent2Id,
  onParent2Change,
  spouseId,
  onSpouseChange,
  personsById,
  excludePersonId,
}) => {
  const { t } = useTranslation();
  const [parentQuery, setParentQuery] = useState("");
  const [spouseQuery, setSpouseQuery] = useState("");
  const [parent1Open, setParent1Open] = useState(false);
  const [parent2Open, setParent2Open] = useState(false);
  const [spouseOpen, setSpouseOpen] = useState(false);

  const candidates = useMemo(() => {
    const list = Object.values(personsById).filter(
      (p) => !excludePersonId || p.id !== excludePersonId,
    );
    list.sort(
      (a, b) =>
        (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
        [a.firstName, a.lastName]
          .join(" ")
          .localeCompare([b.firstName, b.lastName].join(" ")),
    );
    return list;
  }, [personsById, excludePersonId]);

  const filterCandidates = (query: string) =>
    candidates.filter((p) =>
      ([p.firstName, p.lastName, p.name].filter(Boolean).join(" ") || "")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  const displayName = (id: string | undefined) => {
    if (!id) return null;
    const p = personsById[id];
    return p
      ? [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || id
      : id;
  };

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    query: string,
    onQueryChange: (v: string) => void,
    items: Person[],
    onSelect: (id: string) => void,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 8,
            width: "90%",
            maxHeight: "70%",
            padding: 12,
          }}
        >
          <TextInput
            placeholder={t("search")}
            value={query}
            onChangeText={onQueryChange}
            style={inputStyle}
          />
          <ScrollView style={{ marginTop: 8 }}>
            {items.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  onSelect(p.id);
                  onClose();
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text>
                  {[p.firstName, p.lastName].filter(Boolean).join(" ") ||
                    p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <Pressable
              onPress={onClose}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: "#eeeeee",
                borderRadius: 8,
              }}
            >
              <Text>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: "#555" }}>{t("parent1_optional")}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => setParent1Open(true)}
          style={[
            inputStyle,
            {
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <Text style={{ color: parent1Id ? "#000" : "#9e9e9e" }}>
            {displayName(parent1Id) ?? t("search")}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#616161" />
        </Pressable>
        {!!parent1Id && (
          <Pressable
            onPress={() => onParent1Change(undefined)}
            style={{
              backgroundColor: "#eee",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
            }}
          >
            <Text>{t("clear")}</Text>
          </Pressable>
        )}
      </View>

      <Text style={{ color: "#555" }}>{t("parent2_optional")}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => setParent2Open(true)}
          style={[
            inputStyle,
            {
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <Text style={{ color: parent2Id ? "#000" : "#9e9e9e" }}>
            {displayName(parent2Id) ?? t("search")}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#616161" />
        </Pressable>
        {!!parent2Id && (
          <Pressable
            onPress={() => onParent2Change(undefined)}
            style={{
              backgroundColor: "#eee",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
            }}
          >
            <Text>{t("clear")}</Text>
          </Pressable>
        )}
      </View>

      <Text style={{ color: "#555" }}>{t("spouse_optional")}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => setSpouseOpen(true)}
          style={[
            inputStyle,
            {
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <Text style={{ color: spouseId ? "#000" : "#9e9e9e" }}>
            {displayName(spouseId) ?? t("search")}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#616161" />
        </Pressable>
        {!!spouseId && (
          <Pressable
            onPress={() => onSpouseChange(undefined)}
            style={{
              backgroundColor: "#eee",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
            }}
          >
            <Text>{t("clear")}</Text>
          </Pressable>
        )}
      </View>

      {renderPicker(
        parent1Open,
        () => {
          setParent1Open(false);
          setParentQuery("");
        },
        parentQuery,
        setParentQuery,
        filterCandidates(parentQuery).filter((p) => p.id !== parent2Id),
        onParent1Change,
      )}
      {renderPicker(
        parent2Open,
        () => {
          setParent2Open(false);
          setParentQuery("");
        },
        parentQuery,
        setParentQuery,
        filterCandidates(parentQuery).filter((p) => p.id !== parent1Id),
        onParent2Change,
      )}
      {renderPicker(
        spouseOpen,
        () => {
          setSpouseOpen(false);
          setSpouseQuery("");
        },
        spouseQuery,
        setSpouseQuery,
        filterCandidates(spouseQuery),
        onSpouseChange,
      )}
    </View>
  );
};
