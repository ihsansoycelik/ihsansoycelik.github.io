from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Use absolute path to the file
        page.goto("file:///app/index.html")

        # Click the first project link
        page.click(".project-link")

        # Take a screenshot to see if spinner appears or if UI state is correct
        # Note: Spinner animation might make it hard to catch, but we can check display style

        spinner = page.locator("#loading-spinner")
        # We can try to take a screenshot while spinner is visible
        # Since the iframe loads fast locally, the spinner might already be gone.
        # But we can check if the logic fired.

        page.screenshot(path="verification/spinner_test.png")

        # We can also verify via evaluation if the logic is correct
        # But visual verification is requested.

        browser.close()

if __name__ == "__main__":
    run()
