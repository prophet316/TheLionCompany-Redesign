const config = {
  extends: ["html-validate:recommended"],
  elements: ["html5"],
  rules: {
    // Next.js serializes React attributes and framework-owned IDs in its
    // generated HTML. Validate semantics here, not React's output style.
    "attr-case": "off",
    "attribute-boolean-style": "off",
    "attribute-empty-style": "off",
    "element-required-attributes": "off",
    "long-title": "off",
    "no-inline-style": "off",
    "no-trailing-whitespace": "error",
    "prefer-native-element": "error",
    "valid-id": "off",
    "void-style": "off",
    "wcag/h30": "error",
    "wcag/h32": "error",
    "wcag/h37": "error",
    "wcag/h63": "error",
    "wcag/h71": "error",
  },
};

export default config;
