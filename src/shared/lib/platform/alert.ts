import { Platform, Alert as RNAlert } from "react-native";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

function webAlert(title: string, message: string, buttons: AlertButton[]) {
  if (typeof window !== "undefined" && window.alert) {
    window.alert(`${title}\n\n${message}`);
  }
  buttons[0].onPress?.();
}

function webConfirm(confirmMessage: string, buttons: AlertButton[]) {
  const isConfirmed =
    typeof window !== "undefined" && window.confirm
      ? window.confirm(confirmMessage)
      : true;

  if (isConfirmed) {
    const confirmBtn = buttons.find((b) => b.style !== "cancel");
    confirmBtn?.onPress?.();
  } else {
    const cancelBtn = buttons.find((b) => b.style === "cancel");
    cancelBtn?.onPress?.();
  }
}

export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === "web") {
      const defaultButtons: AlertButton[] = buttons || [
        { text: "OK", style: "default" },
      ];

      if (defaultButtons.length === 1) {
        webAlert(title, message || "", defaultButtons);
      } else {
        const confirmMessage = message ? `${title}\n\n${message}` : title;
        webConfirm(confirmMessage, defaultButtons);
      }
    } else {
      RNAlert.alert(title, message, buttons);
    }
  },
};
