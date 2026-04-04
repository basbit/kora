import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TreeJson } from "@entities/person/model/types";
import type { TreeMetadata } from "@entities/tree/model/types";

import { ViewState } from "./indexedDB";

const TREE_KEY = "gentree_tree_data";
const VIEW_STATE_KEY = "gentree_view_state";
const IMAGES_PREFIX = "gentree_image_";
const TREES_INDEX_KEY = "gentree_trees_index";

export async function saveTreeToNative(tree: TreeJson): Promise<void> {
  const json = JSON.stringify(tree);
  await AsyncStorage.setItem(TREE_KEY, json);
}

export async function loadTreeFromNative(): Promise<TreeJson | null> {
  try {
    const json = await AsyncStorage.getItem(TREE_KEY);
    if (!json) return null;
    return JSON.parse(json) as TreeJson;
  } catch (error) {
    console.warn("Failed to load tree from AsyncStorage:", error);
    return null;
  }
}

export async function saveViewStateToNative(
  viewState: ViewState,
): Promise<void> {
  const json = JSON.stringify(viewState);
  await AsyncStorage.setItem(VIEW_STATE_KEY, json);
}

export async function loadViewStateFromNative(): Promise<ViewState | null> {
  try {
    const json = await AsyncStorage.getItem(VIEW_STATE_KEY);
    if (!json) return null;
    return JSON.parse(json) as ViewState;
  } catch (error) {
    console.warn("Failed to load view state from AsyncStorage:", error);
    return null;
  }
}

export async function saveImageToNative(
  imageId: string,
  imageData: string,
): Promise<void> {
  await AsyncStorage.setItem(`${IMAGES_PREFIX}${imageId}`, imageData);
}

export async function loadImageFromNative(
  imageId: string,
): Promise<string | null> {
  return await AsyncStorage.getItem(`${IMAGES_PREFIX}${imageId}`);
}

export async function deleteImageFromNative(imageId: string): Promise<void> {
  await AsyncStorage.removeItem(`${IMAGES_PREFIX}${imageId}`);
}

export async function getAllImageIdsFromNative(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter((k) => k.startsWith(IMAGES_PREFIX))
    .map((k) => k.replace(IMAGES_PREFIX, ""));
}

export async function clearNativeStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter(
    (k) =>
      k === TREE_KEY ||
      k === VIEW_STATE_KEY ||
      k === TREES_INDEX_KEY ||
      k.startsWith(IMAGES_PREFIX) ||
      k.startsWith("gentree_tree_") ||
      k.startsWith("gentree_view_"),
  );
  await AsyncStorage.multiRemove(appKeys);
}

export async function saveTreesIndexToNative(
  index: Record<string, TreeMetadata>,
): Promise<void> {
  await AsyncStorage.setItem(TREES_INDEX_KEY, JSON.stringify(index));
}

export async function loadTreesIndexFromNative(): Promise<Record<
  string,
  TreeMetadata
> | null> {
  try {
    const json = await AsyncStorage.getItem(TREES_INDEX_KEY);
    if (!json) return null;
    return JSON.parse(json) as Record<string, TreeMetadata>;
  } catch (error) {
    console.warn("Failed to load trees index from AsyncStorage:", error);
    return null;
  }
}

export async function saveTreeByIdToNative(
  treeId: string,
  tree: import("@entities/person/model/types").TreeJson,
): Promise<void> {
  await AsyncStorage.setItem(`gentree_tree_${treeId}`, JSON.stringify(tree));
}

export async function loadTreeByIdFromNative(
  treeId: string,
): Promise<import("@entities/person/model/types").TreeJson | null> {
  try {
    const json = await AsyncStorage.getItem(`gentree_tree_${treeId}`);
    if (!json) return null;
    return JSON.parse(json) as import("@entities/person/model/types").TreeJson;
  } catch (error) {
    console.warn(`Failed to load tree ${treeId} from AsyncStorage:`, error);
    return null;
  }
}

export async function deleteTreeByIdFromNative(treeId: string): Promise<void> {
  await AsyncStorage.multiRemove([
    `gentree_tree_${treeId}`,
    `gentree_view_${treeId}`,
  ]);
}

export async function saveViewStateByIdToNative(
  treeId: string,
  viewState: import("./indexedDB").ViewState,
): Promise<void> {
  await AsyncStorage.setItem(
    `gentree_view_${treeId}`,
    JSON.stringify(viewState),
  );
}

export async function loadViewStateByIdFromNative(
  treeId: string,
): Promise<import("./indexedDB").ViewState | null> {
  try {
    const json = await AsyncStorage.getItem(`gentree_view_${treeId}`);
    if (!json) return null;
    return JSON.parse(json) as import("./indexedDB").ViewState;
  } catch (error) {
    console.warn(
      `Failed to load view state for tree ${treeId} from AsyncStorage:`,
      error,
    );
    return null;
  }
}
