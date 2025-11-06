import { filterAndSortForParentSelector } from "@entities/person/model/sort";
import type { Person } from "@entities/person/model/types";

describe("filterAndSortForParentSelector", () => {
  const mk = (
    id: string,
    first: string,
    last?: string,
    createdAt?: number,
  ): Person => ({
    id,
    firstName: first,
    lastName: last,
    parentIds: [],
    createdAt,
  });

  const persons: Person[] = [
    mk("1", "Alice", undefined, 1000),
    mk("2", "Bob", undefined, 2000),
    mk("3", "Carol", "Smith", 1500),
    { id: "4", firstName: "", name: "Legacy", parentIds: [], createdAt: 2500 },
  ];

  it("filters by query across first/last/name", () => {
    const res = filterAndSortForParentSelector(persons, "sm");
    expect(res.map((p) => p.id)).toEqual(["3"]);
  });

  it("sorts by createdAt desc then by display name", () => {
    const res = filterAndSortForParentSelector(persons, "");
    expect(res.map((p) => p.id)).toEqual(["4", "2", "3", "1"]);
  });
});
