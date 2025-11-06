import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const IMAGES_DIR = FileSystem.documentDirectory + "images";

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

async function convertImageToBase64Web(sourceUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (sourceUri.startsWith("data:")) {
      resolve(sourceUri);
      return;
    }

    if (sourceUri.startsWith("blob:")) {
      fetch(sourceUri)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
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
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
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

export async function copyImageToAppDir(
  personId: string,
  sourceUri: string,
): Promise<string> {
  if (Platform.OS === "web") {
    try {
      return await convertImageToBase64Web(sourceUri);
    } catch {
      return sourceUri;
    }
  }
  
  await ensureImagesDir();
  const ext = getExtensionFromUri(sourceUri);
  const target = `${IMAGES_DIR}/${personId}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}
