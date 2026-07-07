import type { Person, NodePosition } from "@entities/person/model/types";

import type { TreeState } from "./types";

type PersonsById = Record<string, Person>;

function genOpId(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

function remapId(id: string, remap: Map<string, string>): string {
  return remap.get(id) ?? id;
}

function remapPerson(p: Person, remap: Map<string, string>): Person {
  return {
    ...p,
    id: remapId(p.id, remap),
    parentIds: p.parentIds.map((id) => remapId(id, remap)),
    spouseIds: (p.spouseIds ?? []).map((id) => remapId(id, remap)),
  };
}

function mergeAnchorPersons(a: Person, b: Person): Person {
  const parentIds = Array.from(new Set([...a.parentIds, ...b.parentIds])).slice(
    0,
    2,
  );
  const spouseIds = Array.from(
    new Set([...(a.spouseIds ?? []), ...(b.spouseIds ?? [])]),
  );
  const photoGallery =
    a.photoGallery || b.photoGallery
      ? [...(a.photoGallery ?? []), ...(b.photoGallery ?? [])]
      : undefined;
  return {
    ...a,
    parentIds,
    spouseIds,
    lastName: a.lastName ?? b.lastName,
    birthDateISO: a.birthDateISO ?? b.birthDateISO,
    deathDateISO: a.deathDateISO ?? b.deathDateISO,
    comment: a.comment ?? b.comment,
    photoUri: a.photoUri ?? b.photoUri,
    photoGallery:
      photoGallery && photoGallery.length > 0 ? photoGallery : undefined,
  };
}

export type MergeAsSpousesParams = {
  treeA: TreeState;
  treeB: TreeState;
  anchorAId: string;
  anchorBId: string;
  newTreeId: string;
};

export function mergeAsSpouses({
  treeA,
  treeB,
  anchorAId,
  anchorBId,
  newTreeId,
}: MergeAsSpousesParams): TreeState {
  const aIds = new Set(Object.keys(treeA.personsById));

  // Remap all treeB IDs that collide with treeA IDs
  const remap = new Map<string, string>();
  for (const id of Object.keys(treeB.personsById)) {
    if (aIds.has(id)) {
      remap.set(id, genOpId());
    }
  }

  // Effective anchor B ID after remapping
  const effectiveAnchorBId = remap.get(anchorBId) ?? anchorBId;

  // Remap all treeB persons
  const remappedB: PersonsById = {};
  for (const [, person] of Object.entries(treeB.personsById)) {
    const remapped = remapPerson(person, remap);
    remappedB[remapped.id] = remapped;
  }

  // Copy treeA persons; link anchorA → effectiveAnchorBId as spouse
  const mergedPersonsById: PersonsById = {};
  for (const [id, person] of Object.entries(treeA.personsById)) {
    if (id === anchorAId) {
      mergedPersonsById[id] = {
        ...person,
        spouseIds: Array.from(
          new Set([...(person.spouseIds ?? []), effectiveAnchorBId]),
        ),
      };
    } else {
      mergedPersonsById[id] = person;
    }
  }

  // Merge remapped treeB persons; link effectiveAnchorB → anchorAId as spouse
  for (const [id, person] of Object.entries(remappedB)) {
    if (id === effectiveAnchorBId) {
      mergedPersonsById[id] = {
        ...person,
        spouseIds: Array.from(
          new Set([...(person.spouseIds ?? []), anchorAId]),
        ),
      };
    } else {
      mergedPersonsById[id] = person;
    }
  }

  // Offset treeB positions to the right of treeA
  const maxX = Object.values(treeA.positions).reduce(
    (m, pos) => Math.max(m, pos.x),
    0,
  );
  const xOffset = maxX + 300;

  const mergedPositions: Record<string, NodePosition> = { ...treeA.positions };
  for (const [id, pos] of Object.entries(treeB.positions ?? {})) {
    const newId = remap.get(id) ?? id;
    mergedPositions[newId] = { x: pos.x + xOffset, y: pos.y };
  }

  return {
    id: newTreeId,
    personsById: mergedPersonsById,
    positions: mergedPositions,
    uiOffsets: {},
    rootId: treeA.rootId,
  };
}

export type MergeParams = {
  treeA: TreeState;
  treeB: TreeState;
  anchorAId: string;
  anchorBId: string;
};

export function merge({
  treeA,
  treeB,
  anchorAId,
  anchorBId,
}: MergeParams): TreeState {
  const aIds = new Set(Object.keys(treeA.personsById));

  // Build remap table for treeB IDs that collide with treeA
  const remap = new Map<string, string>();
  // anchorBId always maps to anchorAId
  remap.set(anchorBId, anchorAId);

  for (const id of Object.keys(treeB.personsById)) {
    if (id === anchorBId) continue;
    if (aIds.has(id)) {
      remap.set(id, genOpId());
    }
  }

  // Remap all treeB persons (skip anchorB — it merges into anchorA)
  const remappedB: PersonsById = {};
  for (const [id, person] of Object.entries(treeB.personsById)) {
    if (id === anchorBId) continue;
    const remapped = remapPerson(person, remap);
    remappedB[remapped.id] = remapped;
  }

  // Merge anchor
  const anchorA = treeA.personsById[anchorAId];
  const anchorB = treeB.personsById[anchorBId];
  if (!anchorA || !anchorB) {
    // Fallback: just combine without merge if anchors missing
    return {
      ...treeA,
      personsById: { ...treeA.personsById, ...remappedB },
    };
  }

  // Remap anchorB's references before merging
  const anchorBRemapped = remapPerson(anchorB, remap);
  const mergedAnchor = mergeAnchorPersons(anchorA, anchorBRemapped);

  // Compute max X position from treeA for offset
  const maxX = Object.values(treeA.positions).reduce(
    (m, pos) => Math.max(m, pos.x),
    0,
  );
  const xOffset = maxX + 300;

  // Build merged positions: treeA positions first, then offset treeB positions
  const mergedPositions: Record<string, NodePosition> = { ...treeA.positions };
  for (const [id, pos] of Object.entries(treeB.positions ?? {})) {
    if (id === anchorBId) continue;
    const newId = remap.get(id) ?? id;
    if (!mergedPositions[newId]) {
      mergedPositions[newId] = { x: pos.x + xOffset, y: pos.y };
    }
  }

  const mergedPersonsById: PersonsById = {
    ...treeA.personsById,
    ...remappedB,
    [anchorAId]: mergedAnchor,
  };

  return {
    id: treeA.id,
    personsById: mergedPersonsById,
    positions: mergedPositions,
    uiOffsets: { ...treeA.uiOffsets },
    rootId: treeA.rootId,
  };
}

export type SplitParams = {
  source: TreeState;
  rootPersonId: string;
  keepInOriginal: boolean;
  newTreeId: string;
  newTreeName?: string;
};

function collectSubtree(source: TreeState, rootPersonId: string): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [rootPersonId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    if (visited.has(current)) continue;
    visited.add(current);

    const person = source.personsById[current];
    if (!person) continue;

    // Add spouses
    for (const spouseId of person.spouseIds ?? []) {
      if (!visited.has(spouseId)) queue.push(spouseId);
    }

    // Add children (persons that have current as parent)
    for (const [id, p] of Object.entries(source.personsById)) {
      if (!visited.has(id) && p.parentIds.includes(current)) {
        queue.push(id);
      }
    }
  }

  return visited;
}

export function split({
  source,
  rootPersonId,
  keepInOriginal,
  newTreeId,
}: SplitParams): {
  original: TreeState;
  extracted: TreeState;
} {
  const subtreeIds = collectSubtree(source, rootPersonId);

  // Build extracted tree — persons in subtree, cut parent links that go outside
  const extractedPersonsById: PersonsById = {};
  for (const id of subtreeIds) {
    const person = source.personsById[id];
    if (!person) continue;
    extractedPersonsById[id] = {
      ...person,
      // Keep only parent links that are within the subtree
      parentIds: person.parentIds.filter((pid) => subtreeIds.has(pid)),
      // Keep only spouse links within the subtree
      spouseIds: (person.spouseIds ?? []).filter((sid) => subtreeIds.has(sid)),
    };
  }

  const extractedPositions: Record<string, NodePosition> = {};
  for (const id of subtreeIds) {
    if (source.positions[id]) {
      extractedPositions[id] = source.positions[id];
    }
  }

  const extracted: TreeState = {
    id: newTreeId,
    personsById: extractedPersonsById,
    positions: extractedPositions,
    uiOffsets: {},
    rootId: rootPersonId,
  };

  if (keepInOriginal) {
    return { original: source, extracted };
  }

  // Remove subtree from original
  const originalPersonsById: PersonsById = {};
  for (const [id, person] of Object.entries(source.personsById)) {
    if (subtreeIds.has(id)) continue;
    originalPersonsById[id] = {
      ...person,
      parentIds: person.parentIds.filter((pid) => !subtreeIds.has(pid)),
      spouseIds: (person.spouseIds ?? []).filter((sid) => !subtreeIds.has(sid)),
    };
  }

  const originalPositions: Record<string, NodePosition> = {};
  for (const [id, pos] of Object.entries(source.positions)) {
    if (!subtreeIds.has(id)) {
      originalPositions[id] = pos;
    }
  }

  // Determine new rootId for original
  let originalRootId = source.rootId;
  if (originalRootId && subtreeIds.has(originalRootId)) {
    // Find first person with no parents in the remaining tree
    const newRoot = Object.values(originalPersonsById).find(
      (p) => p.parentIds.length === 0,
    );
    originalRootId = newRoot?.id;
  }

  const original: TreeState = {
    id: source.id,
    personsById: originalPersonsById,
    positions: originalPositions,
    uiOffsets: {},
    rootId: originalRootId,
  };

  return { original, extracted };
}
