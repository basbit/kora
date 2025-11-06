describe("images utils", () => {
  // Helper function extracted for testing
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
});
