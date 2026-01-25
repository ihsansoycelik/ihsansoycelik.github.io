## 2026-10-24 - Accessibility in Vanilla JS Components
**Learning:** This app frequently uses non-semantic elements (`div`, `li`) for interactive components (checklists, sidebar items) without native keyboard support or ARIA roles.
**Action:** When working on similar components, always ensure to add `role`, `tabindex="0"`, `aria-label` (if needed), and a keyboard listener for Enter/Space alongside the click listener. A reusable helper function for events is highly effective.
