# D+D — Librería & Marroquinería (e-commerce + back-office)

E-commerce de **D+D** (Alcorta, Rosario, Argentina). Stack:

- **Frontend:** React 19 + Tailwind + Shadcn UI + React Router (CRA + craco)
- **Backend:** FastAPI 0.110 + Motor (MongoDB async) + Pydantic v2
- **DB:** MongoDB (4.351 productos al día de hoy)
- **Auth admin:** password simple en variable de entorno (`ADMIN_PASSWORD`)
- **Checkout actual:** WhatsApp deep-link (a reemplazar por Mercado Pago — ver §6)
- **Imágenes:** legacy Cloudinary URLs + uploads locales en `backend/uploads/` (a migrar a Cloudinary — ver §7)

---

## 1. Estructura del proyecto

```
.
├── backend/
│   ├── server.py                # FastAPI: catálogo, filtros, admin, uploads, subclassify
│   ├── initial_catalog.csv      # Seed inicial (8.205 filas → upsert por SKU)
│   ├── requirements.txt
│   ├── uploads/                 # ⚠️ Imágenes subidas desde /admin (efímero en contenedores)
│   ├── tests/                   # 67 pytest (regression + bloque 2)
│   └── .env                     # ← crear con MONGO_URL, DB_NAME, ADMIN_PASSWORD
│
├── frontend/
│   ├── package.json
│   ├── craco.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/{Home,ProductDetail,Admin}.jsx
│   │   ├── components/store/    # Navbar, FilterSidebar, ProductCard, GalleryModal, …
│   │   ├── context/CartContext.js
│   │   └── lib/{api,whatsapp,format}.js
│   └── .env                     # ← crear con REACT_APP_BACKEND_URL
│
├── export/
│   ├── products.json            # mongoexport de los 4.351 productos
│   └── seed_mongo.py            # restore script (pymongo upsert por sku)
│
└── README.md                    # este archivo
```

---

## 2. Requisitos del entorno

- **Node.js** 18+ y **yarn** 1.22+ (recomendado, evita problemas con npm)
- **Python** 3.11+
- **MongoDB** 6+ (local con `mongod` o cuenta de **MongoDB Atlas**)
- Opcional: `mongoexport`/`mongorestore` de `mongodb-database-tools`

---

## 3. Levantar el proyecto en local — paso a paso

### 3.1 Configurar `.env`

**`backend/.env`** (crear):

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dd_database"
CORS_ORIGINS="*"
ADMIN_PASSWORD="Netri 437"
```

**`frontend/.env`** (crear):

```
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
```

> En producción `REACT_APP_BACKEND_URL` debe apuntar a tu dominio público del backend (ej. `https://api.tudominio.com`). El frontend **siempre** prefija las llamadas con `/api`.

### 3.2 Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
# Si la DB está vacía, hace seed automático desde initial_catalog.csv.
# Para cargar el snapshot de 4.351 productos, correr el seed manual del paso 3.4.
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Verificar:
```bash
curl http://localhost:8001/api/products?limit=1
```

### 3.3 Frontend (React)

```bash
cd frontend
yarn install
yarn start                          # http://localhost:3000
```

### 3.4 Restaurar la base de datos (4.351 productos)

**A. Con el script Python incluido (más simple):**
```bash
cd export
pip install pymongo
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="dd_database"
python seed_mongo.py products.json
```

**B. Con `mongoimport` (si tenés mongo-tools):**
```bash
mongoimport --uri="mongodb://localhost:27017" --db=dd_database --collection=products \
            --file=export/products.json --jsonArray --mode=upsert --upsertFields=sku
```

Ambas son idempotentes (upsert por `sku`).

---

## 4. Credenciales y datos importantes

| Qué | Dónde | Valor actual |
|---|---|---|
| Password del back-office `/admin` | `backend/.env` → `ADMIN_PASSWORD` | `Netri 437` (con espacio) |
| Número de WhatsApp del local | `frontend/src/lib/whatsapp.js` → `WHATSAPP_NUMBER` | `5493465538232` |
| URL pública del backend | `frontend/.env` → `REACT_APP_BACKEND_URL` | (definir según deploy) |
| URI de MongoDB | `backend/.env` → `MONGO_URL` | `mongodb://localhost:27017` |
| Nombre de la DB | `backend/.env` → `DB_NAME` | `dd_database` (o el que elijas) |

---

## 5. Endpoints clave del backend

| Método | Path | Para qué |
|---|---|---|
| GET | `/api/products` | Catálogo. Filtros: `categoria, subcategoria, color, precio_min, precio_max, search, limit, offset, sort` |
| GET | `/api/products/{sku}` | Detalle |
| GET | `/api/categories` | Lista de categorías |
| GET | `/api/featured` | Destacados de home |
| GET | `/api/offers` | Productos con `precio_oferta` |
| GET | `/api/filters/{categoria}` | Colores + subcategorías + rango de precios disponibles |
| GET | `/api/search/suggest?q=` | Predictive search |
| POST | `/api/admin/login` | `{ password }` → `{ token }` |
| GET/POST/PUT/DELETE | `/api/admin/products[/{sku}]` | CRUD (header `X-Admin-Token`) |
| POST | `/api/admin/csv-upload` | Carga masiva (upsert o replace) |
| POST | `/api/admin/upload-file` | Sube imagen a `backend/uploads/` y devuelve URL pública |
| POST | `/api/admin/subclassify` | Asigna `subcategoria` y `colores` por keywords |
| POST | `/api/admin/clean-titles` | Normaliza títulos a Title Case |

---

## 6. 🟦 Integrar **Mercado Pago** (sandbox y prod)

### 6.1 Sacar credenciales

1. Ingresar a https://www.mercadopago.com.ar/developers/panel
2. Crear una aplicación (tipo "Pagos online · Checkout Pro" para empezar).
3. Copiar de **Credenciales de prueba (Sandbox)**:
   - **Public Key**: `TEST-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token**: `TEST-1234567890123456-xxxxxx-...`
4. Crear usuarios de prueba (sandbox) vendedor + comprador desde el mismo panel.

### 6.2 Variables de entorno (agregar en `backend/.env`)

```
MP_ACCESS_TOKEN=TEST-1234567890123456-xxxxxx-...
MP_PUBLIC_KEY=TEST-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_WEBHOOK_SECRET=algo-aleatorio-para-firmar-callbacks
MP_SUCCESS_URL=https://tudominio.com/checkout/exito
MP_FAILURE_URL=https://tudominio.com/checkout/fallo
MP_PENDING_URL=https://tudominio.com/checkout/pendiente
```

### 6.3 Archivos a tocar (puntos de inyección)

| Archivo | Qué hay que hacer |
|---|---|
| `backend/requirements.txt` | Agregar `mercadopago>=2.2.0` y reinstalar (`pip install -r requirements.txt`) |
| `backend/server.py` (≈ líneas 24-28) | Leer `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` con `os.environ.get(...)` |
| `backend/server.py` (nuevo bloque antes de `app.include_router`) | Endpoint `POST /api/checkout/mp/preference` que recibe los items del carrito y devuelve `{ init_point, preference_id }` usando `mercadopago.SDK(MP_ACCESS_TOKEN).preference().create(...)` |
| `backend/server.py` | Endpoint `POST /api/checkout/mp/webhook` que escuche `payment.created/updated`, valide la firma con `MP_WEBHOOK_SECRET` y persista el pedido en `db.orders` |
| `frontend/src/lib/whatsapp.js` | Dejarlo como **fallback opcional** ("Comprar por WhatsApp"). El botón principal del carrito pasa a Mercado Pago. |
| `frontend/src/context/CartContext.js` | Agregar `checkoutWithMP()` que hace `POST /api/checkout/mp/preference` y redirige a `init_point`. |
| `frontend/src/components/store/` (componente del carrito drawer) | Reemplazar el botón principal por **"Pagar con Mercado Pago"** que llama al método anterior. Mantener WhatsApp como secundario. |
| `frontend/src/pages/` (nuevos) | `CheckoutExito.jsx`, `CheckoutFallo.jsx`, `CheckoutPendiente.jsx`. Registrar rutas en `App.js`. |

> SDK oficial Python: https://github.com/mercadopago/sdk-python
> Tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards

### 6.4 Probar end-to-end

1. Levantar backend + frontend con las nuevas env vars.
2. Agregar items al carrito → "Pagar con Mercado Pago".
3. Loguearse con el **usuario comprador de prueba** y pagar con tarjeta de test.
4. Verificar que el webhook recibió el `payment.id` y se creó el pedido en `db.orders`.

---

## 7. 🟧 Integrar **Cloudinary** (uploads persistentes)

> **Por qué:** actualmente `POST /api/admin/upload-file` guarda en `backend/uploads/` (disco local). En contenedores eso es **efímero**: los archivos se pierden al reiniciar el pod. La solución correcta es subirlos directo a Cloudinary.

### 7.1 Sacar credenciales

1. Crear cuenta en https://cloudinary.com/ (plan free alcanza para arrancar).
2. En el Dashboard copiar:
   - **Cloud Name**: `dxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcDEFghiJKLmnoPQRstuVWX-YZ`

### 7.2 Variables de entorno (agregar en `backend/.env`)

```
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcDEFghiJKLmnoPQRstuVWX-YZ
CLOUDINARY_UPLOAD_FOLDER=dd-productos
```

### 7.3 Archivos a tocar (puntos de inyección)

| Archivo | Qué hay que hacer |
|---|---|
| `backend/requirements.txt` | Agregar `cloudinary>=1.40.0` y reinstalar |
| `backend/server.py` (cerca de la línea 24) | `import cloudinary, cloudinary.uploader` y `cloudinary.config(cloud_name=..., api_key=..., api_secret=..., secure=True)` leyendo `os.environ` |
| `backend/server.py` líneas **744-765** (endpoint `POST /api/admin/upload-file`) | Reemplazar el bloque que escribe en `UPLOADS_DIR` por `cloudinary.uploader.upload(raw, folder=CLOUDINARY_UPLOAD_FOLDER, resource_type='image')`. Devolver `{"url": result["secure_url"], ...}` |
| `backend/server.py` línea **31** y 26-28 | Borrar `app.mount("/api/uploads", StaticFiles(...))` y `UPLOADS_DIR`. Ya no se sirven imágenes locales. |
| `frontend/src/components/store/GalleryModal.jsx` | No requiere cambios: el endpoint sigue devolviendo `{ url }`, ahora apunta a `https://res.cloudinary.com/...` |
| `backend/uploads/*` | Si tenés imágenes subidas localmente y querés conservarlas, subirlas a Cloudinary con un script antes del corte. |

### 7.4 Bonus — Upload directo desde el frontend (signed upload)

Para no pasar los binarios por el backend se puede generar una **firma** desde `/api/admin/upload-signature` y subir desde el navegador a `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`. Recomendable cuando crezca el catálogo.

---

## 8. Deploy externo (opciones recomendadas)

| Plataforma | Bueno para | Tip |
|---|---|---|
| **Railway** | Stack completo (FastAPI + MongoDB + estáticos) | Tiene plugin de MongoDB y deploy desde GitHub. Más simple para arrancar. |
| **Render** | Backend Python + frontend estático separados | Free tier suficiente para test. |
| **Vercel** | Solo frontend React | Combinarlo con Railway/Render para el backend. |
| **VPS (DigitalOcean, Hetzner, AWS Lightsail)** | Control total | Docker compose + nginx + certbot. Costo bajo (~5 USD/mes). |
| **MongoDB Atlas** | Para la DB en cualquier deploy | Free tier M0 alcanza para 4–5k productos. |

Esquema mínimo:
1. MongoDB Atlas → copiar la `MONGO_URL` con usuario/password.
2. Backend en Railway/Render → setear env vars (`MONGO_URL`, `DB_NAME`, `ADMIN_PASSWORD`, MP_*, CLOUDINARY_*).
3. Frontend en Vercel/Railway → setear `REACT_APP_BACKEND_URL` apuntando al backend público + `yarn build`.
4. Importar `export/products.json` a Atlas con `seed_mongo.py` o `mongoimport`.

---

## 9. Tests

```bash
cd backend
pytest -q                           # 67 tests (regression + bloque 2)
```

Cobertura actual: backend 100% (67/67), frontend ~92% (flujos críticos verificados con Playwright en el último iteration report).

---

## 10. Backlog conocido (post-descarga)

| Prioridad | Tarea |
|---|---|
| 🟥 P0 | Implementar Mercado Pago (sandbox → prod) según §6 |
| 🟧 P1 | Migrar uploads a Cloudinary según §7 |
| 🟨 P2 | Ruta `/categoria/:slug?subcategoria=&color=&precio_min=…` (hoy las categorías viven en `state` dentro de `Home.jsx` — rompe deep-link y "atrás" del navegador) |
| 🟨 P2 | Loading state en `FilterSidebar` cuando se cliquea un chip de color (hay una ventana de ~1s donde se ven 0 productos) |
| 🟦 P3 | Refactor: `server.py` ya tiene 860 líneas. Dividir en `routes/{public,admin,uploads}.py` + `services/classifier.py` |
| 🟦 P3 | `subclassify` escanea TODA la colección cada call. Agregar `since=fecha` o batch incremental |
| 🟦 P3 | JWT real si suman más usuarios admin |
| 🟦 P3 | Persistir carrito en `localStorage` |

---

## 11. Contacto / referencia rápida

- WhatsApp del local: **+54 9 3465 538232** (hardcodeado en `frontend/src/lib/whatsapp.js`)
- Paleta: crema `#FAFAF7`, tinta `#1A1A1A`, verde D+D `#22A94A`
- Tipografía: Outfit (display) · DM Sans (body) · Fraunces italic (detalles)

¡Éxitos con la migración! 🚀
