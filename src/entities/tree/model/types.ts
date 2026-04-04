import type { Person, NodePosition } from "@entities/person/model/types";

export type TreeMetadata = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  personCount: number;
  rootPersonId?: string;
};

export type TreeState = {
  id: string;
  personsById: Record<string, Person>;
  positions: Record<string, NodePosition>;
  uiOffsets: Record<string, number>;
  rootId?: string;
};

export type TreesState = {
  activeTreeId: string | null;
  trees: Record<string, TreeMetadata>;
};
