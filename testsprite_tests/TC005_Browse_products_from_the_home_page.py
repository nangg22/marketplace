import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Jersy Man United Retro 1990' product (image or title) to open its product detail page.
        # Jersy Man United Retro 1990
        elem = page.locator('xpath=/html/body/div[2]/main/section[2]/div[2]/div[3]/a/div/div/img')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the product detail page is displayed
        # Assert: The URL shows we are on a product detail page.
        await expect(page).to_have_url(re.compile("/products/"), timeout=15000), "The URL shows we are on a product detail page."
        await page.locator("xpath=/html/body/div[3]/main/div[1]/a").nth(0).scroll_into_view_if_needed()
        # Assert: The '← Kembali ke Semua Produk' link is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[3]/main/div[1]/a").nth(0)).to_be_visible(timeout=15000), "The '\u2190 Kembali ke Semua Produk' link is visible on the product detail page."
        await page.locator("xpath=/html/body/div[3]/main/div[2]/div[2]/div[5]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Tambah ke Keranjang' button is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[3]/main/div[2]/div[2]/div[5]/button[1]").nth(0)).to_be_visible(timeout=15000), "The 'Tambah ke Keranjang' button is visible on the product detail page."
        await page.locator("xpath=/html/body/div[3]/main/div[2]/div[2]/div[5]/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Beli Langsung' button is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[3]/main/div[2]/div[2]/div[5]/button[2]").nth(0)).to_be_visible(timeout=15000), "The 'Beli Langsung' button is visible on the product detail page."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    