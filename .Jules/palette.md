## 2026-02-01 - Task Tracker Custom Controls
**Learning:** The `task-tracker` project uses `div` elements for checkboxes (`.check-circle`) and other interactive elements without semantic HTML. This requires manual implementation of `role`, `tabindex`, `aria-checked`, and keyboard event listeners (`keydown` for Enter/Space) to ensure accessibility.
**Action:** When working on `task-tracker`, always verify that custom interactive elements have proper ARIA roles and keyboard support, as they are likely missing by default.
