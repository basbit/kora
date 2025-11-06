import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  loadTreeFromStorage,
  loadViewStateFromStorage,
  saveTreeToStorage,
  saveViewStateToStorage,
} from "@shared/lib/storage/asyncStorage";
import type { ViewState } from "@shared/lib/storage/asyncStorage";

import type { TreeJson } from "@entities/person/model/types";

jest.mock("@react-native-async-storage/async-storage");

describe("asyncStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveTreeToStorage / loadTreeFromStorage", () => {
    it("should save and load tree data", async () => {
      const treeData: TreeJson = {
        persons: [
          {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            birthDateISO: "1980-01-01",
            parentIds: [],
            spouseIds: [],
            createdAt: Date.now(),
          },
        ],
        positions: { "1": { x: 100, y: 200 } },
      };

      await saveTreeToStorage(treeData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "gentree:tree",
        JSON.stringify(treeData),
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(treeData),
      );

      const loaded = await loadTreeFromStorage();
      expect(loaded).toEqual(treeData);
    });

    it("should return null if no data exists", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const loaded = await loadTreeFromStorage();
      expect(loaded).toBeNull();
    });

    it("should return null if data is invalid", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid json");

      const loaded = await loadTreeFromStorage();
      expect(loaded).toBeNull();
    });

    it("should return null if persons is not array", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ persons: "not array" }),
      );

      const loaded = await loadTreeFromStorage();
      expect(loaded).toBeNull();
    });
  });

  describe("saveViewStateToStorage / loadViewStateFromStorage", () => {
    it("should save and load view state", async () => {
      const viewState: ViewState = {
        scale: 1.5,
        offsetX: 100,
        offsetY: 200,
      };

      await saveViewStateToStorage(viewState);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "gentree:viewstate",
        JSON.stringify(viewState),
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(viewState),
      );

      const loaded = await loadViewStateFromStorage();
      expect(loaded).toEqual(viewState);
    });

    it("should return null if no view state exists", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const loaded = await loadViewStateFromStorage();
      expect(loaded).toBeNull();
    });

    it("should return null if view state is invalid", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid json");

      const loaded = await loadViewStateFromStorage();
      expect(loaded).toBeNull();
    });

    it("should return null if scale is not a number", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ scale: "not a number", offsetX: 0, offsetY: 0 }),
      );

      const loaded = await loadViewStateFromStorage();
      expect(loaded).toBeNull();
    });
  });
});
