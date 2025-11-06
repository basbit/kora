export type Person = {
  id: string;
  firstName: string;
  lastName?: string;
  birthDateISO?: string;
  deathDateISO?: string;
  comment?: string;
  photoUri?: string;
  parentIds: string[];
  spouseIds?: string[];
  name?: string;
  createdAt?: number;
};

export type NodePosition = { x: number; y: number };

export type TreeJson = {
  persons: Person[];
  positions?: Record<string, NodePosition>;
};
