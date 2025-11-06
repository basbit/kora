import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TreeJson } from "@entities/person/model/types";

const TREE_KEY = "gentree:tree";
const VIEW_STATE_KEY = "gentree:viewstate";

export type ViewState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export async function saveTreeToStorage(tree: TreeJson): Promise<void> {
  const payload = JSON.stringify(tree);
  await AsyncStorage.setItem(TREE_KEY, payload);
}

export async function loadTreeFromStorage(): Promise<TreeJson | null> {
  const raw = await AsyncStorage.getItem(TREE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.persons)) {
      return parsed as TreeJson;
    }
  } catch {
    return null;
  }
  return null;
}

export async function saveViewStateToStorage(
  viewState: ViewState,
): Promise<void> {
  const payload = JSON.stringify(viewState);
  await AsyncStorage.setItem(VIEW_STATE_KEY, payload);
}

export async function loadViewStateFromStorage(): Promise<ViewState | null> {
  const raw = await AsyncStorage.getItem(VIEW_STATE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.scale === "number") {
      return parsed as ViewState;
    }
  } catch {
    return null;
  }
  return null;
}
