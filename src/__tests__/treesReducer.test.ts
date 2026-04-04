/**
 * Tests for the TreesProvider reducer logic.
 * The reducer is not exported, so we inline it here to test the same
 * state transition logic that TreesProvider uses internally.
 */

import type { TreeMetadata, TreesState } from "@entities/tree/model/types";

// --- Inline reducer (mirrors TreesProvider.tsx reducer exactly) ---

type TreesAction =
  | { type: "set-index"; payload: Record<string, TreeMetadata> }
  | { type: "set-active"; payload: { treeId: string } }
  | { type: "create-tree"; payload: TreeMetadata }
  | { type: "update-metadata"; payload: TreeMetadata }
  | { type: "delete-tree"; payload: { treeId: string } };

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

// --- Helpers ---

function makeMeta(
  id: string,
  overrides: Partial<TreeMetadata> = {},
): TreeMetadata {
  return {
    id,
    name: `Tree_${id}`,
    createdAt: 1000,
    updatedAt: 1000,
    personCount: 0,
    ...overrides,
  };
}

const emptyState: TreesState = {
  activeTreeId: null,
  trees: {},
};

// --- Tests ---

describe("TreesProvider reducer", () => {
  describe("set-index", () => {
    it("replaces the entire trees map", () => {
      const meta1 = makeMeta("t1");
      const meta2 = makeMeta("t2");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1: meta1 },
      };

      const next = reducer(initial, {
        type: "set-index",
        payload: { t1: meta1, t2: meta2 },
      });

      expect(Object.keys(next.trees)).toHaveLength(2);
      expect(next.trees["t2"]).toEqual(meta2);
    });

    it("does not change activeTreeId", () => {
      const meta = makeMeta("t1");
      const initial: TreesState = { activeTreeId: "t1", trees: { t1: meta } };

      const next = reducer(initial, {
        type: "set-index",
        payload: { t1: meta },
      });

      expect(next.activeTreeId).toBe("t1");
    });

    it("can set an empty index", () => {
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1: makeMeta("t1") },
      };

      const next = reducer(initial, { type: "set-index", payload: {} });

      expect(Object.keys(next.trees)).toHaveLength(0);
    });
  });

  describe("set-active", () => {
    it("changes only activeTreeId", () => {
      const meta1 = makeMeta("t1");
      const meta2 = makeMeta("t2");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1: meta1, t2: meta2 },
      };

      const next = reducer(initial, {
        type: "set-active",
        payload: { treeId: "t2" },
      });

      expect(next.activeTreeId).toBe("t2");
      expect(next.trees).toBe(initial.trees); // same reference
    });

    it("does not affect the trees index", () => {
      const meta = makeMeta("t1");
      const initial: TreesState = { activeTreeId: null, trees: { t1: meta } };

      const next = reducer(initial, {
        type: "set-active",
        payload: { treeId: "t1" },
      });

      expect(next.trees["t1"]).toEqual(meta);
    });
  });

  describe("create-tree", () => {
    it("adds a new tree to the index", () => {
      const meta = makeMeta("new");

      const next = reducer(emptyState, { type: "create-tree", payload: meta });

      expect(next.trees["new"]).toEqual(meta);
    });

    it("does not overwrite existing trees", () => {
      const existing = makeMeta("existing");
      const newMeta = makeMeta("new");
      const initial: TreesState = {
        activeTreeId: "existing",
        trees: { existing },
      };

      const next = reducer(initial, {
        type: "create-tree",
        payload: newMeta,
      });

      expect(next.trees["existing"]).toEqual(existing);
      expect(next.trees["new"]).toEqual(newMeta);
      expect(Object.keys(next.trees)).toHaveLength(2);
    });

    it("does not change activeTreeId", () => {
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1: makeMeta("t1") },
      };

      const next = reducer(initial, {
        type: "create-tree",
        payload: makeMeta("t2"),
      });

      expect(next.activeTreeId).toBe("t1");
    });

    it("stores all provided metadata fields", () => {
      const meta = makeMeta("t1", {
        name: "My Family",
        personCount: 42,
        createdAt: 9999,
        rootPersonId: "root-abc",
      });

      const next = reducer(emptyState, { type: "create-tree", payload: meta });

      expect(next.trees["t1"].name).toBe("My Family");
      expect(next.trees["t1"].personCount).toBe(42);
      expect(next.trees["t1"].createdAt).toBe(9999);
      expect(next.trees["t1"].rootPersonId).toBe("root-abc");
    });
  });

  describe("update-metadata", () => {
    it("updates only the targeted tree", () => {
      const t1 = makeMeta("t1", { name: "Old Name" });
      const t2 = makeMeta("t2", { name: "Tree 2" });
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1, t2 },
      };

      const next = reducer(initial, {
        type: "update-metadata",
        payload: { ...t1, name: "New Name", personCount: 5 },
      });

      expect(next.trees["t1"].name).toBe("New Name");
      expect(next.trees["t1"].personCount).toBe(5);
      // t2 is unchanged
      expect(next.trees["t2"]).toEqual(t2);
    });

    it("does not change activeTreeId", () => {
      const t1 = makeMeta("t1");
      const initial: TreesState = { activeTreeId: "t1", trees: { t1 } };

      const next = reducer(initial, {
        type: "update-metadata",
        payload: { ...t1, name: "Updated" },
      });

      expect(next.activeTreeId).toBe("t1");
    });

    it("can update personCount independently", () => {
      const t1 = makeMeta("t1", { personCount: 0 });
      const initial: TreesState = { activeTreeId: "t1", trees: { t1 } };

      const next = reducer(initial, {
        type: "update-metadata",
        payload: { ...t1, personCount: 10 },
      });

      expect(next.trees["t1"].personCount).toBe(10);
    });
  });

  describe("delete-tree", () => {
    it("removes the tree from the index", () => {
      const t1 = makeMeta("t1");
      const t2 = makeMeta("t2");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1, t2 },
      };

      const next = reducer(initial, {
        type: "delete-tree",
        payload: { treeId: "t2" },
      });

      expect(next.trees["t2"]).toBeUndefined();
      expect(Object.keys(next.trees)).toHaveLength(1);
    });

    it("when active tree is deleted, switches activeTreeId to first remaining tree", () => {
      const t1 = makeMeta("t1");
      const t2 = makeMeta("t2");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1, t2 },
      };

      const next = reducer(initial, {
        type: "delete-tree",
        payload: { treeId: "t1" },
      });

      expect(next.activeTreeId).toBe("t2");
    });

    it("when non-active tree is deleted, activeTreeId is unchanged", () => {
      const t1 = makeMeta("t1");
      const t2 = makeMeta("t2");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1, t2 },
      };

      const next = reducer(initial, {
        type: "delete-tree",
        payload: { treeId: "t2" },
      });

      expect(next.activeTreeId).toBe("t1");
    });

    it("when last tree is deleted, activeTreeId becomes null", () => {
      const t1 = makeMeta("t1");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1 },
      };

      const next = reducer(initial, {
        type: "delete-tree",
        payload: { treeId: "t1" },
      });

      expect(next.activeTreeId).toBeNull();
      expect(Object.keys(next.trees)).toHaveLength(0);
    });

    it("deleting a non-existent tree id is a no-op", () => {
      const t1 = makeMeta("t1");
      const initial: TreesState = {
        activeTreeId: "t1",
        trees: { t1 },
      };

      const next = reducer(initial, {
        type: "delete-tree",
        payload: { treeId: "doesnotexist" },
      });

      expect(Object.keys(next.trees)).toHaveLength(1);
      expect(next.activeTreeId).toBe("t1");
    });
  });

  describe("state immutability", () => {
    it("each action returns a new state object", () => {
      const initial: TreesState = {
        activeTreeId: null,
        trees: {},
      };

      const next = reducer(initial, {
        type: "create-tree",
        payload: makeMeta("t1"),
      });

      expect(next).not.toBe(initial);
    });

    it("trees object is replaced on create-tree, not mutated", () => {
      const initial: TreesState = {
        activeTreeId: null,
        trees: {},
      };

      const next = reducer(initial, {
        type: "create-tree",
        payload: makeMeta("t1"),
      });

      expect(next.trees).not.toBe(initial.trees);
    });
  });
});
