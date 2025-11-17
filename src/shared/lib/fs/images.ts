import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

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
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result as string;
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
  if (Platform.OS === "web") {
    try {
      return await convertImageToBase64Web(sourceUri);
    } catch {
      return sourceUri;
    }
  }

  await ensureImagesDir();
  const optimizedUri = await optimizeImageMobile(sourceUri);
  const ext = getExtensionFromUri(optimizedUri);
  const target = `${IMAGES_DIR}/${personId}.${ext}`;
  await FileSystem.copyAsync({ from: optimizedUri, to: target });
  return target;
}
