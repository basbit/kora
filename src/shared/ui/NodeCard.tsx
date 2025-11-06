import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View, Pressable } from "react-native";

import { colors } from "@shared/config/theme/colors";

import type { Person } from "@entities/person/model/types";

import { useSettings } from "@app/providers/SettingsProvider";

function formatDates(birth?: string, death?: string): string {
  if (!birth && !death) return "";
  const birthYear = birth ? birth.split("-")[0] : "";
  const deathYear = death ? death.split("-")[0] : "";

  if (birthYear && deathYear) return `${birthYear} — ${deathYear}`;
  if (birthYear) return birthYear;
  return `† ${deathYear}`;
}

export const NodeCard: React.FC<{
  person: Person;
  onPress?: () => void;
}> = ({ person, onPress }) => {
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;
  const primary = theme.primary;
  const secondary = theme.secondary;
  const avatarBg = theme.avatarBg;
  const avatarIcon = theme.avatarIcon;

  const displayName =
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.name ||
    "";
  const dates = formatDates(person.birthDateISO, person.deathDateISO);

  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", width: 100 }}>
      {person.photoUri ? (
        <Image
          source={{ uri: person.photoUri }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#f0f0f0",
          }}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: avatarBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person" size={36} color={avatarIcon} />
        </View>
      )}
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          fontWeight: "700",
          color: primary,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {displayName}
      </Text>
      {dates ? (
        <Text
          style={{ fontSize: 12, color: secondary, textAlign: "center" }}
          numberOfLines={1}
        >
          {dates}
        </Text>
      ) : null}
    </Pressable>
  );
};
