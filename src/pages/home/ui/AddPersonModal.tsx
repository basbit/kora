import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from "react-native";

import { copyImageToAppDir } from "@shared/lib/fs/images";

import { getChildrenOf } from "@entities/person/model/treeStore";
import type { Person } from "@entities/person/model/types";

import { useTreeStore } from "@app/providers/StoreProvider";

function isoToDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}
function dateToIso(d?: Date): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 6,
  padding: 8,
} as const;
const btnStyle = {
  primary: {
    backgroundColor: "#1e88e5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ghost: {
    backgroundColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  active: {
    backgroundColor: "#8e24aa",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  text: { color: "white", fontWeight: "600" as const },
  textSmall: { color: "white", fontWeight: "600" as const, fontSize: 12 },
};

/* eslint-disable complexity */
export const AddPersonModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  editPerson?: Person;
}> = ({ visible, onClose, editPerson }) => {
  const { t } = useTranslation();
  const {
    personsById,
    addPerson,
    updatePerson,
    linkParentChild,
    unlinkParentChild,
    positions,
    setNodePosition,
    linkSpouses,
    unlinkSpouses,
  } = useTreeStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState<string | undefined>(undefined);
  const [death, setDeath] = useState<string | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState<string | undefined>(undefined);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [parentQuery, setParentQuery] = useState("");
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showDeathPicker, setShowDeathPicker] = useState(false);
  const [tempBirth, setTempBirth] = useState<Date>(new Date());
  const [tempDeath, setTempDeath] = useState<Date>(new Date());
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false);
  const [spouseId, setSpouseId] = useState<string | undefined>(undefined);
  const [spouseQuery, setSpouseQuery] = useState("");
  const [spouseSelectorOpen, setSpouseSelectorOpen] = useState(false);

  const loadEditData = useCallback(() => {
    if (!editPerson) return;
    setFirstName(editPerson.firstName);
    setLastName(editPerson.lastName || "");
    setBirth(editPerson.birthDateISO);
    setDeath(editPerson.deathDateISO);
    setComment(editPerson.comment || "");
    setNewPhotoUri(editPerson.photoUri);
    setParentId(editPerson.parentIds[0]);
    setSpouseId(editPerson.spouseIds?.[0]);
  }, [editPerson]);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setBirth(undefined);
    setDeath(undefined);
    setComment("");
    setNewPhotoUri(undefined);
    setParentId(undefined);
    setSpouseId(undefined);
  }, []);

  const resetUIState = useCallback(() => {
    setParentQuery("");
    setShowBirthPicker(false);
    setShowDeathPicker(false);
    setParentSelectorOpen(false);
    setTempBirth(new Date());
    setTempDeath(new Date());
    setSpouseQuery("");
    setSpouseSelectorOpen(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (editPerson) {
      loadEditData();
    } else {
      resetForm();
    }
    resetUIState();
  }, [visible, editPerson, loadEditData, resetForm, resetUIState]);

  const parentCandidates = useMemo(() => {
    const list = Object.values(personsById).filter(
      (p) => !editPerson || p.id !== editPerson.id,
    );
    const filtered = list.filter((p) =>
      ([p.firstName, p.lastName, p.name].filter(Boolean).join(" ") || "")
        .toLowerCase()
        .includes(parentQuery.toLowerCase()),
    );
    filtered.sort(
      (a, b) =>
        (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
        [a.firstName, a.lastName]
          .join(" ")
          .localeCompare([b.firstName, b.lastName].join(" ")),
    );
    return filtered;
  }, [personsById, parentQuery, editPerson]);

  const spouseCandidates = useMemo(() => {
    const list = Object.values(personsById).filter(
      (p) => !editPerson || p.id !== editPerson.id,
    );
    const filtered = list.filter((p) =>
      ([p.firstName, p.lastName, p.name].filter(Boolean).join(" ") || "")
        .toLowerCase()
        .includes(spouseQuery.toLowerCase()),
    );
    filtered.sort(
      (a, b) =>
        (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
        [a.firstName, a.lastName]
          .join(" ")
          .localeCompare([b.firstName, b.lastName].join(" ")),
    );
    return filtered;
  }, [personsById, spouseQuery, editPerson]);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri)
      setNewPhotoUri(res.assets[0].uri);
  };

  const createPersonId = () =>
    addPerson({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      birthDateISO: birth || undefined,
      deathDateISO: death || undefined,
      comment: comment || undefined,
    });
  const maybeCopyPhoto = async (id: string) => {
    if (!newPhotoUri) return undefined;
    if (editPerson && newPhotoUri === editPerson.photoUri) return newPhotoUri;
    try {
      return await copyImageToAppDir(id, newPhotoUri);
    } catch {
      return undefined;
    }
  };
  const finalizePerson = (id: string, photo?: string) =>
    updatePerson({
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      birthDateISO: birth || undefined,
      deathDateISO: death || undefined,
      comment: comment || undefined,
      photoUri: photo,
      parentIds: [],
      spouseIds: [],
      createdAt: Date.now(),
    });
  const linkParent = (id: string) => {
    if (parentId) linkParentChild(parentId, id);
  };
  const linkSpouse = (id: string) => {
    if (spouseId && spouseId !== id) {
      linkSpouses(spouseId, id);
    }
  };
  const placeInitially = (id: string) => {
    const allIds = Object.keys(personsById);
    if (allIds.length === 0) {
      const w = Dimensions.get("window").width;
      setNodePosition(id, Math.max(0, Math.floor(w / 2 - 32)), 600);
      return;
    }
    if (parentId) {
      const p = positions[parentId] ?? { x: 0, y: 600 };
      const existingChildren = getChildrenOf(personsById, parentId);
      const placed = existingChildren.filter(
        (c) => positions[c.id] !== undefined,
      );
      const idx = placed.length;
      const spacing = 160;
      const total = Math.max(idx + 1, 2);
      const startX = p.x - ((total - 1) * spacing) / 2;
      const x = startX + idx * spacing;
      const y = Math.max(0, p.y - 160);
      setNodePosition(id, x, y);
      return;
    }
    const xs = Object.values(positions).map((p) => p.x);
    const maxX = xs.length ? Math.max(...xs) : 0;
    setNodePosition(id, maxX + 200, 600);
  };

  const handleEditPerson = useCallback(
    async (person: Person) => {
      const photo = await maybeCopyPhoto(person.id);

      const oldParentId = person.parentIds[0];
      if (oldParentId !== parentId) {
        if (oldParentId) unlinkParentChild(oldParentId, person.id);
        if (parentId) linkParentChild(parentId, person.id);
      }

      const oldSpouseId = person.spouseIds?.[0];
      if (oldSpouseId !== spouseId) {
        if (oldSpouseId) unlinkSpouses(oldSpouseId, person.id);
        if (spouseId && spouseId !== person.id)
          linkSpouses(spouseId, person.id);
      }

      updatePerson({
        ...person,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        birthDateISO: birth || undefined,
        deathDateISO: death || undefined,
        comment: comment || undefined,
        photoUri: photo,
        parentIds: parentId ? [parentId] : [],
        spouseIds: spouseId ? [spouseId] : [],
      });
    },
    [
      firstName,
      lastName,
      birth,
      death,
      comment,
      parentId,
      spouseId,
      linkParentChild,
      unlinkParentChild,
      linkSpouses,
      unlinkSpouses,
      updatePerson,
    ],
  );

  const handleCreatePerson = useCallback(async () => {
    const id = createPersonId();
    const photo = await maybeCopyPhoto(id);
    finalizePerson(id, photo);
    linkParent(id);
    linkSpouse(id);
    placeInitially(id);
  }, [firstName, lastName, birth, death, comment, parentId, spouseId]);

  const submit = async () => {
    if (!firstName.trim()) return;

    if (editPerson) {
      await handleEditPerson(editPerson);
    } else {
      await handleCreatePerson();
    }
    onClose();
  };

  return (
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
            padding: 16,
            borderRadius: 8,
            width: "90%",
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {editPerson ? "Редактировать" : t("new_person")}
          </Text>

          <View style={{ alignItems: "center", gap: 8 }}>
            <Pressable onPress={pickPhoto} style={{ alignItems: "center" }}>
              {newPhotoUri ? (
                <Image
                  source={{ uri: newPhotoUri }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                />
              ) : (
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: "#e0e0e0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={56} color="#5e35b1" />
                </View>
              )}
            </Pressable>
          </View>

          <TextInput
            placeholder={t("first_name")}
            value={firstName}
            onChangeText={setFirstName}
            style={inputStyle}
          />
          <TextInput
            placeholder={t("last_name")}
            value={lastName}
            onChangeText={setLastName}
            style={inputStyle}
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => {
                setTempBirth(isoToDate(birth) ?? new Date());
                setShowBirthPicker(true);
              }}
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
              <Text style={{ color: birth ? "#000" : "#9e9e9e" }}>
                {birth || t("birth_date")}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#616161" />
            </Pressable>
            <Pressable
              onPress={() => {
                setTempDeath(isoToDate(death) ?? new Date());
                setShowDeathPicker(true);
              }}
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
              <Text style={{ color: death ? "#000" : "#9e9e9e" }}>
                {death || t("death_date")}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#616161" />
            </Pressable>
          </View>

          <TextInput
            placeholder={t("comment")}
            value={comment}
            onChangeText={setComment}
            style={[inputStyle, { height: 80 }]}
            multiline
          />

          <Text style={{ color: "#555" }}>{t("parent_optional")}</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable
              onPress={() => setParentSelectorOpen(true)}
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
              <Text style={{ color: parentId ? "#000" : "#9e9e9e" }}>
                {parentId
                  ? [
                      personsById[parentId]?.firstName,
                      personsById[parentId]?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || personsById[parentId]?.name
                  : t("search")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#616161" />
            </Pressable>
            {!!parentId && (
              <Pressable
                onPress={() => setParentId(undefined)}
                style={[btnStyle.ghost, { paddingHorizontal: 12 }]}
              >
                <Text>Очистить</Text>
              </Pressable>
            )}
          </View>

          <Text style={{ color: "#555" }}>Супруг(а) (необязательно)</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable
              onPress={() => setSpouseSelectorOpen(true)}
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
                {spouseId
                  ? [
                      personsById[spouseId]?.firstName,
                      personsById[spouseId]?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || personsById[spouseId]?.name
                  : t("search")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#616161" />
            </Pressable>
            {!!spouseId && (
              <Pressable
                onPress={() => setSpouseId(undefined)}
                style={[btnStyle.ghost, { paddingHorizontal: 12 }]}
              >
                <Text>Очистить</Text>
              </Pressable>
            )}
          </View>

          <Modal
            visible={parentSelectorOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setParentSelectorOpen(false)}
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
                  value={parentQuery}
                  onChangeText={setParentQuery}
                  style={inputStyle}
                />
                <ScrollView style={{ marginTop: 8 }}>
                  {parentCandidates.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setParentId(p.id);
                        setParentSelectorOpen(false);
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
                    onPress={() => setParentSelectorOpen(false)}
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

          <Modal
            visible={spouseSelectorOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSpouseSelectorOpen(false)}
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
                  value={spouseQuery}
                  onChangeText={setSpouseQuery}
                  style={inputStyle}
                />
                <ScrollView style={{ marginTop: 8 }}>
                  {spouseCandidates.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setSpouseId(p.id);
                        setSpouseSelectorOpen(false);
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
                    onPress={() => setSpouseSelectorOpen(false)}
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

          {showBirthPicker && Platform.OS === "ios" && (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setShowBirthPicker(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 16,
                    width: "90%",
                    borderWidth: 1,
                    borderColor: "#ddd",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                      textAlign: "center",
                    }}
                  >
                    {t("birth_date")}
                  </Text>
                  <DateTimePicker
                    value={tempBirth}
                    mode="date"
                    display="inline"
                    onChange={(e, d) => {
                      if (d) setTempBirth(d);
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: 12,
                      gap: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => setShowBirthPicker(false)}
                      style={[btnStyle.ghost, { paddingHorizontal: 16 }]}
                    >
                      <Text>{t("cancel")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setBirth(dateToIso(tempBirth));
                        setShowBirthPicker(false);
                      }}
                      style={[btnStyle.primary, { paddingHorizontal: 16 }]}
                    >
                      <Text style={btnStyle.text}>OK</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {showBirthPicker && Platform.OS === "android" && (
            <DateTimePicker
              value={tempBirth}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowBirthPicker(false);
                if (d) setBirth(dateToIso(d));
              }}
            />
          )}

          {showDeathPicker && Platform.OS === "ios" && (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setShowDeathPicker(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 16,
                    width: "90%",
                    borderWidth: 1,
                    borderColor: "#ddd",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                      textAlign: "center",
                    }}
                  >
                    {t("death_date")}
                  </Text>
                  <DateTimePicker
                    value={tempDeath}
                    mode="date"
                    display="inline"
                    onChange={(e, d) => {
                      if (d) setTempDeath(d);
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: 12,
                      gap: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => setShowDeathPicker(false)}
                      style={[btnStyle.ghost, { paddingHorizontal: 16 }]}
                    >
                      <Text>{t("cancel")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setDeath(dateToIso(tempDeath));
                        setShowDeathPicker(false);
                      }}
                      style={[btnStyle.primary, { paddingHorizontal: 16 }]}
                    >
                      <Text style={btnStyle.text}>OK</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {showDeathPicker && Platform.OS === "android" && (
            <DateTimePicker
              value={tempDeath}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowDeathPicker(false);
                if (d) setDeath(dateToIso(d));
              }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Pressable onPress={onClose} style={btnStyle.ghost}>
              <Text style={btnStyle.text}>{t("cancel")}</Text>
            </Pressable>
            <Pressable onPress={submit} style={btnStyle.primary}>
              <Text style={btnStyle.text}>
                {editPerson ? "Сохранить" : t("add")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
/* eslint-enable complexity */
