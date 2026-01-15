## 2024-10-24 - [Restoring Focus Visibility]
**Learning:** Found `* { outline: none; }` in CSS, which destroys accessibility for keyboard users by removing focus indicators.
**Action:** Replace `outline: none` with `:focus { outline: none; }` combined with `:focus-visible { outline: ... }` to preserve mouse aesthetics while ensuring keyboard accessibility.
