import type { Person } from "./types";

export type PersonsById = Record<string, Person>;

function getDisplayName(person: Person): string {
  const full = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || person.name || "";
}

export function getChildrenOf(
  personsById: PersonsById,
  parentId: string,
): Person[] {
  const result: Person[] = [];
  for (const person of Object.values(personsById)) {
    if (person.parentIds.includes(parentId)) {
      result.push(person);
    }
  }
  result.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  return result;
}

export function getParentsOf(
  personsById: PersonsById,
  childId: string,
): Person[] {
  const child = personsById[childId];
  if (!child) return [];
  return child.parentIds.map((pid) => personsById[pid]).filter(Boolean);
}

export function getSiblingsOf(
  personsById: PersonsById,
  personId: string,
): Person[] {
  const me = personsById[personId];
  if (!me) return [];
  const parentSet = new Set(me.parentIds);
  const result: Person[] = [];
  for (const person of Object.values(personsById)) {
    if (person.id === personId) continue;
    for (const pid of person.parentIds) {
      if (parentSet.has(pid)) {
        result.push(person);
        break;
      }
    }
  }
  result.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  return result;
}

export function getRootCandidates(personsById: PersonsById): Person[] {
  const roots = Object.values(personsById).filter(
    (p) => p.parentIds.length === 0,
  );
  roots.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  return roots;
}
