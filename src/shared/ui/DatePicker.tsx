import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";

interface DatePickerProps {
  value: Date;
  mode?: "date" | "time" | "datetime";
  display?: "default" | "spinner" | "calendar" | "inline";
  onChange: (event: unknown, date?: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  mode = "date",
  onChange,
  maximumDate,
  minimumDate,
  display,
}) => {
  if (Platform.OS === "web") {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const dateString = event.target.value;
      if (dateString) {
        const newDate = new Date(dateString);
        onChange(event, newDate);
      }
    };

    const InputComponent = "input";

    return (
      <View style={styles.webContainer}>
        <InputComponent
          type="date"
          value={formatDate(value)}
          onChange={handleChange}
          max={maximumDate ? formatDate(maximumDate) : undefined}
          min={minimumDate ? formatDate(minimumDate) : undefined}
          style={{
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#ddd",
            borderRadius: "6px",
            padding: "8px",
            fontSize: "16px",
            backgroundColor: "#fff",
            minHeight: "40px",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </View>
    );
  }

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display={display}
      onChange={onChange}
      maximumDate={maximumDate}
      minimumDate={minimumDate}
    />
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: "100%",
  },
});
