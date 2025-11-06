import * as FileSystem from "expo-file-system";

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

export async function copyImageToAppDir(
  personId: string,
  sourceUri: string,
): Promise<string> {
  await ensureImagesDir();
  const ext = getExtensionFromUri(sourceUri);
  const target = `${IMAGES_DIR}/${personId}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}
