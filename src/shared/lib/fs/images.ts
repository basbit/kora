import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import React from "react";
import { Platform } from "react-native";

import {
  saveImageToStorage,
  loadImageFromStorage,
  deleteImageFromStorage,
} from "@shared/lib/storage/indexedDB";

export const isWeb = (): boolean => {
  return Platform.OS === "web";
};

const IMAGES_DIR = FileSystem.documentDirectory + "images";
const MAX_SIZE_KB = 500;
const MAX_DIMENSION = 1024;

export async function ensureImagesDir(): Promise<string> {
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
  return IMAGES_DIR;
}

function getExtensionFromUri(uri: string): string {
  const match = uri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : "jpg";
}

function getImageSizeInKB(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  const bytes = (base64.length * 3) / 4;
  return bytes / 1024;
}

async function optimizeImageWeb(
  img: HTMLImageElement,
  quality = 0.85,
): Promise<string> {
  const canvas = document.createElement("canvas");
  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = (height / width) * MAX_DIMENSION;
      width = MAX_DIMENSION;
    } else {
      width = (width / height) * MAX_DIMENSION;
      height = MAX_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(img, 0, 0, width, height);

  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  if (getImageSizeInKB(dataUrl) > MAX_SIZE_KB && quality > 0.5) {
    dataUrl = canvas.toDataURL("image/jpeg", quality - 0.1);
  }

  return dataUrl;
}

async function convertImageToBase64Web(sourceUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (sourceUri.startsWith("data:")) {
      const sizeKB = getImageSizeInKB(sourceUri);
      if (sizeKB <= MAX_SIZE_KB) {
        resolve(sourceUri);
        return;
      }

      const img = new Image();
      img.onload = async () => {
        try {
          const optimized = await optimizeImageWeb(img);
          resolve(optimized);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = sourceUri;
      return;
    }

    if (sourceUri.startsWith("blob:")) {
      fetch(sourceUri)
        .then((response) => response.blob())
        .then((blob) => {
          const mimeType = blob.type || "image/jpeg";
          const reader = new FileReader();
          reader.onloadend = async () => {
            let dataUrl = reader.result as string;
            if (dataUrl.startsWith("data:application/octet-stream")) {
              dataUrl = dataUrl.replace(
                "data:application/octet-stream",
                `data:${mimeType}`,
              );
            }

            const sizeKB = getImageSizeInKB(dataUrl);

            if (sizeKB <= MAX_SIZE_KB) {
              resolve(dataUrl);
              return;
            }

            const img = new Image();
            img.onload = async () => {
              try {
                const optimized = await optimizeImageWeb(img);
                resolve(optimized);
              } catch (error) {
                reject(error);
              }
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = dataUrl;
          };
          reader.onerror = () => {
            reject(new Error("Failed to read blob"));
          };
          reader.readAsDataURL(blob);
        })
        .catch(reject);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const optimized = await optimizeImageWeb(img);
        resolve(optimized);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = sourceUri;
  });
}

async function optimizeImageMobile(sourceUri: string): Promise<string> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(sourceUri);
    if (!fileInfo.exists) {
      return sourceUri;
    }

    const sizeKB = (fileInfo.size || 0) / 1024;

    if (sizeKB <= MAX_SIZE_KB) {
      return sourceUri;
    }

    const manipResult = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );

    return manipResult.uri;
  } catch {
    return sourceUri;
  }
}

export async function copyImageToAppDir(
  personId: string,
  sourceUri: string,
): Promise<string> {
  if (isWeb()) {
    if (
      sourceUri.startsWith("data:") &&
      getImageSizeInKB(sourceUri) <= MAX_SIZE_KB
    ) {
      return sourceUri;
    }

    try {
      const base64Data = await convertImageToBase64Web(sourceUri);
      await saveImageToStorage(personId, base64Data);
      return personId;
    } catch (error) {
      console.warn(
        "Failed to save image to IndexedDB, falling back to base64:",
        error,
      );
      try {
        return await convertImageToBase64Web(sourceUri);
      } catch (fallbackError) {
        console.error("Failed to convert image to base64:", fallbackError);
        return sourceUri;
      }
    }
  }

  await ensureImagesDir();
  const optimizedUri = await optimizeImageMobile(sourceUri);
  const ext = getExtensionFromUri(optimizedUri);
  const target = `${IMAGES_DIR}/${personId}.${ext}`;
  await FileSystem.copyAsync({ from: optimizedUri, to: target });
  return target;
}

export function isImageId(uri: string): boolean {
  return (
    uri.length >= 10 &&
    !uri.startsWith("data:") &&
    !uri.startsWith("file:") &&
    !uri.startsWith("http") &&
    !uri.startsWith("blob:") &&
    !uri.includes("/") &&
    /^[a-z0-9_]+$/.test(uri)
  );
}

export async function loadImageData(imageUri: string): Promise<string | null> {
  if (isWeb()) {
    if (isImageId(imageUri)) {
      return await loadImageFromStorage(imageUri);
    } else if (imageUri.startsWith("data:")) {
      return imageUri;
    }
  }

  return imageUri;
}

export async function deleteImageData(imageUri: string): Promise<void> {
  if (isWeb()) {
    if (isImageId(imageUri)) {
      await deleteImageFromStorage(imageUri);
    }
  } else {
    try {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    } catch (error) {
      console.warn("Failed to delete image file:", error);
    }
  }
}

export function useImageData(imageUri?: string) {
  const [imageData, setImageData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!imageUri) {
      setImageData(null);
      return;
    }

    if (imageUri.startsWith("data:")) {
      setImageData(imageUri);
      return;
    }

    if (isImageId(imageUri)) {
      setLoading(true);
      loadImageData(imageUri)
        .then(setImageData)
        .catch(() => setImageData(null))
        .finally(() => setLoading(false));
    } else {
      setImageData(imageUri);
    }
  }, [imageUri]);

  return { imageData, loading };
}

export function useImageGalleryData(imageUris?: string[]) {
  const [imageData, setImageData] = React.useState<(string | null)[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!imageUris || imageUris.length === 0) {
      setImageData([]);
      return;
    }

    setLoading(true);
    const loadPromises = imageUris.map((uri) => loadImageData(uri));

    Promise.all(loadPromises)
      .then((results) => {
        setImageData(results);
      })
      .catch(() => {
        setImageData(new Array(imageUris.length).fill(null));
      })
      .finally(() => setLoading(false));
  }, [imageUris]);

  return { imageData, loading };
}
