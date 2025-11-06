import type { Person } from "./types";

export function filterAndSortForParentSelector(
  persons: Person[],
  query: string,
): Person[] {
  const q = query.trim().toLowerCase();
  const filtered = persons.filter((p) =>
    ([p.firstName, p.lastName, p.name].filter(Boolean).join(" ") || "")
      .toLowerCase()
      .includes(q),
  );
  filtered.sort(
    (a, b) =>
      (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
      [a.firstName, a.lastName]
        .join(" ")
        .localeCompare([b.firstName, b.lastName].join(" ")),
  );
  return filtered;
}
