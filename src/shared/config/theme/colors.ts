export const colors = {
  cream: "#fdf6e5",
  darkGreen: "#163c27",
  brown: "#9a5817",

  light: {
    background: "#fdf6e5",
    surface: "#ffffff",
    surfaceVariant: "#f5ede0",

    primary: "#163c27",
    secondary: "#4a6b4f",
    tertiary: "#7a8a7d",
    disabled: "#b8c4ba",

    accent: "#9a5817",
    accentLight: "#c47826",
    accentDark: "#6d3f11",

    border: "#d4c5a9",
    divider: "#e8dfc8",
    error: "#c41e3a",
    success: "#2d5f3f",
    warning: "#d4860c",

    parentLink: "#4a6b4f",
    spouseLink: "#9a5817",

    avatarBg: "#e8dfc8",
    avatarIcon: "#9a5817",
  },

  dark: {
    background: "#0f2318",
    surface: "#163c27",
    surfaceVariant: "#1f4a32",

    primary: "#fdf6e5",
    secondary: "#c4b89a",
    tertiary: "#9a9283",
    disabled: "#6b6658",

    accent: "#c47826",
    accentLight: "#e89b3e",
    accentDark: "#9a5817",

    border: "#2a5234",
    divider: "#1f4028",
    error: "#e84a5f",
    success: "#4a8059",
    warning: "#f0a838",

    parentLink: "#7a9e7f",
    spouseLink: "#c47826",

    avatarBg: "#2a5234",
    avatarIcon: "#c47826",
  },
};

export type ThemeColors = typeof colors.light;
