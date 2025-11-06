import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { View, ActivityIndicator } from "react-native";

import {
  loadTreeFromStorage,
  saveTreeToStorage,
} from "@shared/lib/storage/asyncStorage";

import type {
  Person,
  TreeJson,
  NodePosition,
} from "@entities/person/model/types";

export type PersonsById = Record<string, Person>;

type State = {
  personsById: PersonsById;
  rootId?: string;
  uiOffsets: Record<string, number>;
  positions: Record<string, NodePosition>;
};

type AddPersonInput = {
  firstName: string;
  lastName?: string;
  birthDateISO?: string;
  deathDateISO?: string;
  comment?: string;
  photoUri?: string;
};

type Action =
  | { type: "set-all"; payload: State }
  | { type: "add-person"; payload: Person }
  | { type: "update-person"; payload: Person }
  | { type: "remove-person"; payload: { id: string } }
  | {
      type: "link-parent-child";
      payload: { parentId: string; childId: string };
    }
  | {
      type: "unlink-parent-child";
      payload: { parentId: string; childId: string };
    }
  | { type: "set-root"; payload: { id?: string } }
  | { type: "set-node-offset"; payload: { id: string; offset: number } }
  | {
      type: "set-node-position";
      payload: { id: string; x: number; y: number };
    };

function applyRemovePerson(state: State, id: string): State {
  const { [id]: _removed, ...rest } = state.personsById;
  const next: PersonsById = { ...rest };
  for (const p of Object.values(next)) {
    if (p.parentIds.includes(id)) {
      p.parentIds = p.parentIds.filter((pid) => pid !== id);
    }
  }
  const newRoot = state.rootId === id ? undefined : state.rootId;
  const { [id]: _o, ...restOffsets } = state.uiOffsets;
  const { [id]: _pos, ...restPos } = state.positions;
  return {
    ...state,
    personsById: next,
    rootId: newRoot,
    uiOffsets: restOffsets,
    positions: restPos,
  };
}

function applyLinkParent(
  state: State,
  parentId: string,
  childId: string,
): State {
  const child = state.personsById[childId];
  if (!child) return state;
  if (child.parentIds.includes(parentId)) return state;
  const updated: Person = {
    ...child,
    parentIds: [...child.parentIds, parentId].slice(0, 2),
  };
  return {
    ...state,
    personsById: { ...state.personsById, [child.id]: updated },
  };
}

function applyUnlinkParent(
  state: State,
  parentId: string,
  childId: string,
): State {
  const child = state.personsById[childId];
  if (!child) return state;
  const updated: Person = {
    ...child,
    parentIds: child.parentIds.filter((pid) => pid !== parentId),
  };
  return {
    ...state,
    personsById: { ...state.personsById, [child.id]: updated },
  };
}

function applyLinkSpouses(state: State, aId: string, bId: string): State {
  if (!state.personsById[aId] || !state.personsById[bId]) return state;
  const a = state.personsById[aId];
  const b = state.personsById[bId];
  const aSet = new Set(a.spouseIds ?? []);
  const bSet = new Set(b.spouseIds ?? []);
  aSet.add(bId);
  bSet.add(aId);
  const aUpd: Person = { ...a, spouseIds: Array.from(aSet) };
  const bUpd: Person = { ...b, spouseIds: Array.from(bSet) };
  return {
    ...state,
    personsById: { ...state.personsById, [aId]: aUpd, [bId]: bUpd },
  };
}

function applyUnlinkSpouses(state: State, aId: string, bId: string): State {
  if (!state.personsById[aId] || !state.personsById[bId]) return state;
  const a = state.personsById[aId];
  const b = state.personsById[bId];
  const aUpd: Person = {
    ...a,
    spouseIds: (a.spouseIds ?? []).filter((x) => x !== bId),
  };
  const bUpd: Person = {
    ...b,
    spouseIds: (b.spouseIds ?? []).filter((x) => x !== aId),
  };
  return {
    ...state,
    personsById: { ...state.personsById, [aId]: aUpd, [bId]: bUpd },
  };
}

type ActionSpouse =
  | { type: "link-spouses"; payload: { aId: string; bId: string } }
  | { type: "unlink-spouses"; payload: { aId: string; bId: string } };

type ActionAll = Action | ActionSpouse;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-all":
      return action.payload;
    case "add-person":
      return {
        ...state,
        personsById: {
          ...state.personsById,
          [action.payload.id]: action.payload,
        },
      };
    case "update-person":
      if (!state.personsById[action.payload.id]) return state;
      return {
        ...state,
        personsById: {
          ...state.personsById,
          [action.payload.id]: action.payload,
        },
      };
    case "remove-person":
      return applyRemovePerson(state, action.payload.id);
    case "link-parent-child":
      return applyLinkParent(
        state,
        action.payload.parentId,
        action.payload.childId,
      );
    case "unlink-parent-child":
      return applyUnlinkParent(
        state,
        action.payload.parentId,
        action.payload.childId,
      );
    case "set-root":
      return { ...state, rootId: action.payload.id };
    case "set-node-offset":
      return {
        ...state,
        uiOffsets: {
          ...state.uiOffsets,
          [action.payload.id]: action.payload.offset,
        },
      };
    case "set-node-position":
      return {
        ...state,
        positions: {
          ...state.positions,
          [action.payload.id]: { x: action.payload.x, y: action.payload.y },
        },
      };
    default:
      return state;
  }
}

function reducerAll(state: State, action: ActionAll): State {
  switch (action.type) {
    case "link-spouses":
      return applyLinkSpouses(state, action.payload.aId, action.payload.bId);
    case "unlink-spouses":
      return applyUnlinkSpouses(state, action.payload.aId, action.payload.bId);
    default:
      return reducer(state, action as Action);
  }
}

const StoreCtx = createContext<{
  personsById: PersonsById;
  rootId?: string;
  positions: Record<string, NodePosition>;
  addPerson: (input: AddPersonInput) => string;
  updatePerson: (person: Person) => void;
  removePerson: (id: string) => void;
  linkParentChild: (parentId: string, childId: string) => void;
  unlinkParentChild: (parentId: string, childId: string) => void;
  linkSpouses: (aId: string, bId: string) => void;
  unlinkSpouses: (aId: string, bId: string) => void;
  setRootId: (id?: string) => void;
  setNodeOffset: (id: string, offset: number) => void;
  setNodePosition: (id: string, x: number, y: number) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
}>({
  personsById: {},
  positions: {},
  addPerson: () => "",
  updatePerson: () => {},
  removePerson: () => {},
  linkParentChild: () => {},
  unlinkParentChild: () => {},
  linkSpouses: () => {},
  unlinkSpouses: () => {},
  setRootId: () => {},
  setNodeOffset: () => {},
  setNodePosition: () => {},
  exportJson: () => "{}",
  importJson: () => {},
});

function genId() {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, dispatch] = useReducer(reducerAll, {
    personsById: {},
    rootId: undefined,
    uiOffsets: {},
    positions: {},
  });

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadTreeFromStorage();
        if (loaded) {
          const normalized = (loaded.persons as Person[]).map((p) =>
            normalizePerson(p),
          );
          const entries = normalized.map((p) => [p.id, p] as const);
          const personsById = Object.fromEntries(entries) as PersonsById;
          const positions = loaded.positions ?? {};
          dispatch({
            type: "set-all",
            payload: {
              personsById,
              rootId: undefined,
              uiOffsets: {},
              positions,
            },
          });
        }
      } catch {
        // Ignore errors during initialization
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    const persons = Object.values(state.personsById);
    const json: TreeJson = { persons, positions: state.positions };
    saveTreeToStorage(json).catch(() => undefined);
  }, [state.personsById, state.positions]);

  const api = useMemo(
    () => ({
      addPerson: (input: AddPersonInput) => {
        const id = genId();
        const person: Person = normalizePerson({
          id,
          firstName: input.firstName,
          lastName: input.lastName,
          birthDateISO: input.birthDateISO,
          deathDateISO: input.deathDateISO,
          comment: input.comment,
          photoUri: input.photoUri,
          parentIds: [],
          spouseIds: [],
          createdAt: Date.now(),
        } as Person);
        dispatch({ type: "add-person", payload: person });
        return id;
      },
      updatePerson: (person: Person) =>
        dispatch({ type: "update-person", payload: normalizePerson(person) }),
      removePerson: (id: string) =>
        dispatch({ type: "remove-person", payload: { id } }),
      linkParentChild: (parentId: string, childId: string) =>
        dispatch({ type: "link-parent-child", payload: { parentId, childId } }),
      unlinkParentChild: (parentId: string, childId: string) =>
        dispatch({
          type: "unlink-parent-child",
          payload: { parentId, childId },
        }),
      linkSpouses: (aId: string, bId: string) =>
        dispatch({ type: "link-spouses", payload: { aId, bId } }),
      unlinkSpouses: (aId: string, bId: string) =>
        dispatch({ type: "unlink-spouses", payload: { aId, bId } }),
      setRootId: (id?: string) =>
        dispatch({ type: "set-root", payload: { id } }),
      setNodeOffset: (id: string, offset: number) =>
        dispatch({ type: "set-node-offset", payload: { id, offset } }),
      setNodePosition: (id: string, x: number, y: number) =>
        dispatch({ type: "set-node-position", payload: { id, x, y } }),
      exportJson: () => {
        const persons = Object.values(state.personsById);
        const json: TreeJson = { persons, positions: state.positions };
        return JSON.stringify(json, null, 2);
      },
      importJson: (json: string) => {
        try {
          const parsed = JSON.parse(json) as TreeJson;
          if (!parsed || !Array.isArray(parsed.persons)) return;
          const normalized = (parsed.persons as Person[]).map((p) =>
            normalizePerson(p),
          );
          const entries = normalized.map((p) => [p.id, p] as const);
          const personsById = Object.fromEntries(entries) as PersonsById;
          const positions = parsed.positions ?? {};
          dispatch({
            type: "set-all",
            payload: {
              personsById,
              rootId: undefined,
              uiOffsets: {},
              positions,
            },
          });
          saveTreeToStorage({ persons: normalized, positions }).catch(
            () => undefined,
          );
        } catch {
          return;
        }
      },
    }),
    [state.personsById, state.positions],
  );

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fdf6e5",
        }}
      >
        <ActivityIndicator size="large" color="#9a5817" />
      </View>
    );
  }

  return (
    <StoreCtx.Provider
      value={{
        personsById: state.personsById,
        positions: state.positions,
        rootId: state.rootId,
        ...api,
      }}
    >
      {children}
    </StoreCtx.Provider>
  );
};

export function useTreeStore() {
  return useContext(StoreCtx);
}

function normalizePerson(p: Person): Person {
  const firstName = p.firstName ?? p.name ?? "";
  const lastName = p.lastName ?? undefined;
  const parentIds = Array.isArray(p.parentIds) ? p.parentIds : [];
  const spouseIds = Array.isArray(p.spouseIds) ? p.spouseIds : [];
  return {
    id: p.id,
    firstName: firstName,
    lastName,
    birthDateISO: p.birthDateISO,
    deathDateISO: p.deathDateISO,
    comment: p.comment,
    photoUri: p.photoUri,
    parentIds,
    spouseIds,
    createdAt: p.createdAt ?? Date.now(),
  };
}
