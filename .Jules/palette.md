## 2026-01-28 - Custom Interactive Elements Require Explicit A11y
**Learning:** The `task-tracker` project used `div`s with `click` listeners for checkboxes, making them completely inaccessible to keyboard users. Using semantic `<button>` or `<input type="checkbox">` is preferred, but when styling constraints force custom elements, we MUST add `role`, `tabindex`, `aria-*`, and `keydown` listeners.
**Action:** When auditing sub-projects, always check if "clickable" `div`s or `span`s are keyboard accessible. If not, add `tabindex="0"` and appropriate role/aria attributes immediately.
