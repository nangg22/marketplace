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
        
        # -> Click the '✨ Masuk' button to open the login form.
        # ✨ Masuk button
        elem = page.get_by_role('button', name='✨ Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the Email field with example@gmail.com, fill the Password field with password123, then click the '🚀 Masuk Sekarang' button to submit the login form.
        # nama@email.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the Email field with example@gmail.com, fill the Password field with password123, then click the '🚀 Masuk Sekarang' button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the Email field with example@gmail.com, fill the Password field with password123, then click the '🚀 Masuk Sekarang' button to submit the login form.
        # 🚀 Masuk Sekarang button
        elem = page.locator('[id="login-submit-btn"]')
        await elem.click(timeout=10000)
        
        # -> Open the 'Keranjang' (Cart) page by clicking the cart icon so the customer cart can be reviewed.
        # 🛒 link
        elem = page.get_by_text('TTest Customercustomer▼', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='🛒', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '🛍️ Mulai Belanja' button to browse products and add an item to the cart.
        # 🛍️ Mulai Belanja button
        elem = page.get_by_role('button', name='🛍️ Mulai Belanja', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Keranjang' button for the product 'Jersy Man United Retro 1990' to add it to the cart.
        # 🛒 + Keranjang button
        elem = page.get_by_text('Jersy Man United Retro 1990', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='🛒 + Keranjang', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Customer' user menu to access the 'Keranjang' (Cart) link and view cart contents.
        # T Test Customer customer ▼ button
        elem = page.get_by_role('button', name='T Test Customer customer ▼', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Keranjang' link in the user menu to open the cart page and verify cart contents.
        # 🛒 Keranjang link
        elem = page.get_by_role('link', name='🛒 Keranjang', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '🚀 Checkout & Bayar' button to proceed to the checkout/shipping form.
        # 🚀 Checkout & Bayar button
        elem = page.get_by_role('button', name='🚀 Checkout & Bayar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '➕ Tambah Alamat' button to open the Add Address (Alamat Pengiriman) form.
        # ➕ Tambah Alamat button
        elem = page.get_by_role('button', name='➕ Tambah Alamat', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the shipping fields (Nama penerima, Nomor telepon, Alamat lengkap, Kota) and then click the '💾 Simpan Alamat' button to save the address.
        # Nama penerima text field
        elem = page.get_by_placeholder('Nama penerima', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Customer")
        
        # -> Fill the shipping fields (Nama penerima, Nomor telepon, Alamat lengkap, Kota) and then click the '💾 Simpan Alamat' button to save the address.
        # Nomor telepon text field
        elem = page.get_by_placeholder('Nomor telepon', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("081234567890")
        
        # -> Fill the shipping fields (Nama penerima, Nomor telepon, Alamat lengkap, Kota) and then click the '💾 Simpan Alamat' button to save the address.
        # Alamat lengkap text area
        elem = page.get_by_placeholder('Alamat lengkap', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Jl. Merdeka 10 No.5")
        
        # -> Fill the shipping fields (Nama penerima, Nomor telepon, Alamat lengkap, Kota) and then click the '💾 Simpan Alamat' button to save the address.
        # Kota text field
        elem = page.get_by_placeholder('Kota', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Jakarta")
        
        # -> Fill the shipping fields (Nama penerima, Nomor telepon, Alamat lengkap, Kota) and then click the '💾 Simpan Alamat' button to save the address.
        # 💾 Simpan Alamat button
        elem = page.get_by_role('button', name='💾 Simpan Alamat', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Provinsi' field with 'DKI Jakarta', fill the 'Kode pos' field with '10110', then click the '💾 Simpan Alamat' button to save the address.
        # Provinsi text field
        elem = page.get_by_placeholder('Provinsi', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("DKI Jakarta")
        
        # -> Fill the 'Provinsi' field with 'DKI Jakarta', fill the 'Kode pos' field with '10110', then click the '💾 Simpan Alamat' button to save the address.
        # Kode pos text field
        elem = page.get_by_placeholder('Kode pos', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("10110")
        
        # -> Fill the 'Provinsi' field with 'DKI Jakarta', fill the 'Kode pos' field with '10110', then click the '💾 Simpan Alamat' button to save the address.
        # 💾 Simpan Alamat button
        elem = page.get_by_role('button', name='💾 Simpan Alamat', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '💸 Bayar Sekarang' button to start the payment flow and verify that the purchase completion or payment screen appears.
        # 💸 Bayar Sekarang button
        elem = page.get_by_role('button', name='💸 Bayar Sekarang', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '✨ Simulasi Bayar' button in the QRIS modal to simulate completing the payment and observe the confirmation screen.
        # ✨ Simulasi Bayar button
        elem = page.get_by_role('button', name='✨ Simulasi Bayar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the purchase completion screen is displayed
        # Assert: The browser is on the purchase/orders page (URL contains 'customer/orders'), confirming the completion screen is displayed.
        await expect(page).to_have_url(re.compile("customer/orders"), timeout=15000), "The browser is on the purchase/orders page (URL contains 'customer/orders'), confirming the completion screen is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    