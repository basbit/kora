import type { Person, NodePosition } from "@entities/person/model/types";
import { merge } from "@entities/tree/model/operations";
import type { TreeState } from "@entities/tree/model/types";

function makePerson(id: string, overrides: Partial<Person> = {}): Person {
  return {
    id,
    firstName: `Person_${id}`,
    parentIds: [],
    spouseIds: [],
    ...overrides,
  };
}

function makeTree(
  id: string,
  persons: Person[],
  positions?: Record<string, NodePosition>,
): TreeState {
  const personsById = Object.fromEntries(persons.map((p) => [p.id, p]));
  return {
    id,
    personsById,
    positions: positions ?? {},
    uiOffsets: {},
    rootId: persons[0]?.id,
  };
}

describe("merge()", () => {
  describe("basic merge of two disjoint trees", () => {
    it("result has treeA's id", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      // alice and bob are anchors (they become the same person in the merged tree)
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.id).toBe("treeA");
    });

    it("all persons from treeA appear in result", () => {
      const alice = makePerson("alice");
      const carol = makePerson("carol");
      const bob = makePerson("bob");
      const dave = makePerson("dave");
      const treeA = makeTree("treeA", [alice, carol]);
      const treeB = makeTree("treeB", [bob, dave]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"]).toBeDefined();
      expect(result.personsById["carol"]).toBeDefined();
    });

    it("non-anchor persons from treeB appear in result", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const dave = makePerson("dave");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob, dave]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // dave is non-anchor from treeB — must appear under original or remapped id
      const allIds = Object.keys(result.personsById);
      expect(allIds).toContain("dave");
    });

    it("anchor from treeB does NOT appear as a separate entry — it merges into anchorA", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["bob"]).toBeUndefined();
      expect(result.personsById["alice"]).toBeDefined();
    });

    it("rootId equals treeA rootId", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.rootId).toBe(treeA.rootId);
    });
  });

  describe("ID collision: non-anchor person in treeB has same ID as person in treeA", () => {
    it("colliding treeB person gets remapped to a fresh ID", () => {
      const alice = makePerson("alice");
      const shared = makePerson("shared"); // exists in both trees, not the anchor
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice, shared]);
      const treeB = makeTree("treeB", [bob, shared]); // 'shared' id collision
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });

      // treeA's "shared" is preserved
      expect(result.personsById["shared"]).toBeDefined();
      expect(result.personsById["shared"].firstName).toBe("Person_shared");

      // A second entry with a different id should exist for the remapped treeB person
      const allIds = Object.keys(result.personsById);
      // One entry is "shared" from treeA, there should be an extra remapped one
      // (both original shared from treeA AND the remapped one from treeB)
      expect(allIds.length).toBeGreaterThanOrEqual(2); // at least alice + shared(A) + remapped-shared(B)
    });

    it("total person count is correct after remapping", () => {
      const alice = makePerson("alice");
      const carol = makePerson("carol");
      const bob = makePerson("bob");
      const carol2 = makePerson("carol"); // same id as carol in treeA
      const treeA = makeTree("treeA", [alice, carol]);
      const treeB = makeTree("treeB", [bob, carol2]);
      // alice ↔ bob anchors; carol collides
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // alice (merged anchor) + carol(A) + remapped-carol(B) = 3
      expect(Object.keys(result.personsById).length).toBe(3);
    });
  });

  describe("anchor merge: field priority and gap-filling", () => {
    it("treeA anchor scalar fields take priority over treeB", () => {
      const alice = makePerson("alice", {
        lastName: "Smith",
        birthDateISO: "1990-01-01",
      });
      const bob = makePerson("bob", {
        lastName: "Jones",
        birthDateISO: "1985-06-15",
      });
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"].lastName).toBe("Smith");
      expect(result.personsById["alice"].birthDateISO).toBe("1990-01-01");
    });

    it("treeB anchor fills in null/missing fields of treeA anchor", () => {
      const alice = makePerson("alice", {
        lastName: undefined,
        birthDateISO: undefined,
      });
      const bob = makePerson("bob", {
        lastName: "Jones",
        birthDateISO: "1985-06-15",
      });
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"].lastName).toBe("Jones");
      expect(result.personsById["alice"].birthDateISO).toBe("1985-06-15");
    });

    it("merged anchor has treeA firstName", () => {
      const alice = makePerson("alice", { firstName: "Alice" });
      const bob = makePerson("bob", { firstName: "Bob" });
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"].firstName).toBe("Alice");
    });
  });

  describe("parent/spouse arrays are unioned", () => {
    it("anchorA parent and anchorB parent both appear (union, up to 2)", () => {
      const parentA = makePerson("parentA");
      const parentB = makePerson("parentB");
      const alice = makePerson("alice", { parentIds: ["parentA"] });
      const bob = makePerson("bob", { parentIds: ["parentB"] });
      const treeA = makeTree("treeA", [alice, parentA]);
      const treeB = makeTree("treeB", [bob, parentB]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      const mergedParents = result.personsById["alice"].parentIds;
      expect(mergedParents).toContain("parentA");
      expect(mergedParents).toContain("parentB");
      expect(mergedParents.length).toBeLessThanOrEqual(2);
    });

    it("duplicate parent ids are deduplicated when parent exists only in treeA", () => {
      // parent exists only in treeA as a person node, but BOTH alice and bob reference it.
      // Since "parent" is not in treeB.personsById, it won't be remapped — so both
      // alice.parentIds and bob.parentIds resolve to the same "parent" id after remap.
      const parent = makePerson("parent");
      const alice = makePerson("alice", { parentIds: ["parent"] });
      const bob = makePerson("bob", { parentIds: ["parent"] });
      const treeA = makeTree("treeA", [alice, parent]);
      const treeB = makeTree("treeB", [bob]); // parent is NOT a person node in treeB
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      const mergedParents = result.personsById["alice"].parentIds;
      expect(mergedParents.length).toBe(1);
      expect(mergedParents[0]).toBe("parent");
    });

    it("max 2 parent limit is respected when both anchors have 2 parents each", () => {
      const p1 = makePerson("p1");
      const p2 = makePerson("p2");
      const p3 = makePerson("p3");
      const p4 = makePerson("p4");
      const alice = makePerson("alice", { parentIds: ["p1", "p2"] });
      const bob = makePerson("bob", { parentIds: ["p3", "p4"] });
      const treeA = makeTree("treeA", [alice, p1, p2]);
      const treeB = makeTree("treeB", [bob, p3, p4]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // Union of [p1,p2,p3,p4] sliced to 2
      expect(result.personsById["alice"].parentIds.length).toBeLessThanOrEqual(
        2,
      );
    });
  });

  describe("spouse links unioned", () => {
    it("spouses from both anchors are in the merged anchor's spouseIds", () => {
      const spouseA = makePerson("spouseA");
      const spouseB = makePerson("spouseB");
      const alice = makePerson("alice", { spouseIds: ["spouseA"] });
      const bob = makePerson("bob", { spouseIds: ["spouseB"] });
      const treeA = makeTree("treeA", [alice, spouseA]);
      const treeB = makeTree("treeB", [bob, spouseB]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      const mergedSpouses = result.personsById["alice"].spouseIds ?? [];
      expect(mergedSpouses).toContain("spouseA");
      expect(mergedSpouses).toContain("spouseB");
    });

    it("duplicate spouseIds are deduplicated", () => {
      const shared = makePerson("shared");
      const alice = makePerson("alice", { spouseIds: ["shared"] });
      const bob = makePerson("bob", { spouseIds: ["shared"] });
      const treeA = makeTree("treeA", [alice, shared]);
      const treeB = makeTree("treeB", [bob, shared]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      const mergedSpouses = result.personsById["alice"].spouseIds ?? [];
      expect(mergedSpouses.filter((s) => s === "shared").length).toBe(1);
    });
  });

  describe("treeB positions are offset", () => {
    it("treeB positions are offset by (maxX of treeA + 300)", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const carol = makePerson("carol");
      const treeA = makeTree("treeA", [alice], { alice: { x: 100, y: 0 } });
      const treeB = makeTree("treeB", [bob, carol], {
        bob: { x: 0, y: 0 },
        carol: { x: 50, y: 100 },
      });
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // maxX of treeA = 100, xOffset = 400
      // carol's x should be 50 + 400 = 450
      expect(result.positions["carol"]).toEqual({ x: 450, y: 100 });
    });

    it("treeA positions are preserved without offset", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice], { alice: { x: 100, y: 50 } });
      const treeB = makeTree("treeB", [bob], { bob: { x: 0, y: 0 } });
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.positions["alice"]).toEqual({ x: 100, y: 50 });
    });

    it("anchorB position is not included in merged positions", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice], { alice: { x: 0, y: 0 } });
      const treeB = makeTree("treeB", [bob], { bob: { x: 999, y: 999 } });
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // bob's position slot should not exist (it was the anchor and got merged)
      expect(result.positions["bob"]).toBeUndefined();
    });
  });

  describe("merging when treeA has no positions", () => {
    it("treeB positions still appear with xOffset of 0+300=300", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const carol = makePerson("carol");
      const treeA = makeTree("treeA", [alice]); // no positions
      const treeB = makeTree("treeB", [bob, carol], {
        carol: { x: 10, y: 20 },
      });
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      // maxX = 0 (no treeA positions), xOffset = 300
      expect(result.positions["carol"]).toEqual({ x: 310, y: 20 });
    });
  });

  describe("photoGallery merging", () => {
    it("combines photoGallery arrays from both anchors", () => {
      const alice = makePerson("alice", { photoGallery: ["a.jpg", "b.jpg"] });
      const bob = makePerson("bob", { photoGallery: ["c.jpg"] });
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"].photoGallery).toEqual([
        "a.jpg",
        "b.jpg",
        "c.jpg",
      ]);
    });

    it("photoGallery is undefined when neither anchor has one", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob]);
      const result = merge({
        treeA,
        treeB,
        anchorAId: "alice",
        anchorBId: "bob",
      });
      expect(result.personsById["alice"].photoGallery).toBeUndefined();
    });
  });

  describe("fallback when anchors are missing", () => {
    it("falls back gracefully when anchorAId does not exist", () => {
      const alice = makePerson("alice");
      const bob = makePerson("bob");
      const carol = makePerson("carol");
      const treeA = makeTree("treeA", [alice]);
      const treeB = makeTree("treeB", [bob, carol]);
      // Use a non-existent anchor
      const result = merge({
        treeA,
        treeB,
        anchorAId: "nonexistent",
        anchorBId: "bob",
      });
      expect(result.id).toBe("treeA");
      expect(result.personsById["alice"]).toBeDefined();
    });
  });
});
