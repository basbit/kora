import { Platform } from "react-native";

import { Alert } from "@shared/lib/platform/alert";

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
  Alert: {
    alert: jest.fn(),
  },
}));

(global as any).window = {
  alert: jest.fn(),
  confirm: jest.fn(),
};

describe("Alert utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Mobile platform", () => {
    beforeEach(() => {
      (Platform as any).OS = "ios";
    });

    it("should use native Alert.alert on mobile", () => {
      const RNAlert = require("react-native").Alert;
      Alert.alert("Title", "Message");
      expect(RNAlert.alert).toHaveBeenCalledWith("Title", "Message", undefined);
    });
  });

  describe("Web platform", () => {
    beforeEach(() => {
      (Platform as any).OS = "web";
    });

    it("should use window.alert for single button", () => {
      const onPressMock = jest.fn();
      Alert.alert("Title", "Message", [{ text: "OK", onPress: onPressMock }]);

      expect((global as any).window.alert).toHaveBeenCalledWith(
        "Title\n\nMessage",
      );
      expect(onPressMock).toHaveBeenCalled();
    });

    it("should use window.confirm for multiple buttons", () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      ((global as any).window.confirm as jest.Mock).mockReturnValue(true);

      Alert.alert("Confirm", "Are you sure?", [
        { text: "Cancel", style: "cancel", onPress: onCancelMock },
        { text: "OK", onPress: onConfirmMock },
      ]);

      expect((global as any).window.confirm).toHaveBeenCalledWith(
        "Confirm\n\nAre you sure?",
      );
      expect(onConfirmMock).toHaveBeenCalled();
      expect(onCancelMock).not.toHaveBeenCalled();
    });

    it("should call cancel callback when user cancels", () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      ((global as any).window.confirm as jest.Mock).mockReturnValue(false);

      Alert.alert("Confirm", "Are you sure?", [
        { text: "Cancel", style: "cancel", onPress: onCancelMock },
        { text: "OK", onPress: onConfirmMock },
      ]);

      expect(onCancelMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });
  });
});
