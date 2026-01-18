## 2024-05-23 - Accessibility in Task Tracker
**Learning:** The `task-tracker` project used `div` and `li` elements for interactive components (smart cards, lists, checkboxes) without `tabindex` or keyboard listeners, making them inaccessible to keyboard users. Also, `outline: none` in CSS globally disabled focus indicators.
**Action:** Always verify `role`, `tabindex`, and keyboard event listeners when creating custom interactive elements. Use `:focus-visible` instead of removing outlines globally.
