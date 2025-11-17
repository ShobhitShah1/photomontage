export const FONT_ASSETS = {
  "ElmsSans-Bold": require("../assets/fonts/ElmsSans-Bold.ttf"),
  "ElmsSans-Medium": require("../assets/fonts/ElmsSans-Medium.ttf"),
  "ElmsSans-Regular": require("../assets/fonts/ElmsSans-Regular.ttf"),
  "ElmsSans-SemiBold": require("../assets/fonts/ElmsSans-SemiBold.ttf"),
} as const;

// Smart font utilities - use these instead of hardcoding
export const FontFamily = {
  regular: "ElmsSans-Regular",
  medium: "ElmsSans-Medium",
  semibold: "ElmsSans-SemiBold",
  bold: "ElmsSans-Bold",
} as const;

// Typography helper functions
export const typography = {
  h1: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: FontFamily.semibold, fontSize: 20, lineHeight: 26 },
  h4: { fontFamily: FontFamily.semibold, fontSize: 18, lineHeight: 24 },
  h5: { fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 22 },
  h6: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },

  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18 },

  button: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 20 },
  buttonSmall: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 18 },

  label: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
} as const;
