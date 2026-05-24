# D+D — E-commerce + Back-office (PRD)

## Problem Statement (original)
E-commerce para "D+D", librería y marroquinería de Alcorta (Rosario, Argentina).
Catálogo real (~8.000 SKUs) provisto en CSV con imágenes hosteadas en Cloudinary.
Se requiere catálogo público + back-office privado para gestión de inventario.

## Architecture (actual)
- **Frontend:** React 19 + Tailwind + Shadcn UI + React Router
- **Backend:** FastAPI + MongoDB (Motor async) + Pydantic v2
- **Persistencia:** MongoDB colección `products` (índice único por `sku`)
- **Auth admin:** password simple en env `ADMIN_PASSWORD`, header `X-Admin-Token`
- **Datos iniciales:** auto-seed desde `/app/backend/initial_catalog.csv` si DB vacía

## Core Requirements
- Paleta minimalista: crema (#FAFAF7) + ink (#1A1A1A) + pasteles (mint/sand/butter/lilac/sky) + verde D+D (#22A94A)
- Tipografía: Outfit (display) + DM Sans (body) + Fraunces italic (detalles académicos)
- Currency ARS, nombres en Title Case, 4 tabs fijos (Marroquinería/Librería/Juguetería/Regalería) + General fallback
- Marroquinería priorizada visualmente (badge verde + punto)
- WhatsApp integration a 5493465538232

## What's been implemented

### Iteración 2026-02 (MVP + carrito + WhatsApp)
- Frontend con navbar sticky, buscador, grilla de productos, página de detalle
- CartContext con drawer lateral (Sheet shadcn), counter, items, qty +/-, remove, clear
- Botón flotante WhatsApp + botón en drawer generan `wa.me/…?text=…` con mensaje pre-cargado
- Logo D+D (verde/amarillo) en header + footer + favicon
- Paleta minimalista académica con Fraunces italic

### Iteración 2026-04 (CMS + MongoDB + API)
- **Backend FastAPI** con endpoints públicos (`/api/products` con filter/sort/search/pagination, `/api/products/{sku}`, `/api/categories`) y admin (`/api/admin/login`, `/api/admin/stats`, `/api/admin/csv-upload`, `/api/admin/products` CRUD)
- **MongoDB** como fuente de verdad: auto-seed al iniciar desde `initial_catalog.csv` (8.142 productos únicos)
- **Panel /admin** privado con password "Netri 437" (en env var), 3 tabs:
  - **Gestionar**: tabla paginada con edición inline de stock/precio/categoría + botón eliminar por fila, búsqueda integrada
  - **Subir CSV**: multipart upload con modo upsert (fusiona por SKU) o replace (reemplaza todo)
  - **Nuevo producto**: form manual con SKU/nombre/categoría/precio/stock/imagen URL
- Stats dashboard (total, con stock, sin imagen)
- Home migrada a API con sorting (relevance, price asc/desc, name A-Z, newest), paginación "Ver más"
- ImageFallback elegante (iniciales sobre pastel) para URLs 404
- Hero text: "D+D · Alcorta · desde siempre"
- WhatsApp floating button oculto en `/admin`

## Test Coverage
- **Backend**: 27/27 pytest passing (`/app/backend/tests/test_dd_api.py`)
- **Frontend**: 100% flujos críticos (sort, search, add-to-cart, admin login, CMS tabs)

## Structure
```
app/
├── backend/
│   ├── server.py                 # FastAPI + MongoDB + admin
│   ├── initial_catalog.csv       # 8205 filas → seed al boot
│   ├── .env                      # ADMIN_PASSWORD="Netri 437"
│   └── tests/test_dd_api.py      # 27 tests
└── frontend/src/
    ├── App.js                    # routes / + /producto/:id + /admin
    ├── lib/
    │   ├── api.js                # wrapper fetch (public + admin)
    │   ├── whatsapp.js           # WHATSAPP_NUMBER="5493465538232"
    │   └── format.js
    ├── context/CartContext.js
    ├── pages/
    │   ├── Home.jsx
    │   ├── ProductDetail.jsx
    │   └── Admin.jsx             # login + 3 tabs
    └── components/store/
        ├── Navbar.jsx            # logo + search + bolsa drawer
        ├── CategoryTabs.jsx      # 4 fijos + General
        ├── ProductCard.jsx       # botón "Agregar al carrito" + fallback
        ├── WhatsAppFloating.jsx
        └── EmptyState.jsx
```

## Prioritized Backlog
- **P1**: usuario sube imágenes a su Cloudinary para que catálogo muestre fotos reales
- **P1**: usuario sube CSV con categorías reales (hoy todo "General")
- **P2**: persistir carrito en localStorage para sobrevivir refresh
- **P2**: reemplazar native `<select>` en admin por Shadcn Select (cosmético)
- **P3**: lifespan FastAPI moderno (on_event está deprecado)
- **P3**: autenticación real (JWT) si se suman múltiples admins
- **P3**: pagos online (MercadoPago) para checkout directo sin WhatsApp

## Next Tasks
1. Login a `/admin` con `Netri 437` y probar flujo CSV real
2. Subir imágenes a Cloudinary o actualizar URLs en CSV
3. Deploy desde UI de Emergent
