## 2024-10-24 - Interactive Div Accessibility
**Learning:** `div` elements acting as buttons need `role="button"`, `tabindex="0"`, and keyboard event listeners (Enter/Space) to be accessible. Just adding `click` is not enough.
**Action:** Always wrap `click` listeners on non-semantic elements with a helper that also handles `keydown`.
