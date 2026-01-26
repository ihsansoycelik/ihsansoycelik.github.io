## 2024-05-21 - Task Tracker Accessibility
**Learning:** Custom interactive lists and checkboxes often lack basic keyboard support (Enter/Space) and ARIA roles, making them inaccessible to keyboard users.
**Action:** Use a reusable helper like `addAccessibleClickListener` to consistently bind both click and keydown (Enter/Space) events for custom interactive elements.
