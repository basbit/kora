/**
 * Integration tests for the trees storage layer.
 * Tests the indexedDB facade (which uses native.ts in jest env)
 * to verify the contract TreesProvider depends on.
 */

import {
  saveTreesIndex,
  loadTreesIndex,
  saveTreeById,
  loadTreeById,
  deleteTreeById,
} from "@shared/lib/storage/indexedDB";
import { clearNativeStorage } from "@shared/lib/storage/native";

import type { TreeJson } from "@entities/person/model/types";
import type { TreeMetadata } from "@entities/tree/model/types";

function makeTree(id: string): TreeJson {
  return {
    persons: [{ id: "p1", firstName: "Alice", parentIds: [], spouseIds: [] }],
    positions: { p1: { x: 0, y: 0 } },
  };
}

function makeMeta(id: string, name = `Tree_${id}`): TreeMetadata {
  return { id, name, createdAt: 1000, updatedAt: 2000, personCount: 1 };
}

beforeEach(async () => {
  await clearNativeStorage();
});

describe("Trees index storage contract", () => {
  it("saveTreesIndex + loadTreesIndex round-trip", async () => {
    const index = { t1: makeMeta("t1"), t2: makeMeta("t2") };
    await saveTreesIndex(index);
    const loaded = await loadTreesIndex();
    expect(loaded).toEqual(index);
  });

  it("loadTreesIndex returns null when empty", async () => {
    expect(await loadTreesIndex()).toBeNull();
  });

  it("saveTreesIndex overwrites existing index", async () => {
    await saveTreesIndex({ t1: makeMeta("t1") });
    await saveTreesIndex({ t2: makeMeta("t2") });
    const loaded = await loadTreesIndex();
    expect(Object.keys(loaded!)).toEqual(["t2"]);
  });
});

describe("Per-tree data storage contract", () => {
  it("saveTreeById + loadTreeById round-trip", async () => {
    const tree = makeTree("t1");
    await saveTreeById("t1", tree);
    const loaded = await loadTreeById("t1");
    expect(loaded).toEqual(tree);
  });

  it("loadTreeById returns null for unknown id", async () => {
    expect(await loadTreeById("ghost")).toBeNull();
  });

  it("multiple trees are stored independently", async () => {
    const treeA = {
      persons: [{ id: "a", firstName: "A", parentIds: [], spouseIds: [] }],
      positions: {},
    };
    const treeB = {
      persons: [{ id: "b", firstName: "B", parentIds: [], spouseIds: [] }],
      positions: {},
    };
    await saveTreeById("a", treeA);
    await saveTreeById("b", treeB);
    expect(await loadTreeById("a")).toEqual(treeA);
    expect(await loadTreeById("b")).toEqual(treeB);
  });

  it("saveTreeById updates existing tree", async () => {
    await saveTreeById("t1", makeTree("t1"));
    const updated: TreeJson = {
      persons: [
        { id: "p99", firstName: "Updated", parentIds: [], spouseIds: [] },
      ],
      positions: {},
    };
    await saveTreeById("t1", updated);
    expect(await loadTreeById("t1")).toEqual(updated);
  });
});

describe("deleteTreeById contract", () => {
  it("removes the tree", async () => {
    await saveTreeById("t1", makeTree("t1"));
    await deleteTreeById("t1");
    expect(await loadTreeById("t1")).toBeNull();
  });

  it("does not affect other trees", async () => {
    await saveTreeById("t1", makeTree("t1"));
    await saveTreeById("t2", makeTree("t2"));
    await deleteTreeById("t1");
    expect(await loadTreeById("t2")).not.toBeNull();
  });

  it("no-op for non-existent id", async () => {
    await expect(deleteTreeById("ghost")).resolves.not.toThrow();
  });
});

describe("Migration contract: createTree initializes storage correctly", () => {
  it("a freshly saved tree has persons and positions", async () => {
    const tree: TreeJson = {
      persons: [
        { id: "root", firstName: "Root", parentIds: [], spouseIds: [] },
      ],
      positions: { root: { x: 0, y: 0 } },
    };
    await saveTreeById("newId", tree);
    const loaded = await loadTreeById("newId");
    expect(loaded!.persons).toHaveLength(1);
    expect(loaded!.positions).toEqual({ root: { x: 0, y: 0 } });
  });

  it("trees index persists metadata correctly", async () => {
    const meta = makeMeta("t1", "My Family Tree");
    await saveTreesIndex({ t1: meta });
    const index = await loadTreesIndex();
    expect(index!["t1"].name).toBe("My Family Tree");
    expect(index!["t1"].personCount).toBe(1);
  });
});
