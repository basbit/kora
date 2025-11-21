import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Pressable, Image, Platform } from "react-native";

import { colors } from "../config/theme/colors";

interface MobileCheckProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "kora-web-preference";

export const MobileCheck: React.FC<MobileCheckProps> = ({ children }) => {
  const { t } = useTranslation();
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);

  useEffect(() => {
    const checkMobilePreference = async () => {
      if (Platform.OS !== "web") {
        return;
      }

      try {
        const preference = localStorage.getItem(STORAGE_KEY);
        if (preference === "web") {
          return;
        }

        const userAgent = navigator.userAgent || "";
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        if (isMobile) {
          setShowMobilePrompt(true);
        }
      } catch {
        const userAgent = navigator.userAgent || "";
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent,
          );
        if (isMobile) {
          setShowMobilePrompt(true);
        }
      }
    };

    checkMobilePreference();
  }, []);

  const handleDownloadApp = () => {
    const userAgent = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    if (isIOS) {
      window.open("https://apps.apple.com/app/id/com.rbaster.kora", "_blank");
    } else if (isAndroid) {
      window.open("https://play.google.com/store/apps/details?id=com.rbaster.kora", "_blank");
    }
  };

  const handleContinueWeb = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "web");
    } catch {
    }
    setShowMobilePrompt(false);
  };

  if (!showMobilePrompt) {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          alignItems: "center",
          maxWidth: 320,
          gap: 24,
        }}
      >
        <Image
          source={require("../../../assets/kora.png")}
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
          }}
        />

        <View style={{ alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.light.primary,
              textAlign: "center",
            }}
          >
            {t("mobile_app_title")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.light.secondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {t("mobile_app_description")}
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 16,
              color: colors.light.primary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {t("mobile_recommendation")}
          </Text>
        </View>

        <View style={{ width: "100%", gap: 12 }}>
          <Pressable
            onPress={handleDownloadApp}
            style={{
              backgroundColor: colors.light.accent,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {t("download_app")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleContinueWeb}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.light.accent,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {t("continue_in_browser")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
