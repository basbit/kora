import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import Markdown from "react-native-markdown-display";

import { copyImageToAppDir } from "@shared/lib/fs/images";

import { getChildrenOf } from "@entities/person/model/treeStore";
import type { Person } from "@entities/person/model/types";

import { useTreeStore } from "@app/providers/StoreProvider";

function displayToIso(display?: string): string | undefined {
  if (!display) return undefined;
  const parts = display.split(".");
  if (parts.length === 3) {
    // dd.mm.yyyy
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else if (parts.length === 2) {
    // mm.yyyy
    const [month, year] = parts;
    return `${year}-${month.padStart(2, "0")}`;
  } else if (parts.length === 1) {
    // yyyy
    return parts[0];
  }
  return undefined;
}

function isoToDisplay(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    // yyyy-mm-dd
    const [year, month, day] = parts;
    return `${parseInt(day)}.${parseInt(month)}.${year}`;
  } else if (parts.length === 2) {
    // yyyy-mm
    const [year, month] = parts;
    return `${parseInt(month)}.${year}`;
  } else if (parts.length === 1) {
    // yyyy
    return parts[0];
  }
  return "";
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

type SelectionRange = { start: number; end: number };

const markdownPreviewStyles = {
  body: {
    color: "#1f2933",
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: "#1e88e5",
  },
  code_inline: {
    backgroundColor: "#eceff1",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#1f2933",
  },
  fence: {
    backgroundColor: "#eceff1",
    padding: 8,
    borderRadius: 6,
    color: "#1f2933",
  },
};

const MarkdownEditor: React.FC<{
  value: string;
  onChange: (next: string) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const selectionRef = useRef<SelectionRange>({
    start: value.length,
    end: value.length,
  });
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState<SelectionRange | undefined>(
    selectionRef.current,
  );

  const applySelection = useCallback((nextSel: SelectionRange) => {
    selectionRef.current = nextSel;
    setSelection(nextSel);
    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps?.({ selection: nextSel });
    });
  }, []);

  const getSelection = useCallback(() => {
    const current = selectionRef.current;
    if (
      typeof current?.start !== "number" ||
      typeof current?.end !== "number"
    ) {
      return { start: value.length, end: value.length };
    }
    return current;
  }, [value.length]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const nextSel = event.nativeEvent.selection;
      selectionRef.current = nextSel;
      setSelection(nextSel);
    },
    [],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange],
  );

  useEffect(() => {
    if (!inputRef.current?.isFocused?.()) {
      const caret = { start: value.length, end: value.length };
      selectionRef.current = caret;
      setSelection(caret);
    }
  }, [value]);

  const wrapSelection = useCallback(
    (startWrapper: string, endWrapper?: string, placeholder?: string) => {
      const selection = getSelection();
      const start = Math.min(selection.start, selection.end);
      const end = Math.max(selection.start, selection.end);
      const selected = value.slice(start, end);
      const insertBody = selected || placeholder || "";
      const closing = endWrapper ?? startWrapper;
      const insertion = `${startWrapper}${insertBody}${closing}`;
      const nextValue = value.slice(0, start) + insertion + value.slice(end);
      onChange(nextValue);
      focusInput();
      const newSelection: SelectionRange = selected
        ? {
            start: start + startWrapper.length + insertBody.length,
            end: start + startWrapper.length + insertBody.length,
          }
        : {
            start: start + startWrapper.length,
            end: start + startWrapper.length + insertBody.length,
          };
      applySelection(newSelection);
    },
    [applySelection, focusInput, getSelection, onChange, value],
  );

  const applyLinePrefix = useCallback(
    (prefix: string) => {
      const selection = getSelection();
      const start = Math.min(selection.start, selection.end);
      const source = value;
      const prevNewLine = source.lastIndexOf("\n", start - 1);
      const insertionIndex = prevNewLine === -1 ? 0 : prevNewLine + 1;
      const nextValue =
        source.slice(0, insertionIndex) + prefix + source.slice(insertionIndex);
      onChange(nextValue);
      focusInput();
      const delta = prefix.length;
      const newSelection: SelectionRange = {
        start: selection.start + delta,
        end: selection.end + delta,
      };
      applySelection(newSelection);
    },
    [applySelection, focusInput, getSelection, onChange, value],
  );

  const insertLink = useCallback(() => {
    const selection = getSelection();
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const selected = value.slice(start, end);
    const label =
      selected || t("comment_link_placeholder", { defaultValue: "текст" });
    const urlPlaceholder = "https://";
    const insertion = `[${label}](${urlPlaceholder})`;
    const nextValue = value.slice(0, start) + insertion + value.slice(end);
    onChange(nextValue);
    focusInput();
    const urlStart = start + label.length + 2;
    applySelection({
      start: urlStart,
      end: urlStart + urlPlaceholder.length,
    });
  }, [applySelection, focusInput, getSelection, onChange, t, value]);

  const toolbarButtons = useMemo(
    () => [
      { key: "bold", label: "B", onPress: () => wrapSelection("**") },
      { key: "italic", label: "I", onPress: () => wrapSelection("*") },
      { key: "heading", label: "H1", onPress: () => applyLinePrefix("# ") },
      { key: "list", label: "•", onPress: () => applyLinePrefix("- ") },
      { key: "code", label: "</>", onPress: () => wrapSelection("`") },
      { key: "link", label: "🔗", onPress: insertLink },
    ],
    [applyLinePrefix, insertLink, wrapSelection],
  );

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: "#555", fontWeight: "500" }}>
        {t("comment_editor_tab")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {toolbarButtons.map((btn) => (
          <Pressable
            key={btn.key}
            onPress={btn.onPress}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontWeight: "600", color: "#333" }}>
              {btn.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        placeholder={t("comment")}
        value={value}
        onChangeText={handleChangeText}
        style={[inputStyle, { minHeight: 160, textAlignVertical: "top" }]}
        multiline
        onSelectionChange={handleSelectionChange}
        selection={selection}
        autoCorrect={false}
        autoComplete="off"
      />
      <Text style={{ fontSize: 12, color: "#757575" }}>
        {t("comment_markdown_hint")}
      </Text>

      <Text style={{ color: "#555", fontWeight: "500" }}>
        {t("comment_preview_tab")}
      </Text>
      <View
        style={[
          inputStyle,
          {
            minHeight: 160,
            backgroundColor: "#fafafa",
            borderStyle: "dashed",
          },
        ]}
      >
        {value ? (
          <ScrollView nestedScrollEnabled>
            <Markdown style={markdownPreviewStyles}>{value}</Markdown>
          </ScrollView>
        ) : (
          <Text style={{ color: "#999" }}>
            {t("comment_preview_placeholder")}
          </Text>
        )}
      </View>
    </View>
  );
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
    positions,
    setNodePosition,
    linkParentChild,
    linkSpouses,
  } = useTreeStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [death, setDeath] = useState("");
  const [comment, setComment] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState<string | undefined>(undefined);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [parent1Id, setParent1Id] = useState<string | undefined>(undefined);
  const [parent2Id, setParent2Id] = useState<string | undefined>(undefined);
  const [parentQuery, setParentQuery] = useState("");
  const [parent1SelectorOpen, setParent1SelectorOpen] = useState(false);
  const [parent2SelectorOpen, setParent2SelectorOpen] = useState(false);
  const [spouseId, setSpouseId] = useState<string | undefined>(undefined);
  const [spouseQuery, setSpouseQuery] = useState("");
  const [spouseSelectorOpen, setSpouseSelectorOpen] = useState(false);

  const loadEditData = useCallback(() => {
    if (!editPerson) return;
    setFirstName(editPerson.firstName);
    setLastName(editPerson.lastName || "");
    setBirth(isoToDisplay(editPerson.birthDateISO));
    setDeath(isoToDisplay(editPerson.deathDateISO));
    setComment(editPerson.comment || "");
    setNewPhotoUri(editPerson.photoUri);
    setGalleryPhotos(editPerson.photoGallery || []);
    setParent1Id(editPerson.parentIds[0]);
    setParent2Id(editPerson.parentIds[1]);
    setSpouseId(editPerson.spouseIds?.[0]);
  }, [editPerson]);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setBirth("");
    setDeath("");
    setComment("");
    setNewPhotoUri(undefined);
    setGalleryPhotos([]);
    setParent1Id(undefined);
    setParent2Id(undefined);
    setSpouseId(undefined);
  }, []);

  const resetUIState = useCallback(() => {
    setParentQuery("");
    setParent1SelectorOpen(false);
    setParent2SelectorOpen(false);
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
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setNewPhotoUri(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri)
      setNewPhotoUri(res.assets[0].uri);
  };

  const pickGalleryPhotos = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setGalleryPhotos((prev) => [...prev, dataUrl]);
          };
          reader.readAsDataURL(file);
        });
      };
      input.click();
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
    });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map((asset) => asset.uri);
      setGalleryPhotos((prev) => [...prev, ...uris]);
    }
  };

  const createPersonId = () =>
    addPerson({
      firstName,
      lastName: lastName || undefined,
      birthDateISO: displayToIso(birth),
      deathDateISO: displayToIso(death),
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

  const maybeCopyGalleryPhotos = async (id: string) => {
    const copiedPhotos: string[] = [];
    for (let i = 0; i < galleryPhotos.length; i++) {
      const uri = galleryPhotos[i];
      if (editPerson?.photoGallery?.includes(uri)) {
        copiedPhotos.push(uri);
        continue;
      }
      try {
        const timestamp = Date.now();
        const copied = await copyImageToAppDir(
          `${id}_gallery_${timestamp}_${i}`,
          uri,
        );
        copiedPhotos.push(copied);
      } catch (error) {
        console.error("Failed to copy gallery photo:", error);
      }
    }
    return copiedPhotos;
  };

  const finalizePerson = (id: string, photo?: string, gallery?: string[]) =>
    updatePerson({
      id,
      firstName,
      lastName: lastName || undefined,
      birthDateISO: displayToIso(birth),
      deathDateISO: displayToIso(death),
      comment: comment || undefined,
      photoUri: photo,
      photoGallery: gallery,
      parentIds: [],
      spouseIds: [],
      createdAt: Date.now(),
    });
  const linkParents = (id: string) => {
    if (parent1Id) linkParentChild(parent1Id, id);
    if (parent2Id) linkParentChild(parent2Id, id);
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
    const firstParentId = parent1Id || parent2Id;
    if (firstParentId) {
      const p = positions[firstParentId] ?? { x: 0, y: 600 };
      const existingChildren = getChildrenOf(personsById, firstParentId);
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
      const gallery = await maybeCopyGalleryPhotos(person.id);

      const newParentIds = [parent1Id, parent2Id].filter(Boolean) as string[];
      const newSpouseIds = spouseId ? [spouseId] : [];

      updatePerson({
        ...person,
        firstName,
        lastName: lastName || undefined,
        birthDateISO: displayToIso(birth),
        deathDateISO: displayToIso(death),
        comment: comment || undefined,
        photoUri: photo,
        photoGallery: gallery,
        parentIds: newParentIds,
        spouseIds: newSpouseIds,
      });
    },
    [
      firstName,
      lastName,
      birth,
      death,
      comment,
      parent1Id,
      parent2Id,
      spouseId,
      newPhotoUri,
      galleryPhotos,
      updatePerson,
    ],
  );

  const handleCreatePerson = useCallback(async () => {
    const id = createPersonId();
    const photo = await maybeCopyPhoto(id);
    const gallery = await maybeCopyGalleryPhotos(id);
    finalizePerson(id, photo, gallery);
    linkParents(id);
    linkSpouse(id);
    placeInitially(id);
  }, [
    firstName,
    lastName,
    birth,
    death,
    comment,
    parent1Id,
    parent2Id,
    spouseId,
    newPhotoUri,
    galleryPhotos,
    editPerson,
    personsById,
    positions,
  ]);

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
            maxHeight: Platform.OS === "web" ? "90%" : undefined,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {editPerson ? t("edit_person") : t("new_person")}
          </Text>

          <ScrollView
            style={{ maxHeight: Platform.OS === "web" ? 600 : undefined }}
            showsVerticalScrollIndicator={true}
          >
            <View style={{ gap: 12 }}>
              <View style={{ alignItems: "center", gap: 12 }}>
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
                <TextInput
                  placeholder={`${t("birth_date")} ${t("date_format_hint")}`}
                  value={birth}
                  onChangeText={setBirth}
                  style={[inputStyle, { flex: 1 }]}
                  autoComplete="off"
                  inputMode="text"
                />
                <TextInput
                  placeholder={`${t("death_date")} ${t("date_format_hint")}`}
                  value={death}
                  onChangeText={setDeath}
                  style={[inputStyle, { flex: 1 }]}
                  autoComplete="off"
                  inputMode="text"
                />
              </View>

              <Text style={{ color: "#555" }}>{t("parent1_optional")}</Text>
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Pressable
                  onPress={() => setParent1SelectorOpen(true)}
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
                    {parent1Id
                      ? [
                          personsById[parent1Id]?.firstName,
                          personsById[parent1Id]?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || personsById[parent1Id]?.name
                      : t("search")}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#616161" />
                </Pressable>
                {!!parent1Id && (
                  <Pressable
                    onPress={() => setParent1Id(undefined)}
                    style={[btnStyle.ghost, { paddingHorizontal: 12 }]}
                  >
                    <Text>{t("clear")}</Text>
                  </Pressable>
                )}
              </View>

              <Text style={{ color: "#555" }}>{t("parent2_optional")}</Text>
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Pressable
                  onPress={() => setParent2SelectorOpen(true)}
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
                    {parent2Id
                      ? [
                          personsById[parent2Id]?.firstName,
                          personsById[parent2Id]?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || personsById[parent2Id]?.name
                      : t("search")}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#616161" />
                </Pressable>
                {!!parent2Id && (
                  <Pressable
                    onPress={() => setParent2Id(undefined)}
                    style={[btnStyle.ghost, { paddingHorizontal: 12 }]}
                  >
                    <Text>{t("clear")}</Text>
                  </Pressable>
                )}
              </View>

              <Text style={{ color: "#555" }}>{t("spouse_optional")}</Text>
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
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
                    <Text>{t("clear")}</Text>
                  </Pressable>
                )}
              </View>
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#555" }}>{t("photo_gallery")}</Text>
                  <Pressable
                    onPress={pickGalleryPhotos}
                    style={[btnStyle.ghost, { paddingHorizontal: 12 }]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="add" size={20} color="#5e35b1" />
                      <Text style={{ color: "#5e35b1" }}>
                        {t("add_photos")}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {galleryPhotos.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    {galleryPhotos.map((uri, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        <Image
                          source={{ uri }}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            marginRight: 8,
                          }}
                        />
                        <Pressable
                          onPress={() => {
                            setGalleryPhotos((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: 0,
                            backgroundColor: "rgba(0,0,0,0.7)",
                            borderRadius: 12,
                            width: 24,
                            height: 24,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              <MarkdownEditor value={comment} onChange={setComment} />

              <Modal
                visible={parent1SelectorOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setParent1SelectorOpen(false)}
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
                      {parentCandidates
                        .filter((p) => p.id !== parent2Id)
                        .map((p) => (
                          <Pressable
                            key={p.id}
                            onPress={() => {
                              setParent1Id(p.id);
                              setParent1SelectorOpen(false);
                            }}
                            style={{ paddingVertical: 10 }}
                          >
                            <Text>
                              {[p.firstName, p.lastName]
                                .filter(Boolean)
                                .join(" ") || p.name}
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
                        onPress={() => setParent1SelectorOpen(false)}
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
                visible={parent2SelectorOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setParent2SelectorOpen(false)}
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
                      {parentCandidates
                        .filter((p) => p.id !== parent1Id)
                        .map((p) => (
                          <Pressable
                            key={p.id}
                            onPress={() => {
                              setParent2Id(p.id);
                              setParent2SelectorOpen(false);
                            }}
                            style={{ paddingVertical: 10 }}
                          >
                            <Text>
                              {[p.firstName, p.lastName]
                                .filter(Boolean)
                                .join(" ") || p.name}
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
                        onPress={() => setParent2SelectorOpen(false)}
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
                            {[p.firstName, p.lastName]
                              .filter(Boolean)
                              .join(" ") || p.name}
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
            </View>
          </ScrollView>

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
                {editPerson ? t("save") : t("add")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
/* eslint-enable complexity */
