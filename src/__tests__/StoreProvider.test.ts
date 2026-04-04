import type { Person } from "@entities/person/model/types";

import { normalizePerson, genId } from "@app/providers/StoreProvider";

describe("StoreProvider", () => {
  describe("normalizePerson", () => {
    it("should normalize person with all fields", () => {
      const person: Partial<Person> & { id: string } = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        birthDateISO: "1980-01-15",
        deathDateISO: "2020-12-31",
        comment: "Test comment",
        photoUri: "file:///photo.jpg",
        parentIds: ["parent1"],
        spouseIds: ["spouse1"],
        createdAt: 1234567890,
      };

      const normalized = normalizePerson(person);
      expect(normalized.id).toBe("1");
      expect(normalized.firstName).toBe("John");
      expect(normalized.lastName).toBe("Doe");
      expect(normalized.parentIds).toEqual(["parent1"]);
      expect(normalized.spouseIds).toEqual(["spouse1"]);
    });

    it("should use name as firstName if firstName is missing", () => {
      const person: any = {
        id: "1",
        name: "OldName",
      };

      const normalized = normalizePerson(person);
      expect(normalized.firstName).toBe("OldName");
      expect(normalized.lastName).toBeUndefined();
    });

    it("should set empty arrays if parentIds/spouseIds are not arrays", () => {
      const person: any = {
        id: "1",
        firstName: "John",
        parentIds: "not-array",
        spouseIds: null,
      };

      const normalized = normalizePerson(person);
      expect(normalized.parentIds).toEqual([]);
      expect(normalized.spouseIds).toEqual([]);
    });

    it("should set createdAt to current time if missing", () => {
      const person: Partial<Person> & { id: string } = {
        id: "1",
        firstName: "John",
      };

      const before = Date.now();
      const normalized = normalizePerson(person);
      const after = Date.now();

      expect(normalized.createdAt).toBeGreaterThanOrEqual(before);
      expect(normalized.createdAt).toBeLessThanOrEqual(after);
    });

    it("should handle person with minimal fields", () => {
      const person: Partial<Person> & { id: string } = {
        id: "1",
        firstName: "",
      };

      const normalized = normalizePerson(person);
      expect(normalized.id).toBe("1");
      expect(normalized.firstName).toBe("");
      expect(normalized.parentIds).toEqual([]);
      expect(normalized.spouseIds).toEqual([]);
    });
  });

  describe("genId", () => {
    it("should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(genId());
      }
      expect(ids.size).toBe(100);
    });

    it("should generate IDs with correct format", () => {
      const id = genId();
      expect(id.length).toBeGreaterThan(8);
      expect(/^[a-z0-9]+$/.test(id)).toBe(true);
    });
  });
});
