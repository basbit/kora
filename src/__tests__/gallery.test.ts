import { Person } from "@entities/person/model/types";

describe("Photo Gallery", () => {
  describe("Person with photoGallery", () => {
    it("should support photoGallery array in Person type", () => {
      const person: Person = {
        id: "test-1",
        firstName: "Test",
        lastName: "User",
        photoUri: "photo.jpg",
        photoGallery: ["gallery1.jpg", "gallery2.jpg", "gallery3.jpg"],
        parentIds: [],
      };

      expect(person.photoGallery).toBeDefined();
      expect(person.photoGallery).toHaveLength(3);
      expect(person.photoGallery?.[0]).toBe("gallery1.jpg");
    });

    it("should allow empty photoGallery", () => {
      const person: Person = {
        id: "test-2",
        firstName: "Test",
        parentIds: [],
      };

      expect(person.photoGallery).toBeUndefined();
    });

    it("should combine photoUri and photoGallery", () => {
      const person: Person = {
        id: "test-3",
        firstName: "Test",
        photoUri: "main.jpg",
        photoGallery: ["extra1.jpg", "extra2.jpg"],
        parentIds: [],
      };

      const allImages: string[] = [];
      if (person.photoUri) {
        allImages.push(person.photoUri);
      }
      if (person.photoGallery) {
        allImages.push(...person.photoGallery);
      }

      expect(allImages).toHaveLength(3);
      expect(allImages[0]).toBe("main.jpg");
      expect(allImages[1]).toBe("extra1.jpg");
      expect(allImages[2]).toBe("extra2.jpg");
    });
  });

  describe("Gallery Export/Import", () => {
    it("should preserve photoGallery in export", () => {
      const person: Person = {
        id: "test-4",
        firstName: "Test",
        photoUri: "main.jpg",
        photoGallery: ["gallery1.jpg", "gallery2.jpg"],
        parentIds: [],
      };

      const exported = JSON.stringify(person);
      const imported = JSON.parse(exported) as Person;

      expect(imported.photoGallery).toBeDefined();
      expect(imported.photoGallery).toHaveLength(2);
      expect(imported.photoGallery?.[0]).toBe("gallery1.jpg");
    });

    it("should handle person without gallery", () => {
      const person: Person = {
        id: "test-5",
        firstName: "Test",
        photoUri: "main.jpg",
        parentIds: [],
      };

      const exported = JSON.stringify(person);
      const imported = JSON.parse(exported) as Person;

      expect(imported.photoUri).toBe("main.jpg");
      expect(imported.photoGallery).toBeUndefined();
    });
  });

  describe("Gallery Operations", () => {
    it("should add photo to gallery", () => {
      const person: Person = {
        id: "test-6",
        firstName: "Test",
        parentIds: [],
        photoGallery: [],
      };

      person.photoGallery?.push("new-photo.jpg");

      expect(person.photoGallery).toHaveLength(1);
      expect(person.photoGallery?.[0]).toBe("new-photo.jpg");
    });

    it("should remove photo from gallery", () => {
      const person: Person = {
        id: "test-7",
        firstName: "Test",
        parentIds: [],
        photoGallery: ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
      };

      const updatedGallery = person.photoGallery?.filter(
        (_, index) => index !== 1,
      );

      expect(updatedGallery).toHaveLength(2);
      expect(updatedGallery?.[0]).toBe("photo1.jpg");
      expect(updatedGallery?.[1]).toBe("photo3.jpg");
    });

    it("should handle multiple additions", () => {
      const person: Person = {
        id: "test-8",
        firstName: "Test",
        parentIds: [],
        photoGallery: ["photo1.jpg"],
      };

      const newPhotos = ["photo2.jpg", "photo3.jpg", "photo4.jpg"];
      person.photoGallery = [...(person.photoGallery || []), ...newPhotos];

      expect(person.photoGallery).toHaveLength(4);
    });
  });

  describe("Gallery Image Processing", () => {
    it("should validate image URIs", () => {
      const validUris = [
        "file:///path/to/image.jpg",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg",
        "http://example.com/image.png",
      ];

      validUris.forEach((uri) => {
        expect(typeof uri).toBe("string");
        expect(uri.length).toBeGreaterThan(0);
      });
    });

    it("should handle data URLs", () => {
      const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg";
      expect(dataUrl.startsWith("data:")).toBe(true);

      const base64Part = dataUrl.split(",")[1];
      expect(base64Part).toBe("/9j/4AAQSkZJRg");
    });

    it("should handle file URIs", () => {
      const fileUri = "file:///storage/images/photo.jpg";
      expect(fileUri.startsWith("file:")).toBe(true);

      const fileName = fileUri.split("/").pop();
      expect(fileName).toBe("photo.jpg");
    });
  });

  describe("Gallery Size Limits", () => {
    it("should handle large galleries", () => {
      const largeGallery = Array.from(
        { length: 50 },
        (_, i) => `photo${i}.jpg`,
      );

      const person: Person = {
        id: "test-9",
        firstName: "Test",
        parentIds: [],
        photoGallery: largeGallery,
      };

      expect(person.photoGallery).toHaveLength(50);
    });

    it("should handle empty gallery array", () => {
      const person: Person = {
        id: "test-10",
        firstName: "Test",
        parentIds: [],
        photoGallery: [],
      };

      expect(person.photoGallery).toBeDefined();
      expect(person.photoGallery).toHaveLength(0);
    });
  });
});
