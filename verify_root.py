from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080/index.html")

    # Click Simulations category
    page.click("a[data-category='simulations']")

    # Wait for list to update - "CRT Simulation" should be there
    page.wait_for_selector("text=CRT Simulation")

    # Click the project link
    page.click("text=CRT Simulation")

    # Wait for iframe update
    # The iframe id is "project-frame"
    frame_element = page.locator("#project-frame")

    # Check that src contains "crt-simulation/index.html"
    page.wait_for_function("document.getElementById('project-frame').getAttribute('src').includes('crt-simulation/index.html')")

    # Wait a bit for the iframe to load the CRT content
    page.wait_for_timeout(3000)

    page.screenshot(path="verification_root.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
