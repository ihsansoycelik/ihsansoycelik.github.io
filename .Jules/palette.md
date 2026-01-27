## 2024-10-24 - Missing Focus Indicators
**Learning:** The application explicitly removed all focus outlines with `* { outline: none; }` without providing a replacement, rendering the app inaccessible to keyboard users.
**Action:** Always ensure `:focus-visible` styles are present when removing default outlines. Use a consistent focus ring (e.g., `outline: 2px solid var(--color-blue)`) to match the design system while maintaining accessibility.
