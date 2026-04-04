import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import i18n from "i18next";
import JSZip from "jszip";
import { Platform } from "react-native";

import {
  ensureImagesDir,
  isImageId,
  loadImageData,
} from "@shared/lib/fs/images";
import { loadTreeById } from "@shared/lib/storage/indexedDB";

import type { TreeJson, Person } from "@entities/person/model/types";
import type { TreeMetadata } from "@entities/tree/model/types";

const isWeb = (): boolean => Platform.OS === "web";
const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function generateAndShareZip(
  zip: JSZip,
  fileName: string,
): Promise<void> {
  if (isWeb()) {
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  const base64 = await zip.generateAsync({ type: "base64" });
  const zipTarget = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(zipTarget, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    const title = i18n.isInitialized
      ? (i18n.t("export_dialog_title") as string)
      : "Export";
    await Sharing.shareAsync(zipTarget, {
      mimeType: "application/zip",
      dialogTitle: title,
    });
  }
}

/* eslint-disable complexity */
async function processPersonsForExport(
  persons: Person[],
  imagesFolder: JSZip | null,
): Promise<Person[]> {
  const updated: Person[] = [];
  for (const p of persons) {
    let photoUri = p.photoUri;
    let photoGallery = p.photoGallery;

    if (p.photoUri) {
      const fileName = buildAvatarFileName(p.id, p.photoUri);
      try {
        if (isWeb() && p.photoUri.startsWith("data:")) {
          imagesFolder?.file(fileName, p.photoUri.split(",")[1], {
            base64: true,
          });
          photoUri = fileName;
        } else if (isWeb() && isImageId(p.photoUri)) {
          const imageData = await loadImageData(p.photoUri);
          if (imageData?.startsWith("data:")) {
            imagesFolder?.file(fileName, imageData.split(",")[1], {
              base64: true,
            });
            photoUri = fileName;
          } else {
            photoUri = undefined;
          }
        } else {
          const data = await FileSystem.readAsStringAsync(p.photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imagesFolder?.file(fileName, data, { base64: true });
          photoUri = fileName;
        }
      } catch {
        photoUri = undefined;
      }
    }

    if (p.photoGallery?.length) {
      const files: string[] = [];
      for (let i = 0; i < p.photoGallery.length; i++) {
        const uri = p.photoGallery[i];
        const name = buildGalleryFileName(p.id, i, uri);
        try {
          if (isWeb() && uri.startsWith("data:")) {
            imagesFolder?.file(name, uri.split(",")[1], { base64: true });
            files.push(name);
          } else if (isWeb() && isImageId(uri)) {
            const imageData = await loadImageData(uri);
            if (imageData?.startsWith("data:")) {
              imagesFolder?.file(name, imageData.split(",")[1], {
                base64: true,
              });
              files.push(name);
            }
          } else {
            const data = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imagesFolder?.file(name, data, { base64: true });
            files.push(name);
          }
        } catch {
          /* skip */
        }
      }
      photoGallery = files.length ? files : undefined;
    }

    updated.push({ ...p, photoUri, photoGallery });
  }
  return updated;
}
/* eslint-enable complexity */

/* eslint-disable complexity */
async function processPersonsFromWebZip(
  persons: Person[],
  zip: JSZip,
  imagePrefix: string,
): Promise<Person[]> {
  const updated: Person[] = [];
  for (const p of persons) {
    let photoUri = p.photoUri;
    let photoGallery = p.photoGallery;

    if (photoUri && !photoUri.startsWith("data:")) {
      const entry = zip.file(
        `${imagePrefix}${photoUri.replace(/^images\//, "")}`,
      );
      if (entry) {
        try {
          photoUri = await blobToDataUrl(await entry.async("blob"));
        } catch {
          photoUri = undefined;
        }
      } else {
        photoUri = undefined;
      }
    }

    if (photoGallery?.length) {
      const uris: string[] = [];
      for (const fn of photoGallery) {
        if (fn.startsWith("data:")) {
          uris.push(fn);
        } else {
          const entry = zip.file(
            `${imagePrefix}${fn.replace(/^images\//, "")}`,
          );
          if (entry) {
            try {
              uris.push(await blobToDataUrl(await entry.async("blob")));
            } catch {
              /* skip */
            }
          }
        }
      }
      photoGallery = uris.length ? uris : undefined;
    }

    const firstName = p.firstName ?? (p as Record<string, unknown>).name ?? "";
    updated.push({
      ...p,
      firstName: String(firstName),
      lastName: p.lastName ?? undefined,
      photoUri,
      photoGallery,
    });
  }
  return updated;
}
/* eslint-enable complexity */

/* eslint-disable complexity */
async function processPersonsFromNativeZip(
  persons: Person[],
  zip: JSZip,
  imagePrefix: string,
  appImagesDir: string,
): Promise<Person[]> {
  const updated: Person[] = [];
  for (const p of persons) {
    let photoUri = p.photoUri;
    let photoGallery = p.photoGallery;

    if (photoUri && !photoUri.startsWith("file:")) {
      const entry = zip.file(
        `${imagePrefix}${photoUri.replace(/^images\//, "")}`,
      );
      if (entry) {
        try {
          const b64 = await entry.async("base64");
          const dest = `${appImagesDir}/${photoUri}`;
          await FileSystem.writeAsStringAsync(dest, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          photoUri = dest;
        } catch {
          photoUri = undefined;
        }
      } else {
        photoUri = undefined;
      }
    }

    if (photoGallery?.length) {
      const uris: string[] = [];
      for (const fn of photoGallery) {
        if (fn.startsWith("file:")) {
          uris.push(fn);
        } else {
          const entry = zip.file(
            `${imagePrefix}${fn.replace(/^images\//, "")}`,
          );
          if (entry) {
            try {
              const b64 = await entry.async("base64");
              const dest = `${appImagesDir}/${fn}`;
              await FileSystem.writeAsStringAsync(dest, b64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              uris.push(dest);
            } catch {
              /* skip */
            }
          }
        }
      }
      photoGallery = uris.length ? uris : undefined;
    }

    const firstName = p.firstName ?? (p as Record<string, unknown>).name ?? "";
    updated.push({
      ...p,
      firstName: String(firstName),
      lastName: p.lastName ?? undefined,
      photoUri,
      photoGallery,
    });
  }
  return updated;
}
/* eslint-enable complexity */

// ─── Single-tree archive ──────────────────────────────────────────────────────

export async function exportTreeArchive(
  json: string,
  metadata?: TreeMetadata,
): Promise<void> {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");

  let persons: Person[] = [];
  let positions: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(json) as TreeJson;
    persons = await processPersonsForExport(parsed.persons, imagesFolder);
    positions = parsed.positions ?? {};
  } catch {
    /* leave empty */
  }

  const treeContent = metadata
    ? JSON.stringify({ version: 2, metadata, persons, positions }, null, 2)
    : JSON.stringify({ persons, positions }, null, 2);

  zip.file("tree.json", treeContent);
  await generateAndShareZip(zip, `kora_tree_${Date.now()}.zip`);
}

export async function importTreeArchive(): Promise<string | null> {
  if (isWeb()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip,application/zip";
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const zip = await JSZip.loadAsync(await file.arrayBuffer());
          const content = await zip.file("tree.json")?.async("string");
          if (!content) {
            resolve(null);
            return;
          }
          const parsed = JSON.parse(content);
          const persons = await processPersonsFromWebZip(
            parsed.persons ?? [],
            zip,
            "images/",
          );
          resolve(
            JSON.stringify(
              { persons, positions: parsed.positions ?? {} },
              null,
              2,
            ),
          );
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

  const base64Zip = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const zip = await JSZip.loadAsync(base64Zip, { base64: true });
  const content = await zip.file("tree.json")?.async("string");
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    const appImagesDir = await ensureImagesDir();
    const persons = await processPersonsFromNativeZip(
      parsed.persons ?? [],
      zip,
      "images/",
      appImagesDir,
    );
    return JSON.stringify(
      { persons, positions: parsed.positions ?? {} },
      null,
      2,
    );
  } catch {
    return content;
  }
}

// ─── Multi-tree archive ───────────────────────────────────────────────────────

export async function exportMultiTreeArchive(
  treeIds: string[],
  treesMetadata: Record<string, TreeMetadata>,
): Promise<void> {
  const zip = new JSZip();
  const manifest: {
    version: number;
    trees: Array<{ id: string; name: string }>;
  } = {
    version: 1,
    trees: [],
  };

  for (const treeId of treeIds) {
    const meta = treesMetadata[treeId];
    if (!meta) continue;
    const treeData = await loadTreeById(treeId);
    if (!treeData) continue;

    manifest.trees.push({ id: treeId, name: meta.name });
    const treeFolder = zip.folder(`trees/${treeId}`);
    const imagesFolder = treeFolder?.folder("images") ?? null;

    const persons = await processPersonsForExport(
      treeData.persons,
      imagesFolder,
    );
    treeFolder?.file(
      "tree.json",
      JSON.stringify(
        {
          version: 2,
          metadata: meta,
          persons,
          positions: treeData.positions ?? {},
        },
        null,
        2,
      ),
    );
  }

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  await generateAndShareZip(zip, `kora_all_trees_${Date.now()}.zip`);
}

export async function importMultiTreeArchive(): Promise<Array<{
  name: string;
  treeJson: string;
}> | null> {
  if (isWeb()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip,application/zip";
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const zip = await JSZip.loadAsync(await file.arrayBuffer());
          const manifestContent = await zip
            .file("manifest.json")
            ?.async("string");
          if (!manifestContent) {
            resolve(null);
            return;
          }
          const manifest = JSON.parse(manifestContent) as {
            trees: Array<{ id: string; name: string }>;
          };
          const results: Array<{ name: string; treeJson: string }> = [];
          for (const { id, name } of manifest.trees) {
            const content = await zip
              .file(`trees/${id}/tree.json`)
              ?.async("string");
            if (!content) continue;
            const parsed = JSON.parse(content);
            const persons = await processPersonsFromWebZip(
              parsed.persons ?? [],
              zip,
              `trees/${id}/images/`,
            );
            results.push({
              name,
              treeJson: JSON.stringify(
                { persons, positions: parsed.positions ?? {} },
                null,
                2,
              ),
            });
          }
          resolve(results.length ? results : null);
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

  const base64Zip = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const zip = await JSZip.loadAsync(base64Zip, { base64: true });
  const manifestContent = await zip.file("manifest.json")?.async("string");
  if (!manifestContent) return null;

  const manifest = JSON.parse(manifestContent) as {
    trees: Array<{ id: string; name: string }>;
  };
  const appImagesDir = await ensureImagesDir();
  const results: Array<{ name: string; treeJson: string }> = [];

  for (const { id, name } of manifest.trees) {
    const content = await zip.file(`trees/${id}/tree.json`)?.async("string");
    if (!content) continue;
    const parsed = JSON.parse(content);
    const persons = await processPersonsFromNativeZip(
      parsed.persons ?? [],
      zip,
      `trees/${id}/images/`,
      appImagesDir,
    );
    results.push({
      name,
      treeJson: JSON.stringify(
        { persons, positions: parsed.positions ?? {} },
        null,
        2,
      ),
    });
  }

  return results.length ? results : null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getExtensionFromUri(uri: string): string {
  try {
    const clean = uri.split("?")[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    if (match?.[1]) return `.${match[1]}`;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

function buildAvatarFileName(personId: string, uri: string | undefined) {
  return `${personId}_avatar${uri ? getExtensionFromUri(uri) : ".jpg"}`;
}

function buildGalleryFileName(
  personId: string,
  index: number,
  uri: string | undefined,
) {
  return `${personId}_gallery_${index}${uri ? getExtensionFromUri(uri) : ".jpg"}`;
}
