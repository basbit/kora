import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import i18n from "i18next";
import JSZip from "jszip";
import { Platform } from "react-native";

import { ensureImagesDir } from "@shared/lib/fs/images";

import type { TreeJson, Person } from "@entities/person/model/types";

const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";

export async function exportTreeArchive(json: string): Promise<void> {
  const zip = new JSZip();

  let toWrite = json;
  try {
    const parsed = JSON.parse(json) as TreeJson;
    const updatedPersons: Person[] = [];
    const imagesFolder = zip.folder("images");

    for (const p of parsed.persons) {
      if (p.photoUri) {
        const fileName = getFileNameFromUri(p.photoUri) || `${p.id}.jpg`;
        try {
          if (Platform.OS === "web" && p.photoUri.startsWith("data:")) {
            const base64Data = p.photoUri.split(",")[1];
            imagesFolder?.file(fileName, base64Data, { base64: true });
            updatedPersons.push({ ...p, photoUri: fileName });
          } else {
            const data = await FileSystem.readAsStringAsync(p.photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imagesFolder?.file(fileName, data, { base64: true });
            updatedPersons.push({ ...p, photoUri: fileName });
          }
        } catch {
          updatedPersons.push(p);
        }
      } else {
        updatedPersons.push(p);
      }
    }
    toWrite = JSON.stringify(
      { persons: updatedPersons, positions: parsed.positions },
      null,
      2,
    );
  } catch {
    // Ignore errors during initialization
  }

  zip.file("tree.json", toWrite);

  if (Platform.OS === "web") {
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kora_tree_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const base64 = await zip.generateAsync({ type: "base64" });
  const zipTarget = `${baseDir}gentree_${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(zipTarget, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    const title = i18n.isInitialized
      ? (i18n.t("export_dialog_title") as string)
      : "Export tree";
    await Sharing.shareAsync(zipTarget, {
      mimeType: "application/zip",
      dialogTitle: title,
    });
  }
}

export async function importTreeArchive(): Promise<string | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip,application/zip";
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);

          const treeEntry = zip.file("tree.json");
          if (!treeEntry) {
            resolve(null);
            return;
          }
          const content = await treeEntry.async("string");

          try {
            const parsed = JSON.parse(content) as TreeJson;
            const updatedPersons: Person[] = [];

            for (const p of parsed.persons) {
              let photoUri = p.photoUri;
              if (photoUri && !photoUri.startsWith("data:")) {
                const imageEntry = zip.file(
                  `images/${photoUri.replace(/^images\//, "")}`,
                );
                if (imageEntry) {
                  const blob = await imageEntry.async("blob");
                  const reader = new FileReader();
                  photoUri = await new Promise<string>((res) => {
                    reader.onload = () => res(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                }
              }
              const firstName = p.firstName ?? p.name ?? "";
              const lastName = p.lastName ?? undefined;
              updatedPersons.push({ ...p, firstName, lastName, photoUri });
            }
            resolve(
              JSON.stringify(
                { persons: updatedPersons, positions: parsed.positions },
                null,
                2,
              ),
            );
          } catch {
            resolve(content);
          }
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/zip", "application/x-zip-compressed", "*/*"],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];

  const base64Zip = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const zip = await JSZip.loadAsync(base64Zip, { base64: true });

  const treeEntry = zip.file("tree.json");
  if (!treeEntry) return null;
  const content = await treeEntry.async("string");

  try {
    const parsed = JSON.parse(content) as TreeJson;
    const appImagesDir = await ensureImagesDir();

    const updatedPersons: Person[] = [];
    for (const p of parsed.persons) {
      let photoUri = p.photoUri;
      if (photoUri && !photoUri.startsWith("file:")) {
        const imageEntry = zip.file(
          `images/${photoUri.replace(/^images\//, "")}`,
        );
        if (imageEntry) {
          const b64 = await imageEntry.async("base64");
          const dest = `${appImagesDir}/${photoUri}`;
          try {
            await FileSystem.writeAsStringAsync(dest, b64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            photoUri = dest;
          } catch {
            // Ignore errors during image copy
          }
        }
      }
      const firstName = p.firstName ?? p.name ?? "";
      const lastName = p.lastName ?? undefined;
      updatedPersons.push({ ...p, firstName, lastName, photoUri });
    }
    return JSON.stringify(
      { persons: updatedPersons, positions: parsed.positions },
      null,
      2,
    );
  } catch {
    return content;
  }
}

function getFileNameFromUri(uri: string): string | null {
  try {
    const clean = uri.split("?")[0];
    const parts = clean.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}
