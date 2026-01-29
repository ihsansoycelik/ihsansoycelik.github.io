from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # Go to the page
    page.goto("http://localhost:8080/Interactive-graffiti-1/index.html")

    # Wait for canvas
    page.wait_for_selector("#defaultCanvas0")

    # Verify Title
    expect(page).to_have_title("Liquid Graffiti")

    # Verify New UI Elements
    expect(page.locator("#btn-undo")).to_be_visible()
    expect(page.locator("#tool-select")).to_be_visible()
    expect(page.locator("#title-input")).to_be_visible()
    expect(page.locator("#anim-mode")).to_be_visible()

    # Simulate Drawing with Marker
    canvas = page.locator("#defaultCanvas0")
    box = canvas.bounding_box()

    if box:
        # Draw a line
        page.mouse.move(box["x"] + 200, box["y"] + 200)
        page.mouse.down()
        page.mouse.move(box["x"] + 400, box["y"] + 400, steps=20)
        page.mouse.up()

    # Change tool to Spray and Draw
    page.select_option("#tool-select", "spray")
    if box:
        page.mouse.move(box["x"] + 500, box["y"] + 200)
        page.mouse.down()
        page.mouse.move(box["x"] + 500, box["y"] + 400, steps=20)
        page.mouse.up()

    # Undo last action (Spray)
    page.click("#btn-undo")

    # Take screenshot
    page.screenshot(path="Interactive-graffiti-1/verification/final_state.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
