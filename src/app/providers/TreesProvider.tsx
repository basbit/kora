import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { Platform } from "react-native";

import {
  saveTreesIndex,
  loadTreesIndex,
  saveTreeById,
  loadTreeFromStorage,
  deleteTreeById,
} from "@shared/lib/storage/indexedDB";

import type { TreeJson } from "@entities/person/model/types";
import { mergeAsSpouses, split } from "@entities/tree/model/operations";
import type {
  MergeAsSpousesParams,
  SplitParams,
} from "@entities/tree/model/operations";
import type { TreeMetadata, TreesState } from "@entities/tree/model/types";

function genId(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

type TreesAction =
  | { type: "set-index"; payload: Record<string, TreeMetadata> }
  | { type: "set-active"; payload: { treeId: string } }
  | { type: "create-tree"; payload: TreeMetadata }
  | { type: "update-metadata"; payload: TreeMetadata }
  | { type: "delete-tree"; payload: { treeId: string } };

type TreesCtx = {
  trees: TreeMetadata[];
  activeTreeId: string | null;
  setActiveTree: (id: string) => void;
  createTree: (name: string) => string;
  renameTree: (id: string, name: string) => void;
  deleteTree: (id: string) => void;
  updateMetadata: (meta: TreeMetadata) => void;
  importTree: (name: string, data: TreeJson) => Promise<string>;
  mergeIntoTree: (
    params: Omit<MergeAsSpousesParams, "newTreeId">,
  ) => Promise<void>;
  splitFromTree: (params: SplitParams) => Promise<void>;
};

function reducer(state: TreesState, action: TreesAction): TreesState {
  switch (action.type) {
    case "set-index":
      return { ...state, trees: action.payload };
    case "set-active":
      return { ...state, activeTreeId: action.payload.treeId };
    case "create-tree":
      return {
        ...state,
        trees: { ...state.trees, [action.payload.id]: action.payload },
      };
    case "update-metadata":
      return {
        ...state,
        trees: { ...state.trees, [action.payload.id]: action.payload },
      };
    case "delete-tree": {
      const { [action.payload.treeId]: _removed, ...rest } = state.trees;
      const newActive =
        state.activeTreeId === action.payload.treeId
          ? (Object.keys(rest)[0] ?? null)
          : state.activeTreeId;
      return { ...state, trees: rest, activeTreeId: newActive };
    }
    default:
      return state;
  }
}

const TreesCtxDefault: TreesCtx = {
  trees: [],
  activeTreeId: null,
  setActiveTree: () => {},
  createTree: () => "",
  renameTree: () => {},
  deleteTree: () => {},
  updateMetadata: () => {},
  importTree: async () => "",
  mergeIntoTree: async () => {},
  splitFromTree: async () => {},
};

const TreesContext = createContext<TreesCtx>(TreesCtxDefault);

const MIGRATION_FLAG = "gentree_migration_v2_done";

async function getMigrationFlag(): Promise<boolean> {
  if (Platform.OS === "web") {
    return localStorage.getItem(MIGRATION_FLAG) === "1";
  }
  return (await AsyncStorage.getItem(MIGRATION_FLAG)) === "1";
}

async function setMigrationFlag(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(MIGRATION_FLAG, "1");
  } else {
    await AsyncStorage.setItem(MIGRATION_FLAG, "1");
  }
}

async function runMigration(): Promise<string | null> {
  try {
    const migrated = await getMigrationFlag();
    if (migrated) return null;

    // Try to load legacy tree
    const legacy = await loadTreeFromStorage();
    if (
      !legacy ||
      !Array.isArray(legacy.persons) ||
      legacy.persons.length === 0
    ) {
      await setMigrationFlag();
      return null;
    }

    // Create a new tree from legacy data
    const newId = genId();
    await saveTreeById(newId, legacy);
    await setMigrationFlag();

    return newId;
  } catch (error) {
    console.warn("Migration error:", error);
    return null;
  }
}

export const TreesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    activeTreeId: null,
    trees: {},
  });

  useEffect(() => {
    (async () => {
      try {
        let index = await loadTreesIndex();

        if (!index || Object.keys(index).length === 0) {
          // Try migration from v1
          const migratedId = await runMigration();
          if (migratedId) {
            const meta: TreeMetadata = {
              id: migratedId,
              name: "My Family",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              personCount: 0,
            };
            index = { [migratedId]: meta };
            await saveTreesIndex(index);
          }
        }

        if (index && Object.keys(index).length > 0) {
          dispatch({ type: "set-index", payload: index });
          const firstId = Object.keys(index)[0];
          dispatch({ type: "set-active", payload: { treeId: firstId } });
        } else {
          // No data at all — create a default empty tree
          const defaultId = genId();
          const defaultMeta: TreeMetadata = {
            id: defaultId,
            name: "My Family",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            personCount: 0,
          };
          await saveTreesIndex({ [defaultId]: defaultMeta });
          dispatch({ type: "create-tree", payload: defaultMeta });
          dispatch({ type: "set-active", payload: { treeId: defaultId } });
        }
      } catch (error) {
        console.warn("Failed to load trees index:", error);
      }
    })();
  }, []);

  // Persist index on every change
  useEffect(() => {
    if (Object.keys(state.trees).length === 0) return;
    saveTreesIndex(state.trees).catch(() => undefined);
  }, [state.trees]);

  const api = useMemo(
    (): TreesCtx => ({
      trees: Object.values(state.trees).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
      activeTreeId: state.activeTreeId,
      setActiveTree: (id: string) => {
        if (state.trees[id]) {
          dispatch({ type: "set-active", payload: { treeId: id } });
        }
      },
      createTree: (name: string) => {
        const id = genId();
        const meta: TreeMetadata = {
          id,
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          personCount: 0,
        };
        dispatch({ type: "create-tree", payload: meta });
        if (!state.activeTreeId) {
          dispatch({ type: "set-active", payload: { treeId: id } });
        }
        return id;
      },
      renameTree: (id: string, name: string) => {
        const existing = state.trees[id];
        if (!existing) return;
        dispatch({
          type: "update-metadata",
          payload: { ...existing, name, updatedAt: Date.now() },
        });
      },
      deleteTree: (id: string) => {
        dispatch({ type: "delete-tree", payload: { treeId: id } });
        deleteTreeById(id).catch(() => undefined);
      },
      updateMetadata: (meta: TreeMetadata) => {
        dispatch({ type: "update-metadata", payload: meta });
      },
      importTree: async (name: string, data: TreeJson) => {
        const id = genId();
        await saveTreeById(id, data);
        const meta: TreeMetadata = {
          id,
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          personCount: (data.persons ?? []).length,
        };
        dispatch({ type: "create-tree", payload: meta });
        return id;
      },
      mergeIntoTree: async (
        params: Omit<MergeAsSpousesParams, "newTreeId">,
      ) => {
        const newTreeId = genId();
        const result = mergeAsSpouses({ ...params, newTreeId });
        const persons = Object.values(result.personsById);
        await saveTreeById(newTreeId, { persons, positions: result.positions });
        const nameA = state.trees[params.treeA.id]?.name ?? "Tree A";
        const nameB = state.trees[params.treeB.id]?.name ?? "Tree B";
        const newMeta: TreeMetadata = {
          id: newTreeId,
          name: `${nameA} + ${nameB}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          personCount: persons.length,
          rootPersonId: result.rootId,
        };
        dispatch({ type: "create-tree", payload: newMeta });
        dispatch({ type: "set-active", payload: { treeId: newTreeId } });
      },
      splitFromTree: async (params: SplitParams) => {
        const { extracted } = split({ ...params, keepInOriginal: true });
        const extractedPersons = Object.values(extracted.personsById);
        await saveTreeById(extracted.id, {
          persons: extractedPersons,
          positions: extracted.positions,
        });
        const newMeta: TreeMetadata = {
          id: extracted.id,
          name: params.newTreeName?.trim() || "Extracted Branch",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          personCount: extractedPersons.length,
          rootPersonId: extracted.rootId,
        };
        dispatch({ type: "create-tree", payload: newMeta });
        dispatch({ type: "set-active", payload: { treeId: extracted.id } });
      },
    }),
    [state],
  );

  return <TreesContext.Provider value={api}>{children}</TreesContext.Provider>;
};

export function useTreesStore(): TreesCtx {
  return useContext(TreesContext);
}
