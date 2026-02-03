## 2024-05-22 - [Task Tracker Accessibility]
**Learning:** Custom interactive elements (like `div` based checkboxes) often miss keyboard accessibility. `role="button"` alone is insufficient without `tabindex="0"` and keyboard event listeners. For toggle states, `role="checkbox"` with `aria-checked` provides better semantics than `role="button"`.
**Action:** When creating custom controls, always implement the full "ARIA Pattern" (Role + State + Properties + Keyboard Support).
