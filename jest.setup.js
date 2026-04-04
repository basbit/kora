import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mockDir/",
  cacheDirectory: "file:///cacheDir/",
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: "base64", UTF8: "utf8" },
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn((uri) =>
    Promise.resolve({ uri: uri + "_optimized" }),
  ),
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));
