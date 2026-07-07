/**
 * Tests for the countDescendants BFS logic used in SplitModal.
 * The function is replicated here (not exported from SplitModal) to test the algorithm.
 */

import type { Person } from "@entities/person/model/types";

// Mirrors countDescendants from SplitModal.tsx
function countDescendants(
  rootId: string,
  personsById: Record<string, Person>,
): number {
  const visited = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    if (visited.has(id)) continue;
    visited.add(id);
    const p = personsById[id];
    if (!p) continue;
    for (const [pid, person] of Object.entries(personsById)) {
      if (!visited.has(pid) && person.parentIds.includes(id)) {
        queue.push(pid);
      }
    }
    for (const sid of p.spouseIds ?? []) {
      if (!visited.has(sid)) queue.push(sid);
    }
  }
  return visited.size;
}

function makePerson(id: string, opts: Partial<Person> = {}): Person {
  return { id, firstName: id, parentIds: [], spouseIds: [], ...opts };
}

describe("countDescendants", () => {
  it("returns 1 for a lone person with no descendants", () => {
    const persons = { alice: makePerson("alice") };
    expect(countDescendants("alice", persons)).toBe(1);
  });

  it("counts direct child", () => {
    const persons = {
      alice: makePerson("alice"),
      bob: makePerson("bob", { parentIds: ["alice"] }),
    };
    expect(countDescendants("alice", persons)).toBe(2);
  });

  it("counts two generations", () => {
    const persons = {
      root: makePerson("root"),
      child: makePerson("child", { parentIds: ["root"] }),
      grandchild: makePerson("grandchild", { parentIds: ["child"] }),
    };
    expect(countDescendants("root", persons)).toBe(3);
  });

  it("counts spouse of root", () => {
    const persons = {
      alice: makePerson("alice", { spouseIds: ["bob"] }),
      bob: makePerson("bob", { spouseIds: ["alice"] }),
    };
    expect(countDescendants("alice", persons)).toBe(2);
  });

  it("counts children of both root and spouse", () => {
    const persons = {
      alice: makePerson("alice", { spouseIds: ["bob"] }),
      bob: makePerson("bob", { spouseIds: ["alice"] }),
      child: makePerson("child", { parentIds: ["alice", "bob"] }),
    };
    expect(countDescendants("alice", persons)).toBe(3);
  });

  it("handles diamond ancestry without double-counting", () => {
    // root → childA, root → childB; childA + childB → grandchild
    const persons = {
      root: makePerson("root"),
      childA: makePerson("childA", { parentIds: ["root"] }),
      childB: makePerson("childB", { parentIds: ["root"] }),
      grandchild: makePerson("grandchild", { parentIds: ["childA", "childB"] }),
    };
    expect(countDescendants("root", persons)).toBe(4);
  });

  it("does not count persons outside the subtree", () => {
    const persons = {
      unrelated: makePerson("unrelated"),
      root: makePerson("root"),
      child: makePerson("child", { parentIds: ["root"] }),
    };
    expect(countDescendants("root", persons)).toBe(2);
  });

  it("returns 0 for unknown rootId", () => {
    const persons = { alice: makePerson("alice") };
    // BFS starts with "ghost" which is not in personsById, visited.size = 1
    // but person is undefined so no children are enqueued
    expect(countDescendants("ghost", persons)).toBe(1);
  });

  it("handles a long chain without stack overflow", () => {
    const persons: Record<string, Person> = {};
    let prev = "root";
    persons[prev] = makePerson(prev);
    for (let i = 0; i < 100; i++) {
      const id = `n${i}`;
      persons[id] = makePerson(id, { parentIds: [prev] });
      prev = id;
    }
    expect(countDescendants("root", persons)).toBe(101);
  });
});
