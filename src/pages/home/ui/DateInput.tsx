import React from "react";
import { TextInput, StyleSheet } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: object;
};

export const DateInput: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder,
  style,
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    style={[styles.input, style]}
    autoComplete="off"
    inputMode="text"
  />
);

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
  },
});
