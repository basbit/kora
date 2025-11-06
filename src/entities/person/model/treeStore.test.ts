import {
  getChildrenOf,
  getParentsOf,
  getSiblingsOf,
  getRootCandidates,
  PersonsById,
} from "./treeStore";

import type { Person } from "./types";

type P = Person;

function p(partial: Partial<P> & { id: string }): P {
  return {
    id: partial.id,
    firstName: partial.firstName ?? partial.name ?? "",
    lastName: partial.lastName,
    parentIds: partial.parentIds ?? [],
    birthDateISO: partial.birthDateISO,
    deathDateISO: partial.deathDateISO,
    comment: partial.comment,
    photoUri: partial.photoUri,
    name: partial.name,
  } as P;
}

describe("treeStore selectors", () => {
  const A = p({ id: "A", firstName: "Alice" });
  const B = p({ id: "B", firstName: "Bob" });
  const C = p({ id: "C", firstName: "Carol", parentIds: ["A"] });
  const D = p({ id: "D", firstName: "Dave", parentIds: ["A"] });
  const E = p({ id: "E", firstName: "Eve", parentIds: ["B"] });
  const F = p({ id: "F", firstName: "Frank", parentIds: ["A", "B"] });
  const X = p({ id: "X", name: "XOld" }); // backward compat with name

  const personsById: PersonsById = { A, B, C, D, E, F, X };

  it("getChildrenOf returns children sorted by display name", () => {
    const childrenOfA = getChildrenOf(personsById, "A").map(
      (p) => p.firstName || p.name,
    );
    expect(childrenOfA).toEqual(["Carol", "Dave", "Frank"]);
  });

  it("getParentsOf returns parents in given order", () => {
    const parents = getParentsOf(personsById, "F").map((p) => p.firstName);
    expect(parents).toEqual(["Alice", "Bob"]);
  });

  it("getSiblingsOf returns siblings sorted by display name", () => {
    const siblingsOfC = getSiblingsOf(personsById, "C").map(
      (p) => p.firstName || p.name,
    );
    expect(siblingsOfC).toEqual(["Dave", "Frank"]);
  });

  it("getRootCandidates returns persons with no parents, sorted", () => {
    const roots = getRootCandidates(personsById).map(
      (p) => p.firstName || p.name,
    );
    // A, B, XOld (from legacy name)
    expect(roots).toEqual(["Alice", "Bob", "XOld"]);
  });
});
