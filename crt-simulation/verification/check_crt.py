from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Listen for console errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        try:
            page.goto("http://localhost:8080/crt-simulation/index.html")
            page.wait_for_timeout(3000) # Wait for boot sequence

            page.screenshot(path="crt_final.png")
            print("Screenshot saved to crt_final.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
