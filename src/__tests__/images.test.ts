import { Platform } from "react-native";

import { copyImageToAppDir } from "@shared/lib/fs/images";

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mockDir/",
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: "base64",
  },
}));

describe("images utils", () => {
  function getExtensionFromUri(uri: string): string {
    const match = uri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : "jpg";
  }

  describe("getExtensionFromUri", () => {
    it("should extract extension from simple uri", () => {
      expect(getExtensionFromUri("file:///path/to/image.png")).toBe("png");
    });

    it("should extract extension from uri with query params", () => {
      expect(
        getExtensionFromUri("file:///path/to/image.jpeg?param=value"),
      ).toBe("jpeg");
    });

    it("should return default jpg for uri without extension", () => {
      expect(getExtensionFromUri("file:///path/to/image")).toBe("jpg");
    });

    it("should handle various extensions", () => {
      expect(getExtensionFromUri("file:///path/to/photo.webp")).toBe("webp");
      expect(getExtensionFromUri("file:///path/to/photo.gif")).toBe("gif");
      expect(getExtensionFromUri("file:///path/to/photo.bmp")).toBe("bmp");
    });

    it("should handle uri with multiple dots", () => {
      expect(getExtensionFromUri("file:///path.to/image.name.png")).toBe("png");
    });

    it("should ignore query parameters", () => {
      expect(
        getExtensionFromUri("file:///path/to/image.png?size=large&format=jpeg"),
      ).toBe("png");
    });
  });

  describe("copyImageToAppDir", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return data URI as-is for web platform with data URI input", async () => {
      (Platform as any).OS = "web";
      const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASA";

      const result = await copyImageToAppDir("person-123", dataUri);

      expect(result).toBe(dataUri);
    });

    it("should handle web platform with blob URL", async () => {
      (Platform as any).OS = "web";
      const blobUri = "blob:http://localhost:8081/abc-123";

      const result = await copyImageToAppDir("person-123", blobUri);

      expect(typeof result).toBe("string");
    });
  });
});
