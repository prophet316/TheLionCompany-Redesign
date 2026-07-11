const config = {
  extends: ["html-validate:recommended"],
  elements: ["html5"],
  rules: {
    "no-inline-style": "off",
    "no-trailing-whitespace": "error",
    "prefer-native-element": "error",
    "valid-id": "error",
    "wcag/h30": "error",
    "wcag/h32": "error",
    "wcag/h37": "error",
    "wcag/h63": "error",
    "wcag/h71": "error",
  },
};

export default config;
