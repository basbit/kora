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

import { PersonFormFields } from "./PersonFormFields";
import { PersonPhotoSection } from "./PersonPhotoSection";
import { PersonRelationsSection } from "./PersonRelationsSection";

function displayToIso(display?: string): string | undefined {
  if (!display) return undefined;
  const parts = display.split(".");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else if (parts.length === 2) {
    const [month, year] = parts;
    return `${year}-${month.padStart(2, "0")}`;
  } else if (parts.length === 1) {
    return parts[0];
  }
  return undefined;
}

function isoToDisplay(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${parseInt(day)}.${parseInt(month)}.${year}`;
  } else if (parts.length === 2) {
    const [year, month] = parts;
    return `${parseInt(month)}.${year}`;
  } else if (parts.length === 1) {
    return parts[0];
  }
  return "";
}

type SelectionRange = { start: number; end: number };

const markdownPreviewStyles = {
  body: { color: "#1f2933", fontSize: 14, lineHeight: 20 },
  link: { color: "#1e88e5" },
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
  text: { color: "white", fontWeight: "600" as const },
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

  useEffect(() => {
    if (!inputRef.current?.isFocused?.()) {
      const caret = { start: value.length, end: value.length };
      selectionRef.current = caret;
      setSelection(caret);
    }
  }, [value]);

  const wrapSelection = useCallback(
    (startWrapper: string, endWrapper?: string, placeholder?: string) => {
      const sel = getSelection();
      const start = Math.min(sel.start, sel.end);
      const end = Math.max(sel.start, sel.end);
      const selected = value.slice(start, end);
      const insertBody = selected || placeholder || "";
      const closing = endWrapper ?? startWrapper;
      const insertion = `${startWrapper}${insertBody}${closing}`;
      const nextValue = value.slice(0, start) + insertion + value.slice(end);
      onChange(nextValue);
      focusInput();
      const newSel: SelectionRange = selected
        ? {
            start: start + startWrapper.length + insertBody.length,
            end: start + startWrapper.length + insertBody.length,
          }
        : {
            start: start + startWrapper.length,
            end: start + startWrapper.length + insertBody.length,
          };
      applySelection(newSel);
    },
    [applySelection, focusInput, getSelection, onChange, value],
  );

  const applyLinePrefix = useCallback(
    (prefix: string) => {
      const sel = getSelection();
      const start = Math.min(sel.start, sel.end);
      const prevNewLine = value.lastIndexOf("\n", start - 1);
      const insertionIndex = prevNewLine === -1 ? 0 : prevNewLine + 1;
      const nextValue =
        value.slice(0, insertionIndex) + prefix + value.slice(insertionIndex);
      onChange(nextValue);
      focusInput();
      applySelection({
        start: sel.start + prefix.length,
        end: sel.end + prefix.length,
      });
    },
    [applySelection, focusInput, getSelection, onChange, value],
  );

  const insertLink = useCallback(() => {
    const sel = getSelection();
    const start = Math.min(sel.start, sel.end);
    const end = Math.max(sel.start, sel.end);
    const selected = value.slice(start, end);
    const label =
      selected || t("comment_link_placeholder", { defaultValue: "текст" });
    const urlPlaceholder = "https://";
    const insertion = `[${label}](${urlPlaceholder})`;
    onChange(value.slice(0, start) + insertion + value.slice(end));
    focusInput();
    const urlStart = start + label.length + 2;
    applySelection({ start: urlStart, end: urlStart + urlPlaceholder.length });
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
        onChangeText={onChange}
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
          { minHeight: 160, backgroundColor: "#fafafa", borderStyle: "dashed" },
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

export const AddPersonModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  editPerson?: Person;
  onExtractFamily?: (person: Person) => void;
}> = ({ visible, onClose, editPerson, onExtractFamily }) => {
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
  const [spouseId, setSpouseId] = useState<string | undefined>(undefined);

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

  useEffect(() => {
    if (!visible) return;
    if (editPerson) {
      loadEditData();
    } else {
      resetForm();
    }
  }, [visible, editPerson, loadEditData, resetForm]);

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
        const copied = await copyImageToAppDir(
          `${id}_gallery_${Date.now()}_${i}`,
          uri,
        );
        copiedPhotos.push(copied);
      } catch {
        /* skip */
      }
    }
    return copiedPhotos;
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
      setNodePosition(id, startX + idx * spacing, Math.max(0, p.y - 160));
      return;
    }
    const xs = Object.values(positions).map((p) => p.x);
    const maxX = xs.length ? Math.max(...xs) : 0;
    setNodePosition(id, maxX + 200, 600);
  };

  const submit = async () => {
    if (!firstName.trim()) return;

    if (editPerson) {
      const photo = await maybeCopyPhoto(editPerson.id);
      const gallery = await maybeCopyGalleryPhotos(editPerson.id);
      updatePerson({
        ...editPerson,
        firstName,
        lastName: lastName || undefined,
        birthDateISO: displayToIso(birth),
        deathDateISO: displayToIso(death),
        comment: comment || undefined,
        photoUri: photo,
        photoGallery: gallery,
        parentIds: [parent1Id, parent2Id].filter(Boolean) as string[],
        spouseIds: spouseId ? [spouseId] : [],
      });
    } else {
      const id = addPerson({
        firstName,
        lastName: lastName || undefined,
        birthDateISO: displayToIso(birth),
        deathDateISO: displayToIso(death),
        comment: comment || undefined,
      });
      const photo = await maybeCopyPhoto(id);
      const gallery = await maybeCopyGalleryPhotos(id);
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
      if (parent1Id) linkParentChild(parent1Id, id);
      if (parent2Id) linkParentChild(parent2Id, id);
      if (spouseId && spouseId !== id) linkSpouses(spouseId, id);
      placeInitially(id);
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
            width: "95%",
            maxHeight: Platform.OS === "web" ? "90%" : "80%",
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
              <PersonPhotoSection
                photoUri={newPhotoUri}
                onPhotoChange={setNewPhotoUri}
                galleryPhotos={galleryPhotos}
                onGalleryChange={setGalleryPhotos}
              />

              <PersonFormFields
                firstName={firstName}
                onFirstNameChange={setFirstName}
                lastName={lastName}
                onLastNameChange={setLastName}
                birth={birth}
                onBirthChange={setBirth}
                death={death}
                onDeathChange={setDeath}
              />

              <PersonRelationsSection
                parent1Id={parent1Id}
                onParent1Change={setParent1Id}
                parent2Id={parent2Id}
                onParent2Change={setParent2Id}
                spouseId={spouseId}
                onSpouseChange={setSpouseId}
                personsById={personsById}
                excludePersonId={editPerson?.id}
              />

              <MarkdownEditor value={comment} onChange={setComment} />
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {editPerson && onExtractFamily && (
              <Pressable
                onPress={() => {
                  onExtractFamily(editPerson);
                  onClose();
                }}
                style={[
                  btnStyle.ghost,
                  { backgroundColor: "#e8f5e9", marginRight: "auto" },
                ]}
              >
                <Text style={[btnStyle.text, { color: "#2e7d32" }]}>
                  {t("extract_family")}
                </Text>
              </Pressable>
            )}
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
