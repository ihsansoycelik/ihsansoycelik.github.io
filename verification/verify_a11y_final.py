from playwright.sync_api import sync_playwright, expect
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs/errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Load the page via local server
        page.goto("http://localhost:8000/task-tracker/index.html")

        # Wait for the task list
        page.wait_for_selector("#task-list .task-row")

        # Locate the first task's check circle
        first_task_row = page.locator(".task-row").first
        check_circle = first_task_row.locator(".check-circle")

        # Ensure it's not completed to start with
        # (This is tricky if data is persistent or random, but looking at script.js, it resets on reload)
        # script.js: { id: 1, text: 'Buy groceries', completed: false, ... }

        expect(first_task_row).not_to_have_class(re.compile(r"completed"))
        print("Verified initial state: Not completed.")

        # Focus the check circle
        check_circle.focus()

        # Verify it has focus
        expect(check_circle).to_be_focused()
        print("Check circle focused.")

        # Press Space to toggle
        page.keyboard.press("Space")
        print("Pressed Space.")

        # Verify task is now completed
        expect(first_task_row).to_have_class(re.compile(r"completed"))
        print("Task marked as completed via keyboard!")

        # Take a screenshot of the focused, completed state
        page.screenshot(path="verification/a11y_final.png")

        browser.close()

if __name__ == "__main__":
    run()
