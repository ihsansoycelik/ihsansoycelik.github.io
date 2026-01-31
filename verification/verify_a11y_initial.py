from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        # Load the page via local server
        page.goto("http://localhost:8000/task-tracker/index.html")

        # Wait for the task list to populate
        try:
            page.wait_for_selector("#task-list .task-row", timeout=5000)
        except Exception as e:
            print(f"Error waiting for selector: {e}")
            return

        # Try to find the first check circle
        check_circle = page.locator(".check-circle").first

        # Check if it has tabindex
        tabindex = check_circle.get_attribute("tabindex")
        print(f"Check circle tabindex: {tabindex}")

        browser.close()

if __name__ == "__main__":
    run()
