import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import i18n from "i18next";
import JSZip from "jszip";
import { Platform } from "react-native";

import { ensureImagesDir } from "@shared/lib/fs/images";

import type { TreeJson, Person } from "@entities/person/model/types";

const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";

/* eslint-disable complexity */
export async function exportTreeArchive(json: string): Promise<void> {
  const zip = new JSZip();

  let toWrite = json;
  try {
    const parsed = JSON.parse(json) as TreeJson;
    const updatedPersons: Person[] = [];
    const imagesFolder = zip.folder("images");

    for (const p of parsed.persons) {
      let photoUri = p.photoUri;
      let photoGallery = p.photoGallery;

      if (p.photoUri) {
        const fileName = buildAvatarFileName(p.id, p.photoUri);
        try {
          if (Platform.OS === "web" && p.photoUri.startsWith("data:")) {
            const base64Data = p.photoUri.split(",")[1];
            imagesFolder?.file(fileName, base64Data, { base64: true });
            photoUri = fileName;
          } else {
            const data = await FileSystem.readAsStringAsync(p.photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imagesFolder?.file(fileName, data, { base64: true });
            photoUri = fileName;
          }
        } catch (error) {
          console.error(`Failed to export photoUri for ${p.id}:`, error);
          photoUri = undefined;
        }
      }

      if (p.photoGallery && p.photoGallery.length > 0) {
        const galleryFiles: string[] = [];
        for (let i = 0; i < p.photoGallery.length; i++) {
          const galleryUri = p.photoGallery[i];
          const galleryFileName = buildGalleryFileName(p.id, i, galleryUri);
          try {
            if (Platform.OS === "web" && galleryUri.startsWith("data:")) {
              const base64Data = galleryUri.split(",")[1];
              imagesFolder?.file(galleryFileName, base64Data, { base64: true });
              galleryFiles.push(galleryFileName);
            } else {
              const data = await FileSystem.readAsStringAsync(galleryUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              imagesFolder?.file(galleryFileName, data, { base64: true });
              galleryFiles.push(galleryFileName);
            }
          } catch (error) {
            console.error(
              `Failed to export gallery photo ${i} for ${p.id}:`,
              error,
            );
          }
        }
        photoGallery = galleryFiles.length > 0 ? galleryFiles : undefined;
      }

      updatedPersons.push({ ...p, photoUri, photoGallery });
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
/* eslint-enable complexity */

/* eslint-disable complexity */
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
              let photoGallery = p.photoGallery;

              if (photoUri && !photoUri.startsWith("data:")) {
                const imageEntry = zip.file(
                  `images/${photoUri.replace(/^images\//, "")}`,
                );
                if (imageEntry) {
                  try {
                    const blob = await imageEntry.async("blob");
                    const reader = new FileReader();
                    photoUri = await new Promise<string>((res) => {
                      reader.onload = () => res(reader.result as string);
                      reader.readAsDataURL(blob);
                    });
                  } catch (error) {
                    console.error(
                      `Failed to import photoUri for ${p.id}:`,
                      error,
                    );
                    photoUri = undefined;
                  }
                } else {
                  console.warn(
                    `Image file not found in archive for ${p.id}: ${photoUri}`,
                  );
                  photoUri = undefined;
                }
              }

              if (photoGallery && photoGallery.length > 0) {
                const galleryUris: string[] = [];
                for (const galleryFileName of photoGallery) {
                  if (galleryFileName.startsWith("data:")) {
                    galleryUris.push(galleryFileName);
                  } else {
                    const imageEntry = zip.file(
                      `images/${galleryFileName.replace(/^images\//, "")}`,
                    );
                    if (imageEntry) {
                      try {
                        const blob = await imageEntry.async("blob");
                        const reader = new FileReader();
                        const dataUrl = await new Promise<string>((res) => {
                          reader.onload = () => res(reader.result as string);
                          reader.readAsDataURL(blob);
                        });
                        galleryUris.push(dataUrl);
                      } catch (error) {
                        console.error(
                          `Failed to import gallery photo ${galleryFileName} for ${p.id}:`,
                          error,
                        );
                      }
                    } else {
                      console.warn(
                        `Gallery image not found in archive for ${p.id}: ${galleryFileName}`,
                      );
                    }
                  }
                }
                photoGallery = galleryUris.length > 0 ? galleryUris : undefined;
              }

              const firstName = p.firstName ?? p.name ?? "";
              const lastName = p.lastName ?? undefined;
              updatedPersons.push({
                ...p,
                firstName,
                lastName,
                photoUri,
                photoGallery,
              });
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
      let photoGallery = p.photoGallery;

      if (photoUri && !photoUri.startsWith("file:")) {
        const imageEntry = zip.file(
          `images/${photoUri.replace(/^images\//, "")}`,
        );
        if (imageEntry) {
          try {
            const b64 = await imageEntry.async("base64");
            const dest = `${appImagesDir}/${photoUri}`;
            await FileSystem.writeAsStringAsync(dest, b64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            photoUri = dest;
          } catch (error) {
            console.error(`Failed to import photoUri for ${p.id}:`, error);
            photoUri = undefined;
          }
        } else {
          console.warn(
            `Image file not found in archive for ${p.id}: ${photoUri}`,
          );
          photoUri = undefined;
        }
      }

      if (photoGallery && photoGallery.length > 0) {
        const galleryUris: string[] = [];
        for (const galleryFileName of photoGallery) {
          if (galleryFileName.startsWith("file:")) {
            galleryUris.push(galleryFileName);
          } else {
            const imageEntry = zip.file(
              `images/${galleryFileName.replace(/^images\//, "")}`,
            );
            if (imageEntry) {
              try {
                const b64 = await imageEntry.async("base64");
                const dest = `${appImagesDir}/${galleryFileName}`;
                await FileSystem.writeAsStringAsync(dest, b64, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                galleryUris.push(dest);
              } catch (error) {
                console.error(
                  `Failed to import gallery photo ${galleryFileName} for ${p.id}:`,
                  error,
                );
              }
            } else {
              console.warn(
                `Gallery image not found in archive for ${p.id}: ${galleryFileName}`,
              );
            }
          }
        }
        photoGallery = galleryUris.length > 0 ? galleryUris : undefined;
      }

      const firstName = p.firstName ?? p.name ?? "";
      const lastName = p.lastName ?? undefined;
      updatedPersons.push({
        ...p,
        firstName,
        lastName,
        photoUri,
        photoGallery,
      });
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

/* eslint-enable complexity */
function getExtensionFromUri(uri: string): string {
  try {
    const clean = uri.split("?")[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    if (match?.[1]) {
      return `.${match[1]}`;
    }
  } catch {
    // ignore
  }
  return ".jpg";
}

function buildAvatarFileName(personId: string, uri: string | undefined) {
  const ext = uri ? getExtensionFromUri(uri) : ".jpg";
  return `${personId}_avatar${ext}`;
}

function buildGalleryFileName(
  personId: string,
  index: number,
  uri: string | undefined,
) {
  const ext = uri ? getExtensionFromUri(uri) : ".jpg";
  return `${personId}_gallery_${index}${ext}`;
}
