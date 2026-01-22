## 2026-05-22 - Accessible Custom Checkboxes
**Learning:** Custom interactive elements (like `div` based checkboxes) in legacy codebases often miss basic accessibility features. Simply adding `role="checkbox"` is not enough; `tabindex="0"`, `aria-checked` state management, and `keydown` (Space/Enter) handlers are essential for full compliance.
**Action:** When refactoring custom UI components, always audit for keyboard support and screen reader attributes immediately.

## 2026-05-22 - Hidden Actions Visibility
**Learning:** Action buttons that appear only on hover (like delete buttons) are inaccessible to keyboard users. Using `:focus` and `:focus-visible` to reveal them is a mandatory pattern.
**Action:** Ensure all hover-reveal patterns have a corresponding focus-reveal CSS rule.
