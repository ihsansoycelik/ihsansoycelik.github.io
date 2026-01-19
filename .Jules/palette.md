## 2024-05-23 - Missing Global Focus Indicators
**Learning:** The application completely lacked keyboard focus indicators, making it unusable for keyboard users. Relying on default browser outlines is insufficient when using custom background colors.
**Action:** Always implement a high-contrast focus ring (using `box-shadow` or `outline` with offset) that adapts to the theme colors (`var(--text-color)`) to ensure visibility on all backgrounds.
