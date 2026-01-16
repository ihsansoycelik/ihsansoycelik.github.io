from playwright.sync_api import sync_playwright
import os

def verify_link():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open main portfolio
        url = "file:///app/index.html"
        print(f"Navigating to {url}")
        page.goto(url)

        # Check if Task Tracker appears in the list
        print("Looking for Task Tracker link...")
        # Note: Depending on filtering (default 'all'), it should be visible.
        # But wait, my new item has category 'Applications'.
        # The main filter logic is `currentCategory = 'all'`.
        # `renderProjects` renders everything if 'all'.

        link = page.locator("text=Task Tracker")
        if link.count() == 0:
            raise Exception("Task Tracker link not found in main list")

        print("Link found. Clicking...")
        link.click()

        # Verify Iframe src updates
        iframe = page.locator("#project-frame")
        # Wait for src attribute to update
        page.wait_for_timeout(1000)

        # We can't easily check iframe content due to cross-origin in file:// protocol
        # (even if same dir, sometimes strictly blocked in some browsers, but Playwright might handle).
        # But we can check the src attribute of the iframe element.

        src = iframe.get_attribute("src")
        print(f"Iframe src: {src}")

        if "task-tracker/index.html" not in src:
             raise Exception(f"Iframe src did not update correctly. Got: {src}")

        # Screenshot of the main page with the iframe loaded
        if not os.path.exists("verification"):
            os.makedirs("verification")
        screenshot_path = "verification/main_page_link_test.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_link()
