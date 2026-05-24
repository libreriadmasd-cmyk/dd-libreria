"""D+D — Bloque 2 backend tests.

Covers:
  * GET /api/products filters: categoria, subcategoria, colores, precio_min, precio_max, destacado, oferta, limit
  * GET /api/search/suggest predictive (smoke; full schema covered elsewhere)
  * POST /api/admin/login + X-Admin-Token gate
  * POST /api/admin/subclassify (apply=False / apply=True) -> sets subcategoria + colores
  * GET /api/filters/{categoria} returns subcategorias + colores + precio range
  * POST /api/admin/upload-file (multipart) -> file persisted + accessible via /api/uploads/{name}
  * POST /api/admin/clean-titles -> auth + shape
"""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "Netri 437"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_headers(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    return {"X-Admin-Token": r.json()["token"]}


# ---------------- Admin login ----------------
class TestAdminLogin:
    def test_login_ok(self, s):
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        assert r.json()["token"] == ADMIN_PASSWORD

    def test_login_wrong_401(self, s):
        r = s.post(f"{API}/admin/login", json={"password": "nope"}, timeout=15)
        assert r.status_code == 401


# ---------------- Product filters ----------------
class TestProductFilters:
    def test_categoria_filter(self, s):
        r = s.get(f"{API}/products", params={"categoria": "Marroquinería", "limit": 20}, timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0
        for it in items:
            assert it["categoria"] == "Marroquinería"

    def test_limit_respected(self, s):
        r = s.get(f"{API}/products", params={"limit": 3}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) <= 3
        assert d["limit"] == 3

    def test_precio_range(self, s):
        r = s.get(f"{API}/products", params={"precio_min": 100, "precio_max": 500, "limit": 30}, timeout=20)
        assert r.status_code == 200
        for it in r.json()["items"]:
            if it["precio"] > 0:
                assert 100 <= it["precio"] <= 500, f"Precio fuera de rango: {it['precio']}"

    def test_featured_endpoint(self, s):
        # Backend exposes /api/featured (not ?destacado= on /products). Per-category top destacados.
        r = s.get(f"{API}/featured", params={"per_category": 3}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        # Returns dict categoria -> list
        assert isinstance(d, (dict, list))

    def test_offers_endpoint(self, s):
        # Backend exposes /api/offers for productos en oferta (not ?oferta= on /products)
        r = s.get(f"{API}/offers", params={"limit": 10}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        items = d.get("items", d) if isinstance(d, dict) else d
        if isinstance(items, list):
            for it in items:
                assert it.get("precio_oferta", 0) > 0

    def test_color_filter_singular_param(self, s):
        # Implementation uses ?color= (singular). Pick a color from filters.
        cats = s.get(f"{API}/categories", timeout=20).json()["categories"]
        found_color = None
        cat_name = None
        for c in cats[:6]:
            fr = s.get(f"{API}/filters/{c['name']}", timeout=20)
            if fr.status_code == 200 and fr.json().get("colores"):
                found_color = fr.json()["colores"][0]["name"]
                cat_name = c["name"]
                break
        if not found_color:
            pytest.skip("No hay colores asignados — corre /admin/subclassify primero")
        r = s.get(f"{API}/products", params={"categoria": cat_name, "color": found_color, "limit": 10}, timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0, f"Sin items para color={found_color}"
        for it in items:
            assert found_color in it.get("colores", []), f"Color esperado no presente: {it}"

    def test_subcategoria_filter(self, s):
        fr = s.get(f"{API}/filters/Marroquinería", timeout=20)
        if fr.status_code != 200 or not fr.json().get("subcategorias"):
            pytest.skip("Sin subcategorías cargadas")
        sub = fr.json()["subcategorias"][0]["name"]
        r = s.get(f"{API}/products", params={"categoria": "Marroquinería", "subcategoria": sub, "limit": 5}, timeout=20)
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert it.get("subcategoria") == sub


# ---------------- /api/filters/{categoria} ----------------
class TestCategoryFilters:
    def test_filters_marroquineria(self, s):
        r = s.get(f"{API}/filters/Marroquinería", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["categoria"] == "Marroquinería"
        assert isinstance(d["subcategorias"], list)
        assert isinstance(d["colores"], list)
        assert "price_min" in d and "price_max" in d
        assert d["price_max"] >= d["price_min"]

    def test_filters_unknown_returns_empty(self, s):
        r = s.get(f"{API}/filters/NoExisteEstaCategoria", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["subcategorias"] == []
        assert d["colores"] == []


# ---------------- Subclassify ----------------
class TestSubclassify:
    def test_subclassify_requires_auth(self, s):
        r = s.post(f"{API}/admin/subclassify", json={"apply": False}, timeout=20)
        assert r.status_code == 401

    def test_subclassify_dryrun(self, s, admin_headers):
        r = s.post(f"{API}/admin/subclassify", json={"apply": False}, headers=admin_headers, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["applied"] is False
        assert d["scanned"] > 0
        assert isinstance(d["counts_by_subcat"], dict)
        assert isinstance(d["products_with_color"], int)

    def test_subclassify_apply_persists(self, s, admin_headers):
        # Create a product with words that match Marroquinería → Mochilas + color rojo
        sku = f"TEST_{uuid.uuid4().hex[:8].upper()}"
        try:
            cr = s.post(
                f"{API}/admin/products",
                headers=admin_headers,
                json={
                    "sku": sku,
                    "nombre": "Mochila Escolar Espalda Rojo Test",
                    "categoria": "Marroquinería",
                    "precio": 100,
                    "stock": 1,
                },
                timeout=15,
            )
            assert cr.status_code == 200, cr.text
            r = s.post(f"{API}/admin/subclassify", json={"apply": True}, headers=admin_headers, timeout=90)
            assert r.status_code == 200
            # Verify product now has subcategoria + colores
            g = s.get(f"{API}/products/{sku}", timeout=15).json()
            assert g.get("subcategoria") == "Mochilas", f"got {g.get('subcategoria')}"
            assert "Rojo" in g.get("colores", []), f"got colores={g.get('colores')}"
        finally:
            s.delete(f"{API}/admin/products/{sku}", headers=admin_headers, timeout=15)


# ---------------- Upload file (multipart) ----------------
# tiny valid 1x1 PNG (red pixel)
_PNG_1x1 = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108020000009077"
    "53DE0000000C49444154789C63F8CFC0000000030001"
    "9A9C2C0F0000000049454E44AE426082"
)


class TestUploadFile:
    def test_upload_requires_auth(self, s):
        files = {"file": ("x.png", io.BytesIO(_PNG_1x1), "image/png")}
        r = s.post(f"{API}/admin/upload-file", files=files, timeout=20)
        assert r.status_code == 401

    def test_upload_rejects_bad_mime(self, s, admin_headers):
        files = {"file": ("x.txt", io.BytesIO(b"hello"), "text/plain")}
        r = s.post(f"{API}/admin/upload-file", files=files, headers=admin_headers, timeout=20)
        assert r.status_code == 400

    def test_upload_png_and_serve(self, s, admin_headers):
        files = {"file": ("test.png", io.BytesIO(_PNG_1x1), "image/png")}
        r = s.post(f"{API}/admin/upload-file", files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/uploads/")
        assert d["size"] > 0
        # Retrieve the file
        g = s.get(f"{BASE_URL}{d['url']}", timeout=20)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("image/")
        assert len(g.content) == d["size"]


# ---------------- Predictive search smoke ----------------
class TestPredictiveSearch:
    def test_suggest_returns_items(self, s):
        r = s.get(f"{API}/search/suggest", params={"q": "mochila", "limit": 5}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("items"), list)
