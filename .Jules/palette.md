## 2024-10-23 - Task Tracker Accessibility
**Learning:** Generic `:focus-visible` styles should avoid setting properties like `border-radius` that might override component-specific shapes (e.g., turning a circular checkbox into a square on focus).
**Action:** Use `outline` and `outline-offset` for focus rings, and rely on the component's existing `border-radius` or `box-shadow` if needed, rather than enforcing a global radius on focus.
