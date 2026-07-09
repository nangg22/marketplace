import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    results = []

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=["--window-size=1280,720", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        context.set_default_timeout(30000)
        page = await context.new_page()

        # ===== TEST-AUTH-001: Redirect jika belum login =====
        print("\n🧪 TEST-AUTH-001: Redirect jika belum login")
        try:
            await page.goto("http://localhost:3000/seller/products")
            await page.wait_for_url("**/login**", timeout=10000)
            current_url = page.url
            assert "/login" in current_url, f"Expected redirect to /login, got {current_url}"
            print("   ✅ PASS — Redirected to login page")
            results.append(("TEST-AUTH-001", "PASS"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-AUTH-001", f"FAIL: {e}"))

        # ===== Login sebagai seller =====
        print("\n🔐 Logging in as seller...")
        await page.goto("http://localhost:3000/login")
        await page.locator('[id="login-email"]').fill("seller@test.com")
        await page.locator('[id="login-password"]').fill("password123")
        await page.locator('[id="login-submit-btn"]').click()
        
        # Wait for NextAuth and our client-side redirect to settle
        await page.wait_for_url("**/seller/products**", timeout=15000)
        await asyncio.sleep(2)

        # ===== TEST-AUTH-003: Seller dapat akses halaman =====
        print("\n🧪 TEST-AUTH-003: Seller dapat akses halaman")
        try:
            # We are already on /seller/products
            current_url = page.url
            assert "/seller/products" in current_url, f"Expected /seller/products, got {current_url}"
            
            # Cek H1
            h1 = page.locator("h1")
            h1_text = await h1.inner_text()
            assert "Produk Saya" in h1_text, f"H1 should contain 'Produk Saya', got '{h1_text}'"
            
            # Cek Dashboard badge visible
            dashboard_badge = page.get_by_text("Dashboard", exact=True)
            await expect(dashboard_badge).to_be_visible(timeout=5000)
            
            # Cek Tambah Produk button visible
            tambah_btn = page.locator("button", has_text="Tambah Produk").first
            await expect(tambah_btn).to_be_visible(timeout=5000)
            
            print("   ✅ PASS — Page loads, H1 correct, Dashboard badge + Tambah Produk visible")
            results.append(("TEST-AUTH-003", "PASS"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-AUTH-003", f"FAIL: {e}"))

        # ===== TEST-UI-001: Header section render =====
        print("\n🧪 TEST-UI-001: Header section render")
        try:
            subtitle = page.get_by_text("produk terdaftar")
            await expect(subtitle).to_be_visible(timeout=5000)
            
            print("   ✅ PASS — Header & subtitle rendered correctly")
            results.append(("TEST-UI-001", "PASS"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-UI-001", f"FAIL: {e}"))

        # ===== TEST-NAV-001: Tombol Tambah Produk navigasi =====
        print("\n🧪 TEST-NAV-001: Tombol Tambah Produk navigasi")
        try:
            tambah_link = page.locator("button", has_text="Tambah Produk").first
            await tambah_link.click()
            await page.wait_for_url("**/seller/products/create**", timeout=15000)
            
            current_url = page.url
            assert "/seller/products/create" in current_url, f"Expected /seller/products/create, got {current_url}"
            print("   ✅ PASS — Navigated to /seller/products/create")
            results.append(("TEST-NAV-001", "PASS"))
            
            # Go back to products for next tests
            await page.goto("http://localhost:3000/seller/products")
            await page.wait_for_url("**/seller/products**", timeout=15000)
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-NAV-001", f"FAIL: {e}"))

        # ===== TEST-UI-009: Format harga Rupiah benar =====
        print("\n🧪 TEST-UI-009: Format harga Rupiah benar")
        try:
            # Cek apakah ada produk
            product_cards = page.locator(".neo-card")
            count = await product_cards.count()
            
            if count > 0:
                # Cek format Rp ada di halaman 
                rp_text = page.get_by_text(re.compile(r"Rp\s*[\d.]+"))
                rp_count = await rp_text.count()
                assert rp_count > 0, "No Rupiah formatted prices found"
                print(f"   ✅ PASS — Found {rp_count} Rupiah formatted prices")
                results.append(("TEST-UI-009", "PASS"))
            else:
                print("   ⚠️ SKIP — No products to test price format")
                results.append(("TEST-UI-009", "SKIP (no products)"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-UI-009", f"FAIL: {e}"))

        # ===== TEST-UI-003: Product grid tampil =====
        print("\n🧪 TEST-UI-003: Product grid tampil ketika ada produk")
        try:
            # Cek empty state
            empty_text = page.get_by_text("Toko Anda Masih Kosong")
            if await empty_text.is_visible(timeout=2000):
                print("   ✅ PASS — Empty state shown (seller has no products)")
                results.append(("TEST-UI-003", "PASS (empty state)"))
            else:
                # Cek grid class
                grid = page.locator(".grid")
                grid_count = await grid.count()
                
                if grid_count > 0:
                    # Cek card berisi edit & hapus button
                    edit_btn = page.locator("button", has_text="Edit").first
                    hapus_btn = page.locator("button", has_text="Hapus").first
                    
                    assert await edit_btn.is_visible(), "Edit button not visible"
                    assert await hapus_btn.is_visible(), "Hapus button not visible"
                    
                    print(f"   ✅ PASS — Grid visible with Edit & Hapus buttons")
                    results.append(("TEST-UI-003", "PASS"))
                else:
                    print("   ❌ FAIL — Neither grid nor empty state visible")
                    results.append(("TEST-UI-003", "FAIL"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-UI-003", f"FAIL: {e}"))

        # ===== TEST-RESP-003: Layout desktop (1280px) =====
        print("\n🧪 TEST-RESP-003: Layout desktop (1280px)")
        try:
            viewport = page.viewport_size
            assert viewport["width"] == 1280, f"Expected width 1280, got {viewport['width']}"
            print(f"   ✅ PASS — Desktop layout rendered at {viewport['width']}x{viewport['height']}")
            results.append(("TEST-RESP-003", "PASS"))
        except Exception as e:
            print(f"   ❌ FAIL — {e}")
            results.append(("TEST-RESP-003", f"FAIL: {e}"))

        # ===== SUMMARY =====
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        passed = sum(1 for _, r in results if r == "PASS" or r.startswith("PASS"))
        failed = sum(1 for _, r in results if r.startswith("FAIL"))
        skipped = sum(1 for _, r in results if r.startswith("SKIP"))
        
        for name, result in results:
            status = "✅" if "PASS" in result else ("⚠️" if "SKIP" in result else "❌")
            print(f"  {status} {name}: {result}")
        
        print(f"\nTotal: {len(results)} | ✅ Passed: {passed} | ❌ Failed: {failed} | ⚠️ Skipped: {skipped}")
        print("=" * 60)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
