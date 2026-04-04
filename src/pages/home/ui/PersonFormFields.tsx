import React from "react";
import { useTranslation } from "react-i18next";
import { View, TextInput } from "react-native";

import { DateInput } from "./DateInput";

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 6,
  padding: 8,
} as const;

type Props = {
  firstName: string;
  onFirstNameChange: (v: string) => void;
  lastName: string;
  onLastNameChange: (v: string) => void;
  birth: string;
  onBirthChange: (v: string) => void;
  death: string;
  onDeathChange: (v: string) => void;
};

export const PersonFormFields: React.FC<Props> = ({
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  birth,
  onBirthChange,
  death,
  onDeathChange,
}) => {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder={t("first_name")}
        value={firstName}
        onChangeText={onFirstNameChange}
        style={inputStyle}
      />
      <TextInput
        placeholder={t("last_name")}
        value={lastName}
        onChangeText={onLastNameChange}
        style={inputStyle}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <DateInput
          placeholder={`${t("birth_date")} ${t("date_format_hint")}`}
          value={birth}
          onChangeText={onBirthChange}
          style={{ flex: 1, ...inputStyle }}
        />
        <DateInput
          placeholder={`${t("death_date")} ${t("date_format_hint")}`}
          value={death}
          onChangeText={onDeathChange}
          style={{ flex: 1, ...inputStyle }}
        />
      </View>
    </View>
  );
};
