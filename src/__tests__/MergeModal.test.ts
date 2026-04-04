/**
 * Tests for MergeModal person filter logic.
 * The filter is replicated here to test the search/filter behavior.
 */

import type { Person } from "@entities/person/model/types";

function makePerson(id: string, firstName: string, lastName?: string): Person {
  return { id, firstName, lastName, parentIds: [], spouseIds: [] };
}

// Mirrors the filteredA/filteredB useMemo logic in MergeModal
function filterPersons(persons: Person[], query: string): Person[] {
  if (!query) return persons;
  const q = query.toLowerCase();
  return persons.filter((p) =>
    `${p.firstName} ${p.lastName ?? ""}`.toLowerCase().includes(q),
  );
}

describe("MergeModal person filter", () => {
  const persons: Person[] = [
    makePerson("1", "Alice", "Smith"),
    makePerson("2", "Bob", "Jones"),
    makePerson("3", "Alice", "Jones"),
    makePerson("4", "Charlie"),
  ];

  it("returns all persons for empty query", () => {
    expect(filterPersons(persons, "")).toHaveLength(4);
  });

  it("filters by first name (case-insensitive)", () => {
    const result = filterPersons(persons, "alice");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("filters by last name", () => {
    const result = filterPersons(persons, "jones");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["2", "3"]);
  });

  it("filters by full name", () => {
    const result = filterPersons(persons, "alice smith");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when no match", () => {
    expect(filterPersons(persons, "xyz")).toHaveLength(0);
  });

  it("is case-insensitive for mixed case query", () => {
    expect(filterPersons(persons, "ALICE")).toHaveLength(2);
  });

  it("handles persons with no last name", () => {
    const result = filterPersons(persons, "charlie");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("partial match works", () => {
    const result = filterPersons(persons, "ali");
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty persons list", () => {
    expect(filterPersons([], "alice")).toHaveLength(0);
  });
});

describe("MergeModal anchor selection logic", () => {
  it("canMerge is false when only one anchor selected", () => {
    const canMerge = (anchorAId: string | null, anchorBId: string | null) =>
      !!anchorAId && !!anchorBId;

    expect(canMerge("alice", null)).toBe(false);
    expect(canMerge(null, "bob")).toBe(false);
    expect(canMerge(null, null)).toBe(false);
    expect(canMerge("alice", "bob")).toBe(true);
  });
});
