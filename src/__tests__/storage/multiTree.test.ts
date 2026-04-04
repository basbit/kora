/**
 * Tests for multi-tree native storage round-trips.
 * In jest environment Platform.OS !== "web", so indexedDB.ts delegates to native.ts.
 * AsyncStorage is mocked via jest.setup.js.
 */

import {
  saveTreesIndexToNative,
  loadTreesIndexFromNative,
  saveTreeByIdToNative,
  loadTreeByIdFromNative,
  deleteTreeByIdFromNative,
  saveViewStateByIdToNative,
  loadViewStateByIdFromNative,
  clearNativeStorage,
  saveTreeToNative,
  loadTreeFromNative,
} from "@shared/lib/storage/native";

import type { TreeJson } from "@entities/person/model/types";
import type { TreeMetadata } from "@entities/tree/model/types";

function makeTree(id: string): TreeJson {
  return {
    persons: [
      { id: "p1", firstName: "Alice", parentIds: [], spouseIds: [] },
      { id: "p2", firstName: "Bob", parentIds: ["p1"], spouseIds: [] },
    ],
    positions: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } },
  };
}

function makeMeta(id: string, name = "Test Tree"): TreeMetadata {
  return { id, name, createdAt: 1000, updatedAt: 2000, personCount: 2 };
}

beforeEach(async () => {
  await clearNativeStorage();
});

describe("saveTreesIndexToNative / loadTreesIndexFromNative", () => {
  it("round-trips a trees index", async () => {
    const index = { t1: makeMeta("t1"), t2: makeMeta("t2", "Second Tree") };
    await saveTreesIndexToNative(index);
    const loaded = await loadTreesIndexFromNative();
    expect(loaded).toEqual(index);
  });

  it("returns null when nothing stored", async () => {
    const loaded = await loadTreesIndexFromNative();
    expect(loaded).toBeNull();
  });

  it("overwrites previous index", async () => {
    await saveTreesIndexToNative({ t1: makeMeta("t1") });
    await saveTreesIndexToNative({ t2: makeMeta("t2") });
    const loaded = await loadTreesIndexFromNative();
    expect(Object.keys(loaded!)).toEqual(["t2"]);
  });
});

describe("saveTreeByIdToNative / loadTreeByIdFromNative", () => {
  it("round-trips a tree by id", async () => {
    const tree = makeTree("t1");
    await saveTreeByIdToNative("t1", tree);
    const loaded = await loadTreeByIdFromNative("t1");
    expect(loaded).toEqual(tree);
  });

  it("returns null for unknown treeId", async () => {
    const loaded = await loadTreeByIdFromNative("nonexistent");
    expect(loaded).toBeNull();
  });

  it("stores multiple trees independently", async () => {
    const treeA = makeTree("a");
    const treeB = {
      persons: [{ id: "x", firstName: "X", parentIds: [], spouseIds: [] }],
      positions: {},
    };
    await saveTreeByIdToNative("a", treeA);
    await saveTreeByIdToNative("b", treeB);

    expect(await loadTreeByIdFromNative("a")).toEqual(treeA);
    expect(await loadTreeByIdFromNative("b")).toEqual(treeB);
  });
});

describe("deleteTreeByIdFromNative", () => {
  it("removes the tree after deletion", async () => {
    await saveTreeByIdToNative("t1", makeTree("t1"));
    await saveViewStateByIdToNative("t1", { scale: 1, offsetX: 0, offsetY: 0 });
    await deleteTreeByIdFromNative("t1");
    expect(await loadTreeByIdFromNative("t1")).toBeNull();
    expect(await loadViewStateByIdFromNative("t1")).toBeNull();
  });

  it("is a no-op for non-existent id", async () => {
    await expect(deleteTreeByIdFromNative("ghost")).resolves.not.toThrow();
  });
});

describe("saveViewStateByIdToNative / loadViewStateByIdFromNative", () => {
  it("round-trips view state", async () => {
    const vs = { scale: 1.5, offsetX: 200, offsetY: -50 };
    await saveViewStateByIdToNative("t1", vs);
    const loaded = await loadViewStateByIdFromNative("t1");
    expect(loaded).toEqual(vs);
  });

  it("returns null when not stored", async () => {
    expect(await loadViewStateByIdFromNative("t99")).toBeNull();
  });

  it("different treeIds have independent view states", async () => {
    const vs1 = { scale: 1, offsetX: 0, offsetY: 0 };
    const vs2 = { scale: 2, offsetX: 50, offsetY: 50 };
    await saveViewStateByIdToNative("t1", vs1);
    await saveViewStateByIdToNative("t2", vs2);
    expect(await loadViewStateByIdFromNative("t1")).toEqual(vs1);
    expect(await loadViewStateByIdFromNative("t2")).toEqual(vs2);
  });
});

describe("clearNativeStorage", () => {
  it("clears all gentree keys including per-tree data", async () => {
    await saveTreeByIdToNative("t1", makeTree("t1"));
    await saveTreesIndexToNative({ t1: makeMeta("t1") });
    await saveViewStateByIdToNative("t1", { scale: 1, offsetX: 0, offsetY: 0 });
    await saveTreeToNative({ persons: [], positions: {} });

    await clearNativeStorage();

    expect(await loadTreeByIdFromNative("t1")).toBeNull();
    expect(await loadTreesIndexFromNative()).toBeNull();
    expect(await loadViewStateByIdFromNative("t1")).toBeNull();
    expect(await loadTreeFromNative()).toBeNull();
  });
});
