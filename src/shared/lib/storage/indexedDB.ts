import { Platform } from "react-native";

import type { TreeJson } from "@entities/person/model/types";
import type { TreeMetadata } from "@entities/tree/model/types";

import {
  saveTreeToNative,
  loadTreeFromNative,
  saveViewStateToNative,
  loadViewStateFromNative,
  saveImageToNative,
  loadImageFromNative,
  deleteImageFromNative,
  getAllImageIdsFromNative,
  clearNativeStorage,
  saveTreesIndexToNative,
  loadTreesIndexFromNative,
  saveTreeByIdToNative,
  loadTreeByIdFromNative,
  deleteTreeByIdFromNative,
  saveViewStateByIdToNative,
  loadViewStateByIdFromNative,
} from "./native";

const DB_NAME = "gentree-db";
const DB_VERSION = 3;

const TREE_STORE = "tree";
const VIEW_STATE_STORE = "viewstate";
const IMAGES_STORE = "images";
const TREES_STORE = "trees";

export type ViewState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const isWeb = Platform.OS === "web";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isWeb) {
      reject(new Error("IndexedDB is not available on native platforms"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(TREE_STORE)) {
        db.createObjectStore(TREE_STORE);
      }

      if (!db.objectStoreNames.contains(VIEW_STATE_STORE)) {
        db.createObjectStore(VIEW_STATE_STORE);
      }
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE);
      }
      if (!db.objectStoreNames.contains(TREES_STORE)) {
        db.createObjectStore(TREES_STORE);
      }
    };
  });

  return dbPromise;
}

async function getStore(
  storeName: string,
  mode: IDBTransactionMode = "readonly",
): Promise<IDBObjectStore> {
  const db = await openDB();
  const transaction = db.transaction([storeName], mode);
  return transaction.objectStore(storeName);
}

export async function saveTreeToStorage(tree: TreeJson): Promise<void> {
  if (!isWeb) {
    return saveTreeToNative(tree);
  }
  const store = await getStore(TREE_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(tree, "tree-data");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadTreeFromStorage(): Promise<TreeJson | null> {
  if (!isWeb) {
    return loadTreeFromNative();
  }
  try {
    const store = await getStore(TREE_STORE);
    const result = await new Promise<TreeJson | undefined>(
      (resolve, reject) => {
        const request = store.get("tree-data");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );

    if (!result) return null;

    if (result && Array.isArray(result.persons)) {
      return result as TreeJson;
    }
  } catch (error) {
    console.warn("Failed to load tree from IndexedDB:", error);
  }
  return null;
}

export async function saveViewStateToStorage(
  viewState: ViewState,
): Promise<void> {
  if (!isWeb) {
    return saveViewStateToNative(viewState);
  }
  const store = await getStore(VIEW_STATE_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(viewState, "view-state-data");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadViewStateFromStorage(): Promise<ViewState | null> {
  if (!isWeb) {
    return loadViewStateFromNative();
  }
  try {
    const store = await getStore(VIEW_STATE_STORE);
    const result = await new Promise<ViewState | undefined>(
      (resolve, reject) => {
        const request = store.get("view-state-data");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );

    if (!result) return null;

    if (result && typeof result.scale === "number") {
      return result as ViewState;
    }
  } catch (error) {
    console.warn("Failed to load view state from IndexedDB:", error);
  }
  return null;
}

export async function saveImageToStorage(
  imageId: string,
  imageData: string,
): Promise<void> {
  if (!isWeb) {
    return saveImageToNative(imageId, imageData);
  }
  const store = await getStore(IMAGES_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(imageData, imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadImageFromStorage(
  imageId: string,
): Promise<string | null> {
  if (!isWeb) {
    return loadImageFromNative(imageId);
  }
  try {
    const store = await getStore(IMAGES_STORE);
    const result = await new Promise<string | undefined>((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return result || null;
  } catch (error) {
    console.warn("Failed to load image from IndexedDB:", error);
    return null;
  }
}

export async function deleteImageFromStorage(imageId: string): Promise<void> {
  if (!isWeb) {
    return deleteImageFromNative(imageId);
  }
  const store = await getStore(IMAGES_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllImageIds(): Promise<string[]> {
  if (!isWeb) {
    return getAllImageIdsFromNative();
  }
  try {
    const store = await getStore(IMAGES_STORE);
    const result = await new Promise<string[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(Array.from(request.result as string[]));
      request.onerror = () => reject(request.error);
    });

    return result;
  } catch (error) {
    console.warn("Failed to get image IDs from IndexedDB:", error);
    return [];
  }
}

export async function clearStorage(): Promise<void> {
  if (!isWeb) {
    return clearNativeStorage();
  }
  const db = await openDB();
  const transaction = db.transaction(
    [TREE_STORE, VIEW_STATE_STORE, IMAGES_STORE, TREES_STORE],
    "readwrite",
  );

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(TREE_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(VIEW_STATE_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(IMAGES_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(TREES_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
  ]);
}

export async function saveTreesIndex(
  index: Record<string, TreeMetadata>,
): Promise<void> {
  if (!isWeb) {
    return saveTreesIndexToNative(index);
  }
  const store = await getStore(TREES_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(index, "index");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadTreesIndex(): Promise<Record<
  string,
  TreeMetadata
> | null> {
  if (!isWeb) {
    return loadTreesIndexFromNative();
  }
  try {
    const store = await getStore(TREES_STORE);
    const result = await new Promise<Record<string, TreeMetadata> | undefined>(
      (resolve, reject) => {
        const request = store.get("index");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    return result ?? null;
  } catch (error) {
    console.warn("Failed to load trees index from IndexedDB:", error);
    return null;
  }
}

export async function saveTreeById(
  treeId: string,
  tree: import("@entities/person/model/types").TreeJson,
): Promise<void> {
  if (!isWeb) {
    return saveTreeByIdToNative(treeId, tree);
  }
  const store = await getStore(TREES_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(tree, `tree:${treeId}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadTreeById(
  treeId: string,
): Promise<import("@entities/person/model/types").TreeJson | null> {
  if (!isWeb) {
    return loadTreeByIdFromNative(treeId);
  }
  try {
    const store = await getStore(TREES_STORE);
    const result = await new Promise<
      import("@entities/person/model/types").TreeJson | undefined
    >((resolve, reject) => {
      const request = store.get(`tree:${treeId}`);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!result || !Array.isArray(result.persons)) return null;
    return result;
  } catch (error) {
    console.warn(`Failed to load tree ${treeId} from IndexedDB:`, error);
    return null;
  }
}

export async function deleteTreeById(treeId: string): Promise<void> {
  if (!isWeb) {
    return deleteTreeByIdFromNative(treeId);
  }
  const db = await openDB();
  const transaction = db.transaction(
    [TREES_STORE, VIEW_STATE_STORE],
    "readwrite",
  );
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = transaction
        .objectStore(TREES_STORE)
        .delete(`tree:${treeId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const request = transaction
        .objectStore(VIEW_STATE_STORE)
        .delete(`view:${treeId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
  ]);
}

export async function saveViewStateById(
  treeId: string,
  viewState: ViewState,
): Promise<void> {
  if (!isWeb) {
    return saveViewStateByIdToNative(treeId, viewState);
  }
  const store = await getStore(VIEW_STATE_STORE, "readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(viewState, `view:${treeId}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadViewStateById(
  treeId: string,
): Promise<ViewState | null> {
  if (!isWeb) {
    return loadViewStateByIdFromNative(treeId);
  }
  try {
    const store = await getStore(VIEW_STATE_STORE);
    const result = await new Promise<ViewState | undefined>(
      (resolve, reject) => {
        const request = store.get(`view:${treeId}`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    if (!result || typeof result.scale !== "number") return null;
    return result;
  } catch (error) {
    console.warn(
      `Failed to load view state for tree ${treeId} from IndexedDB:`,
      error,
    );
    return null;
  }
}
