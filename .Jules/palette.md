## 2024-05-22 - Hidden Actions & Keyboard Accessibility
**Learning:** Hiding actions like "Delete" until hover (`opacity: 0`) creates a trap for keyboard users if they are reachable via tab order but remain invisible when focused.
**Action:** Always ensure interactive elements hidden by default have a `:focus` or `:focus-visible` override to make them fully visible (opacity 1) when receiving keyboard focus.
